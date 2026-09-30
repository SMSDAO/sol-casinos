import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Zap, RotateCcw, Shuffle } from 'lucide-react';
import { BetSlip } from '../BetSlip';
import { calculateKenoOutcome } from '../../utils/provablyFair';
import { sound } from '../../utils/audio';

interface KenoNovaProps {
  balance: number;
  onBetPlaced: (game: string, betAmount: number, payout: number, multiplier: number, details?: string) => Promise<boolean>;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
}

// Payout tables for 1-10 picks
const KENO_PAYTABLE: Record<number, Record<number, number>> = {
  1: { 1: 3.5 },
  2: { 1: 1.0, 2: 9.0 },
  3: { 2: 2.0, 3: 45.0 },
  4: { 2: 1.0, 3: 5.0, 4: 120.0 },
  5: { 3: 3.0, 4: 20.0, 5: 500.0 },
  6: { 3: 2.0, 4: 10.0, 5: 100.0, 6: 1500.0 },
  7: { 4: 5.0, 5: 35.0, 6: 300.0, 7: 4000.0 },
  8: { 5: 15.0, 6: 100.0, 7: 1000.0, 8: 10000.0 },
};

export const KenoNova: React.FC<KenoNovaProps> = ({
  balance,
  onBetPlaced,
  serverSeed,
  clientSeed,
  nonce,
}) => {
  const [betAmount, setBetAmount] = useState(0.01);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([7, 14, 21, 42, 77]);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [roundWin, setRoundWin] = useState<number | null>(null);

  const toggleNumber = (num: number) => {
    if (drawing) return;
    sound.playChipClick();
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter((n) => n !== num));
    } else {
      if (selectedNumbers.length < 8) {
        setSelectedNumbers([...selectedNumbers, num]);
      }
    }
  };

  const quickPick = () => {
    sound.playChipClick();
    const picked: number[] = [];
    while (picked.length < 5) {
      const rand = Math.floor(Math.random() * 80) + 1;
      if (!picked.includes(rand)) picked.push(rand);
    }
    setSelectedNumbers(picked);
  };

  const clearPicks = () => {
    sound.playChipClick();
    setSelectedNumbers([]);
  };

  const handleDraw = async () => {
    if (selectedNumbers.length === 0 || betAmount > balance || drawing) return;

    sound.playBetPlaced();
    setDrawing(true);
    setDrawnNumbers([]);
    setRoundWin(null);

    const winningDrawn = await calculateKenoOutcome(serverSeed, clientSeed, nonce);

    // Progressive rapid ball reveal
    winningDrawn.forEach((ball, idx) => {
      setTimeout(() => {
        setDrawnNumbers((prev) => [...prev, ball]);
        sound.playGemChime(idx);

        if (idx === winningDrawn.length - 1) {
          // Final evaluation
          const hits = selectedNumbers.filter((n) => winningDrawn.includes(n)).length;
          const pickCount = selectedNumbers.length;
          const mult = KENO_PAYTABLE[pickCount]?.[hits] || 0;
          const payout = betAmount * mult;

          setDrawing(false);
          setRoundWin(payout);

          if (payout > 0) {
            sound.playWin();
            confetti({ particleCount: 70, spread: 60 });
          } else {
            sound.playLoss();
          }

          onBetPlaced(
            'Keno Nova',
            betAmount,
            payout,
            mult,
            `Matched ${hits}/${pickCount} numbers (${mult}x)`
          );
        }
      }, (idx + 1) * 60);
    });
  };

  const matches = selectedNumbers.filter((n) => drawnNumbers.includes(n)).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 80-Number Board */}
      <div className="lg:col-span-8 cyber-glass rounded-2xl p-6 border border-cyan-500/20 flex flex-col justify-between min-h-[440px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Selected: <span className="text-cyan-300 font-mono font-bold">{selectedNumbers.length}/8</span>
            </span>
            {drawnNumbers.length > 0 && (
              <span className="text-xs font-mono font-bold text-emerald-400 pl-3 border-l border-slate-700">
                Hits: {matches}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={quickPick}
              disabled={drawing}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded-lg flex items-center gap-1"
            >
              <Shuffle className="w-3 h-3 text-cyan-400" /> Auto Pick
            </button>
            <button
              onClick={clearPicks}
              disabled={drawing || selectedNumbers.length === 0}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-orange-400 rounded-lg flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Clear
            </button>
          </div>
        </div>

        {/* 80-cell Matrix */}
        <div className="grid grid-cols-10 gap-1.5 py-4 font-mono text-xs">
          {Array.from({ length: 80 }, (_, i) => i + 1).map((n) => {
            const isSelected = selectedNumbers.includes(n);
            const isDrawn = drawnNumbers.includes(n);
            const isHit = isSelected && isDrawn;

            return (
              <button
                key={n}
                disabled={drawing}
                onClick={() => toggleNumber(n)}
                className={`h-8 rounded-lg font-bold transition-all text-center flex items-center justify-center ${
                  isHit
                    ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/50 scale-105'
                    : isDrawn
                    ? 'bg-purple-900/80 border border-purple-400/60 text-purple-200'
                    : isSelected
                    ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-200 shadow-sm'
                    : 'bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300'
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <button
          disabled={drawing || selectedNumbers.length === 0 || betAmount > balance}
          onClick={handleDraw}
          className="w-full py-3.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-950/80 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          <Zap className={`w-4 h-4 ${drawing ? 'animate-pulse' : ''}`} />
          <span>
            {drawing
              ? 'Drawing 20 Nova Balls...'
              : `DRAW KENO (${betAmount.toFixed(4)} SOL)`}
          </span>
        </button>
      </div>

      {/* Bet Slip & Dynamic Paytable */}
      <div className="lg:col-span-4 space-y-4">
        <BetSlip
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          balance={balance}
          disabled={drawing}
        />

        <div className="cyber-glass rounded-2xl p-4 border border-cyan-500/20 space-y-2 font-mono text-xs">
          <span className="text-slate-300 font-semibold uppercase tracking-wider block mb-2">
            Paytable ({selectedNumbers.length} Picks Selected)
          </span>
          {Object.entries(KENO_PAYTABLE[selectedNumbers.length] || {}).map(([hits, mult]) => (
            <div
              key={hits}
              className={`flex items-center justify-between p-2 rounded-lg border ${
                matches === parseInt(hits, 10)
                  ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 font-bold'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400'
              }`}
            >
              <span>{hits} Matches</span>
              <span className="text-cyan-300 font-bold">{mult}x Payout</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
