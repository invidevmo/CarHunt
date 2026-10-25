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
  History,
  Info,
  Users
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
  
  const [garageExpanded, setGarageExpanded] = useState(!localStorage.getItem('carhunt_car_model'));
  const [showRulesAccordion, setShowRulesAccordion] = useState(false);
  const [activeTeamTab, setActiveTeamTab] = useState('ALL');
  const [showSettings, setShowSettings] = useState(false);
  const [showZoneDetails, setShowZoneDetails] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const [editName, setEditName] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editPlate, setEditPlate] = useState('');

  const prevMsgCountRef = useRef(room?.messages?.length || 0);

  const isHost = myPlayer?.isHost;

  useEffect(() => {
    const currentCount = room?.messages?.length || 0;
    if (currentCount > prevMsgCountRef.current && !showChat) {
      setUnreadChatCount((c) => c + (currentCount - prevMsgCountRef.current));
    }
    prevMsgCountRef.current = currentCount;
  }, [room?.messages, showChat]);

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
      <div className="max-w-md mx-auto w-full px-3.5 sm:px-5 py-4 sm:py-6 space-y-3.5 flex-1 flex flex-col justify-center select-none pb-safe animate-fade-in">
        <div className="text-center space-y-1.5">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute -inset-3 bg-gradient-to-r from-amber-500 via-rose-500 to-cyan-500 rounded-3xl blur-xl opacity-35 animate-pulse" />
            <div className="relative inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-gradient-to-tr from-slate-900 via-slate-950 to-slate-900 border border-white/15 shadow-2xl">
              <Radar className="w-8 h-8 sm:w-9 sm:h-9 text-amber-400 animate-pulse" />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-black tracking-widest uppercase mb-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Nocny Chowany Samochodowy GPS
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase italic leading-none">
              Car<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Hunt</span>
            </h1>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto leading-tight">
              Ukryj auto w mieście, zgaś światła lub poluj załogą łowców z radarem GPS!
            </p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-2.5 flex gap-2 text-amber-200/90 text-[11px] items-center border-amber-500/20 bg-amber-950/20 shadow-sm">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="leading-tight">
            <strong>Bezpieczeństwo na drodze:</strong> Telefon w aucie obsługuje wyłącznie <strong>pilot / pasażer</strong>!
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-3.5 sm:p-4 space-y-3 shadow-2xl border-white/10 transition-all duration-300">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setGarageExpanded(!garageExpanded)}
              className="flex items-center gap-2 text-left cursor-pointer group flex-1"
            >
              <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                <Car className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wider font-extrabold text-white flex items-center gap-1.5">
                  <span>Twój Samochód i Załoga</span>
                  {carPlate && <LicensePlate plate={carPlate} size="xs" />}
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">
                  {playerName || 'Kierowca'} • {carModel || 'Brak modelu'}{carColor ? ` (${carColor})` : ''}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setGarageExpanded(!garageExpanded)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              {garageExpanded ? <ChevronUp className="w-4 h-4 text-amber-400" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {garageExpanded && (
            <div className="space-y-3 pt-2 border-t border-white/5 animate-fade-in text-xs">
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

                <div className="flex gap-1 overflow-x-auto py-1 mt-1 scrollbar-none">
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

              <button
                type="button"
                onClick={() => {
                  handleSaveProfile();
                  setGarageExpanded(false);
                }}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 border border-white/10"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zapisz dane auta</span>
              </button>
            </div>
          )}
        </div>

        <div className="space-y-2.5">
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

        <div className="pt-1 flex gap-2">
          <button
            type="button"
            onClick={() => setShowHistory(true)}
            className="flex-1 py-2 px-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-md"
          >
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>Historia Gier</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRulesAccordion(!showRulesAccordion)}
            className="flex-1 py-2 px-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-md"
          >
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span>{showRulesAccordion ? 'Ukryj Zasady' : 'Zasady Gry'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showRulesAccordion ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showRulesAccordion && (
          <div className="grid grid-cols-2 gap-2 pt-1 animate-fade-in">
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
        )}

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

  const displayedPlayers = 
    activeTeamTab === 'HIDERS' ? hiders :
    activeTeamTab === 'SEEKERS' ? seekers :
    room.players;

  return (
    <div className="max-w-xl mx-auto p-3 sm:p-5 space-y-3 flex-1 flex flex-col select-none pb-28">
      <div className="glass-panel rounded-3xl p-3.5 sm:p-4.5 flex items-center justify-between shadow-2xl border-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-400 to-rose-500" />
        <div>
          <span className="text-[9px] uppercase tracking-widest font-black text-slate-400 block">KOD ROZGRYWKI</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-widest text-white">{room.code}</span>
            <button
              onClick={handleCopyCode}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/10 transition active:scale-95 cursor-pointer"
              title="Skopiuj kod pokoju"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleShareCode}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/10 transition active:scale-95 cursor-pointer"
              title="Udostępnij kod znajomym"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            {onLeaveRoom && (
              <button
                onClick={onLeaveRoom}
                className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 border border-white/10 transition active:scale-95 cursor-pointer ml-0.5"
                title="Opuść pokój"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setShowChat(true);
              setUnreadChatCount(0);
            }}
            className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-md relative"
            title="Czat pokoju"
          >
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Czat</span>
            {unreadChatCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black animate-pulse">
                +{unreadChatCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowHistory(true)}
            className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-md"
            title="Historia rozgrywek"
          >
            <History className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Historia</span>
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-2.5 sm:p-3 flex items-center justify-between border-amber-500/20 bg-slate-900/60">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
            <Car className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <strong className="text-white text-xs truncate">{myPlayer?.name || playerName}</strong>
              <span className="text-[11px] text-slate-300 font-medium">({myPlayer?.carModel || carModel || 'Auto'})</span>
              {(myPlayer?.carColor || carColor) && (
                <span
                  className="w-2.5 h-2.5 rounded-full border border-white/40 shadow-sm shrink-0"
                  style={{ backgroundColor: getColorHex(myPlayer?.carColor || carColor) }}
                />
              )}
              {(myPlayer?.carPlate || carPlate) && (
                <LicensePlate plate={myPlayer?.carPlate || carPlate} size="xs" />
              )}
            </div>
          </div>
        </div>

        <button
          onClick={openEditModal}
          className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer active:scale-95"
          title="Zmień dane swojego auta"
        >
          <Pencil className="w-3 h-3 text-amber-400" />
          <span className="text-[11px]">Edytuj</span>
        </button>
      </div>

      <div className={`glass-panel rounded-3xl p-3 sm:p-3.5 border space-y-2 transition-all ${
        room.settings.gameMode === 'MOVING_ZONE' ? 'border-cyan-500/30' : 'border-rose-500/25'
      }`}>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowZoneDetails(!showZoneDetails)}
            className="flex items-center gap-2 text-left cursor-pointer flex-1 min-w-0"
          >
            <div className={`p-1.5 rounded-xl border shrink-0 ${
              room.settings.gameMode === 'MOVING_ZONE'
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
            }`}>
              <Crosshair className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-white">Strefa</span>
                <span className={`px-2 py-0.2 rounded-full text-[9px] font-black uppercase border ${
                  room.settings.gameMode === 'MOVING_ZONE'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}>
                  {room.settings.gameMode === 'MOVING_ZONE' ? 'Dynamiczna' : 'Stała'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showZoneDetails ? 'rotate-180' : ''}`} />
              </div>
              <span className="text-[10px] text-slate-400 block font-mono truncate">
                {room.settings.gameMode === 'MOVING_ZONE'
                  ? `Teren: ${room.settings.movingZone.outerRadius >= 1000 ? `${(room.settings.movingZone.outerRadius / 1000).toFixed(1)}km` : `${room.settings.movingZone.outerRadius}m`} | Auta: ${room.settings.movingZone.activeRadius >= 1000 ? `${(room.settings.movingZone.activeRadius / 1000).toFixed(1)}km` : `${room.settings.movingZone.activeRadius}m`}`
                  : `Promień: ${room.settings.zone.radius >= 1000 ? `${(room.settings.zone.radius / 1000).toFixed(1)}km` : `${room.settings.zone.radius}m`} (Karencja ${room.settings.zone.graceSeconds || 30}s)`
                }
              </span>
            </div>
          </button>

          {isHost && (
            <button
              onClick={() => setShowZoneModal(true)}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-[11px] uppercase transition cursor-pointer flex items-center gap-1 active:scale-95 shadow-md shadow-rose-600/20 shrink-0"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Zmień</span>
            </button>
          )}
        </div>

        {showZoneDetails && (
          <div className="pt-2 border-t border-white/5 text-[11px] text-slate-400 space-y-1 animate-fade-in leading-relaxed">
            <p>
              {room.settings.gameMode === 'MOVING_ZONE'
                ? 'Strefa przemieszcza się po wyznaczonym terenie miasta! Załogi muszą regularnie zmieniać kryjówki i dojeżdżać do nowego rejonu.'
                : `Wyjście poza wyznaczony okrąg skutkuje odliczeniem ${room.settings.zone.graceSeconds || 30}s. Jeśli uciekinier nie wróci, jego pozycja zostaje odsłonięta łowcom!`}
            </p>
          </div>
        )}
      </div>

      {isHost && room.players.length >= 2 && (
        <div className="glass-panel rounded-3xl p-3 space-y-2 border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-extrabold text-amber-300 flex items-center gap-1.5">
              <Dices className="w-3.5 h-3.5 text-amber-400" /> Szybki Podział Składów:
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-xs">
            <button
              onClick={() => onRandomizeTeams('single')}
              className="p-1.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-400/50 text-slate-300 hover:text-white transition text-center cursor-pointer active:scale-95"
            >
              <strong className="block text-amber-400 text-[11px] font-black">1 Ucieka</strong>
              <span className="text-[9px] text-slate-400">Reszta szuka</span>
            </button>

            <button
              onClick={() => onRandomizeTeams('pair')}
              className="p-1.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-purple-400/50 text-slate-300 hover:text-white transition text-center cursor-pointer active:scale-95"
            >
              <strong className="block text-purple-400 text-[11px] font-black">2 Ucieka</strong>
              <span className="text-[9px] text-slate-400">Reszta szuka</span>
            </button>

            <button
              onClick={() => onRandomizeTeams('ratio')}
              className="p-1.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-400/50 text-slate-300 hover:text-white transition text-center cursor-pointer active:scale-95"
            >
              <strong className="block text-cyan-400 text-[11px] font-black">Balans</strong>
              <span className="text-[9px] text-slate-400">~35% celów</span>
            </button>

            <button
              onClick={() => onRandomizeTeams('half')}
              className="p-1.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-400/50 text-slate-300 hover:text-white transition text-center cursor-pointer active:scale-95"
            >
              <strong className="block text-emerald-400 text-[11px] font-black">50 / 50</strong>
              <span className="text-[9px] text-slate-400">Równe siły</span>
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2 flex-1">
        <div className="grid grid-cols-3 p-1 bg-slate-900/90 rounded-2xl border border-white/10 text-xs font-black">
          <button
            type="button"
            onClick={() => setActiveTeamTab('ALL')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1 transition cursor-pointer ${
              activeTeamTab === 'ALL'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Wszyscy ({room.players.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTeamTab('HIDERS')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1 transition cursor-pointer ${
              activeTeamTab === 'HIDERS'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Ucieka ({hiders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTeamTab('SEEKERS')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1 transition cursor-pointer ${
              activeTeamTab === 'SEEKERS'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-cyan-300 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Szuka ({seekers.length})</span>
          </button>
        </div>

        {activeTeamTab === 'HIDERS' && myPlayer?.role !== 'HIDER' && (
          <button
            onClick={() => onSetRole('HIDER', myPlayer?.id)}
            className="w-full py-2 px-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase transition cursor-pointer active:scale-95 shadow-md flex items-center justify-center gap-1.5"
          >
            <Car className="w-4 h-4" />
            <span>Dołącz do Uciekinierów</span>
          </button>
        )}

        {activeTeamTab === 'SEEKERS' && myPlayer?.role !== 'SEEKER' && (
          <button
            onClick={() => onSetRole('SEEKER', myPlayer?.id)}
            className="w-full py-2 px-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase transition cursor-pointer active:scale-95 shadow-md flex items-center justify-center gap-1.5"
          >
            <Shield className="w-4 h-4" />
            <span>Dołącz do Łowców</span>
          </button>
        )}

        <div className="space-y-2">
          {displayedPlayers.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
              Brak załóg w tym składzie. Kliknij przycisk powyżej, aby dołączyć!
            </div>
          ) : (
            displayedPlayers.map((p) => {
              const isHiderP = p.role === 'HIDER';
              return (
                <div
                  key={p.id}
                  className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 transition ${
                    isHiderP
                      ? 'bg-purple-950/20 border-purple-900/40 hover:border-purple-600/40'
                      : 'bg-cyan-950/20 border-cyan-900/40 hover:border-cyan-600/40'
                  }`}
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
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                        isHiderP ? 'bg-purple-500/20 text-purple-300' : 'bg-cyan-500/20 text-cyan-300'
                      }`}>
                        {isHiderP ? 'Ucieka' : 'Szuka'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-[11px] text-slate-300 font-medium">{p.carModel || 'Auto'}</span>
                      {p.carColor && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-slate-900 border border-slate-700 text-[10px] text-slate-300 font-mono">
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
                        className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition cursor-pointer"
                        title="Edytuj dane auta"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isHost && (
                      <button
                        onClick={() => onSetRole(isHiderP ? 'SEEKER' : 'HIDER', p.id)}
                        className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                        title={isHiderP ? 'Przenieś do Łowców' : 'Przenieś do Uciekinierów'}
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {isHost && (
        <div className="glass-panel rounded-3xl p-3 space-y-2 border-white/5">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full flex items-center justify-between text-xs uppercase tracking-wider font-extrabold text-slate-300 hover:text-white cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Settings2 className="w-3.5 h-3.5 text-amber-400" /> Parametry rozgrywki (Czasy / Radar)
            </span>
            <span className="flex items-center gap-1 text-xs text-amber-400">
              {showSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </button>

          {showSettings && (
            <div className="space-y-3 pt-2.5 border-t border-white/5 text-xs animate-fade-in">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Czas na ukrycie:</label>
                  <select
                    value={room.settings.hideDuration}
                    onChange={(e) => onUpdateSettings({ hideDuration: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2 text-white text-xs"
                  >
                    <option value={120}>2 minuty</option>
                    <option value={180}>3 minuty</option>
                    <option value={300}>5 minut</option>
                    <option value={600}>10 minut</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Czas polowania:</label>
                  <select
                    value={room.settings.gameDuration}
                    onChange={(e) => onUpdateSettings({ gameDuration: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2 text-white text-xs"
                  >
                    <option value={600}>10 minut</option>
                    <option value={900}>15 minut</option>
                    <option value={1200}>20 minut</option>
                    <option value={1800}>30 minut</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Interwał radaru:</label>
                  <select
                    value={room.settings.pingInterval}
                    onChange={(e) => onUpdateSettings({ pingInterval: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2 text-white text-xs"
                  >
                    <option value={45}>Co 45 sekund</option>
                    <option value={60}>Co 60 sekund</option>
                    <option value={90}>Co 90 sekund</option>
                    <option value={120}>Co 2 minuty</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Okrąg pingu radaru:</label>
                  <select
                    value={room.settings.pingFuzzRadius}
                    onChange={(e) => onUpdateSettings({ pingFuzzRadius: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2 text-white text-xs"
                  >
                    <option value={50}>50 m (Mikrostrefa)</option>
                    <option value={75}>75 m</option>
                    <option value={100}>100 m</option>
                    <option value={150}>150 m</option>
                    <option value={200}>200 m</option>
                    <option value={300}>300 m</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="fixed bottom-0 inset-x-0 z-40 p-3 pb-safe bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent pointer-events-auto">
        <div className="max-w-xl mx-auto">
          {isHost ? (
            <button
              onClick={onStartGame}
              disabled={!canStart}
              className={`w-full py-3.5 px-6 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest shadow-2xl transition flex items-center justify-center gap-2 cursor-pointer border ${
                canStart
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 border-emerald-400/50 shadow-emerald-500/30 active:scale-[0.98]'
                  : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {canStart ? 'ROZPOCZNIJ ROZGRYWKĘ' : 'Wymagane min. 1 auto w każdym składzie'}
              </span>
            </button>
          ) : (
            <div className="glass-card rounded-2xl p-2.5 text-center text-xs text-slate-400 border-slate-800">
              Oczekiwanie aż Kapitan (<strong className="text-white">{room.players.find((p) => p.isHost)?.name || 'Host'}</strong>) wystartuje grę...
            </div>
          )}
        </div>
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
