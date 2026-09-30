import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Bomb, Diamond, Zap, ShieldAlert } from 'lucide-react';
import { BetSlip } from '../BetSlip';
import { calculateMinesOutcome } from '../../utils/provablyFair';
import { sound } from '../../utils/audio';

interface MinesTreasureProps {
  balance: number;
  onBetPlaced: (game: string, betAmount: number, payout: number, multiplier: number, details?: string) => Promise<boolean>;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
}

export const MinesTreasure: React.FC<MinesTreasureProps> = ({
  balance,
  onBetPlaced,
  serverSeed,
  clientSeed,
  nonce,
}) => {
  const [betAmount, setBetAmount] = useState(0.01);
  const [mineCount, setMineCount] = useState(3);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'cashed_out' | 'exploded'>('betting');
  const [mineLocations, setMineLocations] = useState<number[]>([]);
  const [revealedTiles, setRevealedTiles] = useState<number[]>([]);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);

  // Mathematical multiplier per revealed diamond
  const calculateMultiplierForGems = (gems: number, mines: number): number => {
    let mult = 1.0;
    const totalTiles = 25;
    for (let i = 0; i < gems; i++) {
      mult *= (totalTiles - i) / (totalTiles - mines - i);
    }
    // 1% house edge
    return parseFloat((mult * 0.99).toFixed(2));
  };

  const handleStartGame = async () => {
    if (betAmount > balance || gameState === 'playing') return;

    sound.playBetPlaced();
    setGameState('playing');
    setRevealedTiles([]);
    setCurrentMultiplier(1.0);

    const mines = await calculateMinesOutcome(serverSeed, clientSeed, nonce, mineCount);
    setMineLocations(mines);
  };

  const handleTileClick = (index: number) => {
    if (gameState !== 'playing' || revealedTiles.includes(index)) return;

    if (mineLocations.includes(index)) {
      // Hit a mine!
      sound.playExplosion();
      setGameState('exploded');
      setRevealedTiles([...revealedTiles, index]);
      onBetPlaced(
        'Mines & Treasure',
        betAmount,
        0,
        0,
        `Exploded on tile ${index} (${revealedTiles.length} gems revealed, ${mineCount} mines)`
      );
    } else {
      // Safe diamond!
      const updated = [...revealedTiles, index];
      setRevealedTiles(updated);
      sound.playGemChime(updated.length);

      const nextMult = calculateMultiplierForGems(updated.length, mineCount);
      setCurrentMultiplier(nextMult);

      // Check if all safe tiles cleared
      if (updated.length === 25 - mineCount) {
        handleCashout(nextMult);
      }
    }
  };

  const handleCashout = (specificMult?: number) => {
    if (gameState !== 'playing') return;

    const finalMult = specificMult || currentMultiplier;
    const payout = betAmount * finalMult;

    setGameState('cashed_out');
    sound.playCashout();
    sound.playWin();
    confetti({ particleCount: 70, spread: 60 });

    onBetPlaced(
      'Mines & Treasure',
      betAmount,
      payout,
      finalMult,
      `Cashed out @ ${finalMult}x (${revealedTiles.length} gems, ${mineCount} mines)`
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 5x5 Minefield Arena */}
      <div className="lg:col-span-8 cyber-glass rounded-2xl p-6 border border-cyan-500/20 flex flex-col items-center justify-between min-h-[440px]">
        {/* Status Header */}
        <div className="w-full flex items-center justify-between p-3 bg-slate-900/80 rounded-xl border border-slate-700/60 mb-4 font-mono text-xs">
          <div className="flex items-center gap-2">
            <Bomb className="w-4 h-4 text-red-400" />
            <span className="text-slate-300">Mines: {mineCount}</span>
          </div>

          <div className="flex items-center gap-2">
            <Diamond className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-300 font-bold">Gems: {revealedTiles.length}/{25 - mineCount}</span>
          </div>

          <div className="font-bold text-yellow-300 text-sm">
            {currentMultiplier.toFixed(2)}x
          </div>
        </div>

        {/* 5x5 Grid */}
        <div className="grid grid-cols-5 gap-2.5 p-3 bg-slate-950/80 rounded-2xl border border-cyan-500/30 max-w-sm w-full shadow-inner">
          {Array.from({ length: 25 }, (_, i) => {
            const isRevealed = revealedTiles.includes(i);
            const isMine = mineLocations.includes(i);
            const showMine = (gameState === 'exploded' || gameState === 'cashed_out') && isMine;

            return (
              <button
                key={i}
                disabled={gameState !== 'playing' || isRevealed}
                onClick={() => handleTileClick(i)}
                className={`h-14 rounded-xl font-bold text-xl transition-all flex items-center justify-center ${
                  isRevealed && !isMine
                    ? 'bg-emerald-950/80 border border-emerald-400/80 shadow-lg shadow-emerald-500/20 scale-95'
                    : showMine
                    ? 'bg-red-950 border border-red-500 text-red-400 animate-pulse'
                    : gameState === 'playing'
                    ? 'bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 hover:scale-105 active:scale-95 text-cyan-400 shadow-md'
                    : 'bg-slate-900/60 border border-slate-800 text-slate-500'
                }`}
              >
                {isRevealed && !isMine ? '💎' : showMine ? '💣' : '✦'}
              </button>
            );
          })}
        </div>

        {/* Dynamic CTA */}
        {gameState === 'playing' && revealedTiles.length > 0 ? (
          <button
            onClick={() => handleCashout()}
            className="w-full mt-4 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm rounded-xl shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 transition-all active:scale-95 animate-pulse"
          >
            <Zap className="w-4 h-4" />
            <span>CASH OUT ({(betAmount * currentMultiplier).toFixed(4)} SOL @ {currentMultiplier.toFixed(2)}x)</span>
          </button>
        ) : (
          <button
            disabled={gameState === 'playing' || betAmount > balance}
            onClick={handleStartGame}
            className="w-full mt-4 py-3.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-950/80 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>START MINES RUN ({betAmount.toFixed(4)} SOL)</span>
          </button>
        )}
      </div>

      {/* Bet Slip & Mine Selector */}
      <div className="lg:col-span-4 space-y-4">
        <BetSlip
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          balance={balance}
          disabled={gameState === 'playing'}
        />

        {/* Mine Count Selector */}
        <div className="cyber-glass rounded-2xl p-4 border border-cyan-500/20 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold uppercase tracking-wider">Number of Hidden Mines</span>
            <span className="font-mono text-cyan-300 font-bold">{mineCount} Mines</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[1, 3, 5, 10, 15, 20, 24].map((m) => (
              <button
                key={m}
                disabled={gameState === 'playing'}
                onClick={() => {
                  sound.playChipClick();
                  setMineCount(m);
                }}
                className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  mineCount === m
                    ? 'bg-red-500/30 border border-red-400 text-red-200'
                    : 'bg-slate-900/80 border border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {m} Mines
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
