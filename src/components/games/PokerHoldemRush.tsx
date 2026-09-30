import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Award, Sparkles, Hand, Plus } from 'lucide-react';
import { BetSlip } from '../BetSlip';
import { sound } from '../../utils/audio';

interface PokerHoldemRushProps {
  balance: number;
  onBetPlaced: (game: string, betAmount: number, payout: number, multiplier: number, details?: string) => Promise<boolean>;
}

interface Card {
  val: string;
  suit: string;
  rank: number;
  color: string;
}

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = [
  { val: '2', rank: 2 },
  { val: '3', rank: 3 },
  { val: '4', rank: 4 },
  { val: '5', rank: 5 },
  { val: '6', rank: 6 },
  { val: '7', rank: 7 },
  { val: '8', rank: 8 },
  { val: '9', rank: 9 },
  { val: '10', rank: 10 },
  { val: 'J', rank: 11 },
  { val: 'Q', rank: 12 },
  { val: 'K', rank: 13 },
  { val: 'A', rank: 14 },
];

export const PokerHoldemRush: React.FC<PokerHoldemRushProps> = ({ balance, onBetPlaced }) => {
  const [betAmount, setBetAmount] = useState(0.01);
  const [stage, setStage] = useState<'ante' | 'flop' | 'showdown'>('ante');
  const [playerHole, setPlayerHole] = useState<Card[]>([]);
  const [dealerHole, setDealerHole] = useState<Card[]>([]);
  const [communityCards, setCommunityCards] = useState<Card[]>([]);
  const [pokerResult, setPokerResult] = useState<string | null>(null);

  const drawCard = (): Card => {
    const s = SUITS[Math.floor(Math.random() * SUITS.length)];
    const v = VALUES[Math.floor(Math.random() * VALUES.length)];
    return {
      val: v.val,
      suit: s,
      rank: v.rank,
      color: s === '♥' || s === '♦' ? 'red' : 'white',
    };
  };

  const handleAnte = async () => {
    if (betAmount > balance) return;
    sound.playBetPlaced();
    sound.playCardDeal();

    const p = [drawCard(), drawCard()];
    const d = [drawCard(), drawCard()];
    const comm = [drawCard(), drawCard(), drawCard()];

    setPlayerHole(p);
    setDealerHole(d);
    setCommunityCards(comm);
    setStage('flop');
    setPokerResult(null);
  };

  const handleCallShowdown = async () => {
    sound.playChipClick();
    sound.playCardDeal();

    // Deal Turn and River
    const turn = drawCard();
    const river = drawCard();
    const fullBoard = [...communityCards, turn, river];
    setCommunityCards(fullBoard);
    setStage('showdown');

    // Simple poker evaluator for heads-up demo
    const pHigh = Math.max(...playerHole.map((c) => c.rank));
    const dHigh = Math.max(...dealerHole.map((c) => c.rank));

    const pPair = playerHole[0].rank === playerHole[1].rank || fullBoard.some((c) => c.rank === playerHole[0].rank || c.rank === playerHole[1].rank);
    const dPair = dealerHole[0].rank === dealerHole[1].rank || fullBoard.some((c) => c.rank === dealerHole[0].rank || c.rank === dealerHole[1].rank);

    let payout = 0;
    let multiplier = 0;
    let rankName = 'High Card';

    if (pPair && !dPair) {
      rankName = 'Pair (Win)';
      multiplier = 2.0;
    } else if (pPair && dPair) {
      if (pHigh >= dHigh) {
        rankName = 'Two Pair / High Pair (Win)';
        multiplier = 2.0;
      } else {
        rankName = 'Dealer Pair (Loss)';
        multiplier = 0;
      }
    } else if (pHigh > dHigh) {
      rankName = 'High Card Win';
      multiplier = 2.0;
    } else {
      rankName = 'Dealer High Card';
      multiplier = 0;
    }

    payout = betAmount * multiplier;
    setPokerResult(multiplier > 0 ? `Player Wins with ${rankName}!` : `Dealer Wins with ${rankName}.`);

    if (payout > 0) {
      sound.playWin();
      confetti({ particleCount: 70, spread: 60 });
    } else {
      sound.playLoss();
    }

    onBetPlaced('Poker Hold’em Rush', betAmount, payout, multiplier, rankName);
  };

  const handleFold = () => {
    sound.playChipClick();
    setStage('ante');
    setPokerResult('Hand Folded.');
    onBetPlaced('Poker Hold’em Rush', betAmount, 0, 0, 'Folded');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Poker Table Arena */}
      <div className="lg:col-span-8 cyber-glass rounded-2xl p-6 border border-cyan-500/20 flex flex-col justify-between min-h-[440px]">
        {/* Dealer Hole Cards */}
        <div className="text-center space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            DEALER POKER HAND
          </span>
          <div className="flex items-center justify-center gap-3 min-h-[88px]">
            {dealerHole.map((c, i) => (
              <div
                key={i}
                className={`w-14 h-20 rounded-lg border flex flex-col justify-between p-1.5 font-mono font-bold text-xs ${
                  stage === 'showdown'
                    ? 'bg-slate-900 border-cyan-500/40'
                    : 'bg-gradient-to-br from-cyan-900 to-slate-950 border-cyan-500/60'
                }`}
              >
                {stage === 'showdown' ? (
                  <>
                    <span className={c.color === 'red' ? 'text-red-400' : 'text-cyan-200'}>{c.val}</span>
                    <span className={`text-base text-center ${c.color === 'red' ? 'text-red-400' : 'text-cyan-200'}`}>{c.suit}</span>
                    <span className={`text-right ${c.color === 'red' ? 'text-red-400' : 'text-cyan-200'}`}>{c.val}</span>
                  </>
                ) : (
                  <span className="text-cyan-400 text-center my-auto">🂠</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Community Board (Flop, Turn, River) */}
        <div className="p-3 bg-slate-950/80 rounded-2xl border border-cyan-500/30 text-center space-y-2 max-w-lg mx-auto w-full">
          <span className="text-[11px] font-mono font-semibold text-cyan-400 uppercase">
            Community Cards ({communityCards.length}/5)
          </span>
          <div className="flex items-center justify-center gap-2 min-h-[80px]">
            {communityCards.map((c, i) => (
              <div
                key={i}
                className="w-12 h-18 rounded-lg bg-slate-900 border border-slate-700 flex flex-col justify-between p-1 font-mono font-bold text-[11px]"
              >
                <span className={c.color === 'red' ? 'text-red-400' : 'text-cyan-200'}>{c.val}</span>
                <span className={`text-sm text-center ${c.color === 'red' ? 'text-red-400' : 'text-cyan-200'}`}>{c.suit}</span>
                <span className={`text-right ${c.color === 'red' ? 'text-red-400' : 'text-cyan-200'}`}>{c.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Player Hole Cards */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 min-h-[88px]">
            {playerHole.map((c, i) => (
              <div
                key={i}
                className="w-14 h-20 rounded-lg bg-slate-900 border border-cyan-400 flex flex-col justify-between p-1.5 font-mono font-bold text-xs shadow-md shadow-cyan-950"
              >
                <span className={c.color === 'red' ? 'text-red-400' : 'text-cyan-200'}>{c.val}</span>
                <span className={`text-base text-center ${c.color === 'red' ? 'text-red-400' : 'text-cyan-200'}`}>{c.suit}</span>
                <span className={`text-right ${c.color === 'red' ? 'text-red-400' : 'text-cyan-200'}`}>{c.val}</span>
              </div>
            ))}
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
            YOUR HOLE CARDS
          </span>
        </div>

        {pokerResult && (
          <div className="p-2 text-center bg-slate-900/90 rounded-xl border border-cyan-400/50 font-mono font-bold text-sm text-cyan-300">
            {pokerResult}
          </div>
        )}

        {/* Actions */}
        <div className="pt-3">
          {stage === 'flop' ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCallShowdown}
                className="py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-950"
              >
                CALL & SHOWDOWN (Turn + River)
              </button>
              <button
                onClick={handleFold}
                className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
              >
                FOLD HAND
              </button>
            </div>
          ) : (
            <button
              disabled={betAmount > balance}
              onClick={handleAnte}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-950/80 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <span>DEAL HOLD’EM ANTE ({betAmount.toFixed(4)} SOL)</span>
            </button>
          )}
        </div>
      </div>

      {/* Bet Slip */}
      <div className="lg:col-span-4 space-y-4">
        <BetSlip
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          balance={balance}
          disabled={stage === 'flop'}
        />
      </div>
    </div>
  );
};
