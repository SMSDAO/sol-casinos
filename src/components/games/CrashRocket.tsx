import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Rocket, Zap, AlertTriangle, ShieldCheck } from 'lucide-react';
import { BetSlip } from '../BetSlip';
import { calculateCrashOutcome } from '../../utils/provablyFair';
import { sound } from '../../utils/audio';

interface CrashRocketProps {
  balance: number;
  onBetPlaced: (game: string, betAmount: number, payout: number, multiplier: number, details?: string) => Promise<boolean>;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
}

export const CrashRocket: React.FC<CrashRocketProps> = ({
  balance,
  onBetPlaced,
  serverSeed,
  clientSeed,
  nonce,
}) => {
  const [betAmount, setBetAmount] = useState(0.01);
  const [autoCashout, setAutoCashout] = useState<number | ''>(2.0);
  const [gameState, setGameState] = useState<'betting' | 'in_flight' | 'crashed' | 'cashed_out'>('betting');
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const targetCrashPointRef = useRef<number>(1.0);
  const isCashedOutRef = useRef<boolean>(false);

  const drawFlightCanvas = (multiplier: number, crashed = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Trajectory curve
    const progress = Math.min(1, (multiplier - 1) / (targetCrashPointRef.current + 2));
    const startX = 30;
    const startY = height - 30;
    const currentX = startX + progress * (width - 80);
    const currentY = startY - Math.pow(progress, 1.3) * (height - 80);

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(startX + (currentX - startX) * 0.5, startY, currentX, currentY);
    ctx.strokeStyle = crashed ? '#ef4444' : '#00f0ff';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 12;
    ctx.shadowColor = crashed ? '#ef4444' : '#00f0ff';
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Rocket / Explosion Icon
    if (crashed) {
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('💥', currentX, currentY);
    } else {
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🚀', currentX, currentY);

      // Particle tail
      ctx.beginPath();
      ctx.arc(currentX - 12, currentY + 8, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#ff6600';
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  };

  const handleLaunch = async () => {
    if (betAmount > balance || gameState === 'in_flight') return;

    sound.playBetPlaced();
    setGameState('in_flight');
    setCurrentMultiplier(1.0);
    isCashedOutRef.current = false;

    // Determine Provably Fair Crash Point
    const point = await calculateCrashOutcome(serverSeed, clientSeed, nonce);
    targetCrashPointRef.current = point;
    setCrashPoint(point);

    startTimeRef.current = performance.now();

    const loop = (now: number) => {
      const elapsed = (now - startTimeRef.current) / 1000;
      // Exponential curve: 1 * e^(0.06 * elapsed)
      const current = Math.max(1.0, parseFloat(Math.exp(0.07 * elapsed * 2).toFixed(2)));
      setCurrentMultiplier(current);

      // Auto-cashout trigger
      if (
        !isCashedOutRef.current &&
        typeof autoCashout === 'number' &&
        autoCashout > 1.0 &&
        current >= autoCashout &&
        current < point
      ) {
        handleCashout(current);
      }

      if (current >= point) {
        // Rocket Crashed
        setGameState('crashed');
        sound.playExplosion();
        drawFlightCanvas(point, true);

        if (!isCashedOutRef.current) {
          onBetPlaced('Crash Rocket', betAmount, 0, 0, `Crashed @ ${point}x`);
        }
      } else {
        drawFlightCanvas(current, false);
        animFrameRef.current = requestAnimationFrame(loop);
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);
  };

  const handleCashout = (specificMultiplier?: number) => {
    if (gameState !== 'in_flight' || isCashedOutRef.current) return;

    isCashedOutRef.current = true;
    const finalMult = specificMultiplier || currentMultiplier;
    const payout = betAmount * finalMult;

    setGameState('cashed_out');
    sound.playCashout();
    sound.playWin();
    confetti({ particleCount: 70, spread: 60 });

    onBetPlaced(
      'Crash Rocket',
      betAmount,
      payout,
      finalMult,
      `Cashed out @ ${finalMult}x (Bust @ ${targetCrashPointRef.current}x)`
    );
  };

  useEffect(() => {
    drawFlightCanvas(1.0);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Flight Canvas Arena */}
      <div className="lg:col-span-8 cyber-glass rounded-2xl p-6 border border-cyan-500/20 flex flex-col items-center justify-between min-h-[420px] relative">
        {/* Multiplier Central Display */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center pointer-events-none z-10">
          <span
            className={`font-mono text-5xl sm:text-6xl font-black tracking-tight ${
              gameState === 'crashed'
                ? 'text-red-500 neon-glow-red'
                : gameState === 'cashed_out'
                ? 'text-emerald-400 neon-glow-cyan'
                : 'text-white neon-glow-cyan'
            }`}
          >
            {currentMultiplier.toFixed(2)}x
          </span>
          <span className="block text-xs font-mono text-slate-400 mt-1 uppercase tracking-wider">
            {gameState === 'crashed'
              ? `CRASHED @ ${crashPoint}x`
              : gameState === 'cashed_out'
              ? 'PROFIT SECURED'
              : 'ROCKET IN FLIGHT'}
          </span>
        </div>

        <canvas ref={canvasRef} width={600} height={280} className="w-full h-auto max-h-[280px]" />

        {/* CTA Launch / Cash Out Button */}
        {gameState === 'in_flight' ? (
          <button
            onClick={() => handleCashout()}
            className="w-full mt-4 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-base rounded-xl shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 transition-all active:scale-95 animate-pulse"
          >
            <Zap className="w-5 h-5" />
            <span>
              CASH OUT ({(betAmount * currentMultiplier).toFixed(4)} SOL)
            </span>
          </button>
        ) : (
          <button
            disabled={betAmount > balance}
            onClick={handleLaunch}
            className="w-full mt-4 py-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-950/80 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Rocket className="w-4 h-4" />
            <span>LAUNCH ROCKET ({betAmount.toFixed(4)} SOL)</span>
          </button>
        )}
      </div>

      {/* Bet Slip & Auto-Cashout Controls */}
      <div className="lg:col-span-4 space-y-4">
        <BetSlip
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          balance={balance}
          disabled={gameState === 'in_flight'}
        />

        <div className="cyber-glass rounded-2xl p-4 border border-cyan-500/20 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold uppercase tracking-wider">Auto-Cashout Multiplier</span>
            <span className="font-mono text-cyan-300 font-bold">{autoCashout || 'Manual'}</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[1.5, 2.0, 5.0, 10.0].map((m) => (
              <button
                key={m}
                disabled={gameState === 'in_flight'}
                onClick={() => setAutoCashout(m)}
                className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  autoCashout === m
                    ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-200'
                    : 'bg-slate-900/80 border border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {m}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
