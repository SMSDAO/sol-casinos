import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Zap, Flame, RotateCw } from 'lucide-react';
import { BetSlip, MIN_BET_SOL } from '../BetSlip';
import { calculateRouletteOutcome } from '../../utils/provablyFair';
import { sound } from '../../utils/audio';

interface NeonRouletteProps {
  balance: number;
  onBetPlaced: (game: string, betAmount: number, payout: number, multiplier: number, details?: string) => Promise<boolean>;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
}

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

export const NeonRoulette: React.FC<NeonRouletteProps> = ({
  balance,
  onBetPlaced,
  serverSeed,
  clientSeed,
  nonce,
}) => {
  const [betAmount, setBetAmount] = useState(0.01);
  const [selectedBets, setSelectedBets] = useState<{ [key: string]: number }>({ '17': 0.01 });
  const [spinning, setSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [lightningNumbers, setLightningNumbers] = useState<{ num: number; mult: number }[]>([]);
  const [lastWins, setLastWins] = useState<{ num: number; color: string }[]>([
    { num: 17, color: 'black' },
    { num: 0, color: 'green' },
    { num: 32, color: 'red' },
    { num: 15, color: 'black' },
    { num: 19, color: 'red' },
  ]);
  const [roundWinAmount, setRoundWinAmount] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wheelAngleRef = useRef(0);
  const animIdRef = useRef<number | null>(null);

  // Draw Physics Roulette Wheel on Canvas
  const drawWheel = (angle: number, highlightNum: number | null = null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 15;

    ctx.clearRect(0, 0, width, height);

    // Outer glow ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 8, 0, 2 * Math.PI);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00f0ff';
    ctx.stroke();
    ctx.shadowBlur = 0;

    const segmentAngle = (2 * Math.PI) / WHEEL_ORDER.length;

    WHEEL_ORDER.forEach((num, i) => {
      const segStart = angle + i * segmentAngle;
      const segEnd = segStart + segmentAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, segStart, segEnd);
      ctx.closePath();

      let isRed = RED_NUMBERS.includes(num);
      let isZero = num === 0;

      if (num === highlightNum) {
        ctx.fillStyle = '#ffd700'; // Highlight winning segment
      } else if (isZero) {
        ctx.fillStyle = '#059669'; // Emerald green 0
      } else if (isRed) {
        ctx.fillStyle = '#dc2626'; // Red
      } else {
        ctx.fillStyle = '#0f172a'; // Deep slate black
      }

      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Number text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(segStart + segmentAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillText(num.toString(), radius - 10, 4);
      ctx.restore();
    });

    // Center Hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, 28, 0, 2 * Math.PI);
    ctx.fillStyle = '#060813';
    ctx.fill();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Flapper top indicator
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius - 10);
    ctx.lineTo(centerX - 8, centerY - radius + 8);
    ctx.lineTo(centerX + 8, centerY - radius + 8);
    ctx.closePath();
    ctx.fillStyle = '#ff6600';
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  useEffect(() => {
    drawWheel(wheelAngleRef.current);
  }, []);

  const placeBet = (betKey: string) => {
    sound.playChipClick();
    setSelectedBets((prev) => ({
      ...prev,
      [betKey]: (prev[betKey] || 0) + betAmount,
    }));
  };

  const clearBets = () => {
    sound.playChipClick();
    setSelectedBets({});
  };

  const handleSpin = async () => {
    const totalWager = Object.values(selectedBets).reduce((a, b) => a + b, 0);
    if (totalWager <= 0 || totalWager > balance || spinning) return;

    sound.playBetPlaced();
    setSpinning(true);
    setWinningNumber(null);
    setRoundWinAmount(null);

    // Generate Provably Fair outcome
    const outcome = await calculateRouletteOutcome(serverSeed, clientSeed, nonce);

    // Lightning multi simulation (50x - 500x)
    const lightning: { num: number; mult: number }[] = [];
    if (Math.random() > 0.3) {
      const count = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < count; i++) {
        const randNum = Math.floor(Math.random() * 37);
        const multipliers = [50, 100, 200, 500];
        lightning.push({ num: randNum, mult: multipliers[Math.floor(Math.random() * multipliers.length)] });
      }
    }
    setLightningNumbers(lightning);

    // Calculate wheel landing target angle
    const winningIndex = WHEEL_ORDER.indexOf(outcome.number);
    const segmentAngle = (2 * Math.PI) / WHEEL_ORDER.length;
    // Top pointer is at -Math.PI / 2
    const targetAngle = -Math.PI / 2 - winningIndex * segmentAngle - segmentAngle / 2 + Math.PI * 10;

    let currentAngle = wheelAngleRef.current;
    const startAngle = currentAngle;
    const delta = targetAngle - (currentAngle % (2 * Math.PI));
    const finalAngle = currentAngle + delta + Math.PI * 12; // 6 full rotations

    const startTime = performance.now();
    const duration = 4000; // 4 seconds spin

    let lastTickAngle = 0;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      currentAngle = startAngle + (finalAngle - startAngle) * ease;
      wheelAngleRef.current = currentAngle;

      // Tick sound as segments pass pointer
      if (Math.abs(currentAngle - lastTickAngle) > segmentAngle) {
        sound.playWheelTick(1.0 + (1 - progress) * 0.5);
        lastTickAngle = currentAngle;
      }

      drawWheel(currentAngle, progress === 1 ? outcome.number : null);

      if (progress < 1) {
        animIdRef.current = requestAnimationFrame(animate);
      } else {
        // Spin finished
        setSpinning(false);
        setWinningNumber(outcome.number);

        // Calculate Payout
        let totalPayout = 0;
        let highestMultiplier = 0;

        // Straight up
        if (selectedBets[outcome.number.toString()]) {
          const lMatch = lightning.find((l) => l.num === outcome.number);
          const mult = lMatch ? lMatch.mult : 36;
          totalPayout += selectedBets[outcome.number.toString()] * mult;
          highestMultiplier = Math.max(highestMultiplier, mult);
        }

        // Red/Black
        if (outcome.number !== 0) {
          const isRed = RED_NUMBERS.includes(outcome.number);
          if (isRed && selectedBets['red']) totalPayout += selectedBets['red'] * 2;
          if (!isRed && selectedBets['black']) totalPayout += selectedBets['black'] * 2;
          // Even/Odd
          const isEven = outcome.number % 2 === 0;
          if (isEven && selectedBets['even']) totalPayout += selectedBets['even'] * 2;
          if (!isEven && selectedBets['odd']) totalPayout += selectedBets['odd'] * 2;
          // High/Low
          if (outcome.number <= 18 && selectedBets['low']) totalPayout += selectedBets['low'] * 2;
          if (outcome.number >= 19 && selectedBets['high']) totalPayout += selectedBets['high'] * 2;
        }

        const winMultiplier = totalWager > 0 ? parseFloat((totalPayout / totalWager).toFixed(2)) : 0;
        setRoundWinAmount(totalPayout);

        if (totalPayout > 0) {
          sound.playWin();
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } else {
          sound.playLoss();
        }

        onBetPlaced(
          'Neon Roulette',
          totalWager,
          totalPayout,
          winMultiplier,
          `Number ${outcome.number} (${outcome.color.toUpperCase()})`
        );

        setLastWins((prev) => [{ num: outcome.number, color: outcome.color }, ...prev.slice(0, 9)]);
      }
    };

    animIdRef.current = requestAnimationFrame(animate);
  };

  const totalTableBet = Object.values(selectedBets).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner with Lightning Numbers and History */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 cyber-glass rounded-2xl border border-cyan-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center text-cyan-400">
            <Zap className="w-5 h-5 animate-pulse text-cyan-300" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 block">
              Neon Lightning Strikes (Up to 500x)
            </span>
            <div className="flex items-center gap-2 mt-1">
              {lightningNumbers.length > 0 ? (
                lightningNumbers.map((l, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-yellow-500/20 border border-yellow-400/60 font-mono text-xs font-bold text-yellow-300 animate-pulse"
                  >
                    #{l.num} → {l.mult}x
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">Spin to trigger lightning storm...</span>
              )}
            </div>
          </div>
        </div>

        {/* Recent winning numbers beads */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="text-slate-400 text-[11px] mr-1">STREAK:</span>
          {lastWins.map((w, idx) => (
            <span
              key={idx}
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] shadow-sm ${
                w.color === 'green'
                  ? 'bg-emerald-600 text-white'
                  : w.color === 'red'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-900 border border-slate-700 text-white'
              }`}
            >
              {w.num}
            </span>
          ))}
        </div>
      </div>

      {/* Main Wheel & Table Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Canvas Wheel */}
        <div className="lg:col-span-5 cyber-glass rounded-2xl p-6 flex flex-col items-center justify-center border border-cyan-500/20 relative">
          <canvas ref={canvasRef} width={340} height={340} className="max-w-full" />

          {winningNumber !== null && (
            <div className="absolute top-6 left-6 p-2 rounded-xl bg-slate-900/90 border border-cyan-400/60 font-mono text-center">
              <span className="text-[10px] text-slate-400 block">RESULT</span>
              <span className="text-lg font-bold text-cyan-300">#{winningNumber}</span>
            </div>
          )}

          {roundWinAmount !== null && roundWinAmount > 0 && (
            <div className="mt-4 px-4 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 font-mono font-bold text-emerald-300 text-sm animate-bounce">
              WON +{roundWinAmount.toFixed(4)} SOL!
            </div>
          )}
        </div>

        {/* Interactive Betting Table & Bet Slip */}
        <div className="lg:col-span-7 space-y-4">
          <BetSlip
            betAmount={betAmount}
            setBetAmount={setBetAmount}
            balance={balance}
            disabled={spinning}
          />

          {/* Interactive Felt Board */}
          <div className="cyber-glass rounded-2xl p-4 border border-cyan-500/20 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Interactive Betting Felt (Tap numbers to place chips)</span>
              <button
                onClick={clearBets}
                disabled={spinning || totalTableBet === 0}
                className="text-orange-400 hover:text-orange-300 text-xs font-semibold disabled:opacity-50"
              >
                Clear Table
              </button>
            </div>

            {/* Zero slot */}
            <button
              disabled={spinning}
              onClick={() => placeBet('0')}
              className={`w-full py-2 bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-500/50 rounded-lg font-mono font-bold text-sm text-emerald-200 relative transition-all ${
                selectedBets['0'] ? 'ring-2 ring-yellow-400' : ''
              }`}
            >
              0 (Green - 36x)
              {selectedBets['0'] && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-yellow-300 font-mono font-bold">
                  {selectedBets['0'].toFixed(3)} SOL
                </span>
              )}
            </button>

            {/* Numbers Grid (1-36) */}
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 font-mono text-xs">
              {Array.from({ length: 36 }, (_, i) => i + 1).map((n) => {
                const isRed = RED_NUMBERS.includes(n);
                const isBet = selectedBets[n.toString()];
                return (
                  <button
                    key={n}
                    disabled={spinning}
                    onClick={() => placeBet(n.toString())}
                    className={`h-9 rounded-lg font-bold transition-all relative flex items-center justify-center ${
                      isRed
                        ? 'bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-200'
                        : 'bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-100'
                    } ${isBet ? 'ring-2 ring-yellow-400 shadow-md shadow-yellow-500/30' : ''}`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>

            {/* Outside Bets (Red/Black, Even/Odd, Low/High) */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1 font-mono text-xs">
              <button
                disabled={spinning}
                onClick={() => placeBet('low')}
                className={`py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold transition-all ${
                  selectedBets['low'] ? 'ring-2 ring-cyan-400' : ''
                }`}
              >
                1-18 (2x)
              </button>
              <button
                disabled={spinning}
                onClick={() => placeBet('even')}
                className={`py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold transition-all ${
                  selectedBets['even'] ? 'ring-2 ring-cyan-400' : ''
                }`}
              >
                EVEN (2x)
              </button>
              <button
                disabled={spinning}
                onClick={() => placeBet('red')}
                className={`py-2 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 font-bold transition-all ${
                  selectedBets['red'] ? 'ring-2 ring-yellow-400' : ''
                }`}
              >
                RED (2x)
              </button>
              <button
                disabled={spinning}
                onClick={() => placeBet('black')}
                className={`py-2 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-700 text-slate-200 font-bold transition-all ${
                  selectedBets['black'] ? 'ring-2 ring-yellow-400' : ''
                }`}
              >
                BLACK (2x)
              </button>
              <button
                disabled={spinning}
                onClick={() => placeBet('odd')}
                className={`py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold transition-all ${
                  selectedBets['odd'] ? 'ring-2 ring-cyan-400' : ''
                }`}
              >
                ODD (2x)
              </button>
              <button
                disabled={spinning}
                onClick={() => placeBet('high')}
                className={`py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold transition-all ${
                  selectedBets['high'] ? 'ring-2 ring-cyan-400' : ''
                }`}
              >
                19-36 (2x)
              </button>
            </div>

            {/* Spin CTA Button */}
            <button
              disabled={spinning || totalTableBet <= 0 || totalTableBet > balance}
              onClick={handleSpin}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-950/80 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <RotateCw className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} />
              <span>
                {spinning
                  ? 'Spinning Physics Wheel...'
                  : `SPIN ROULETTE (${totalTableBet.toFixed(4)} SOL)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
