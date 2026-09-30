import React, { useState } from 'react';
import {
  Trophy,
  X,
  Flame,
  Clock,
  Medal,
  Users,
  Award,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface TournamentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayGame: (gameId: string) => void;
}

interface TournamentChallenge {
  id: string;
  title: string;
  description: string;
  prizePoolSol: number;
  endsInSec: number;
  participantsCount: number;
  targetGame: string;
  gameId: string;
  userRank: number;
  leaderboard: { rank: number; player: string; score: string; prize: string }[];
}

const TOURNAMENT_DATA: TournamentChallenge[] = [
  {
    id: 'sprint_50sol',
    title: 'Solstice Prism 50 SOL Sprint',
    description: 'Highest single multiplier win across Roulette & Crash Rocket',
    prizePoolSol: 50.0,
    endsInSec: 14200, // 3h 56m
    participantsCount: 428,
    targetGame: 'Neon Roulette / Crash',
    gameId: 'roulette',
    userRank: 4,
    leaderboard: [
      { rank: 1, player: 'SolanaWhale_88.sol', score: '482.5x', prize: '25.0 SOL' },
      { rank: 2, player: 'HighRoller_Apex', score: '312.0x', prize: '12.5 SOL' },
      { rank: 3, player: 'CyberNinja_99.sol', score: '240.8x', prize: '7.5 SOL' },
      { rank: 4, player: 'You (Vault Player)', score: '185.0x', prize: '3.0 SOL' },
      { rank: 5, player: 'SolsticeVip_01', score: '142.2x', prize: '2.0 SOL' },
    ],
  },
  {
    id: 'cascade_frenzy',
    title: 'Slot Cascade Tumbling Frenzy',
    description: 'Most consecutive cascade tumble wins in a single round',
    prizePoolSol: 25.0,
    endsInSec: 28800, // 8h
    participantsCount: 312,
    targetGame: 'Slot Cascade',
    gameId: 'slots',
    userRank: 12,
    leaderboard: [
      { rank: 1, player: 'TumbleKing_404', score: '14 Tumbles', prize: '12.0 SOL' },
      { rank: 2, player: 'PrismMaster.sol', score: '11 Tumbles', prize: '6.5 SOL' },
      { rank: 3, player: 'CascadeGhost', score: '9 Tumbles', prize: '4.0 SOL' },
    ],
  },
];

export const TournamentsModal: React.FC<TournamentsModalProps> = ({
  isOpen,
  onClose,
  onPlayGame,
}) => {
  const [activeChallenge, setActiveChallenge] = useState<TournamentChallenge>(TOURNAMENT_DATA[0]);

  if (!isOpen) return null;

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    return `${hrs}h ${mins}m remaining`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-mono">
      <div className="w-full max-w-2xl rounded-2xl bg-[#060813] border border-cyan-500/40 p-6 shadow-2xl text-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 p-0.5 shadow-lg shadow-orange-950">
              <div className="w-full h-full bg-[#060813] rounded-[10px] flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-400 animate-bounce" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wider flex items-center gap-2">
                SOLSTICE PRISM TOURNAMENTS
              </h3>
              <p className="text-[10px] text-yellow-400">Time-Limited Challenges & Live Ranks</p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playChipClick();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Challenge Selection Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TOURNAMENT_DATA.map((ch) => (
            <button
              key={ch.id}
              onClick={() => {
                sound.playChipClick();
                setActiveChallenge(ch);
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                activeChallenge.id === ch.id
                  ? 'bg-yellow-950/60 border-yellow-400/80 text-white shadow-lg shadow-yellow-950'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs">{ch.title}</span>
                <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-bold text-[10px]">
                  {ch.prizePoolSol} SOL Pool
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  {formatTimer(ch.endsInSec)}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-purple-400" />
                  {ch.participantsCount} Players
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Active Tournament Detail */}
        <div className="p-4 bg-slate-900/90 rounded-2xl border border-yellow-500/30 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] text-yellow-400 uppercase font-bold tracking-wider block">
                Active Leaderboard Challenge
              </span>
              <h4 className="text-sm font-bold text-white">{activeChallenge.title}</h4>
              <p className="text-xs text-slate-300 mt-0.5">{activeChallenge.description}</p>
            </div>

            <button
              onClick={() => {
                sound.playChipClick();
                onClose();
                onPlayGame(activeChallenge.gameId);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-black font-bold text-xs shadow-lg shadow-orange-950 flex items-center gap-1.5 shrink-0"
            >
              <Flame className="w-4 h-4 fill-black" />
              <span>Enter Competition ({activeChallenge.targetGame})</span>
            </button>
          </div>

          {/* User Current Rank Banner */}
          <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Medal className="w-4 h-4 text-cyan-400" />
              <span>Your Current Bracket Position:</span>
            </div>
            <span className="text-cyan-300 font-bold">
              Rank #{activeChallenge.userRank} (Eligible for 3.0 SOL Prize)
            </span>
          </div>

          {/* Leaderboard Table */}
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Top Standings
            </span>

            <div className="space-y-1.5">
              {activeChallenge.leaderboard.map((row) => (
                <div
                  key={row.rank}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                    row.rank === 4
                      ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 font-bold'
                      : 'bg-slate-950/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold ${
                        row.rank === 1
                          ? 'bg-yellow-500 text-black'
                          : row.rank === 2
                          ? 'bg-slate-300 text-black'
                          : row.rank === 3
                          ? 'bg-orange-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      #{row.rank}
                    </span>
                    <span>{row.player}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-yellow-400 font-bold">{row.score}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold text-[10px] border border-emerald-500/40">
                      {row.prize}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
