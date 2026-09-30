import React from 'react';
import { Flame, Users, TrendingUp, Zap, ArrowRight, Award } from 'lucide-react';
import { sound } from '../utils/audio';

interface HotTable {
  id: string;
  name: string;
  icon: string;
  activePlayers: number;
  recentBigWin: string;
  volume24hSol: number;
  volatility: 'HOT' | 'EXTREME' | 'HIGH';
  glowColor: 'cyan' | 'orange' | 'purple' | 'red';
}

const HOT_TABLES_DATA: HotTable[] = [
  {
    id: 'roulette',
    name: 'Neon Roulette',
    icon: '🎡',
    activePlayers: 184,
    recentBigWin: '500x Lightning Strike (+12.40 SOL)',
    volume24hSol: 1420.8,
    volatility: 'HOT',
    glowColor: 'cyan',
  },
  {
    id: 'crash',
    name: 'Crash Rocket',
    icon: '🚀',
    activePlayers: 246,
    recentBigWin: '87.5x Cashout (+8.75 SOL)',
    volume24hSol: 2190.5,
    volatility: 'EXTREME',
    glowColor: 'orange',
  },
  {
    id: 'slots',
    name: 'Slot Cascade',
    icon: '🎰',
    activePlayers: 128,
    recentBigWin: '245x Cluster (+24.50 SOL)',
    volume24hSol: 980.2,
    volatility: 'HIGH',
    glowColor: 'purple',
  },
  {
    id: 'mines',
    name: 'Mines & Treasure',
    icon: '💣',
    activePlayers: 162,
    recentBigWin: '124x Diamond Run (+18.60 SOL)',
    volume24hSol: 1140.0,
    volatility: 'EXTREME',
    glowColor: 'red',
  },
];

interface HotTablesGridProps {
  onSelectGame: (gameId: string) => void;
}

export const HotTablesGrid: React.FC<HotTablesGridProps> = ({ onSelectGame }) => {
  return (
    <div className="space-y-3 my-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-950/80 border border-orange-500/50 flex items-center justify-center text-orange-400 shadow-sm shadow-orange-950">
            <Flame className="w-4 h-4 text-orange-400 animate-bounce" />
          </div>
          <h2 className="text-sm font-bold font-display tracking-wider text-white uppercase flex items-center gap-2">
            Hot Tables & Live High-Roller Action
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
          Real-time activity telemetry & active multipliers
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {HOT_TABLES_DATA.map((t) => (
          <div
            key={t.id}
            className={`p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden group hover:-translate-y-1 ${
              t.glowColor === 'orange'
                ? 'cyber-glass-orange'
                : t.glowColor === 'red'
                ? 'cyber-glass-red'
                : 'cyber-glass-glow'
            }`}
          >
            {/* Top Row Header */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{t.icon}</span>
                <div>
                  <h3 className="text-xs font-bold text-white font-display">{t.name}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>{t.activePlayers} Live Players</span>
                  </div>
                </div>
              </div>

              <span
                className={`px-2 py-0.5 rounded-md font-mono text-[9px] font-extrabold border ${
                  t.volatility === 'EXTREME'
                    ? 'bg-red-950 text-red-300 border-red-500/50'
                    : 'bg-orange-950 text-orange-300 border-orange-500/50'
                }`}
              >
                🔥 {t.volatility}
              </span>
            </div>

            {/* Recent Big Win Highlight */}
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] font-mono space-y-1 mb-3">
              <span className="text-slate-400 text-[10px] block uppercase tracking-wider">
                Recent Peak Win
              </span>
              <span className="text-yellow-300 font-bold block truncate">{t.recentBigWin}</span>
            </div>

            {/* Footer Stats & Jump In CTA */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
              <span className="font-mono text-slate-400">
                24h Vol: <strong className="text-cyan-300">{t.volume24hSol} SOL</strong>
              </span>

              <button
                onClick={() => {
                  sound.playChipClick();
                  onSelectGame(t.id);
                }}
                className="px-3 py-1.5 bg-cyan-600/80 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-md shadow-cyan-950 transition-all group-hover:scale-105"
              >
                <span>Play Now</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
