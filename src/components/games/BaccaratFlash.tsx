import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Shield, Trophy } from 'lucide-react';
import { BetSlip } from '../BetSlip';
import { sound } from '../../utils/audio';

interface BaccaratFlashProps {
  balance: number;
  onBetPlaced: (game: string, betAmount: number, payout: number, multiplier: number, details?: string) => Promise<boolean>;
}

interface Card {
  val: string;
  suit: string;
  pts: number;
  color: string;
}

const SUITS = ['♠', '♥', '♦', '♣'];
const CARDS = [
  { val: 'A', pts: 1 },
  { val: '2', pts: 2 },
  { val: '3', pts: 3 },
  { val: '4', pts: 4 },
  { val: '5', pts: 5 },
  { val: '6', pts: 6 },
  { val: '7', pts: 7 },
  { val: '8', pts: 8 },
  { val: '9', pts: 9 },
  { val: '10', pts: 0 },
  { val: 'J', pts: 0 },
  { val: 'Q', pts: 0 },
  { val: 'K', pts: 0 },
];

export const BaccaratFlash: React.FC<BaccaratFlashProps> = ({ balance, onBetPlaced }) => {
  const [betAmount, setBetAmount] = useState(0.01);
  const [betTarget, setBetTarget] = useState<'player' | 'banker' | 'tie'>('banker');
  const [dealing, setDealing] = useState(false);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [bankerCards, setBankerCards] = useState<Card[]>([]);
  const [roadmap, setRoadmap] = useState<('P' | 'B' | 'T')[]>(['B', 'P', 'B', 'B', 'T', 'P', 'B']);
  const [roundResult, setRoundResult] = useState<string | null>(null);

  const drawCard = (): Card => {
    const s = SUITS[Math.floor(Math.random() * SUITS.length)];
    const c = CARDS[Math.floor(Math.random() * CARDS.length)];
    return {
      val: c.val,
      suit: s,
      pts: c.pts,
      color: s === '♥' || s === '♦' ? 'red' : 'white',
    };
  };

  const getScore = (cards: Card[]) => cards.reduce((a, b) => a + b.pts, 0) % 10;

  const handleDeal = async () => {
    if (betAmount > balance || dealing) return;

    sound.playBetPlaced();
    setDealing(true);
    setRoundResult(null);

    const p1 = drawCard();
    const b1 = drawCard();
    const p2 = drawCard();
    const b2 = drawCard();

    const pHand = [p1, p2];
    const bHand = [b1, b2];

    sound.playCardDeal();

    // Natural 8 or 9 check
    let pScore = getScore(pHand);
    let bScore = getScore(bHand);

    if (pScore < 8 && bScore < 8) {
      // Third card rules
      if (pScore <= 5) {
        const p3 = drawCard();
        pHand.push(p3);
        pScore = getScore(pHand);

        // Banker third card drawing tableau
        if (bScore <= 2) bHand.push(drawCard());
        else if (bScore === 3 && p3.pts !== 8) bHand.push(drawCard());
        else if (bScore === 4 && [2, 3, 4, 5, 6, 7].includes(p3.pts)) bHand.push(drawCard());
        else if (bScore === 5 && [4, 5, 6, 7].includes(p3.pts)) bHand.push(drawCard());
        else if (bScore === 6 && [6, 7].includes(p3.pts)) bHand.push(drawCard());
      } else if (bScore <= 5) {
        bHand.push(drawCard());
      }
    }

    setPlayerCards(pHand);
    setBankerCards(bHand);

    pScore = getScore(pHand);
    bScore = getScore(bHand);

    let winner: 'P' | 'B' | 'T' = 'T';
    let multiplier = 0;

    if (pScore > bScore) {
      winner = 'P';
      multiplier = betTarget === 'player' ? 2.0 : 0;
      setRoundResult(`Player Wins (${pScore} vs ${bScore})`);
    } else if (bScore > pScore) {
      winner = 'B';
      multiplier = betTarget === 'banker' ? 1.95 : 0;
      setRoundResult(`Banker Wins (${bScore} vs ${pScore})`);
    } else {
      winner = 'T';
      multiplier = betTarget === 'tie' ? 8.0 : betTarget === 'player' || betTarget === 'banker' ? 1.0 : 0;
      setRoundResult(`Tie! (${pScore}-${bScore})`);
    }

    const payout = betAmount * multiplier;

    setTimeout(() => {
      setDealing(false);
      setRoadmap((prev) => [...prev.slice(-14), winner]);

      if (payout > 0) {
        sound.playWin();
        confetti({ particleCount: 70, spread: 60 });
      } else {
        sound.playLoss();
      }

      onBetPlaced(
        'Baccarat Flash',
        betAmount,
        payout,
        multiplier,
        `${winner === 'P' ? 'Player' : winner === 'B' ? 'Banker' : 'Tie'} (${pScore} vs ${bScore})`
      );
    }, 700);
  };

  const pScore = getScore(playerCards);
  const bScore = getScore(bankerCards);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Table Arena */}
      <div className="lg:col-span-8 cyber-glass rounded-2xl p-6 border border-cyan-500/20 flex flex-col justify-between min-h-[440px]">
        {/* Bead Plate Roadmap */}
        <div className="flex items-center gap-2 overflow-x-auto p-2 bg-slate-950/80 rounded-xl border border-slate-800 font-mono text-xs">
          <span className="text-slate-400 text-[11px] mr-2">BEAD PLATE:</span>
          {roadmap.map((r, i) => (
            <span
              key={i}
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                r === 'B'
                  ? 'bg-red-600 text-white'
                  : r === 'P'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {r}
            </span>
          ))}
        </div>

        {/* Showdown Hands */}
        <div className="grid grid-cols-2 gap-4 my-6">
          {/* Player Hand */}
          <div className="p-4 bg-slate-900/80 rounded-xl border border-cyan-500/40 text-center space-y-3">
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider block">
              PLAYER ({pScore})
            </span>
            <div className="flex items-center justify-center gap-2 min-h-[88px]">
              {playerCards.map((c, i) => (
                <div
                  key={i}
                  className="w-14 h-20 rounded-lg bg-slate-950 border border-cyan-500/40 flex flex-col justify-between p-1.5 font-mono font-bold text-xs"
                >
                  <span className={c.color === 'red' ? 'text-red-400' : 'text-cyan-200'}>{c.val}</span>
                  <span className={`text-base text-center ${c.color === 'red' ? 'text-red-400' : 'text-cyan-200'}`}>
                    {c.suit}
                  </span>
                  <span className={`text-right ${c.color === 'red' ? 'text-red-400' : 'text-cyan-200'}`}>
                    {c.val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Banker Hand */}
          <div className="p-4 bg-slate-900/80 rounded-xl border border-red-500/40 text-center space-y-3">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">
              BANKER ({bScore})
            </span>
            <div className="flex items-center justify-center gap-2 min-h-[88px]">
              {bankerCards.map((c, i) => (
                <div
                  key={i}
                  className="w-14 h-20 rounded-lg bg-slate-950 border border-red-500/40 flex flex-col justify-between p-1.5 font-mono font-bold text-xs"
                >
                  <span className={c.color === 'red' ? 'text-red-400' : 'text-cyan-200'}>{c.val}</span>
                  <span className={`text-base text-center ${c.color === 'red' ? 'text-red-400' : 'text-cyan-200'}`}>
                    {c.suit}
                  </span>
                  <span className={`text-right ${c.color === 'red' ? 'text-red-400' : 'text-cyan-200'}`}>
                    {c.val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Outcome Banner */}
        {roundResult && (
          <div className="p-2.5 text-center bg-slate-900/90 rounded-xl border border-cyan-400/50 font-mono font-bold text-sm text-cyan-300">
            {roundResult}
          </div>
        )}

        {/* Target Buttons (Player / Banker / Tie) */}
        <div className="grid grid-cols-3 gap-3 pt-3">
          <button
            disabled={dealing}
            onClick={() => {
              sound.playChipClick();
              setBetTarget('player');
            }}
            className={`py-3 rounded-xl font-bold text-xs transition-all ${
              betTarget === 'player'
                ? 'bg-cyan-600 text-white border border-cyan-400 shadow-lg shadow-cyan-950'
                : 'bg-slate-900/90 border border-slate-800 text-cyan-300'
            }`}
          >
            PLAYER (1:1)
          </button>
          <button
            disabled={dealing}
            onClick={() => {
              sound.playChipClick();
              setBetTarget('tie');
            }}
            className={`py-3 rounded-xl font-bold text-xs transition-all ${
              betTarget === 'tie'
                ? 'bg-emerald-600 text-white border border-emerald-400 shadow-lg shadow-emerald-950'
                : 'bg-slate-900/90 border border-slate-800 text-emerald-300'
            }`}
          >
            TIE (8:1)
          </button>
          <button
            disabled={dealing}
            onClick={() => {
              sound.playChipClick();
              setBetTarget('banker');
            }}
            className={`py-3 rounded-xl font-bold text-xs transition-all ${
              betTarget === 'banker'
                ? 'bg-red-600 text-white border border-red-400 shadow-lg shadow-red-950'
                : 'bg-slate-900/90 border border-slate-800 text-red-300'
            }`}
          >
            BANKER (0.95:1)
          </button>
        </div>

        <button
          disabled={dealing || betAmount > balance}
          onClick={handleDeal}
          className="w-full mt-4 py-3.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-950/80 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          <span>
            {dealing
              ? 'Dealing Baccarat Coup...'
              : `DEAL BACCARAT (${betAmount.toFixed(4)} SOL)`}
          </span>
        </button>
      </div>

      {/* Bet Slip */}
      <div className="lg:col-span-4 space-y-4">
        <BetSlip
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          balance={balance}
          disabled={dealing}
        />
      </div>
    </div>
  );
};
