import React, { useState, useEffect } from 'react';
import {
  Tv,
  Users,
  Eye,
  TrendingUp,
  Heart,
  MessageSquare,
  ShieldAlert,
  Coins,
  Compass,
  ArrowRight,
  Sparkles,
  Zap,
  Star,
  Copy,
  Volume2,
} from 'lucide-react';
import { sound } from '../utils/audio';

// Spectator live player telemetry models
export interface SpectatedPlayer {
  id: string;
  name: string;
  wallet: string;
  activeGame: string;
  currentMultiplier: number;
  betAmountSol: number;
  currentScore: number;
  status: 'playing' | 'cashed_out' | 'bust' | 'won';
  activeArtifacts: string[];
  chosenPath: string[];
  events: string[];
}

const INITIAL_SPECTATE_PLAYERS: SpectatedPlayer[] = [
  {
    id: 'p1',
    name: 'CyberDegen_Apex',
    wallet: 'DegenApe88xK9pL2mP8wZ44mR83kNp2bY79qTx8fL31aCs',
    activeGame: 'Mines & Treasure',
    currentMultiplier: 2.4,
    betAmountSol: 0.05,
    currentScore: 120,
    status: 'playing',
    activeArtifacts: ['Golden Prism Key', 'Multiplier Deflector'],
    chosenPath: ['Tile [1,2] - Safe', 'Tile [3,4] - Safe', 'Tile [2,2] - Safe'],
    events: ['Revealed safe crystal +0.02 SOL', 'Revealed bonus multiplier', 'Triggered Shield protection'],
  },
  {
    id: 'p2',
    name: 'SolanaSniper',
    wallet: 'SolPrism7xK9pL2mP8wZ44mR83kNp2bY79qTx8fL31aCs',
    activeGame: 'Crash Rocket',
    currentMultiplier: 1.84,
    betAmountSol: 0.12,
    currentScore: 220,
    status: 'playing',
    activeArtifacts: ['Auto-Eject Protocol', 'Fuel Cell Booster'],
    chosenPath: ['Launched at 1.00x', 'Passed 1.50x threshold'],
    events: ['Rocket stability at 98%', 'Altitude warning triggered'],
  },
  {
    id: 'p3',
    name: 'QueenOfSpades',
    wallet: 'ApeLord22xK9pL2mP8wZ44mR83kNp2bY79qTx8fL31aCs',
    activeGame: 'Neon Roulette',
    currentMultiplier: 35,
    betAmountSol: 0.015,
    currentScore: 525,
    status: 'won',
    activeArtifacts: ['Lucky Chip Charm'],
    chosenPath: ['Bet Red 32', 'Multiplier bonus applied'],
    events: ['Wheel spun', 'Ball landed on RED 32! Jackpot multiplier active!'],
  },
  {
    id: 'p4',
    name: 'DegenSol_HighRoller',
    wallet: 'Roller99xK9pL2mP8wZ44mR83kNp2bY79qTx8fL31aCs',
    activeGame: 'Chrome Blackjack',
    currentMultiplier: 2,
    betAmountSol: 0.25,
    currentScore: 500,
    status: 'playing',
    activeArtifacts: ['Insurance Card Protector'],
    chosenPath: ['Dealt Q♣, J♠ (20)', 'Dealer showing 6♦'],
    events: ['Stood at 20', 'Dealer hits -> 16', 'Dealer hits again -> Busts!'],
  },
];

interface SpectatorModeProps {
  walletPublicKey: string | null;
  onSendTip?: (wallet: string, amount: number) => void;
}

export const SpectatorMode: React.FC<SpectatorModeProps> = ({
  walletPublicKey,
  onSendTip,
}) => {
  const [players, setPlayers] = useState<SpectatedPlayer[]>(INITIAL_SPECTATE_PLAYERS);
  const [selectedPlayer, setSelectedPlayer] = useState<SpectatedPlayer | null>(INITIAL_SPECTATE_PLAYERS[0]);
  const [tipAmount, setTipAmount] = useState<string>('0.02');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [heartCount, setHeartCount] = useState<number>(42);
  const [showHearts, setShowHearts] = useState<boolean>(false);

  // Periodic Telemetry Updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPlayers((prevPlayers) =>
        prevPlayers.map((p) => {
          if (p.status === 'playing') {
            const nextMultiplier = parseFloat((p.currentMultiplier + (Math.random() * 0.15)).toFixed(2));
            const newScore = Math.floor(p.currentScore + (Math.random() * 20));

            // Randomly update events
            let nextEvents = [...p.events];
            let nextPath = [...p.chosenPath];
            let nextStatus: 'playing' | 'cashed_out' | 'bust' | 'won' = p.status;

            if (p.activeGame === 'Mines & Treasure' && Math.random() > 0.6) {
              const row = Math.floor(Math.random() * 5);
              const col = Math.floor(Math.random() * 5);
              if (Math.random() > 0.85) {
                nextEvents.push(`Revealed bomb at [${row}, ${col}]!`);
                nextStatus = 'bust';
              } else {
                nextPath.push(`Tile [${row},${col}] - Safe`);
                nextEvents.push(`Found safe gold crystal at [${row}, ${col}]!`);
              }
            } else if (p.activeGame === 'Crash Rocket') {
              if (nextMultiplier > 3.5 && Math.random() > 0.5) {
                nextStatus = 'cashed_out';
                nextEvents.push(`Cashed out at ${nextMultiplier}x! Payout: ${(p.betAmountSol * nextMultiplier).toFixed(4)} SOL`);
              } else if (Math.random() > 0.93) {
                nextStatus = 'bust';
                nextEvents.push(`Rocket Exploded at ${nextMultiplier}x!`);
              }
            }

            return {
              ...p,
              currentMultiplier: nextMultiplier,
              currentScore: newScore,
              chosenPath: nextPath.slice(-6),
              events: nextEvents.slice(-5),
              status: nextStatus,
            };
          } else {
            // Respawn finished players with new game simulation
            if (Math.random() > 0.8) {
              const games = ['Mines & Treasure', 'Crash Rocket', 'Neon Roulette', 'Chrome Blackjack', 'Dice Dynasty'];
              const chosenGame = games[Math.floor(Math.random() * games.length)];
              const newBet = parseFloat((0.01 + Math.random() * 0.15).toFixed(3));
              return {
                ...p,
                activeGame: chosenGame,
                currentMultiplier: 1.0,
                betAmountSol: newBet,
                currentScore: 100,
                status: 'playing',
                chosenPath: ['Game initiated'],
                events: ['Bet placed on Solana blockchain'],
              };
            }
            return p;
          }
        })
      );
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Update actively selected player view
  useEffect(() => {
    if (selectedPlayer) {
      const updated = players.find((p) => p.id === selectedPlayer.id);
      if (updated) {
        setSelectedPlayer(updated);
      }
    }
  }, [players]);

  const handleSelectPlayer = (p: SpectatedPlayer) => {
    sound.playChipClick();
    setSelectedPlayer(p);
  };

  const handleSendEmojiCheer = () => {
    sound.playWin();
    setHeartCount((c) => c + 1);
    setShowHearts(true);
    setTimeout(() => setShowHearts(false), 1500);
  };

  const handleTriggerTip = () => {
    if (!selectedPlayer) return;
    const amount = parseFloat(tipAmount);
    if (isNaN(amount) || amount <= 0) return;

    sound.playJackpot();
    if (onSendTip) {
      onSendTip(selectedPlayer.wallet, amount);
    }
    sound.playWin();
    // Pre-inject event
    setSelectedPlayer((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        events: [...prev.events, `Anonymous tip received +${amount} SOL!`],
      };
    });
  };

  const copyBlinkShare = (player: SpectatedPlayer) => {
    sound.playChipClick();
    const mockBlink = `solana-action:https://ais-dev-wodqg4vjvosq73rhbpcsrn-58325421054.us-east5.run.app/api/action/spectate/${player.id}`;
    navigator.clipboard.writeText(mockBlink);
    setCopiedId(player.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  return (
    <div className="cyber-glass-glow rounded-2xl p-6 border border-cyan-500/40 space-y-6 font-mono text-slate-100 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-cyan-500/20 pb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-600 to-purple-600 p-0.5 shadow-lg shadow-cyan-950">
            <div className="w-full h-full bg-[#060813] rounded-[10px] flex items-center justify-center text-cyan-400">
              <Tv className="w-5 h-5 text-cyan-300 animate-pulse" />
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wider flex items-center gap-2">
              SOLSTICE LIVE SPECTATOR STUDIO <span className="text-[10px] text-cyan-400 font-extrabold px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/50">LIVE</span>
            </h2>
            <p className="text-[10px] text-cyan-400">View real-time gameplay, paths, scores & tip top contenders</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] text-emerald-400 font-bold">14,240 Spectators Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Live Players List */}
        <div className="lg:col-span-5 space-y-3">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
            Active Tables & Leaders
          </span>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {players.map((p) => {
              const isSelected = selectedPlayer?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectPlayer(p)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-400 shadow-md shadow-cyan-950/80'
                      : 'bg-slate-950 hover:bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-xs shrink-0 text-cyan-300">
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="text-white font-bold block text-xs truncate">{p.name}</span>
                      <span className="text-[9px] text-slate-400 font-mono block truncate">
                        {p.activeGame} • {p.betAmountSol} SOL
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-bold block ${
                        p.status === 'won' || p.status === 'cashed_out'
                          ? 'text-emerald-400'
                          : p.status === 'bust'
                          ? 'text-red-400'
                          : 'text-yellow-400'
                      }`}
                    >
                      {p.currentMultiplier}x
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase block tracking-widest">
                      {p.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Active Player Telemetry Stream */}
        <div className="lg:col-span-7">
          {selectedPlayer ? (
            <div className="cyber-glass-glow rounded-2xl border border-slate-800 p-5 space-y-4 relative overflow-hidden bg-slate-950/80">
              {/* Highlight Overlay */}
              <div className="absolute top-0 right-0 p-3 flex gap-2">
                <button
                  onClick={() => copyBlinkShare(selectedPlayer)}
                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-[10px] text-cyan-400 rounded border border-slate-800 flex items-center gap-1 transition-all"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{copiedId === selectedPlayer.id ? 'Copied Blink!' : 'Share Blink'}</span>
                </button>
              </div>

              {/* Player Top Meta */}
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Star className="w-4.5 h-4.5 text-yellow-400 animate-pulse fill-yellow-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">{selectedPlayer.name}</h3>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">Wallet: {selectedPlayer.wallet}</p>
              </div>

              {/* Stream Telemetry Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/60">
                  <span className="text-[9px] uppercase font-bold text-slate-400">Current Multiplier</span>
                  <div className="text-xl font-extrabold text-cyan-400 font-mono mt-1 flex items-center gap-1">
                    <TrendingUp className="w-5 h-5 text-cyan-300" />
                    <span>{selectedPlayer.currentMultiplier}x</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/60">
                  <span className="text-[9px] uppercase font-bold text-slate-400">Real Telemetry Score</span>
                  <div className="text-xl font-extrabold text-yellow-400 font-mono mt-1">
                    {selectedPlayer.currentScore} PTS
                  </div>
                </div>
              </div>

              {/* Active Artifacts Section */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Active Gameplay Artifacts</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPlayer.activeArtifacts.map((art, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-purple-950/60 border border-purple-500/50 text-purple-300 rounded text-[9px] font-bold"
                    >
                      🛡️ {art}
                    </span>
                  ))}
                </div>
              </div>

              {/* Chosen Paths / Active Tile Map */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Path Map Sequence</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPlayer.chosenPath.length > 0 ? (
                    selectedPlayer.chosenPath.map((pt, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 text-[10px] rounded flex items-center gap-1 font-mono"
                      >
                        <span>{pt}</span>
                        {idx < selectedPlayer.chosenPath.length - 1 && <ArrowRight className="w-3 h-3 text-slate-500" />}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-[10px]">No decisions made yet.</span>
                  )}
                </div>
              </div>

              {/* Live Broadcast Feed Logs */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Live Stream Broadcast</span>
                <div className="p-3 bg-[#060813] border border-slate-800/80 rounded-xl space-y-1.5 max-h-[140px] overflow-y-auto text-[11px] font-mono">
                  {selectedPlayer.events.map((ev, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-slate-300">
                      <span className="text-cyan-500 font-bold">&gt;&gt;</span>
                      <span>{ev}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cheer & Tip Section */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSendEmojiCheer}
                    className="relative px-3.5 py-2 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500 text-pink-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
                  >
                    <Heart className="w-4.5 h-4.5 fill-pink-400 animate-bounce text-pink-400" />
                    <span>Cheer ({heartCount})</span>

                    {showHearts && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-lg animate-bounce pointer-events-none">
                        💖✨🎉
                      </div>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <input
                    type="text"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    placeholder="0.05"
                    className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-center text-xs text-white"
                  />
                  <button
                    onClick={handleTriggerTip}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-950"
                  >
                    Tip Player
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 border border-slate-800 rounded-2xl h-full text-center space-y-2">
              <Tv className="w-8 h-8 text-slate-500 animate-pulse" />
              <span className="text-slate-300 font-bold">Select an Active Table</span>
              <p className="text-[11px] text-slate-400">Click any player on the left panel to begin live stream spectating.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
