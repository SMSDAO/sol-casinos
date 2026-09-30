import React, { useEffect, useState } from 'react';
import { Flame, Zap, Trophy, TrendingUp } from 'lucide-react';

interface WinEvent {
  id: string;
  player: string;
  game: string;
  amount: string;
  multiplier: string;
}

const INITIAL_WINS: WinEvent[] = [
  { id: '1', player: '7xK9...2LmP', game: 'Neon Roulette', amount: '12.40 SOL', multiplier: '500x' },
  { id: '2', player: '9vQ1...8wZ4', game: 'Crash Rocket', amount: '8.75 SOL', multiplier: '87.5x' },
  { id: '3', player: '4mR8...3kNp', game: 'Slot Cascade', amount: '24.50 SOL', multiplier: '245x' },
  { id: '4', player: '2bY7...9qTx', game: 'Wheel of Sol', amount: '5.20 SOL', multiplier: '40x' },
  { id: '5', player: '8fL3...1aCs', game: 'Chrome Blackjack', amount: '4.80 SOL', multiplier: '25x' },
];

export const JackpotTicker: React.FC = () => {
  const [jackpot, setJackpot] = useState(1482.359);
  const [wins, setWins] = useState<WinEvent[]>(INITIAL_WINS);

  useEffect(() => {
    const interval = setInterval(() => {
      setJackpot((prev) => prev + Math.random() * 0.012);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-[#080c1c]/90 border-b border-cyan-500/20 py-2 px-4 overflow-hidden relative">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Progressive Solstice Jackpot Counter */}
        <div className="flex items-center gap-2.5 bg-gradient-to-r from-orange-950/80 via-red-950/60 to-purple-950/80 px-3.5 py-1.5 rounded-lg border border-orange-500/40 shadow-sm shadow-orange-950 shrink-0">
          <Flame className="w-4 h-4 text-orange-400 animate-bounce" />
          <span className="font-semibold text-orange-300 uppercase tracking-wider text-[11px]">
            SOLSTICE JACKPOT:
          </span>
          <span className="font-mono font-extrabold text-white text-sm neon-glow-orange">
            {jackpot.toFixed(3)} SOL
          </span>
          <span className="text-[10px] text-orange-300/80 font-mono">
            (~${(jackpot * 195.4).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD)
          </span>
        </div>

        {/* Live Rolling Winners */}
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar w-full sm:w-auto justify-start sm:justify-end text-slate-300">
          <div className="flex items-center gap-1.5 text-cyan-400 font-semibold shrink-0">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span>LIVE WINS:</span>
          </div>

          <div className="flex items-center gap-4 shrink-0 font-mono text-[11px]">
            {wins.map((w) => (
              <div key={w.id} className="flex items-center gap-1.5 bg-slate-900/60 px-2.5 py-1 rounded-md border border-slate-700/50">
                <span className="text-slate-400">{w.player}</span>
                <span className="text-cyan-300 font-medium">{w.game}</span>
                <span className="text-emerald-400 font-bold">+{w.amount}</span>
                <span className="text-yellow-400 font-bold">({w.multiplier})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
