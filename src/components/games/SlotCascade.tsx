import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Zap, Flame, RefreshCw } from 'lucide-react';
import { BetSlip } from '../BetSlip';
import { sound } from '../../utils/audio';

interface SlotCascadeProps {
  balance: number;
  onBetPlaced: (game: string, betAmount: number, payout: number, multiplier: number, details?: string) => Promise<boolean>;
}

const SYMBOLS = [
  { id: 'sol', icon: '◎', name: 'Solana Logo', color: 'text-cyan-400', value: 8 },
  { id: 'gem', icon: '💎', name: 'Cyan Diamond', color: 'text-blue-400', value: 5 },
  { id: 'rocket', icon: '🚀', name: 'Rocket', color: 'text-orange-400', value: 4 },
  { id: 'seven', icon: '7️⃣', name: 'Lucky 7', color: 'text-red-400', value: 3 },
  { id: 'star', icon: '⭐', name: 'Gold Scatter', color: 'text-yellow-400', value: 10 },
  { id: 'coin', icon: '🪙', name: 'Sol Coin', color: 'text-yellow-300', value: 2 },
];

export const SlotCascade: React.FC<SlotCascadeProps> = ({ balance, onBetPlaced }) => {
  const [betAmount, setBetAmount] = useState(0.01);
  const [grid, setGrid] = useState<typeof SYMBOLS[0][][]>(() =>
    Array.from({ length: 5 }, () =>
      Array.from({ length: 5 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)])
    )
  );
  const [spinning, setSpinning] = useState(false);
  const [cascadeMultiplier, setCascadeMultiplier] = useState(1);
  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0);
  const [roundWin, setRoundWin] = useState<number | null>(null);

  const getRandomSymbol = () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

  const handleSpin = async () => {
    if (betAmount > balance && freeSpinsLeft === 0) return;
    if (spinning) return;

    sound.playBetPlaced();
    setSpinning(true);
    setRoundWin(null);
    setCascadeMultiplier(1);

    // Generate Initial Spin Grid
    const newGrid = Array.from({ length: 5 }, () =>
      Array.from({ length: 5 }, () => getRandomSymbol())
    );
    setGrid(newGrid);

    // Sound and cascade simulation
    sound.playCascade();

    // Check cluster wins (3+ adjacent matches)
    let totalWinMultiplier = 0;
    let cascades = 1;

    // Check occurrences of each symbol
    const counts: Record<string, number> = {};
    newGrid.flat().forEach((s) => {
      counts[s.id] = (counts[s.id] || 0) + 1;
    });

    Object.entries(counts).forEach(([id, count]) => {
      const sym = SYMBOLS.find((s) => s.id === id)!;
      if (count >= 5) {
        cascades += 1;
        totalWinMultiplier += (count * sym.value * 0.2);
      }
    });

    // Check for 3+ Gold Scatter Stars (Free Spins)
    if ((counts['star'] || 0) >= 3) {
      setFreeSpinsLeft((prev) => prev + 10);
      confetti({ particleCount: 100, spread: 80 });
    }

    const finalMultiplier = cascades > 1 ? totalWinMultiplier * cascades : totalWinMultiplier;
    const payout = betAmount * finalMultiplier;

    setTimeout(() => {
      setSpinning(false);
      setCascadeMultiplier(cascades);
      setRoundWin(payout);

      if (payout > 0) {
        sound.playWin();
        confetti({ particleCount: 60, spread: 60 });
      } else {
        sound.playLoss();
      }

      onBetPlaced(
        'Slot Cascade',
        freeSpinsLeft > 0 ? 0 : betAmount,
        payout,
        parseFloat(finalMultiplier.toFixed(2)),
        `${cascades}x Cascades (${(counts['star'] || 0) >= 3 ? 'Free Spins Triggered' : 'Cluster Match'})`
      );

      if (freeSpinsLeft > 0) {
        setFreeSpinsLeft((prev) => prev - 1);
      }
    }, 1200);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 5x5 Cascade Matrix */}
      <div className="lg:col-span-8 cyber-glass rounded-2xl p-6 border border-cyan-500/20 flex flex-col items-center justify-between min-h-[440px]">
        {/* Cascade Banner & Multipliers */}
        <div className="w-full flex items-center justify-between p-3 bg-slate-900/80 rounded-xl border border-slate-700/60 mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-300">Cascade Multiplier:</span>
            <span className="font-mono font-bold text-orange-400 text-sm">{cascadeMultiplier}x</span>
          </div>

          {freeSpinsLeft > 0 && (
            <div className="px-3 py-1 bg-yellow-500/20 border border-yellow-400/60 rounded-lg text-xs font-mono font-bold text-yellow-300 animate-bounce">
              ⚡ FREE SPINS LEFT: {freeSpinsLeft}
            </div>
          )}

          {roundWin !== null && roundWin > 0 && (
            <div className="font-mono font-bold text-emerald-300 text-xs">
              WIN: +{roundWin.toFixed(4)} SOL
            </div>
          )}
        </div>

        {/* 5x5 Grid */}
        <div className="grid grid-cols-5 gap-2 p-3 bg-slate-950/80 rounded-2xl border border-cyan-500/30 max-w-md w-full shadow-inner">
          {grid.map((row, rIdx) =>
            row.map((cell, cIdx) => (
              <div
                key={`${rIdx}-${cIdx}`}
                className={`h-16 rounded-xl bg-slate-900/90 border border-slate-700/60 flex flex-col items-center justify-center font-bold text-2xl shadow-md transition-all ${
                  spinning ? 'animate-pulse scale-95' : 'hover:scale-105'
                }`}
              >
                <span>{cell.icon}</span>
              </div>
            ))
          )}
        </div>

        {/* Spin Button */}
        <button
          disabled={spinning || (betAmount > balance && freeSpinsLeft === 0)}
          onClick={handleSpin}
          className="w-full mt-4 py-3.5 bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 hover:opacity-90 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-950 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} />
          <span>
            {spinning
              ? 'Tumbling Cascades...'
              : freeSpinsLeft > 0
              ? `FREE SPIN (Remaining: ${freeSpinsLeft})`
              : `SPIN CASCADE (${betAmount.toFixed(4)} SOL)`}
          </span>
        </button>
      </div>

      {/* Bet Slip & Paytable */}
      <div className="lg:col-span-4 space-y-4">
        <BetSlip
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          balance={balance}
          disabled={spinning}
        />

        <div className="cyber-glass rounded-2xl p-4 border border-cyan-500/20 space-y-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
            Cascade Paytable (5+ Cluster)
          </span>
          <div className="space-y-1.5 text-xs font-mono">
            {SYMBOLS.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-2 bg-slate-900/60 rounded-lg border border-slate-800"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-slate-300">{s.name}</span>
                </div>
                <span className="text-cyan-300 font-bold">{s.value}x Base</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
