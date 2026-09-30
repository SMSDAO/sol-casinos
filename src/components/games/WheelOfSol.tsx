import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCw, Sparkles, Zap, Award } from 'lucide-react';
import { BetSlip } from '../BetSlip';
import { calculateWheelOutcome, WHEEL_SEGMENTS } from '../../utils/provablyFair';
import { sound } from '../../utils/audio';

interface WheelOfSolProps {
  balance: number;
  onBetPlaced: (game: string, betAmount: number, payout: number, multiplier: number, details?: string) => Promise<boolean>;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
}

export const WheelOfSol: React.FC<WheelOfSolProps> = ({
  balance,
  onBetPlaced,
  serverSeed,
  clientSeed,
  nonce,
}) => {
  const [betAmount, setBetAmount] = useState(0.01);
  const [selectedMultiplier, setSelectedMultiplier] = useState<number>(2);
  const [spinning, setSpinning] = useState(false);
  const [winningSegment, setWinningSegment] = useState<string | null>(null);
  const [roundWin, setRoundWin] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentAngleRef = useRef<number>(0);

  // Build flat array of 50 segments
  const allSegments: { value: number; label: string; color: string }[] = [];
  WHEEL_SEGMENTS.forEach((seg) => {
    for (let i = 0; i < seg.weight; i++) {
      allSegments.push({ value: seg.value, label: seg.label, color: seg.color });
    }
  });

  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const r = Math.min(cx, cy) - 15;

    ctx.clearRect(0, 0, width, height);

    const segAngle = (2 * Math.PI) / allSegments.length;

    allSegments.forEach((seg, i) => {
      const sStart = angle + i * segAngle;
      const sEnd = sStart + segAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, sStart, sEnd);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      ctx.strokeStyle = '#060813';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Text label
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(sStart + segAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#060813';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.fillText(seg.label, r - 8, 4);
      ctx.restore();
    });

    // Center Hub
    ctx.beginPath();
    ctx.arc(cx, cy, 32, 0, 2 * Math.PI);
    ctx.fillStyle = '#060813';
    ctx.fill();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00f0ff';
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Center Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SOLSTICE', cx, cy + 3);

    // Pointer Top
    ctx.beginPath();
    ctx.moveTo(cx, cy - r - 12);
    ctx.lineTo(cx - 8, cy - r + 8);
    ctx.lineTo(cx + 8, cy - r + 8);
    ctx.closePath();
    ctx.fillStyle = '#ff6600';
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  useEffect(() => {
    drawWheel(currentAngleRef.current);
  }, []);

  const handleSpin = async () => {
    if (betAmount > balance || spinning) return;

    sound.playBetPlaced();
    setSpinning(true);
    setWinningSegment(null);
    setRoundWin(null);

    const outcome = await calculateWheelOutcome(serverSeed, clientSeed, nonce);

    const segAngle = (2 * Math.PI) / allSegments.length;
    const targetAngle = -Math.PI / 2 - outcome.index * segAngle - segAngle / 2;

    const start = currentAngleRef.current;
    const delta = targetAngle - (start % (2 * Math.PI));
    const finalAngle = start + delta + Math.PI * 16; // 8 full spins

    const startTime = performance.now();
    const duration = 3500;

    let lastTickAngle = 0;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      const angle = start + (finalAngle - start) * ease;
      currentAngleRef.current = angle;

      if (Math.abs(angle - lastTickAngle) > segAngle) {
        sound.playWheelTick(1.2 + (1 - progress) * 0.4);
        lastTickAngle = angle;
      }

      drawWheel(angle);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setWinningSegment(outcome.label);

        const won = outcome.multiplier === selectedMultiplier;
        const payout = won ? betAmount * outcome.multiplier : 0;
        setRoundWin(payout);

        if (won) {
          sound.playWin();
          confetti({ particleCount: 80, spread: 70 });
        } else {
          sound.playLoss();
        }

        onBetPlaced(
          'Wheel of Sol',
          betAmount,
          payout,
          won ? outcome.multiplier : 0,
          `Landed on ${outcome.label} (Bet on ${selectedMultiplier}x)`
        );
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 50-Segment Wheel Arena */}
      <div className="lg:col-span-8 cyber-glass rounded-2xl p-6 border border-cyan-500/20 flex flex-col items-center justify-between min-h-[440px] relative">
        <canvas ref={canvasRef} width={340} height={340} className="max-w-full" />

        {winningSegment && (
          <div className="absolute top-6 left-6 p-2.5 rounded-xl bg-slate-900/90 border border-cyan-400/60 font-mono text-center">
            <span className="text-[10px] text-slate-400 block">RESULT</span>
            <span className="text-xl font-bold text-cyan-300">{winningSegment}</span>
          </div>
        )}

        {roundWin !== null && roundWin > 0 && (
          <div className="mt-2 px-4 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 font-mono font-bold text-emerald-300 text-sm animate-bounce">
            WON +{roundWin.toFixed(4)} SOL!
          </div>
        )}

        {/* Multiplier Bet Selection Buttons */}
        <div className="w-full grid grid-cols-6 gap-2 mt-4">
          {WHEEL_SEGMENTS.map((seg) => (
            <button
              key={seg.value}
              disabled={spinning}
              onClick={() => {
                sound.playChipClick();
                setSelectedMultiplier(seg.value);
              }}
              style={{ borderColor: selectedMultiplier === seg.value ? seg.color : undefined }}
              className={`py-2 rounded-xl font-mono font-bold text-xs transition-all ${
                selectedMultiplier === seg.value
                  ? 'bg-slate-900 text-white ring-2 ring-cyan-400 shadow-md'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="block" style={{ color: seg.color }}>{seg.label}</span>
              <span className="text-[10px] text-slate-500 font-normal">({seg.weight} seg)</span>
            </button>
          ))}
        </div>

        <button
          disabled={spinning || betAmount > balance}
          onClick={handleSpin}
          className="w-full mt-4 py-3.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-950/80 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          <RotateCw className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} />
          <span>
            {spinning
              ? 'Spinning Wheel of Sol...'
              : `SPIN WHEEL (${betAmount.toFixed(4)} SOL on ${selectedMultiplier}x)`}
          </span>
        </button>
      </div>

      {/* Bet Slip */}
      <div className="lg:col-span-4 space-y-4">
        <BetSlip
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          balance={balance}
          disabled={spinning}
        />
      </div>
    </div>
  );
};
