import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Flashlight, KeyRound, AlertTriangle, ScanLine, Image as ImageIcon } from 'lucide-react';
import { sounds } from '../utils/audio';

export function SeekerScannerModal({ onScanCode, onClose }) {
  const [activeTab, setActiveTab] = useState('camera');
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const readerId = 'seeker-qr-viewport';
  const isStoppingRef = useRef(false);
  const isMountedRef = useRef(true);
  const handleScanSuccessRef = useRef(null);

  const handleScanSuccess = (decodedText) => {
    if (isProcessing) return;
    setIsProcessing(true);
    sounds.playVictory();

    if (scannerRef.current && scannerRef.current.isScanning && !isStoppingRef.current) {
      isStoppingRef.current = true;
      scannerRef.current.stop().then(() => {
        try { scannerRef.current?.clear(); } catch {}
        onScanCode(decodedText);
      }).catch(() => {
        onScanCode(decodedText);
      });
    } else {
      onScanCode(decodedText);
    }
  };
  useEffect(() => {
    handleScanSuccessRef.current = handleScanSuccess;
  });

  useEffect(() => {
    isMountedRef.current = true;
    isStoppingRef.current = false;

    const timer = setTimeout(() => {
      if (!isMountedRef.current) return;
      const el = document.getElementById(readerId);
      if (!el) return;

      try {
        const html5QrCode = new Html5Qrcode(readerId);
        scannerRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const edge = Math.floor(minEdge * 0.75);
            return { width: edge, height: edge };
          },
          aspectRatio: 1.0,
        };

        html5QrCode
          .start(
            { facingMode: 'environment' },
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
              .catch((fallbackErr) => {
                console.warn('[Camera Fallback Error]', fallbackErr);
                if (!isMountedRef.current) return;
                setCameraError(
                  'Brak dostępu do kamery wideo. Wpisz 4-cyfrowy PIN uciekiniera poniżej lub zrób zdjęcie kodu QR!'
                );
                setActiveTab('manual');
              });
          });
      } catch (err) {
        console.error('[Scanner Init Error]', err);
        setCameraError('Nie udało się zainicjalizować modułu kamery. Wpisz kod PIN ręcznie.');
        setActiveTab('manual');
      }
    }, 150);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
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
  }, []);

  const toggleTorch = () => {
    if (scannerRef.current && hasTorch) {
      const nextState = !torchOn;
      try {
        scannerRef.current
          .applyVideoConstraints({
            advanced: [{ torch: nextState }],
          })
          .then(() => setTorchOn(nextState))
          .catch((e) => console.warn('Torch toggle error:', e));
      } catch {}
    }
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
        setCameraError('Nie udało się odczytać kodu QR ze zdjęcia. Spróbuj wyraźniejszego zdjęcia lub wpisz PIN!');
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

        <div className={`relative rounded-2xl overflow-hidden border-2 border-slate-700 bg-black min-h-[250px] flex items-center justify-center shadow-inner ${
          activeTab === 'camera' ? 'block' : 'hidden'
        }`}>
          <div id={readerId} className="w-full h-full min-h-[250px]" />

          {hasTorch && activeTab === 'camera' && (
            <button
              onClick={toggleTorch}
              className={`absolute bottom-3 right-3 p-3 rounded-full border shadow-xl z-20 transition cursor-pointer ${
                torchOn ? 'bg-amber-400 text-black border-white glow-amber' : 'bg-slate-900/90 text-white border-slate-600'
              }`}
              title="Włącz latarkę"
            >
              <Flashlight className="w-5 h-5" />
            </button>
          )}

          <div className="absolute bottom-3 left-3 z-20">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-lg backdrop-blur-sm"
              title="Zrób zdjęcie aparatem telefonu"
            >
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Zrób zdjęcie</span>
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
