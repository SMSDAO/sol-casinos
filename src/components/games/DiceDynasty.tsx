import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Dices, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { BetSlip } from '../BetSlip';
import { calculateDiceOutcome } from '../../utils/provablyFair';
import { sound } from '../../utils/audio';

interface DiceDynastyProps {
  balance: number;
  onBetPlaced: (game: string, betAmount: number, payout: number, multiplier: number, details?: string) => Promise<boolean>;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
}

export const DiceDynasty: React.FC<DiceDynastyProps> = ({
  balance,
  onBetPlaced,
  serverSeed,
  clientSeed,
  nonce,
}) => {
  const [betAmount, setBetAmount] = useState(0.01);
  const [target, setTarget] = useState(50.0);
  const [mode, setMode] = useState<'over' | 'under'>('over');
  const [rolling, setRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [roundWin, setRoundWin] = useState<number | null>(null);

  // Math: Multiplier = (100 - HouseEdge 1%) / WinChance
  const winChance = mode === 'over' ? 100 - target : target;
  const multiplier = parseFloat(((99.0 / Math.max(0.01, winChance))).toFixed(4));
  const potentialProfit = parseFloat((betAmount * multiplier - betAmount).toFixed(4));

  const handleRoll = async () => {
    if (betAmount > balance || rolling) return;

    sound.playBetPlaced();
    setRolling(true);
    setRoundWin(null);

    const outcome = await calculateDiceOutcome(serverSeed, clientSeed, nonce);

    setTimeout(() => {
      setRolling(false);
      setLastRoll(outcome);

      const isWin = mode === 'over' ? outcome > target : outcome < target;
      const payout = isWin ? betAmount * multiplier : 0;
      setRoundWin(payout);

      if (isWin) {
        sound.playWin();
        confetti({ particleCount: 70, spread: 60 });
      } else {
        sound.playLoss();
      }

      onBetPlaced(
        'Dice Dynasty',
        betAmount,
        payout,
        isWin ? multiplier : 0,
        `Rolled ${outcome} (${mode.toUpperCase()} ${target})`
      );
    }, 600);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Dice Slider & Roll Arena */}
      <div className="lg:col-span-8 cyber-glass rounded-2xl p-6 border border-cyan-500/20 flex flex-col items-center justify-between min-h-[420px]">
        {/* Outcome Display */}
        <div className="w-full flex items-center justify-between p-3 bg-slate-900/80 rounded-xl border border-slate-700/60 mb-6">
          <div className="flex items-center gap-2">
            <Dices className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-300">Provably Fair Roll:</span>
          </div>

          <div className="font-mono text-xl font-extrabold text-cyan-300">
            {lastRoll !== null ? lastRoll.toFixed(2) : '50.00'}
          </div>

          {roundWin !== null && roundWin > 0 && (
            <div className="px-3 py-1 bg-emerald-950/80 border border-emerald-500/50 rounded-lg text-xs font-mono font-bold text-emerald-300 animate-bounce">
              WON +{roundWin.toFixed(4)} SOL!
            </div>
          )}
        </div>

        {/* Large Meter Gauge */}
        <div className="w-full max-w-xl space-y-4 my-auto">
          <div className="relative pt-6 pb-2">
            <input
              type="range"
              min="1.00"
              max="98.00"
              step="0.01"
              disabled={rolling}
              value={target}
              onChange={(e) => {
                sound.playChipClick();
                setTarget(parseFloat(e.target.value));
              }}
              className="w-full h-3 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
            />

            {/* Target Label */}
            <div
              className="absolute top-0 font-mono text-xs font-bold text-cyan-300 px-2 py-0.5 bg-cyan-950/90 border border-cyan-400/50 rounded-md -translate-x-1/2"
              style={{ left: `${(target / 100) * 100}%` }}
            >
              Target: {target.toFixed(2)}
            </div>
          </div>

          {/* Mode Switch (Roll Over vs Roll Under) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/90 rounded-xl border border-slate-700/60">
            <button
              onClick={() => {
                sound.playChipClick();
                setMode('over');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'over'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Roll Over ({target.toFixed(2)})
            </button>
            <button
              onClick={() => {
                sound.playChipClick();
                setMode('under');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'under'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Roll Under ({target.toFixed(2)})
            </button>
          </div>
        </div>

        {/* Roll CTA Button */}
        <button
          disabled={rolling || betAmount > balance}
          onClick={handleRoll}
          className="w-full mt-6 py-3.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-950/80 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          <Dices className={`w-4 h-4 ${rolling ? 'animate-spin' : ''}`} />
          <span>
            {rolling
              ? 'Rolling Cryptographic Dice...'
              : `ROLL DICE (${betAmount.toFixed(4)} SOL)`}
          </span>
        </button>
      </div>

      {/* Bet Slip & Odds breakdown */}
      <div className="lg:col-span-4 space-y-4">
        <BetSlip
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          balance={balance}
          disabled={rolling}
        />

        <div className="cyber-glass rounded-2xl p-4 border border-cyan-500/20 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
            <span className="text-slate-400">Multiplier</span>
            <span className="font-bold text-cyan-300">{multiplier}x</span>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
            <span className="text-slate-400">Win Probability</span>
            <span className="font-bold text-emerald-400">{winChance.toFixed(2)}%</span>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
            <span className="text-slate-400">Potential Profit</span>
            <span className="font-bold text-yellow-300">+{potentialProfit} SOL</span>
          </div>
        </div>
      </div>
    </div>
  );
};
