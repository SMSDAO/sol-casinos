import React, { useState, useEffect, useRef } from 'react';
import {
  Tv,
  Eye,
  TrendingUp,
  Heart,
  Coins,
  ArrowRight,
  Sparkles,
  Zap,
  Star,
  Maximize2,
  Minimize2,
  X,
  Volume2,
  VolumeX,
  Copy,
  Radio,
  Share2,
  Flame,
  Check,
  Shield,
  Layers,
  ChevronDown,
  CheckCircle2,
  MessageSquare,
  Send,
  Users,
  Smile,
} from 'lucide-react';
import { sound } from '../utils/audio';

export interface SpectatorPlayerState {
  id: string;
  name: string;
  wallet: string;
  activeGame: string;
  betAmountSol: number;
  currentMultiplier: number;
  status: 'playing' | 'cashed_out' | 'bust' | 'won';
  currentScore: number;
  activeArtifacts: string[];
  chosenPath: string[];
  events: string[];
  stats: {
    winRate: number;
    totalWageredSol: number;
    netProfitSol: number;
    streak: number;
  };
  lastUpdate: number;
}

export interface SpectatorChatMessage {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  timestamp: number;
  tier?: string;
}

export interface SpectatorLiveStreamProps {
  isOpen: boolean;
  onClose: () => void;
  userPublicKey: string | null;
  onMirrorBet?: (game: string, betAmountSol: number) => void;
}

export const SpectatorLiveStream: React.FC<SpectatorLiveStreamProps> = ({
  isOpen,
  onClose,
  userPublicKey,
  onMirrorBet,
}) => {
  const [players, setPlayers] = useState<SpectatorPlayerState[]>([]);
  const [activePlayerId, setActivePlayerId] = useState<string>('stream-p1');
  // Default to centered popup window in middle of screen (ideal for mobile and desktop)
  const [viewMode, setViewMode] = useState<'modal' | 'pill'>('modal');
  const [connected, setConnected] = useState<boolean>(false);
  const [latency, setLatency] = useState<number>(18);
  const [spectatorCount, setSpectatorCount] = useState<number>(14240);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [tipInput, setTipInput] = useState<string>('0.02');
  const [tipSuccess, setTipSuccess] = useState<boolean>(false);
  const [copiedBlink, setCopiedBlink] = useState<boolean>(false);
  const [cheerHearts, setCheerHearts] = useState<{ id: number; emoji: string; left: number }[]>([]);

  // Mini Live Chat State
  const [showLiveChat, setShowLiveChat] = useState<boolean>(true);
  const [chatMessages, setChatMessages] = useState<SpectatorChatMessage[]>([
    {
      id: 'init-1',
      sender: 'CyberDegen_99',
      avatar: '🤖',
      text: 'Apex is on a 4-win streak! Let it ride! 🔥',
      timestamp: Date.now() - 45000,
      tier: 'VIP',
    },
    {
      id: 'init-2',
      sender: 'SolanaSniper',
      avatar: '🎯',
      text: 'Rocket climbing past 2x altitude... hold on! 🚀',
      timestamp: Date.now() - 25000,
      tier: 'High-Roller',
    },
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [sendingChat, setSendingChat] = useState<boolean>(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Close on Escape Key Press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        sound.playChipClick();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Connect to Backend Real-Time SSE Stream (/api/spectator/stream)
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const connectSSE = () => {
      try {
        const es = new EventSource('/api/spectator/stream');
        eventSourceRef.current = es;

        es.onopen = () => {
          if (isMounted) {
            setConnected(true);
            setLatency(Math.floor(12 + Math.random() * 15));
          }
        };

        es.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'init') {
              if (data.players && Array.isArray(data.players)) {
                setPlayers(data.players);
              }
              if (data.chatMessages && Array.isArray(data.chatMessages)) {
                setChatMessages(data.chatMessages);
              }
              setLatency(Math.floor(10 + Math.random() * 14));
            } else if (data.type === 'spectator_chat' && data.message) {
              setChatMessages((prev) => {
                if (prev.some((m) => m.id === data.message.id)) return prev;
                return [...prev.slice(-40), data.message];
              });
            } else if (data.players && Array.isArray(data.players)) {
              setPlayers(data.players);
              setLatency(Math.floor(10 + Math.random() * 14));
              setSpectatorCount((prev) => prev + (Math.random() > 0.5 ? 1 : -1));
            }
          } catch (e) {
            console.error('Error parsing SSE spectator data:', e);
          }
        };

        es.onerror = () => {
          if (isMounted) {
            setConnected(false);
          }
          es.close();
          // Fallback to polling /api/spectator/players every 2.5 seconds
          pollFallback();
        };
      } catch {
        pollFallback();
      }
    };

    const pollFallback = async () => {
      try {
        const res = await fetch('/api/spectator/players');
        if (res.ok) {
          const json = await res.json();
          if (json.players && isMounted) {
            setPlayers(json.players);
            setConnected(true);
          }
        }
        const chatRes = await fetch('/api/spectator/chat');
        if (chatRes.ok) {
          const chatJson = await chatRes.json();
          if (chatJson.messages && isMounted) {
            setChatMessages(chatJson.messages);
          }
        }
      } catch {
        // Fallback polling retry
      }
    };

    connectSSE();
    const interval = setInterval(pollFallback, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isOpen]);

  // Auto-scroll chat to bottom when messages update
  useEffect(() => {
    if (showLiveChat && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages.length, showLiveChat]);

  if (!isOpen) return null;

  const activePlayer = players.find((p) => p.id === activePlayerId) || players[0];
  const isRoundFinished =
    activePlayer &&
    (activePlayer.status === 'won' ||
      activePlayer.status === 'cashed_out' ||
      activePlayer.status === 'bust');

  const handleSendCheer = (emoji: string) => {
    if (soundEnabled) sound.playWin();
    const newCheer = {
      id: Date.now() + Math.random(),
      emoji,
      left: 20 + Math.random() * 60,
    };
    setCheerHearts((prev) => [...prev.slice(-6), newCheer]);
    setTimeout(() => {
      setCheerHearts((prev) => prev.filter((c) => c.id !== newCheer.id));
    }, 1800);
  };

  const handleSendChatMessage = async (presetText?: string) => {
    const textToSend = (presetText || chatInput).trim();
    if (!textToSend) return;

    if (soundEnabled) sound.playChipClick();
    const senderName = userPublicKey
      ? `${userPublicKey.slice(0, 4)}...${userPublicKey.slice(-4)}`
      : 'You';

    const optimisticMsg: SpectatorChatMessage = {
      id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sender: senderName,
      avatar: '🕶️',
      text: textToSend,
      timestamp: Date.now(),
      tier: 'Member',
    };

    setChatMessages((prev) => [...prev.slice(-40), optimisticMsg]);
    if (!presetText) setChatInput('');

    try {
      setSendingChat(true);
      await fetch('/api/spectator/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: senderName,
          text: textToSend,
          avatar: '🕶️',
          tier: 'Member',
        }),
      });
    } catch (e) {
      console.error('Failed to post spectator chat', e);
    } finally {
      setSendingChat(false);
    }
  };

  const handleTipPlayer = async () => {
    if (!activePlayer) return;
    const amount = parseFloat(tipInput);
    if (isNaN(amount) || amount <= 0) return;

    if (soundEnabled) sound.playJackpot();
    try {
      await fetch('/api/spectator/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: activePlayer.id,
          amountSol: amount,
          senderWallet: userPublicKey,
        }),
      });
      setTipSuccess(true);
      setTimeout(() => setTipSuccess(false), 3000);
    } catch {
      // In offline mode, treat as successful tip simulation
      setTipSuccess(true);
      setTimeout(() => setTipSuccess(false), 3000);
    }
  };

  const handleMirrorBet = () => {
    if (!activePlayer) return;
    if (soundEnabled) sound.playChipClick();
    if (onMirrorBet) {
      onMirrorBet(activePlayer.activeGame, activePlayer.betAmountSol);
    }
  };

  const handleCopyBlink = () => {
    if (soundEnabled) sound.playChipClick();
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://solstice-roulette.app';
    const blinkUrl = `solana-action:${origin}/api/action/play?game=${encodeURIComponent(
      activePlayer?.activeGame.toLowerCase().replace(/\s+/g, '_') || 'roulette'
    )}`;
    navigator.clipboard.writeText(blinkUrl);
    setCopiedBlink(true);
    setTimeout(() => setCopiedBlink(false), 2500);
  };

  // --- Optional Compact Floating Pill Mode (if user minimizes popup) ---
  if (viewMode === 'pill') {
    return (
      <div className="fixed bottom-6 right-4 sm:right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
        <div
          onClick={() => {
            sound.playChipClick();
            setViewMode('modal');
          }}
          className="flex items-center gap-3 px-4 py-2.5 rounded-full cyber-glass-glow border border-cyan-400/70 bg-[#060813]/95 text-slate-100 shadow-2xl cursor-pointer hover:border-cyan-300 transition-all font-mono text-xs backdrop-blur-md"
        >
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-[10px] font-extrabold text-red-400 uppercase tracking-widest">LIVE</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-white truncate max-w-[130px]">{activePlayer?.name || 'Live Stream'}</span>
            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-extrabold text-[10px]">
              {activePlayer?.currentMultiplier.toFixed(2)}x
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              sound.playChipClick();
              onClose();
            }}
            title="Close Live Stream"
            className="w-6 h-6 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // --- Centered Popup Window in Middle of Mobile Phone & Desktop ---
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        // Close if user taps outside the centered card
        if (e.target === e.currentTarget) {
          sound.playChipClick();
          onClose();
        }
      }}
    >
      <div className="w-full max-w-lg cyber-glass-glow rounded-3xl p-4 sm:p-5 border border-cyan-500/40 text-slate-100 shadow-2xl font-mono max-h-[92vh] overflow-y-auto space-y-3.5 bg-[#060813]/95 relative">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 p-0.5 shadow-md">
              <div className="w-full h-full bg-[#060813] rounded-[10px] flex items-center justify-center">
                <Tv className="w-4 h-4 text-cyan-300 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                  <span>SPECTATOR LIVE STREAM</span>
                  <span className="flex items-center gap-1 text-[9px] text-red-400 font-extrabold px-1.5 py-0.2 rounded bg-red-950/80 border border-red-500/40">
                    <Radio className="w-2.5 h-2.5 animate-pulse" />
                    LIVE
                  </span>
                </h3>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                <span className="text-emerald-400">{connected ? `● ${latency}ms` : 'Connecting...'}</span>
                <span>•</span>
                <span>{spectatorCount.toLocaleString()} watching</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Mini 'Live Chat' Toggle Button in Header */}
            <button
              onClick={() => {
                sound.playChipClick();
                setShowLiveChat(!showLiveChat);
              }}
              title={showLiveChat ? 'Hide Live Chat' : 'Show Live Chat'}
              aria-label="Toggle Spectator Live Chat"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                showLiveChat
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-950'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className={`w-3.5 h-3.5 ${showLiveChat ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Live Chat</span>
              {chatMessages.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute Stream Audio' : 'Unmute Stream Audio'}
              className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* Minimize to Pill Toggle */}
            <button
              onClick={() => {
                sound.playChipClick();
                setViewMode('pill');
              }}
              title="Minimize to Floating Pill"
              className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* Prominent Easy-To-Tap Close Button */}
            <button
              onClick={() => {
                sound.playChipClick();
                onClose();
              }}
              title="Close Stream Window"
              aria-label="Close Stream Window"
              className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 hover:border-red-500 text-slate-300 hover:text-white hover:bg-red-950/60 flex items-center justify-center transition-all active:scale-95 shadow-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {activePlayer ? (
          <div className="space-y-3">
            {/* Table Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {players.map((p) => {
                const isSel = p.id === activePlayer.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      sound.playChipClick();
                      setActivePlayerId(p.id);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-all border ${
                      isSel
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-950'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{p.name.split('_')[0]}</span>
                    <span className="ml-1 text-[9px] opacity-75">({p.currentMultiplier}x)</span>
                  </button>
                );
              })}
            </div>

            {/* Video HUD Card with Overlaid Stats */}
            <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30 bg-gradient-to-b from-slate-950 via-[#070b19] to-slate-950 p-4 space-y-3">
              {/* Subtle Cyber Grid Effect */}
              <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />

              {/* Floating Cheer Emojis Layer */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {cheerHearts.map((c) => (
                  <span
                    key={c.id}
                    style={{ left: `${c.left}%` }}
                    className="absolute bottom-2 text-2xl animate-in slide-in-from-bottom duration-1000 fade-out-80"
                  >
                    {c.emoji}
                  </span>
                ))}
              </div>

              {/* Player Top Meta */}
              <div className="flex items-center justify-between gap-2 z-10 relative">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center font-bold text-xs text-cyan-300">
                    {activePlayer.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">{activePlayer.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {activePlayer.wallet.slice(0, 5)}...{activePlayer.wallet.slice(-4)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-cyan-300 block uppercase tracking-wider">
                    {activePlayer.activeGame}
                  </span>
                  <span
                    className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border inline-block ${
                      activePlayer.status === 'won' || activePlayer.status === 'cashed_out'
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                        : activePlayer.status === 'bust'
                        ? 'bg-red-950/80 border-red-500 text-red-300'
                        : 'bg-yellow-950/80 border-yellow-500 text-yellow-300'
                    }`}
                  >
                    {activePlayer.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Bets & Live Multiplier Overlays */}
              <div className="grid grid-cols-2 gap-2 z-10 relative">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Current Bet</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-sm font-extrabold text-white font-mono">
                      {activePlayer.betAmountSol.toFixed(3)} SOL
                    </span>
                    <span className="text-[9px] text-slate-400">
                      (~${(activePlayer.betAmountSol * 148.5).toFixed(2)})
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-cyan-500/40">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Live Multiplier</span>
                  <div className="text-base font-black text-cyan-400 font-mono mt-0.5 flex items-center gap-1 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
                    <TrendingUp className="w-4 h-4 text-cyan-300" />
                    <span>{activePlayer.currentMultiplier.toFixed(2)}x</span>
                  </div>
                </div>
              </div>

              {/* Chosen Path (Visual Decision Trail) */}
              <div className="space-y-1 z-10 relative">
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                  Player's Chosen Path:
                </span>
                <div className="flex flex-wrap gap-1 p-2 rounded-xl bg-slate-950/90 border border-slate-800 max-h-[55px] overflow-y-auto">
                  {activePlayer.chosenPath.length > 0 ? (
                    activePlayer.chosenPath.map((step, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-[9px] font-mono"
                      >
                        <span>{step}</span>
                        {idx < activePlayer.chosenPath.length - 1 && (
                          <ArrowRight className="w-2.5 h-2.5 text-slate-500" />
                        )}
                      </span>
                    ))
                  ) : (
                    <span className="text-[9px] text-slate-500">Initiating game round on-chain...</span>
                  )}
                </div>
              </div>

              {/* Stats HUD */}
              <div className="grid grid-cols-4 gap-1.5 z-10 relative text-center">
                <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[8px] text-slate-400 uppercase block">Score</span>
                  <span className="text-xs font-bold text-yellow-400 font-mono">{activePlayer.currentScore}</span>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[8px] text-slate-400 uppercase block">Win Rate</span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    {activePlayer.stats.winRate.toFixed(1)}%
                  </span>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[8px] text-slate-400 uppercase block">Net P&L</span>
                  <span className="text-xs font-bold text-cyan-300 font-mono">
                    +{activePlayer.stats.netProfitSol.toFixed(2)} SOL
                  </span>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[8px] text-slate-400 uppercase block">Streak</span>
                  <span className="text-xs font-bold text-orange-400 font-mono flex items-center justify-center gap-0.5">
                    <Flame className="w-3 h-3 text-orange-400" />
                    {activePlayer.stats.streak}
                  </span>
                </div>
              </div>
            </div>

            {/* MINI 'LIVE CHAT' PANEL (Toggleable from Header) */}
            {showLiveChat && (
              <div className="rounded-2xl border border-cyan-500/30 bg-slate-950/90 p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                      Spectator Live Chat
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Active Chat Room</span>
                  </div>
                </div>

                {/* Message Scroll Window */}
                <div
                  ref={chatScrollRef}
                  className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1 text-[11px] font-mono scrollbar-thin"
                >
                  {chatMessages.length > 0 ? (
                    chatMessages.map((msg) => (
                      <div key={msg.id} className="flex items-start gap-1.5 p-1 rounded hover:bg-slate-900/50">
                        <span className="text-xs shrink-0 select-none">{msg.avatar || '🕶️'}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-cyan-300 font-bold text-[10px] truncate">{msg.sender}</span>
                            {msg.tier && (
                              <span className="text-[8px] px-1 rounded bg-slate-800 text-yellow-400 font-bold">
                                {msg.tier}
                              </span>
                            )}
                            <span className="text-[8px] text-slate-500">
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-slate-200 text-[10px] break-words leading-tight">{msg.text}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-[10px] text-slate-500 text-center py-2">
                      No chat messages yet. Say hello to other spectators!
                    </div>
                  )}
                </div>

                {/* Quick Reaction Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[9px]">
                  {['🔥 LFG!', '🚀 Hold to 3x!', '💎 Safe Gem!', '👏 GG!', '💰 Cash out!'].map((pill) => (
                    <button
                      key={pill}
                      onClick={() => handleSendChatMessage(pill)}
                      className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 shrink-0 transition-colors"
                    >
                      {pill}
                    </button>
                  ))}
                </div>

                {/* Chat Input & Send Button */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendChatMessage();
                      }
                    }}
                    placeholder="Chat with spectators..."
                    maxLength={140}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={() => handleSendChatMessage()}
                    disabled={!chatInput.trim() || sendingChat}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1 shadow-md transition-all active:scale-95 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </div>
              </div>
            )}

            {/* Observer Actions Row */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                {/* Cheer Reactions */}
                <div className="flex items-center gap-1">
                  {['🔥', '🚀', '💎', '💖'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleSendCheer(emoji)}
                      className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs active:scale-95 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Mirror Bet Action */}
                <button
                  onClick={handleMirrorBet}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-950 transition-all active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Mirror Bet ({activePlayer.betAmountSol} SOL)</span>
                </button>
              </div>

              {/* Tip & Share Row */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-yellow-400" />
                  <input
                    type="text"
                    value={tipInput}
                    onChange={(e) => setTipInput(e.target.value)}
                    className="w-14 px-1.5 py-1 bg-slate-950 border border-slate-800 rounded text-center text-xs text-white font-mono"
                  />
                  <button
                    onClick={handleTipPlayer}
                    className="px-2.5 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-400/60 text-yellow-200 rounded text-[10px] font-bold transition-colors"
                  >
                    {tipSuccess ? 'Tip Sent ✓' : 'Tip'}
                  </button>
                </div>

                <button
                  onClick={handleCopyBlink}
                  className="px-2.5 py-1 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/50 text-purple-300 rounded text-[10px] font-bold flex items-center gap-1 transition-colors"
                >
                  {copiedBlink ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3" />}
                  <span>{copiedBlink ? 'Blink Copied' : 'Share Blink'}</span>
                </button>
              </div>
            </div>

            {/* Round Completion Banner & Easy Close Button (User can close page after completion) */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              {isRoundFinished && (
                <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-400/40 flex items-center justify-between text-xs animate-pulse">
                  <div className="flex items-center gap-1.5 text-cyan-200 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Round Finished ({activePlayer.status.replace('_', ' ').toUpperCase()})</span>
                  </div>
                  <span className="text-[10px] text-yellow-300 font-mono font-extrabold">
                    {activePlayer.currentMultiplier.toFixed(2)}x
                  </span>
                </div>
              )}

              {/* Dedicated Big Close Button to close page after completion */}
              <button
                onClick={() => {
                  sound.playChipClick();
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 hover:border-red-500/50 border border-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                <X className="w-4 h-4 text-red-400" />
                <span>Close Live Stream & Return to Casino</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400 space-y-3">
            <Tv className="w-8 h-8 text-cyan-400 animate-pulse mx-auto" />
            <p>Connecting to Real-Time Authoritative Game Stream...</p>
            <button
              onClick={() => {
                sound.playChipClick();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200"
            >
              Cancel & Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
