import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Flashlight, KeyRound, AlertTriangle, ScanLine, Image as ImageIcon, SwitchCamera, CheckCircle2 } from 'lucide-react';
import { sounds } from '../utils/audio';

export function SeekerScannerModal({ onScanCode, onClose }) {
  const [activeTab, setActiveTab] = useState('camera');
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');

  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const barcodeIntervalRef = useRef(null);
  const readerId = 'seeker-qr-viewport';
  const isStoppingRef = useRef(false);
  const isMountedRef = useRef(true);
  const handleScanSuccessRef = useRef(null);

  const handleScanSuccess = useCallback((decodedText) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setScannedResult(decodedText);
    sounds.playScanChirp();

    if (barcodeIntervalRef.current) {
      clearInterval(barcodeIntervalRef.current);
      barcodeIntervalRef.current = null;
    }

    if (scannerRef.current && scannerRef.current.isScanning && !isStoppingRef.current) {
      isStoppingRef.current = true;
      scannerRef.current.stop().then(() => {
        try { scannerRef.current?.clear(); } catch {}
        setTimeout(() => onScanCode(decodedText), 300);
      }).catch(() => {
        setTimeout(() => onScanCode(decodedText), 300);
      });
    } else {
      setTimeout(() => onScanCode(decodedText), 300);
    }
  }, [isProcessing, onScanCode]);

  useEffect(() => {
    handleScanSuccessRef.current = handleScanSuccess;
  }, [handleScanSuccess]);

  const startCamera = useCallback((mode = 'environment') => {
    if (!isMountedRef.current) return;
    const el = document.getElementById(readerId);
    if (!el) return;

    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        scannerRef.current.stop().catch(() => {});
      } catch {}
    }

    try {
      const html5QrCode = new Html5Qrcode(readerId, {
        formatsToSupport: [0],
        verbose: false,
      });
      scannerRef.current = html5QrCode;

      const config = {
        fps: 15,
        aspectRatio: 1.0,
        disableFlip: false,
      };

      html5QrCode
        .start(
          { facingMode: mode },
          config,
          (text) => handleScanSuccessRef.current?.(text),
          () => {}
        )
        .then(() => {
          if (!isMountedRef.current) return;
          setCameraError(null);

          try {
            if (typeof html5QrCode.getRunningTrackCapabilities === 'function') {
              const caps = html5QrCode.getRunningTrackCapabilities();
              if (caps && caps.torch) {
                setHasTorch(true);
              }
            }
          } catch {}

          if ('BarcodeDetector' in window) {
            try {
              const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
              const videoEl = el.querySelector('video');
              if (videoEl) {
                barcodeIntervalRef.current = setInterval(async () => {
                  if (videoEl.readyState >= 2 && !isStoppingRef.current) {
                    try {
                      const barcodes = await barcodeDetector.detect(videoEl);
                      if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                        handleScanSuccessRef.current?.(barcodes[0].rawValue);
                      }
                    } catch {}
                  }
                }, 150);
              }
            } catch {}
          }
        })
        .catch((err) => {
          console.warn('[Camera Primary Error]', err);
          if (!isMountedRef.current) return;

          html5QrCode
            .start(
              true,
              config,
              (text) => handleScanSuccessRef.current?.(text),
              () => {}
            )
            .then(() => {
              if (!isMountedRef.current) return;
              setCameraError(null);
            })
            .catch(() => {
              if (!isMountedRef.current) return;
              setCameraError(
                'Brak dostępu do kamery. Wpisz 4-cyfrowy PIN uciekiniera poniżej lub wgraj zdjęcie kodu QR.'
              );
              setActiveTab('manual');
            });
        });
    } catch {
      setCameraError('Błąd uruchamiania skanera. Wpisz kod PIN ręcznie.');
      setActiveTab('manual');
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    isStoppingRef.current = false;

    const timer = setTimeout(() => {
      startCamera(facingMode);
    }, 150);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
      if (barcodeIntervalRef.current) {
        clearInterval(barcodeIntervalRef.current);
        barcodeIntervalRef.current = null;
      }
      if (scannerRef.current) {
        const s = scannerRef.current;
        if (s.isScanning && !isStoppingRef.current) {
          isStoppingRef.current = true;
          s.stop()
            .then(() => {
              try { s.clear(); } catch {}
            })
            .catch(() => {});
        } else {
          try { s.clear(); } catch {}
        }
        scannerRef.current = null;
      }
    };
  }, [facingMode, startCamera]);

  const toggleTorch = () => {
    if (scannerRef.current && hasTorch) {
      const nextState = !torchOn;
      try {
        scannerRef.current
          .applyVideoConstraints({
            advanced: [{ torch: nextState }],
          })
          .then(() => setTorchOn(nextState))
          .catch(() => {});
      } catch {}
    }
  };

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !scannerRef.current) return;

    setIsProcessing(true);
    scannerRef.current
      .scanFile(file, true)
      .then((decodedText) => {
        handleScanSuccess(decodedText);
      })
      .catch(() => {
        setIsProcessing(false);
        setCameraError('Nie udało się odczytać kodu ze zdjęcia. Spróbuj wyraźniejszego zdjęcia lub wpisz PIN!');
      });
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim() || manualCode.trim().length < 4) return;
    onScanCode(manualCode.trim());
  };

  return (
    <div className="fixed inset-0 z-[2500] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-3 sm:p-4 select-none pb-safe pt-safe">
      <div className="max-w-sm w-full glass-panel border border-white/10 rounded-3xl p-4 sm:p-5 text-center space-y-3.5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-black uppercase tracking-wider">
            <ScanLine className="w-3.5 h-3.5" />
            Skaner Schwytania
          </div>
          <h2 className="text-xl font-black text-white">Zeskanuj auto uciekiniera</h2>
          <p className="text-xs text-slate-400">
            Skieruj obiektyw na kod QR za przednią szybą auta
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-1 rounded-2xl border border-white/5 text-xs font-black">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'camera' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" /> Aparat / QR
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'manual' ? 'bg-amber-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4" /> Wpisz PIN
          </button>
        </div>

        {cameraError && (
          <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2 text-left">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="leading-tight">{cameraError}</span>
          </div>
        )}

        <div className={`relative rounded-2xl overflow-hidden border-2 border-slate-700 bg-black min-h-[260px] flex items-center justify-center shadow-inner ${
          activeTab === 'camera' ? 'block' : 'hidden'
        }`}>
          <div id={readerId} className="w-full h-full min-h-[260px]" />

          {/* Animated Laser Scanning Line */}
          {!scannedResult && (
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 pointer-events-none">
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_#ef4444] animate-pulse" />
            </div>
          )}

          {/* Scanned Success Badge Overlay */}
          {scannedResult && (
            <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center gap-2 z-30 animate-fade-in text-white">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
              <span className="font-black text-sm uppercase tracking-wider">ZESKANOWANO!</span>
              <span className="font-mono text-xs text-emerald-300">{scannedResult}</span>
            </div>
          )}

          <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleCameraFacing}
              className="p-2.5 rounded-xl bg-slate-900/90 text-white border border-slate-700 shadow-xl cursor-pointer"
              title="Przełącz aparat"
            >
              <SwitchCamera className="w-4 h-4" />
            </button>

            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-2.5 rounded-xl border shadow-xl transition cursor-pointer ${
                  torchOn ? 'bg-amber-400 text-black border-white glow-amber' : 'bg-slate-900/90 text-white border-slate-600'
                }`}
                title="Latarka"
              >
                <Flashlight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="absolute bottom-3 left-3 z-20">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-2 rounded-xl bg-slate-900/90 border border-slate-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-lg backdrop-blur-sm cursor-pointer"
              title="Wgraj zdjęcie"
            >
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Zdjęcie</span>
            </button>
          </div>
        </div>

        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-3 py-2">
            <div>
              <label className="block text-xs text-slate-300 font-semibold mb-1">
                4-cyfrowy tajny kod PIN uciekiniera:
              </label>
              <input
                type="text"
                maxLength={4}
                placeholder="np. 4821"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ''))}
                autoFocus
                className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3 text-center text-3xl font-mono font-black text-amber-400 tracking-widest placeholder-slate-600 focus:outline-none focus:border-amber-500 shadow-inner"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                PIN jest wyświetlany w aucie uciekiniera obok kodu QR
              </span>
            </div>

            <button
              type="submit"
              disabled={manualCode.length < 4}
              className="w-full py-3.5 px-4 rounded-2xl font-black uppercase text-xs tracking-wider bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white disabled:opacity-40 transition shadow-xl shadow-red-600/30 active:scale-[0.98] cursor-pointer"
            >
              Potwierdź schwytanie PIN-em
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
