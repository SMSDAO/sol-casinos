import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Sparkles,
  Users,
  Flame,
  Zap,
  Smile,
  DollarSign,
  Crown,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface ChatMessage {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  timestamp: number;
  isJackpot?: boolean;
  tier?: 'VIP' | 'Whale' | 'High-Roller' | 'Member';
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    sender: 'NeonWhale_88',
    avatar: '🐋',
    text: 'Lightning 200x on #17 just hit! Anyone on it?!',
    timestamp: Date.now() - 120000,
    tier: 'Whale',
  },
  {
    id: 'm2',
    sender: 'SolSniper',
    avatar: '🎯',
    text: 'Cashed out Crash Rocket @ 8.4x nicely. GG!',
    timestamp: Date.now() - 90000,
    tier: 'High-Roller',
  },
  {
    id: 'm3',
    sender: 'SYSTEM',
    avatar: '👑',
    text: '⚡ JACKPOT ALERT: 7xK9...2LmP won +12.40 SOL in Neon Roulette (500x)!',
    timestamp: Date.now() - 45000,
    isJackpot: true,
    tier: 'VIP',
  },
  {
    id: 'm4',
    sender: 'CyberAce',
    avatar: '🤖',
    text: 'Cascade mode into Poker heads-up is printing today.',
    timestamp: Date.now() - 20000,
    tier: 'Member',
  },
];

interface LiveChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  publicKey: string | null;
}

export const LiveChatDrawer: React.FC<LiveChatDrawerProps> = ({
  isOpen,
  onClose,
  publicKey,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [onlineCount, setOnlineCount] = useState(642);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isOpen]);

  // Simulated live message ticker
  useEffect(() => {
    const interval = setInterval(() => {
      const simulatedPlayers = [
        { name: 'SolanaKing', avatar: '🦁', tier: 'VIP' as const, text: 'Rolling 0.5 SOL on Dice over 50...' },
        { name: 'MatrixDegen', avatar: '🕶️', tier: 'High-Roller' as const, text: 'Blackjack side bet 21+3 flush paid out 9x!' },
        { name: 'QuantumSol', avatar: '🔮', tier: 'Member' as const, text: 'Cascade mode 3-stage chain locked in!' },
      ];
      const pick = simulatedPlayers[Math.floor(Math.random() * simulatedPlayers.length)];
      const newMsg: ChatMessage = {
        id: `m_${Date.now()}`,
        sender: pick.name,
        avatar: pick.avatar,
        text: pick.text,
        timestamp: Date.now(),
        tier: pick.tier,
      };
      setMessages((prev) => [...prev.slice(-30), newMsg]);
      setOnlineCount((prev) => prev + (Math.random() > 0.5 ? 1 : -1));
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    sound.playChipClick();
    const myName = publicKey ? `${publicKey.slice(0, 4)}...${publicKey.slice(-3)}` : 'Guest_Player';
    const newMsg: ChatMessage = {
      id: `my_${Date.now()}`,
      sender: myName,
      avatar: '⚡',
      text: inputText.trim(),
      timestamp: Date.now(),
      tier: 'High-Roller',
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm cyber-glass-glow border-l border-cyan-500/30 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Top Bar */}
      <div className="p-4 border-b border-cyan-500/20 flex items-center justify-between bg-slate-950/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              High-Roller Live Room
            </h3>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{onlineCount} Online Players</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playChipClick();
            onClose();
          }}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-2.5 rounded-xl border transition-all ${
              m.isJackpot
                ? 'bg-gradient-to-r from-yellow-950/80 to-orange-950/80 border-yellow-500/60 shadow-md shadow-yellow-950'
                : 'bg-slate-900/70 border-slate-800/80'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span>{m.avatar}</span>
                <span
                  className={`font-bold ${
                    m.isJackpot
                      ? 'text-yellow-300'
                      : m.tier === 'Whale'
                      ? 'text-purple-300'
                      : 'text-cyan-300'
                  }`}
                >
                  {m.sender}
                </span>
                {m.tier && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {m.tier}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500">
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <p className={`text-xs ${m.isJackpot ? 'text-yellow-200 font-bold' : 'text-slate-200'}`}>
              {m.text}
            </p>
          </div>
        ))}
        <div ref={chatBottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-cyan-500/20 bg-slate-950/90 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type message to room..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
        />
        <button
          type="submit"
          className="p-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-white rounded-xl shadow-md shadow-cyan-950 transition-all shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
