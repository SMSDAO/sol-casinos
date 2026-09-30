import React, { useState } from 'react';
import { Bell, Sparkles, Trophy, CheckCircle, X, ShieldAlert } from 'lucide-react';
import { sound } from '../utils/audio';

export interface AppNotification {
  id: string;
  type: 'win' | 'jackpot' | 'tournament' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    type: 'jackpot',
    title: '🔥 Cross-Game Jackpot Alert',
    message: 'Global Progressive Jackpot reached 1,482.50 SOL! 1% of every bet contributes to the vault.',
    timestamp: 'Just now',
    read: false,
  },
  {
    id: 'n2',
    type: 'tournament',
    title: '🏆 Tournament Position Update',
    message: 'You are currently Rank #4 in the 50 SOL Sprint. Eligible for 3.0 SOL payout.',
    timestamp: '5m ago',
    read: false,
  },
  {
    id: 'n3',
    type: 'win',
    title: '⚡ Lightning Multiplier Hit',
    message: 'Player CyberNinja_99 landed 482x on Neon Roulette! Total payout: 96.4 SOL.',
    timestamp: '12m ago',
    read: true,
  },
  {
    id: 'n4',
    type: 'system',
    title: '🛡️ Provably Fair Seeds Cycled',
    message: 'SHA-256 server seed hash batch #8942 committed on-chain.',
    timestamp: '1h ago',
    read: true,
  },
];

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleToggle = () => {
    sound.playChipClick();
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Mark all as read
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        title="In-App Notifications"
        className="p-2 rounded-xl bg-slate-900/90 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white shadow-md transition-all relative flex items-center justify-center active:scale-95"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 text-black font-mono text-[9px] font-extrabold flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#060813] border border-cyan-500/40 p-4 shadow-2xl font-mono text-xs z-50 space-y-3 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2.5">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white text-xs">NOTIFICATION CENTER</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 rounded-xl border transition-all ${
                  n.type === 'jackpot'
                    ? 'bg-yellow-950/40 border-yellow-500/40'
                    : n.type === 'tournament'
                    ? 'bg-purple-950/40 border-purple-500/40'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-[11px]">{n.title}</span>
                  <span className="text-[9px] text-slate-400">{n.timestamp}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
