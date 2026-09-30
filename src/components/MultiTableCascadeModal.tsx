import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Layers, Zap, Sparkles, RefreshCw, Trophy, ArrowRight, X } from 'lucide-react';
import { BetSlip, MIN_BET_SOL } from './BetSlip';
import { sound } from '../utils/audio';

interface MultiTableCascadeModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onBetPlaced: (game: string, betAmount: number, payout: number, multiplier: number, details?: string) => Promise<boolean>;
}

const AVAILABLE_GAMES = [
  { id: 'roulette', name: 'Neon Roulette', icon: '🎡', baseMult: 2.0 },
  { id: 'crash', name: 'Crash Rocket', icon: '🚀', baseMult: 2.5 },
  { id: 'slots', name: 'Slot Cascade', icon: '🎰', baseMult: 3.0 },
  { id: 'dice', name: 'Dice Dynasty', icon: '🎲', baseMult: 1.98 },
  { id: 'wheel', name: 'Wheel of Sol', icon: '🎡', baseMult: 2.0 },
  { id: 'mines', name: 'Mines & Treasure', icon: '💎', baseMult: 2.2 },
];

export const MultiTableCascadeModal: React.FC<MultiTableCascadeModalProps> = ({
  isOpen,
  onClose,
  balance,
  onBetPlaced,
}) => {
  const [activeSubMode, setActiveSubMode] = useState<'multi' | 'cascade'>('multi');
  const [betAmount, setBetAmount] = useState(0.02);

  // Multi-table selected games
  const [selectedMultiGames, setSelectedMultiGames] = useState<string[]>(['roulette', 'crash', 'dice']);

  // Cascade chain
  const [cascadeChain, setCascadeChain] = useState<string[]>(['dice', 'roulette', 'wheel']);

  const [executing, setExecuting] = useState(false);
  const [runLog, setRunLog] = useState<{ game: string; won: boolean; payout: number; mult: number }[]>([]);
  const [totalWon, setTotalWon] = useState<number | null>(null);

  if (!isOpen) return null;

  const toggleMultiGame = (id: string) => {
    sound.playChipClick();
    if (selectedMultiGames.includes(id)) {
      if (selectedMultiGames.length > 1) {
        setSelectedMultiGames(selectedMultiGames.filter((g) => g !== id));
      }
    } else {
      if (selectedMultiGames.length < 4) {
        setSelectedMultiGames([...selectedMultiGames, id]);
      }
    }
  };

  // Run Multi-Table Simulation
  const handleRunMultiTable = async () => {
    if (betAmount > balance || executing) return;

    sound.playBetPlaced();
    setExecuting(true);
    setRunLog([]);
    setTotalWon(null);

    const stakePerGame = betAmount / selectedMultiGames.length;
    let combinedPayout = 0;
    const logs: typeof runLog = [];

    for (let i = 0; i < selectedMultiGames.length; i++) {
      const gId = selectedMultiGames[i];
      const g = AVAILABLE_GAMES.find((x) => x.id === gId)!;
      const won = Math.random() > 0.45; // 55% win rate simulation
      const mult = won ? g.baseMult * (1 + Math.random() * 0.5) : 0;
      const payout = won ? stakePerGame * mult : 0;
      combinedPayout += payout;

      logs.push({
        game: g.name,
        won,
        payout,
        mult: parseFloat(mult.toFixed(2)),
      });
    }

    setTimeout(() => {
      setExecuting(false);
      setRunLog(logs);
      setTotalWon(combinedPayout);

      const netMultiplier = betAmount > 0 ? parseFloat((combinedPayout / betAmount).toFixed(2)) : 0;

      if (combinedPayout > betAmount) {
        sound.playWin();
        confetti({ particleCount: 90, spread: 80 });
      } else {
        sound.playLoss();
      }

      onBetPlaced(
        'Multi-Table Super Mode',
        betAmount,
        combinedPayout,
        netMultiplier,
        `Split across ${selectedMultiGames.length} tables: ${logs.filter((l) => l.won).length} wins`
      );
    }, 1200);
  };

  // Run Cascade Compound Chain
  const handleRunCascade = async () => {
    if (betAmount > balance || executing) return;

    sound.playBetPlaced();
    setExecuting(true);
    setRunLog([]);
    setTotalWon(null);

    let currentStake = betAmount;
    const logs: typeof runLog = [];
    let chainBroke = false;

    for (let i = 0; i < cascadeChain.length; i++) {
      const gId = cascadeChain[i];
      const g = AVAILABLE_GAMES.find((x) => x.id === gId)!;

      if (chainBroke) {
        logs.push({ game: g.name, won: false, payout: 0, mult: 0 });
        continue;
      }

      const won = Math.random() > 0.4;
      if (won) {
        const mult = g.baseMult * (1 + Math.random() * 0.3);
        const payout = currentStake * mult;
        currentStake = payout;
        logs.push({ game: g.name, won: true, payout, mult: parseFloat(mult.toFixed(2)) });
      } else {
        chainBroke = true;
        currentStake = 0;
        logs.push({ game: g.name, won: false, payout: 0, mult: 0 });
      }
    }

    setTimeout(() => {
      setExecuting(false);
      setRunLog(logs);
      setTotalWon(currentStake);

      const finalMultiplier = betAmount > 0 ? parseFloat((currentStake / betAmount).toFixed(2)) : 0;

      if (currentStake > 0) {
        sound.playJackpot();
        confetti({ particleCount: 120, spread: 100 });
      } else {
        sound.playLoss();
      }

      onBetPlaced(
        'Cascade Mode',
        betAmount,
        currentStake,
        finalMultiplier,
        `${logs.filter((l) => l.won).length}/${cascadeChain.length} Stage Chain Payout`
      );
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-3xl cyber-glass-glow rounded-2xl p-6 relative text-slate-100 shadow-2xl border border-orange-500/40 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-orange-500/20 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-950/80 border border-orange-400/50 flex items-center justify-center text-orange-400 shadow-lg shadow-orange-950">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display tracking-wide text-white">
                Multi-Table & Cascade Super-Modes
              </h2>
              <p className="text-xs text-slate-400">
                Play Multiple Games Simultaneously or Chain Winnings Into Mega-Multipliers
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playChipClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Mode Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/90 rounded-xl border border-slate-700/60 mb-5 text-xs font-medium">
          <button
            onClick={() => {
              sound.playChipClick();
              setActiveSubMode('multi');
            }}
            className={`py-2 px-3 rounded-lg transition-all text-center ${
              activeSubMode === 'multi'
                ? 'bg-orange-500/20 text-orange-300 border border-orange-400 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Multi-Table Mode (1 Bet → Split Across Games)
          </button>
          <button
            onClick={() => {
              sound.playChipClick();
              setActiveSubMode('cascade');
            }}
            className={`py-2 px-3 rounded-lg transition-all text-center ${
              activeSubMode === 'cascade'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-400 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Cascade Compounding Chain (Win Rolls to Next)
          </button>
        </div>

        {/* Mode Content */}
        {activeSubMode === 'multi' ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-300">
              Choose 2 to 4 games. Your wager is evenly divided and executed concurrently across all selected tables!
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {AVAILABLE_GAMES.map((g) => {
                const selected = selectedMultiGames.includes(g.id);
                return (
                  <button
                    key={g.id}
                    onClick={() => toggleMultiGame(g.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      selected
                        ? 'bg-orange-950/60 border-orange-500 text-white font-bold shadow-md shadow-orange-950'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{g.icon}</span>
                      <span>{g.name}</span>
                    </div>
                    {selected && <span className="text-orange-400 font-bold">✓ Active</span>}
                  </button>
                );
              })}
            </div>

            <BetSlip
              betAmount={betAmount}
              setBetAmount={setBetAmount}
              balance={balance}
              disabled={executing}
            />

            <button
              disabled={executing || betAmount > balance}
              onClick={handleRunMultiTable}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 hover:opacity-90 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-950 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${executing ? 'animate-spin' : ''}`} />
              <span>
                {executing
                  ? 'Executing Multi-Table Round...'
                  : `EXECUTE MULTI-BET (${betAmount.toFixed(4)} SOL across ${selectedMultiGames.length} tables)`}
              </span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-300">
              Cascade chain: If Game 1 wins, the payout automatically fuels Game 2, and then Game 3. Hit all stages for astronomical multipliers!
            </p>

            <div className="flex items-center gap-2 overflow-x-auto p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              {cascadeChain.map((gId, i) => {
                const g = AVAILABLE_GAMES.find((x) => x.id === gId)!;
                return (
                  <React.Fragment key={i}>
                    <div className="p-2.5 rounded-xl bg-purple-950/70 border border-purple-500/50 flex items-center gap-2 text-xs font-mono text-white shrink-0">
                      <span className="text-base">{g.icon}</span>
                      <span>Stage {i + 1}: {g.name}</span>
                    </div>
                    {i < cascadeChain.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-purple-400 shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            <BetSlip
              betAmount={betAmount}
              setBetAmount={setBetAmount}
              balance={balance}
              disabled={executing}
            />

            <button
              disabled={executing || betAmount > balance}
              onClick={handleRunCascade}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:opacity-90 text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-950 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Trophy className={`w-4 h-4 ${executing ? 'animate-bounce' : ''}`} />
              <span>
                {executing
                  ? 'Cascading Compounding Chain...'
                  : `LAUNCH CASCADE CHAIN (${betAmount.toFixed(4)} SOL)`}
              </span>
            </button>
          </div>
        )}

        {/* Results Stream */}
        {runLog.length > 0 && (
          <div className="mt-5 p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
              Round Execution Logs
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {runLog.map((log, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between ${
                    log.won
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                      : 'bg-red-950/40 border-red-800/40 text-red-400'
                  }`}
                >
                  <span>{log.game}</span>
                  <span className="font-bold">
                    {log.won ? `+${log.payout.toFixed(4)} SOL (${log.mult}x)` : 'Lost'}
                  </span>
                </div>
              ))}
            </div>

            {totalWon !== null && (
              <div className="pt-2 text-center font-mono font-bold text-sm text-white">
                Total Payout: <span className="text-cyan-300">{totalWon.toFixed(4)} SOL</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
