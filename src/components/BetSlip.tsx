import React from 'react';
import { Coins, Sparkles, TrendingUp, AlertCircle } from 'lucide-react';
import { sound } from '../utils/audio';

interface BetSlipProps {
  betAmount: number;
  setBetAmount: (val: number) => void;
  balance: number;
  minBet?: number;
  maxBet?: number;
  disabled?: boolean;
}

export const MIN_BET_SOL = 0.00022;

export const BetSlip: React.FC<BetSlipProps> = ({
  betAmount,
  setBetAmount,
  balance,
  minBet = MIN_BET_SOL,
  maxBet = 100,
  disabled = false,
}) => {
  const handleHalf = () => {
    sound.playChipClick();
    const next = Math.max(minBet, parseFloat((betAmount / 2).toFixed(5)));
    setBetAmount(next);
  };

  const handleDouble = () => {
    sound.playChipClick();
    const next = Math.min(Math.min(balance, maxBet), parseFloat((betAmount * 2).toFixed(5)));
    setBetAmount(next);
  };

  const handleMin = () => {
    sound.playChipClick();
    setBetAmount(minBet);
  };

  const handleMax = () => {
    sound.playChipClick();
    const safeMax = Math.max(minBet, parseFloat(Math.min(balance, maxBet).toFixed(5)));
    setBetAmount(safeMax);
  };

  const handlePreset = (val: number) => {
    sound.playChipClick();
    setBetAmount(val);
  };

  const presets = [0.001, 0.005, 0.01, 0.05, 0.1, 0.5];

  return (
    <div className="p-4 rounded-xl cyber-glass border border-cyan-500/20 space-y-3">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
          <Coins className="w-3.5 h-3.5 text-cyan-400" />
          <span>Wager Amount (SOL)</span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          Floor: <span className="text-cyan-300 font-semibold">{minBet} SOL</span>
        </div>
      </div>

      {/* Input and Quick Modifiers */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="number"
            step="0.0001"
            min={minBet}
            max={balance}
            disabled={disabled}
            value={betAmount}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) setBetAmount(val);
            }}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-cyan-400"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-cyan-400/80 font-bold pointer-events-none">
            SOL
          </span>
        </div>

        <button
          onClick={handleMin}
          disabled={disabled}
          className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-slate-300 transition-colors disabled:opacity-50"
        >
          Min
        </button>
        <button
          onClick={handleHalf}
          disabled={disabled}
          className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-slate-300 transition-colors disabled:opacity-50"
        >
          ½
        </button>
        <button
          onClick={handleDouble}
          disabled={disabled}
          className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-slate-300 transition-colors disabled:opacity-50"
        >
          2×
        </button>
        <button
          onClick={handleMax}
          disabled={disabled}
          className="px-2.5 py-2 bg-gradient-to-r from-orange-600/30 to-red-600/30 hover:from-orange-600/50 hover:to-red-600/50 border border-orange-500/40 rounded-lg text-xs font-mono text-orange-300 font-bold transition-colors disabled:opacity-50"
        >
          Max
        </button>
      </div>

      {/* Chip Presets */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {presets.map((p) => (
          <button
            key={p}
            disabled={disabled}
            onClick={() => handlePreset(p)}
            className={`px-2 py-1 rounded-md text-[11px] font-mono transition-all shrink-0 ${
              betAmount === p
                ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-200 font-bold'
                : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {betAmount > balance && (
        <div className="flex items-center gap-1.5 text-xs text-red-400 font-mono pt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Insufficient balance ({balance.toFixed(4)} SOL available)</span>
        </div>
      )}
    </div>
  );
};
