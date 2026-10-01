import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Sparkles,
  Gift,
  Coins,
  Zap,
  Clock,
  Trophy,
  CheckCircle2,
  Flame,
  RotateCw,
} from 'lucide-react';
import { rewardsService, FORTUNE_WHEEL_SLICES, FortuneWheelSlice, FortuneWheelState } from '../services/rewards';
import { sound } from '../utils/audio';

interface DailyFortuneWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardClaimed: (amountSol: number, label: string) => void;
}

export const DailyFortuneWheelModal: React.FC<DailyFortuneWheelModalProps> = ({
  isOpen,
  onClose,
  onRewardClaimed,
}) => {
  const [wheelState, setWheelState] = useState<FortuneWheelState>({
    lastSpinDate: '',
    canSpinToday: true,
    lastReward: null,
  });
  const [spinning, setSpinning] = useState<boolean>(false);
  const [rotationDeg, setRotationDeg] = useState<number>(0);
  const [winningSlice, setWinningSlice] = useState<FortuneWheelSlice | null>(null);

  const loadWheelState = () => {
    const state = rewardsService.getFortuneWheelState();
    setWheelState(state);
    if (state.lastReward) {
      setWinningSlice(state.lastReward);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadWheelState();
      const unsub = rewardsService.subscribe(() => {
        loadWheelState();
      });
      return () => unsub();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSpin = () => {
    if (spinning || !wheelState.canSpinToday) return;

    sound.playChipClick();
    setSpinning(true);
    setWinningSlice(null);

    const res = rewardsService.spinFortuneWheel();
    if (!res.success) {
      setSpinning(false);
      return;
    }

    const wonSlice = res.reward;
    const sliceCount = FORTUNE_WHEEL_SLICES.length;
    const degreesPerSlice = 360 / sliceCount;
    const sliceIndex = FORTUNE_WHEEL_SLICES.findIndex((s) => s.id === wonSlice.id);

    // Calculate exact target rotation so the winning slice aligns under top pointer (0 deg / 360 deg)
    const extraSpins = 6; // 6 full rotations
    const targetDeg = extraSpins * 360 + (sliceCount - sliceIndex) * degreesPerSlice - degreesPerSlice / 2;

    setRotationDeg(targetDeg);

    // Play spinning sound
    setTimeout(() => {
      sound.playJackpot();
      confetti({ particleCount: 120, spread: 90 });
      setSpinning(false);
      setWinningSlice(wonSlice);
      setWheelState(rewardsService.getFortuneWheelState());

      if (wonSlice.type === 'sol' && wonSlice.amount > 0) {
        onRewardClaimed(wonSlice.amount, `Daily Fortune Wheel: ${wonSlice.label}`);
      } else if (wonSlice.type === 'luck' || wonSlice.type === 'pass') {
        onRewardClaimed(0.005, `Fortune Wheel Buff: ${wonSlice.label} (${wonSlice.perk})`);
      }
    }, 3600);
  };

  const sliceAngle = 360 / FORTUNE_WHEEL_SLICES.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg cyber-glass-glow rounded-3xl p-5 sm:p-6 border border-cyan-500/50 text-slate-100 shadow-2xl font-mono relative overflow-hidden bg-[#060813]/95 flex flex-col items-center space-y-4">
        {/* Top Header */}
        <div className="w-full flex items-center justify-between border-b border-cyan-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 p-0.5 shadow-md">
              <div className="w-full h-full bg-[#060813] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white tracking-wide">DAILY FORTUNE WHEEL</h3>
              <p className="text-[10px] text-slate-400">Spin daily for randomized SPL tokens & Luck buffs</p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playChipClick();
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wheel Canvas / SVG Graphic Container */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 my-2 flex items-center justify-center">
          {/* Outer Neon Ring */}
          <div className="absolute inset-0 rounded-full border-4 border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.3)] animate-pulse" />

          {/* Top Triangle Pointer */}
          <div className="absolute -top-3 z-30 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />

          {/* Rotating Wheel */}
          <div
            className="w-full h-full rounded-full relative overflow-hidden border-4 border-slate-900 shadow-2xl transition-transform ease-out"
            style={{
              transform: `rotate(${rotationDeg}deg)`,
              transitionDuration: spinning ? '3.5s' : '0s',
            }}
          >
            {FORTUNE_WHEEL_SLICES.map((slice, index) => {
              const rotateDeg = index * sliceAngle;
              return (
                <div
                  key={slice.id}
                  className="absolute top-0 left-1/2 w-1/2 h-full origin-left flex items-center justify-start pl-8"
                  style={{
                    transform: `rotate(${rotateDeg}deg)`,
                    backgroundColor: slice.color,
                  }}
                >
                  <span
                    className="text-[10px] font-extrabold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] truncate max-w-[90px]"
                    style={{ transform: `rotate(${sliceAngle / 2}deg)` }}
                  >
                    {slice.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Center Hub */}
          <div className="absolute z-20 w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 via-blue-600 to-purple-600 border-4 border-[#060813] shadow-xl flex items-center justify-center">
            <Trophy className="w-6 h-6 text-yellow-300 animate-bounce" />
          </div>
        </div>

        {/* Winning Result or Spin Status */}
        <div className="w-full text-center space-y-2">
          {winningSlice && !spinning ? (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-purple-950/80 border border-cyan-400/60 animate-in zoom-in-95 duration-200">
              <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest block">
                🎉 Fortune Wheel Reward Claimed!
              </span>
              <span className="text-base font-black text-yellow-300 block mt-0.5">
                {winningSlice.label}
              </span>
              {winningSlice.perk && (
                <span className="text-[10px] text-purple-300 font-bold block mt-0.5">
                  Perk Activated: {winningSlice.perk}
                </span>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-400">
              {wheelState.canSpinToday ? (
                <span>Your daily fortune spin is ready! Test your luck on Solana.</span>
              ) : (
                <span className="text-orange-400 font-bold flex items-center justify-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Fortune Wheel already spun today. Resets at 00:00 UTC.</span>
                </span>
              )}
            </div>
          )}

          {/* Spin Action Button */}
          <button
            onClick={handleSpin}
            disabled={spinning || !wheelState.canSpinToday}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm shadow-xl shadow-cyan-950 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <RotateCw className={`w-4 h-4 text-yellow-300 ${spinning ? 'animate-spin' : ''}`} />
            <span>{spinning ? 'Spinning Fortune Wheel...' : wheelState.canSpinToday ? 'SPIN FORTUNE WHEEL' : 'Already Claimed Today'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
