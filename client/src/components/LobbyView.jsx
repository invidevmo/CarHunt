import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  Shield,
  Car, 
  Radar, 
  Settings2, 
  Play, 
  Copy, 
  Check, 
  Radio, 
  Dices, 
  ArrowLeftRight, 
  Crown,
  ChevronUp,
  ChevronDown,
  Zap,
  Flame,
  Pencil,
  Share2,
  X,
  Crosshair,
  MapPin,
  QrCode,
  Gauge,
  MessageSquare,
  History
} from 'lucide-react';
import { LicensePlate } from './LicensePlate';
import { ZoneConfigModal } from './ZoneConfigModal';
import { RoomChatModal } from './RoomChatModal';
import { GameHistoryModal } from './GameHistoryModal';
import { COLOR_PRESETS, getColorHex } from '../utils/carColors';

const POPULAR_CAR_SUGGESTIONS = [
  'BMW E46', 'BMW E90', 'Audi A4', 'VW Golf', 'Honda Civic', 'Seat Leon', 'Skoda Octavia', 'Mazda Miata'
];

export function LobbyView({
  room,
  myPlayer,
  onJoinRoom,
  onCreateRoom,
  onUpdateProfile,
  onSetRole,
  onRandomizeTeams,
  onUpdateSettings,
  onSetZone,
  onStartGame,
  onLeaveRoom,
  onSendMessage,
  myGpsPosition,
}) {
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState(localStorage.getItem('carhunt_name') || '');
  const [carModel, setCarModel] = useState(localStorage.getItem('carhunt_car_model') || localStorage.getItem('carhunt_car') || '');
  const [carColor, setCarColor] = useState(localStorage.getItem('carhunt_car_color') || '');
  const [carPlate, setCarPlate] = useState(localStorage.getItem('carhunt_car_plate') || '');
  const [welcomeTab, setWelcomeTab] = useState('create');
  const [showSettings, setShowSettings] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const prevMsgCountRef = useRef(room?.messages?.length || 0);

  useEffect(() => {
    const currentCount = room?.messages?.length || 0;
    if (currentCount > prevMsgCountRef.current && !showChat) {
      setUnreadChatCount((c) => c + (currentCount - prevMsgCountRef.current));
    }
    prevMsgCountRef.current = currentCount;
  }, [room?.messages, showChat]);

  const [editName, setEditName] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editPlate, setEditPlate] = useState('');

  const isHost = myPlayer?.isHost;

  const handleCopyCode = () => {
    if (room?.code) {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareCode = async () => {
    if (!room?.code) return;
    const shareData = {
      title: 'CarHunt GPS - Dołącz do gry',
      text: `Dołącz do samochodowego chowanego w CarHunt! Kod pokoju: ${room.code}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        handleCopyCode();
      }
    } else {
      handleCopyCode();
    }
  };

  const handleSaveProfile = (name = playerName, model = carModel, color = carColor, plate = carPlate) => {
    if (name) localStorage.setItem('carhunt_name', name);
    if (model) {
      localStorage.setItem('carhunt_car_model', model);
      localStorage.setItem('carhunt_car', model);
    }
    if (color) localStorage.setItem('carhunt_car_color', color);
    if (plate) localStorage.setItem('carhunt_car_plate', plate.toUpperCase());
  };

  const openEditModal = () => {
    setEditName(myPlayer?.name || playerName);
    setEditModel(myPlayer?.carModel || carModel);
    setEditColor(myPlayer?.carColor || carColor);
    setEditPlate(myPlayer?.carPlate || carPlate);
    setShowEditProfileModal(true);
  };

  const submitEditProfile = (e) => {
    e?.preventDefault();
    handleSaveProfile(editName, editModel, editColor, editPlate);
    setPlayerName(editName);
    setCarModel(editModel);
    setCarColor(editColor);
    setCarPlate(editPlate);
    if (onUpdateProfile) {
      onUpdateProfile({
        playerName: editName,
        carModel: editModel,
        carColor: editColor,
        carPlate: editPlate,
      });
    }
    setShowEditProfileModal(false);
  };

  if (!room) {
    return (
      <div className="max-w-md mx-auto w-full px-3.5 sm:px-5 py-4 sm:py-7 space-y-4 flex-1 flex flex-col justify-center select-none pb-safe">
        <div className="text-center space-y-2">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute -inset-3 bg-gradient-to-r from-amber-500 via-rose-500 to-cyan-500 rounded-3xl blur-xl opacity-35 animate-pulse" />
            <div className="relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-slate-900 via-slate-950 to-slate-900 border border-white/15 shadow-2xl">
              <Radar className="w-9 h-9 sm:w-11 sm:h-11 text-amber-400 animate-pulse" />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-black tracking-widest uppercase mb-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Nocny Chowany Samochodowy GPS
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase italic leading-none">
              Car<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Hunt</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Ukryj samochód w mieście, zgaś światła lub poluj załogą łowców z radarem GPS!
            </p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-2.5 sm:p-3 flex gap-2.5 text-amber-200/90 text-[11px] sm:text-xs items-center border-amber-500/20 bg-amber-950/20 shadow-md">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="leading-tight">
            <strong>Bezpieczeństwo na drodze:</strong> Telefon w aucie obsługuje wyłącznie <strong>pilot / pasażer</strong>!
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-2xl border-white/10">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-xs uppercase tracking-wider font-extrabold text-slate-300 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-amber-400" /> Twoja Załoga i Samochód
            </span>
            <span className="text-[10px] font-mono text-slate-500">Wizytówka auta</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Twój Nick / Nazwa Załogi</label>
              <input
                type="text"
                placeholder="np. Szybcy i Wściekli, Załoga 1..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition shadow-inner font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Marka i Model Samochodu</label>
              <input
                type="text"
                placeholder="np. BMW E46, Audi A4, Golf 5..."
                value={carModel}
                onChange={(e) => setCarModel(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition shadow-inner font-semibold"
              />

              <div className="flex gap-1 overflow-x-auto py-1 mt-1 no-scrollbar">
                {POPULAR_CAR_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setCarModel(sug)}
                    className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 hover:text-white whitespace-nowrap transition cursor-pointer active:scale-95"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-300">Kolor Samochodu</label>
                {carColor && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-amber-300 font-bold">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white/40 shadow-sm"
                      style={{ backgroundColor: getColorHex(carColor) }}
                    />
                    {carColor}
                  </span>
                )}
              </div>
              <input
                type="text"
                placeholder="np. Czarny, Srebrny, Czerwony..."
                value={carColor}
                onChange={(e) => setCarColor(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition shadow-inner font-semibold"
              />

              <div className="grid grid-cols-5 gap-1.5 mt-2">
                {COLOR_PRESETS.map((cp) => {
                  const isSelected = carColor?.toLowerCase() === cp.name.toLowerCase();
                  return (
                    <button
                      key={cp.name}
                      type="button"
                      onClick={() => setCarColor(cp.name)}
                      className={`flex flex-col items-center gap-0.5 p-1 rounded-xl border transition cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-400 shadow-sm'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full border shadow-inner flex items-center justify-center ${
                          isSelected ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-950' : 'border-white/20'
                        }`}
                        style={{ backgroundColor: cp.hex }}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 text-white drop-shadow" />}
                      </span>
                      <span className="text-[8px] font-bold text-slate-300 truncate w-full text-center">
                        {cp.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-300">Numer Rejestracyjny</label>
                <span className="text-[10px] text-slate-500 font-mono">Identyfikacja w pościgu</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="np. KR 12345"
                  maxLength={10}
                  value={carPlate}
                  onChange={(e) => setCarPlate(e.target.value.toUpperCase())}
                  className="flex-1 bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 font-mono font-black tracking-widest text-white uppercase placeholder-slate-500 focus:outline-none focus:border-amber-500 transition shadow-inner"
                />
                {carPlate && (
                  <div className="shrink-0">
                    <LicensePlate plate={carPlate} size="sm" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2.5 pt-0.5">
          <div className="grid grid-cols-2 p-1 bg-slate-900/80 rounded-2xl border border-white/10 text-xs font-black">
            <button
              type="button"
              onClick={() => setWelcomeTab('create')}
              className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                welcomeTab === 'create'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Stwórz Pokój</span>
            </button>
            <button
              type="button"
              onClick={() => setWelcomeTab('join')}
              className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                welcomeTab === 'join'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Dołącz z Kodem</span>
            </button>
          </div>

          {welcomeTab === 'create' ? (
            <button
              onClick={() => {
                handleSaveProfile();
                onCreateRoom({
                  playerName: playerName || 'Kierowca 1',
                  carModel: carModel || 'Samochód',
                  carColor: carColor || '',
                  carPlate: carPlate || '',
                });
              }}
              className="w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-xl shadow-amber-500/25 active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer border border-amber-400/40 glow-amber"
            >
              <Radio className="w-4 h-4" />
              <span>Utwórz Pokój Rozgrywki (Kapitan)</span>
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="KOD POKOJU"
                maxLength={4}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="flex-1 bg-slate-950 border border-slate-700/80 rounded-2xl px-3 py-3 text-center tracking-widest font-mono font-black text-lg text-white uppercase placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition shadow-inner"
              />
              <button
                onClick={() => {
                  if (!joinCode) return;
                  handleSaveProfile();
                  onJoinRoom(joinCode, {
                    playerName: playerName || 'Łowca',
                    carModel: carModel || 'Samochód',
                    carColor: carColor || '',
                    carPlate: carPlate || '',
                  });
                }}
                disabled={joinCode.length < 4}
                className="py-3 px-5 rounded-2xl font-black text-xs uppercase bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white shadow-xl shadow-cyan-600/20 active:scale-[0.98] transition flex items-center gap-1.5 cursor-pointer border border-cyan-400/40"
              >
                <span>Dołącz</span>
              </button>
            </div>
          )}
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowHistory(true)}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-md"
          >
            <History className="w-4 h-4 text-cyan-400" />
            <span>Zobacz Historię i Statystyki Rozgrywek</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="glass-card rounded-2xl p-2.5 border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-black">
              <Radar className="w-3.5 h-3.5" />
              <span>Radar Taktyczny</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Pulsowanie pozycji uciekinierów co 90s jako okrąg poszukiwań.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-2.5 border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-rose-400 text-xs font-black">
              <Crosshair className="w-3.5 h-3.5" />
              <span>Strefa Geofence</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              30s na powrót do strefy, inaczej uciekinier zostaje odsłonięty!
            </p>
          </div>

          <div className="glass-card rounded-2xl p-2.5 border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-purple-400 text-xs font-black">
              <QrCode className="w-3.5 h-3.5" />
              <span>Kody QR za Szybę</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Potwierdzenie schwytania skanem aparatu z odległości 2-5 metrów.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-2.5 border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-black">
              <Gauge className="w-3.5 h-3.5" />
              <span>Tryb HUD & Odbicie</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Wyświetlaj odległość w metrach bezpośrednio na przedniej szybie auta.
            </p>
          </div>
        </div>

        {showHistory && (
          <GameHistoryModal
            history={[]}
            onClose={() => setShowHistory(false)}
          />
        )}
      </div>
    );
  }

  const hiders = room.players.filter((p) => p.role === 'HIDER');
  const seekers = room.players.filter((p) => p.role === 'SEEKER');
  const canStart = hiders.length > 0 && seekers.length > 0;

  return (
    <div className="max-w-xl mx-auto p-3.5 sm:p-5 space-y-4 flex-1 flex flex-col select-none pb-safe">
      <div className="glass-panel rounded-3xl p-4 sm:p-5 flex items-center justify-between shadow-2xl border-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-400 to-rose-500" />
        <div>
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400 block">KOD ROZGRYWKI</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-white">{room.code}</span>
            <button
              onClick={handleCopyCode}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/10 transition active:scale-95 cursor-pointer"
              title="Skopiuj kod pokoju"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleShareCode}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/10 transition active:scale-95 cursor-pointer"
              title="Udostępnij kod znajomym"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {onLeaveRoom && (
              <button
                onClick={onLeaveRoom}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 border border-white/10 transition active:scale-95 cursor-pointer ml-1"
                title="Opuść pokój"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="text-right">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Poczekalnia
          </span>
          <div className="text-xs font-mono text-slate-400 mt-1.5">
            Załogi: <strong className="text-white">{room.players.length}</strong> ({hiders.length} ucieka vs {seekers.length} szuka)
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setShowChat(true);
            setUnreadChatCount(0);
          }}
          className="flex-1 py-2.5 px-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-white/10 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-md relative"
        >
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <span>Czat Pokoju</span>
          {unreadChatCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black animate-pulse">
              +{unreadChatCount}
            </span>
          )}
          {room.messages?.length > 0 && unreadChatCount === 0 && (
            <span className="text-[10px] text-slate-500 font-mono">({room.messages.length})</span>
          )}
        </button>

        <button
          onClick={() => setShowHistory(true)}
          className="py-2.5 px-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 shadow-md"
        >
          <History className="w-4 h-4 text-cyan-400" />
          <span>Historia Gier</span>
        </button>
      </div>

      <div className="glass-card rounded-2xl p-3 flex items-center justify-between border-amber-500/20 bg-slate-900/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
            <Car className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] uppercase font-black tracking-wider text-slate-400">Twoje Auto w Grze:</div>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <strong className="text-white text-xs">{myPlayer?.carModel || carModel || 'Samochód'}</strong>
              {(myPlayer?.carColor || carColor) && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded-full border border-slate-700">
                  <span
                    className="w-2 h-2 rounded-full border border-white/30"
                    style={{ backgroundColor: getColorHex(myPlayer?.carColor || carColor) }}
                  />
                  {myPlayer?.carColor || carColor}
                </span>
              )}
              {(myPlayer?.carPlate || carPlate) && (
                <LicensePlate plate={myPlayer?.carPlate || carPlate} size="xs" />
              )}
            </div>
          </div>
        </div>

        <button
          onClick={openEditModal}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 shadow-sm"
          title="Zmień dane swojego auta"
        >
          <Pencil className="w-3.5 h-3.5 text-amber-400" />
          <span>Edytuj auto</span>
        </button>
      </div>

      <div className={`glass-panel rounded-3xl p-4 border space-y-2.5 relative overflow-hidden ${
        room.settings.gameMode === 'MOVING_ZONE' ? 'border-cyan-500/30' : 'border-rose-500/25'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-xl border ${
              room.settings.gameMode === 'MOVING_ZONE'
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
            }`}>
              <Crosshair className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Strefa Rozgrywki (Geofence)</h3>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                  room.settings.gameMode === 'MOVING_ZONE'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}>
                  {room.settings.gameMode === 'MOVING_ZONE' ? 'Dynamiczna (W Ruchu)' : 'Stała'}
                </span>
              </div>

              {room.settings.gameMode === 'MOVING_ZONE' ? (
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Teren główny: <strong className="text-cyan-400 font-mono">
                    {room.settings.movingZone.outerRadius >= 1000 
                      ? `${(room.settings.movingZone.outerRadius / 1000).toFixed(1)} km` 
                      : `${room.settings.movingZone.outerRadius} m`}
                  </strong> | Strefa aut: <strong className="text-rose-400 font-mono">
                    {room.settings.movingZone.activeRadius >= 1000 
                      ? `${(room.settings.movingZone.activeRadius / 1000).toFixed(1)} km` 
                      : `${room.settings.movingZone.activeRadius} m`}
                  </strong> | Zmiana co <strong className="text-white font-mono">{(room.settings.movingZone.shiftInterval / 60).toFixed(0)} min</strong>
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Promień: <strong className="text-rose-400 font-mono font-bold">
                    {room.settings.zone.radius >= 1000 
                      ? `${(room.settings.zone.radius / 1000).toFixed(1)} km` 
                      : `${room.settings.zone.radius} m`}
                  </strong> | Karencja: <strong className="text-white font-mono">{room.settings.zone.graceSeconds || 30}s</strong>
                </span>
              )}
            </div>
          </div>

          {isHost && (
            <button
              onClick={() => setShowZoneModal(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs uppercase transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-md shadow-rose-600/20 shrink-0"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Dostosuj Strefę</span>
            </button>
          )}
        </div>

        <p className="text-[11px] text-slate-400 leading-tight">
          {room.settings.gameMode === 'MOVING_ZONE'
            ? 'Strefa przemieszcza się po wyznaczonym terenie miasta! Załogi muszą regularnie zmieniać kryjówki i dojeżdżać do nowego rejonu.'
            : `Wyjście poza wyznaczony okrąg skutkuje odliczeniem ${room.settings.zone.graceSeconds || 30}s. Jeśli uciekinier nie wróci, jego pozycja zostaje odsłonięta łowcom!`}
        </p>
      </div>

      {isHost && room.players.length >= 2 && (
        <div className="glass-panel rounded-3xl p-4 space-y-2.5 border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold text-amber-300 flex items-center gap-1.5">
              <Dices className="w-4 h-4 text-amber-400" /> Szybki Podział Składów (Kapitan)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">1 kliknięcie</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <button
              onClick={() => onRandomizeTeams('single')}
              className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-amber-400/50 text-slate-300 hover:text-white transition text-center cursor-pointer active:scale-95"
            >
              <strong className="block text-amber-400 font-black">1 Ucieka</strong>
              <span className="text-[10px] text-slate-400">Reszta goni</span>
            </button>

            <button
              onClick={() => onRandomizeTeams('pair')}
              className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-purple-400/50 text-slate-300 hover:text-white transition text-center cursor-pointer active:scale-95"
            >
              <strong className="block text-purple-400 font-black">2 Ucieka</strong>
              <span className="text-[10px] text-slate-400">Reszta goni</span>
            </button>

            <button
              onClick={() => onRandomizeTeams('ratio')}
              className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-cyan-400/50 text-slate-300 hover:text-white transition text-center cursor-pointer active:scale-95"
            >
              <strong className="block text-cyan-400 font-black">Zbalansowane</strong>
              <span className="text-[10px] text-slate-400">~35% celów</span>
            </button>

            <button
              onClick={() => onRandomizeTeams('half')}
              className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-emerald-400/50 text-slate-300 hover:text-white transition text-center cursor-pointer active:scale-95"
            >
              <strong className="block text-emerald-400 font-black">Wojna 50 / 50</strong>
              <span className="text-[10px] text-slate-400">Równe siły</span>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 flex-1 overflow-y-auto">
        <div className="glass-panel rounded-3xl p-4 space-y-3 flex flex-col border-purple-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between border-b border-purple-900/30 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                <Car className="w-4 h-4 text-purple-300" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-purple-200">SKŁAD UCIEKINIERÓW</h3>
                <span className="text-[11px] text-purple-300 font-mono">{hiders.length} załóg ucieka</span>
              </div>
            </div>

            {myPlayer?.role !== 'HIDER' ? (
              <button
                onClick={() => onSetRole('HIDER', myPlayer?.id)}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition active:scale-95 cursor-pointer"
              >
                Przejdź &rarr;
              </button>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black border border-purple-500/40">
                TWÓJ SKŁAD
              </span>
            )}
          </div>

          <div className="space-y-2 flex-1">
            {hiders.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                Brak aut w tym składzie. Kliknij "Przejdź" lub wylosuj składy.
              </div>
            ) : (
              hiders.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-2xl bg-purple-950/20 border border-purple-900/40 flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                      <span className="truncate">{p.name}</span>
                      {p.id === myPlayer?.id && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">TY</span>
                      )}
                      {p.isHost && (
                        <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-[11px] text-purple-300 font-medium">{p.carModel || 'Auto'}</span>
                      {p.carColor && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-900/90 border border-slate-700 text-[10px] text-slate-300 font-mono">
                          <span
                            className="w-2 h-2 rounded-full border border-white/30"
                            style={{ backgroundColor: getColorHex(p.carColor) }}
                          />
                          {p.carColor}
                        </span>
                      )}
                      {p.carPlate && <LicensePlate plate={p.carPlate} size="xs" />}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {p.id === myPlayer?.id && (
                      <button
                        onClick={openEditModal}
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition cursor-pointer"
                        title="Edytuj dane auta"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isHost && (
                      <button
                        onClick={() => onSetRole('SEEKER', p.id)}
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-cyan-900/50 text-slate-400 hover:text-cyan-300 transition cursor-pointer"
                        title="Przenieś do Łowców"
                      >
                        <ArrowLeftRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-4 space-y-3 flex flex-col border-cyan-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between border-b border-cyan-900/30 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                <Shield className="w-4 h-4 text-cyan-300" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-cyan-200">SKŁAD ŁOWCÓW</h3>
                <span className="text-[11px] text-cyan-300 font-mono">{seekers.length} załóg w pościgu</span>
              </div>
            </div>

            {myPlayer?.role !== 'SEEKER' ? (
              <button
                onClick={() => onSetRole('SEEKER', myPlayer?.id)}
                className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 transition active:scale-95 cursor-pointer"
              >
                Przejdź &rarr;
              </button>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-black border border-cyan-500/40">
                TWÓJ SKŁAD
              </span>
            )}
          </div>

          <div className="space-y-2 flex-1">
            {seekers.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                Brak aut w tym składzie. Kliknij "Przejdź" lub wylosuj składy.
              </div>
            ) : (
              seekers.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-2xl bg-cyan-950/20 border border-cyan-900/40 flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                      <span className="truncate">{p.name}</span>
                      {p.id === myPlayer?.id && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">TY</span>
                      )}
                      {p.isHost && (
                        <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-[11px] text-cyan-300 font-medium">{p.carModel || 'Auto'}</span>
                      {p.carColor && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-900/90 border border-slate-700 text-[10px] text-slate-300 font-mono">
                          <span
                            className="w-2 h-2 rounded-full border border-white/30"
                            style={{ backgroundColor: getColorHex(p.carColor) }}
                          />
                          {p.carColor}
                        </span>
                      )}
                      {p.carPlate && <LicensePlate plate={p.carPlate} size="xs" />}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {p.id === myPlayer?.id && (
                      <button
                        onClick={openEditModal}
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition cursor-pointer"
                        title="Edytuj dane auta"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isHost && (
                      <button
                        onClick={() => onSetRole('HIDER', p.id)}
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-purple-900/50 text-slate-400 hover:text-purple-300 transition cursor-pointer"
                        title="Przenieś do Uciekinierów"
                      >
                        <ArrowLeftRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {isHost && (
        <div className="glass-panel rounded-3xl p-4 space-y-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full flex items-center justify-between text-xs uppercase tracking-wider font-extrabold text-slate-300 hover:text-white cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-amber-400" /> Pozostałe parametry rozgrywki
            </span>
            <span className="flex items-center gap-1 text-xs text-amber-400">
              {showSettings ? (
                <>
                  <span>Ukryj</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Rozwiń</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </span>
          </button>

          {showSettings && (
            <div className="space-y-4 pt-3 border-t border-white/5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Czas na ukrycie:</label>
                  <select
                    value={room.settings.hideDuration}
                    onChange={(e) => onUpdateSettings({ hideDuration: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-white"
                  >
                    <option value={120}>2 minuty</option>
                    <option value={180}>3 minuty</option>
                    <option value={300}>5 minut</option>
                    <option value={600}>10 minut</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Czas polowania:</label>
                  <select
                    value={room.settings.gameDuration}
                    onChange={(e) => onUpdateSettings({ gameDuration: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-white"
                  >
                    <option value={600}>10 minut</option>
                    <option value={900}>15 minut</option>
                    <option value={1200}>20 minut</option>
                    <option value={1800}>30 minut</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Interwał radaru:</label>
                  <select
                    value={room.settings.pingInterval}
                    onChange={(e) => onUpdateSettings({ pingInterval: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-white"
                  >
                    <option value={45}>Co 45 sekund</option>
                    <option value={60}>Co 60 sekund</option>
                    <option value={90}>Co 90 sekund</option>
                    <option value={120}>Co 2 minuty</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Promień okręgu radaru:</label>
                  <select
                    value={room.settings.pingFuzzRadius}
                    onChange={(e) => onUpdateSettings({ pingFuzzRadius: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-white"
                  >
                    <option value={50}>50 metrów (Mikrostrefa)</option>
                    <option value={75}>75 metrów</option>
                    <option value={100}>100 metrów</option>
                    <option value={150}>150 metrów</option>
                    <option value={200}>200 metrów</option>
                    <option value={300}>300 metrów</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="pt-2">
        {isHost ? (
          <button
            onClick={onStartGame}
            disabled={!canStart}
            className={`w-full py-4 px-6 rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl transition flex items-center justify-center gap-2.5 cursor-pointer border ${
              canStart
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 border-emerald-400/50 shadow-emerald-500/30 active:scale-[0.98]'
                : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            <Play className="w-5 h-5 fill-current" />
            <span>
              {canStart ? 'ROZPOCZNIJ ROZGRYWKĘ' : 'Wymagane min. 1 auto w każdym składzie'}
            </span>
          </button>
        ) : (
          <div className="glass-card rounded-2xl p-3 text-center text-xs text-slate-400 border-slate-800">
            Oczekiwanie aż Kapitan (<strong className="text-white">{room.players.find((p) => p.isHost)?.name || 'Host'}</strong>) uruchomi rozgrywkę...
          </div>
        )}
      </div>

      {showZoneModal && (
        <ZoneConfigModal
          currentZone={room.settings.zone}
          roomSettings={room.settings}
          myGpsPosition={myGpsPosition}
          onSaveZone={onSetZone}
          onClose={() => setShowZoneModal(false)}
        />
      )}

      {showEditProfileModal && (
        <div className="fixed inset-0 z-[2300] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 select-none">
          <div className="w-full max-w-sm glass-panel border border-white/10 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <Car className="w-4 h-4 text-amber-400" /> Edycja Twojego Auta
              </h3>
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submitEditProfile} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Twój Nick</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Marka i Model</label>
                <input
                  type="text"
                  value={editModel}
                  onChange={(e) => setEditModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Kolor</label>
                <input
                  type="text"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Numer Rejestracyjny</label>
                <input
                  type="text"
                  value={editPlate}
                  maxLength={10}
                  onChange={(e) => setEditPlate(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono font-black text-white text-xs uppercase"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase"
                >
                  Zapisz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showChat && (
        <RoomChatModal
          roomCode={room.code}
          myPlayer={myPlayer}
          messages={room.messages || []}
          onSendMessage={onSendMessage}
          onClose={() => {
            setShowChat(false);
            setUnreadChatCount(0);
          }}
        />
      )}

      {showHistory && (
        <GameHistoryModal
          history={room.history || []}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
