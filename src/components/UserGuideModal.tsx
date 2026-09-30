import React, { useState } from 'react';
import { X, BookOpen, Coins, Zap, Shield, Sparkles, Layers, Info } from 'lucide-react';
import { sound } from '../utils/audio';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  const [selectedGame, setSelectedGame] = useState<number>(0);

  if (!isOpen) return null;

  const GAMES_GUIDE = [
    {
      title: '01. Neon Roulette',
      tagline: 'European Wheel + Lightning Flash Multipliers',
      houseEdge: '2.70%',
      minBet: '0.00022 SOL',
      maxPayout: '500x',
      description:
        'Place bets across 37 numbers (0-36) or outside fields (Red/Black, Even/Odd, Dozens, Columns, High/Low). In every round, lightning can strike 1-3 numbers boosting standard 36x straight-up payouts up to 500x!',
      rules: [
        'Straight Up (Single Number): 36:1 standard, or boosted 50x - 500x lightning payout.',
        'Red / Black, Even / Odd, High / Low (1-18 / 19-36): 2:1 (1:1 profit).',
        'Dozens (1-12, 13-24, 25-36) & Columns: 3:1 (2:1 profit).',
      ],
    },
    {
      title: '02. Chrome Blackjack',
      tagline: '6-Deck Vegas Rules + Perfect Pairs & 21+3 Side Bets',
      houseEdge: '0.50%',
      minBet: '0.00022 SOL',
      maxPayout: '100x',
      description:
        'Beat the dealer by reaching closer to 21 without busting. Dealer hits on soft 17. Includes high-octane side bets for massive multipliers.',
      rules: [
        'Natural Blackjack pays 3:2. Regular win pays 1:1. Push returns original stake.',
        'Double Down: Double initial bet after first 2 cards and receive exactly one card.',
        'Split: Split matching pair into two separate hands.',
        'Perfect Pairs Side Bet: Mixed Pair (6:1), Colored Pair (12:1), Perfect Pair (25:1).',
        '21+3 Side Bet: Flush (9:1), Straight (10:1), Three of a Kind (30:1), Straight Flush (40:1), Suited Trips (100:1).',
      ],
    },
    {
      title: '03. Slot Cascade',
      tagline: '5×5 Tumbling Grid + Progressive Cascade Multipliers',
      houseEdge: '3.00%',
      minBet: '0.00022 SOL',
      maxPayout: '1,000x',
      description:
        'Cluster matching symbols across the 5x5 grid. Winning clusters explode, triggering cascades where new symbols drop from above while the round multiplier escalates (1x → 2x → 3x → 5x → 10x+)!',
      rules: [
        'Match 3+ adjacent symbols horizontally or vertically.',
        'Solana Logo & Wild Diamonds substitute for any regular symbol.',
        '3+ Gold Scatter Stars trigger 10 Free Spins with non-resetting cascade multipliers.',
      ],
    },
    {
      title: '04. Dice Dynasty',
      tagline: 'Over/Under Slider + Exact Hit & Solana Hot Blockhash Prediction',
      houseEdge: '1.00%',
      minBet: '0.00022 SOL',
      maxPayout: '99x',
      description:
        'Slide your winning target from 0.01 to 99.99. Bet Roll Over or Roll Under with dynamic real-time odds, or play "Solana Hot" to predict the ending digits of the next live Solana block!',
      rules: [
        'Roll Over / Under: Multiplier = 99 / Win Probability (up to 990x on ultra-rare targets).',
        'Exact Hit: Pinpoint a narrow 1.0 window for a huge 99x multiplier.',
        'Provably fair output generated directly from verified cryptographic seeds.',
      ],
    },
    {
      title: '05. Crash Rocket',
      tagline: 'Hyper-Ascending Rocket Multiplier (1.00x → 1,000x+)',
      houseEdge: '1.50%',
      minBet: '0.00022 SOL',
      maxPayout: '1,000x',
      description:
        'Watch the Solstice Rocket take flight as the multiplier exponentially rises. Hit Cash Out before the rocket runs out of fuel and crashes!',
      rules: [
        'Multiplier starts at 1.00x and ascends in real time.',
        'Cash out anytime to lock in your multiplied payout.',
        'If the rocket crashes before cashout, the round stake is lost.',
        'Auto-Cashout setting allows locking profit automatically at a pre-set target.',
      ],
    },
    {
      title: '06. Keno Nova',
      tagline: 'Pick 1-10 Numbers · 20 Drawn from 80-Ball Matrix',
      houseEdge: '2.50%',
      minBet: '0.00022 SOL',
      maxPayout: '10,000x',
      description:
        'Select your lucky numbers on the cyber grid. 20 numbers are drawn rapidly. Match more numbers to reach astronomical payouts up to 10,000x your wager!',
      rules: [
        'Pick between 1 and 10 numbers on the 1-80 board.',
        '20 winning numbers are drawn per round.',
        'Payout table automatically updates to display current selected odds.',
      ],
    },
    {
      title: '07. Baccarat Flash',
      tagline: 'Player vs Banker + Big Road & Bead Plate Streaks',
      houseEdge: '1.06%',
      minBet: '0.00022 SOL',
      maxPayout: '11x',
      description:
        'The classic high-roller game of Macau and Vegas. Bet on Player (1:1), Banker (0.95:1), or Tie (8:1) with live Bead Plate and Big Road trend tracking.',
      rules: [
        'Cards 2-9 equal pip value, 10/J/Q/K equal 0, Ace equals 1.',
        'Hand total is calculated modulo 10 (e.g. 7 + 8 = 15 = 5 points).',
        'Standard third-card tableau drawing rules strictly executed automatically.',
        'Player Pair & Banker Pair side bets pay 11:1.',
      ],
    },
    {
      title: '08. Poker Hold’em Rush',
      tagline: 'Heads-Up Texas Hold’em vs Dealer Showdown',
      houseEdge: '2.10%',
      minBet: '0.00022 SOL',
      maxPayout: '100x',
      description:
        'Get dealt 2 hole cards and face the Dealer with 5 community board cards (Flop, Turn, River). Make the best 5-card poker hand to take down the pot!',
      rules: [
        'Ante up to receive hole cards. Inspect hand and Call or Fold.',
        'Flop (3 cards), Turn (1 card), and River (1 card) are revealed.',
        'Hand evaluator ranks hands: Royal Flush, Straight Flush, Quads, Full House, Flush, Straight, Trips, Two Pair, Pair, High Card.',
      ],
    },
    {
      title: '09. Wheel of Sol',
      tagline: '50-Segment Cyber Fortune Wheel + Lightning Jackpots',
      houseEdge: '2.80%',
      minBet: '0.00022 SOL',
      maxPayout: '100x',
      description:
        'Spin the huge 50-segment Solstice money wheel. Land on multipliers from 1x to 40x or trigger mystery lightning storms with instant jackpot multipliers!',
      rules: [
        'Place your chips on any multiplier segment: 1x, 2x, 5x, 10x, 20x, 40x.',
        'Flapper clicks and comes to rest on the winning segment.',
      ],
    },
    {
      title: '10. Mines & Treasure',
      tagline: '5×5 Cyber Minefield · Reveal Gems & Cash Out Anytime',
      houseEdge: '1.00%',
      minBet: '0.00022 SOL',
      maxPayout: '5,000,000x',
      description:
        'Choose your danger level (1 to 24 hidden mines). Uncover glowing Solstice gems on the 25-tile grid. The multiplier climbs with every safe gem uncovered; cash out whenever you choose!',
      rules: [
        'Configure number of mines (1 to 24).',
        'Click tiles to reveal gems. Each gem increases the current cashout value.',
        'Hit a mine and the round ends immediately with lost stake.',
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-4xl cyber-glass-glow rounded-2xl p-6 relative text-slate-100 shadow-2xl border border-yellow-500/30 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-yellow-500/20 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-950/80 border border-yellow-400/50 flex items-center justify-center text-yellow-400 shadow-lg shadow-yellow-950">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display tracking-wide text-white">
                Solstice Roulette User Guide & Rules
              </h2>
              <p className="text-xs text-slate-400">
                Complete Rules, Paytables, and Math Specifications for all 10 Games
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

        {/* Global Specifications Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 p-3 bg-slate-900/80 rounded-xl border border-slate-700/50 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Hard Floor Min Bet</span>
            <span className="font-mono font-bold text-cyan-300">0.00022 SOL</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Blockchain</span>
            <span className="font-mono font-bold text-purple-300">Solana (100% On-Chain)</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Randomness Model</span>
            <span className="font-mono font-bold text-emerald-300">SHA-256 Commit-Reveal</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Modes Supported</span>
            <span className="font-mono font-bold text-orange-300">Single, Multi & Cascade</span>
          </div>
        </div>

        {/* Game Selector Tabs & Content */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left game list */}
          <div className="space-y-1.5 md:border-r border-slate-800 md:pr-3">
            {GAMES_GUIDE.map((g, idx) => (
              <button
                key={idx}
                onClick={() => {
                  sound.playChipClick();
                  setSelectedGame(idx);
                }}
                className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between text-xs ${
                  selectedGame === idx
                    ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/10 border border-yellow-500/40 text-yellow-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <span>{g.title}</span>
                <span className="text-[10px] font-mono text-slate-500">Max {g.maxPayout}</span>
              </button>
            ))}
          </div>

          {/* Right Game Details */}
          <div className="md:col-span-2 space-y-4">
            {(() => {
              const current = GAMES_GUIDE[selectedGame];
              return (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white font-display">
                      {current.title}
                    </h3>
                    <p className="text-xs text-yellow-400/90 font-medium mt-0.5">
                      {current.tagline}
                    </p>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    {current.description}
                  </p>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">House Edge</span>
                      <span className="font-mono font-bold text-emerald-400">{current.houseEdge}</span>
                    </div>
                    <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Min Stake</span>
                      <span className="font-mono font-bold text-cyan-300">{current.minBet}</span>
                    </div>
                    <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Max Multiplier</span>
                      <span className="font-mono font-bold text-orange-400">{current.maxPayout}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-yellow-400" />
                      Key Rules & Payout Mechanics
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {current.rules.map((rule, rIdx) => (
                        <li key={rIdx} className="flex items-start gap-2 bg-slate-900/40 p-2 rounded-lg border border-slate-800/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5 shrink-0" />
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};
