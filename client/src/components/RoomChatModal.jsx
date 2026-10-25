import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Radio, Car, Shield } from 'lucide-react';
import { LicensePlate } from './LicensePlate';
import { getColorHex } from '../utils/carColors';
import { sounds } from '../utils/audio';

const QUICK_RADIO_HIDER = [
  'Mam dobrą kryjówkę!',
  'Zgubiliście mnie!',
  'Zmieniam miejscówkę!',
  'Uważajcie, łowca blisko!',
  'Wracam do strefy!',
];

const QUICK_RADIO_SEEKER = [
  'Widzę uciekające auto!',
  'Sprawdzam parkingi!',
  'Jestem blisko sygnału radaru!',
  'Ruszam w pościg!',
  'Zgłaszam pozycję!',
];

const QUICK_RADIO_GENERAL = [
  'Potrzebne wsparcie!',
  'Uważajcie na drodze!',
  'Zrozumiałem, odbiór!',
  'Dobra runda!',
];

export function RoomChatModal({
  roomCode,
  myPlayer,
  messages = [],
  onSendMessage,
  onClose,
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const isHider = myPlayer?.role === 'HIDER';
  const quickPhrases = isHider ? QUICK_RADIO_HIDER : QUICK_RADIO_SEEKER;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleQuickRadio = (phrase) => {
    onSendMessage(phrase);
    sounds.playChatMessage();
  };

  return (
    <div className="fixed inset-0 z-[2500] bg-slate-950/85 backdrop-blur-md flex flex-col justify-end sm:justify-center p-0 sm:p-4 select-none pb-safe pt-safe">
      <div className="w-full max-w-lg mx-auto bg-slate-900 border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[82dvh] sm:h-[650px] overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-white/10 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <span>Czat Pokoju & Krótkofalówka</span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                  {roomCode}
                </span>
              </h2>
              <span className="text-[10px] text-slate-400">Komunikacja na żywo między załogami</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-2 sm:p-2.5 bg-slate-950/90 border-b border-white/5 overflow-x-auto flex items-center gap-1.5 shrink-0 scrollbar-none">
          <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold uppercase tracking-wider pl-1 shrink-0">
            <Radio className="w-3.5 h-3.5" />
            <span>Radio 1-klik:</span>
          </div>
          {quickPhrases.map((phrase, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickRadio(phrase)}
              className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-[11px] font-semibold whitespace-nowrap transition cursor-pointer active:scale-95"
            >
              {phrase}
            </button>
          ))}
          {QUICK_RADIO_GENERAL.slice(0, 2).map((phrase, idx) => (
            <button
              key={`g_${idx}`}
              type="button"
              onClick={() => handleQuickRadio(phrase)}
              className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-semibold whitespace-nowrap transition cursor-pointer active:scale-95"
            >
              {phrase}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 text-xs">
          {messages.length === 0 ? (
            <div className="text-center text-slate-500 py-16 flex flex-col items-center gap-2">
              <Radio className="w-8 h-8 text-slate-600 animate-pulse" />
              <span>Brak wiadomości. Wyślij pierwszą wiadomość lub użyj szybkiego radia!</span>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderId === myPlayer?.id;
              const isHiderMsg = m.senderRole === 'HIDER';

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5 px-1">
                    <span className={`text-[10px] font-black uppercase flex items-center gap-1 ${
                      isHiderMsg ? 'text-purple-400' : 'text-cyan-400'
                    }`}>
                      {isHiderMsg ? <Car className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                      <span>{m.senderName}</span>
                    </span>

                    {m.carModel && (
                      <span className="text-[9px] text-slate-400 font-mono">
                        {m.carModel}
                      </span>
                    )}

                    {m.carColor && (
                      <span
                        className="w-2 h-2 rounded-full border border-black/40"
                        style={{ backgroundColor: getColorHex(m.carColor) }}
                      />
                    )}

                    {m.carPlate && <LicensePlate plate={m.carPlate} size="xs" />}

                    <span className="text-[9px] text-slate-500 font-mono ml-1">
                      {m.time}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 font-medium text-xs leading-relaxed shadow-md select-text ${
                      isMe
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold rounded-tr-none'
                        : isHiderMsg
                        ? 'bg-purple-950/70 border border-purple-500/30 text-purple-100 rounded-tl-none'
                        : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-tl-none'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 bg-slate-950/80 flex gap-2">
          <input
            type="text"
            value={inputText}
            maxLength={200}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Napisz do pokoju..."
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 shadow-inner"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold transition flex items-center justify-center cursor-pointer active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
