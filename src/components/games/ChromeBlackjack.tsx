import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ShieldCheck, Plus, Hand, Sparkles, Zap, Award } from 'lucide-react';
import { BetSlip } from '../BetSlip';
import { sound } from '../../utils/audio';

interface ChromeBlackjackProps {
  balance: number;
  onBetPlaced: (game: string, betAmount: number, payout: number, multiplier: number, details?: string) => Promise<boolean>;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
}

interface Card {
  suit: '♠' | '♥' | '♦' | '♣';
  value: string;
  score: number;
  color: 'red' | 'white';
}

const SUITS: ('♠' | '♥' | '♦' | '♣')[] = ['♠', '♥', '♦', '♣'];
const VALUES = [
  { val: '2', score: 2 },
  { val: '3', score: 3 },
  { val: '4', score: 4 },
  { val: '5', score: 5 },
  { val: '6', score: 6 },
  { val: '7', score: 7 },
  { val: '8', score: 8 },
  { val: '9', score: 9 },
  { val: '10', score: 10 },
  { val: 'J', score: 10 },
  { val: 'Q', score: 10 },
  { val: 'K', score: 10 },
  { val: 'A', score: 11 },
];

export const ChromeBlackjack: React.FC<ChromeBlackjackProps> = ({
  balance,
  onBetPlaced,
}) => {
  const [betAmount, setBetAmount] = useState(0.01);
  const [pairSideBet, setPairSideBet] = useState(0);
  const [pokerSideBet, setPokerSideBet] = useState(0);

  const [gameState, setGameState] = useState<'betting' | 'player_turn' | 'dealer_turn' | 'resolved'>('betting');
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const generateCard = (): Card => {
    const s = SUITS[Math.floor(Math.random() * SUITS.length)];
    const v = VALUES[Math.floor(Math.random() * VALUES.length)];
    return {
      suit: s,
      value: v.val,
      score: v.score,
      color: s === '♥' || s === '♦' ? 'red' : 'white',
    };
  };

  const calculateHandScore = (cards: Card[]): number => {
    let score = cards.reduce((acc, c) => acc + c.score, 0);
    let aces = cards.filter((c) => c.value === 'A').length;
    while (score > 21 && aces > 0) {
      score -= 10;
      aces -= 1;
    }
    return score;
  };

  const handleDeal = async () => {
    const totalWager = betAmount + pairSideBet + pokerSideBet;
    if (totalWager > balance || totalWager <= 0) return;

    sound.playBetPlaced();
    sound.playCardDeal();

    const p1 = generateCard();
    const d1 = generateCard();
    const p2 = generateCard();
    const d2 = generateCard();

    const pHand = [p1, p2];
    const dHand = [d1, d2];

    setPlayerHand(pHand);
    setDealerHand(dHand);
    setResultMessage(null);

    // Evaluate Side Bets
    let sidePayout = 0;
    if (pairSideBet > 0 && p1.value === p2.value) {
      sidePayout += pairSideBet * (p1.suit === p2.suit ? 25 : 12);
    }
    if (pokerSideBet > 0) {
      const suits3 = [p1.suit, p2.suit, d1.suit];
      if (suits3[0] === suits3[1] && suits3[1] === suits3[2]) {
        sidePayout += pokerSideBet * 9; // Flush
      }
    }

    const pScore = calculateHandScore(pHand);
    const dScore = calculateHandScore(dHand);

    // Check Natural Blackjack
    if (pScore === 21) {
      setGameState('resolved');
      if (dScore === 21) {
        setResultMessage('Push! Both hold Blackjack.');
        sound.playChipClick();
        onBetPlaced('Chrome Blackjack', totalWager, betAmount + sidePayout, 1.0, 'Push 21-21');
      } else {
        const win = betAmount * 2.5 + sidePayout;
        setResultMessage('Blackjack! 3:2 Payout.');
        sound.playWin();
        confetti({ particleCount: 70, spread: 60 });
        onBetPlaced('Chrome Blackjack', totalWager, win, 2.5, 'Natural Blackjack');
      }
    } else {
      setGameState('player_turn');
    }
  };

  const handleHit = () => {
    sound.playCardDeal();
    const nextCard = generateCard();
    const updated = [...playerHand, nextCard];
    setPlayerHand(updated);

    const score = calculateHandScore(updated);
    if (score > 21) {
      // Bust
      setGameState('resolved');
      setResultMessage('Bust! Player total over 21.');
      sound.playLoss();
      const totalWager = betAmount + pairSideBet + pokerSideBet;
      onBetPlaced('Chrome Blackjack', totalWager, 0, 0, 'Player Bust');
    }
  };

  const handleDoubleDown = () => {
    sound.playChipClick();
    sound.playCardDeal();
    const nextCard = generateCard();
    const updated = [...playerHand, nextCard];
    setPlayerHand(updated);
    resolveDealer(updated, betAmount * 2);
  };

  const handleStand = () => {
    sound.playChipClick();
    resolveDealer(playerHand, betAmount);
  };

  const resolveDealer = async (finalPlayerHand: Card[], activeMainBet: number) => {
    setGameState('dealer_turn');
    const pScore = calculateHandScore(finalPlayerHand);

    let dCards = [...dealerHand];
    while (calculateHandScore(dCards) < 17) {
      sound.playCardDeal();
      dCards.push(generateCard());
    }
    setDealerHand(dCards);
    const dScore = calculateHandScore(dCards);

    const totalWager = activeMainBet + pairSideBet + pokerSideBet;
    setGameState('resolved');

    if (pScore > 21) {
      setResultMessage('Bust! Over 21.');
      sound.playLoss();
      onBetPlaced('Chrome Blackjack', totalWager, 0, 0, `Bust ${pScore}`);
    } else if (dScore > 21 || pScore > dScore) {
      const payout = activeMainBet * 2;
      setResultMessage(`Player Wins! (${pScore} vs Dealer ${dScore > 21 ? 'Bust' : dScore})`);
      sound.playWin();
      confetti({ particleCount: 80, spread: 70 });
      onBetPlaced('Chrome Blackjack', totalWager, payout, 2.0, `Win ${pScore} vs ${dScore}`);
    } else if (pScore === dScore) {
      setResultMessage(`Push! Tied at ${pScore}.`);
      sound.playChipClick();
      onBetPlaced('Chrome Blackjack', totalWager, activeMainBet, 1.0, `Push ${pScore}-${dScore}`);
    } else {
      setResultMessage(`Dealer Wins (${dScore} vs Player ${pScore}).`);
      sound.playLoss();
      onBetPlaced('Chrome Blackjack', totalWager, 0, 0, `Loss ${pScore} vs ${dScore}`);
    }
  };

  const playerScore = calculateHandScore(playerHand);
  const dealerScore =
    gameState === 'betting'
      ? 0
      : gameState === 'player_turn'
      ? dealerHand[0]?.score || 0
      : calculateHandScore(dealerHand);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table Felt */}
        <div className="lg:col-span-8 cyber-glass rounded-2xl p-6 border border-cyan-500/20 min-h-[420px] flex flex-col justify-between relative overflow-hidden">
          {/* Dealer Section */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                DEALER HAND ({gameState === 'player_turn' ? 'Shows ' + dealerScore : dealerScore})
              </span>
            </div>

            <div className="flex items-center justify-center gap-3 min-h-[96px]">
              {dealerHand.map((c, i) => {
                const hidden = gameState === 'player_turn' && i === 1;
                return (
                  <div
                    key={i}
                    className={`w-16 h-24 rounded-xl border flex flex-col justify-between p-2 font-mono font-bold shadow-lg transition-transform hover:-translate-y-1 ${
                      hidden
                        ? 'bg-gradient-to-br from-cyan-900 to-slate-900 border-cyan-500/60 flex items-center justify-center'
                        : 'bg-slate-900/90 border-cyan-500/40 text-white'
                    }`}
                  >
                    {hidden ? (
                      <ShieldCheck className="w-6 h-6 text-cyan-400 animate-pulse" />
                    ) : (
                      <>
                        <span className={`text-xs ${c.color === 'red' ? 'text-red-400' : 'text-cyan-200'}`}>
                          {c.value}
                        </span>
                        <span className={`text-xl text-center ${c.color === 'red' ? 'text-red-400' : 'text-cyan-200'}`}>
                          {c.suit}
                        </span>
                        <span className={`text-xs text-right ${c.color === 'red' ? 'text-red-400' : 'text-cyan-200'}`}>
                          {c.value}
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Outcome Banner */}
          {resultMessage && (
            <div className="my-2 p-3 text-center bg-slate-900/90 rounded-xl border border-cyan-400/50 font-mono font-bold text-sm text-cyan-300 animate-in fade-in zoom-in-95">
              {resultMessage}
            </div>
          )}

          {/* Player Section */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3 min-h-[96px]">
              {playerHand.map((c, i) => (
                <div
                  key={i}
                  className="w-16 h-24 rounded-xl bg-slate-900/90 border border-cyan-500/40 flex flex-col justify-between p-2 font-mono font-bold shadow-lg transition-transform hover:-translate-y-1"
                >
                  <span className={`text-xs ${c.color === 'red' ? 'text-red-400' : 'text-cyan-200'}`}>
                    {c.value}
                  </span>
                  <span className={`text-xl text-center ${c.color === 'red' ? 'text-red-400' : 'text-cyan-200'}`}>
                    {c.suit}
                  </span>
                  <span className={`text-xs text-right ${c.color === 'red' ? 'text-red-400' : 'text-cyan-200'}`}>
                    {c.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                PLAYER HAND ({playerScore})
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800">
            {gameState === 'player_turn' ? (
              <>
                <button
                  onClick={handleHit}
                  className="py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-950"
                >
                  <Plus className="w-4 h-4" /> HIT
                </button>
                <button
                  onClick={handleStand}
                  className="py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-red-950"
                >
                  <Hand className="w-4 h-4" /> STAND
                </button>
                <button
                  disabled={playerHand.length > 2 || betAmount * 2 > balance}
                  onClick={handleDoubleDown}
                  className="py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Zap className="w-4 h-4" /> DOUBLE
                </button>
              </>
            ) : (
              <button
                disabled={betAmount > balance || betAmount <= 0}
                onClick={handleDeal}
                className="col-span-3 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-950/80 transition-all active:scale-95 disabled:opacity-50"
              >
                DEAL CARDS ({(betAmount + pairSideBet + pokerSideBet).toFixed(4)} SOL)
              </button>
            )}
          </div>
        </div>

        {/* Side Bets & Bet Slip */}
        <div className="lg:col-span-4 space-y-4">
          <BetSlip
            betAmount={betAmount}
            setBetAmount={setBetAmount}
            balance={balance}
            disabled={gameState === 'player_turn'}
          />

          {/* Side Bet Modules */}
          <div className="cyber-glass rounded-2xl p-4 border border-cyan-500/20 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
              Optional Side Bets
            </span>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-cyan-300 block">Perfect Pairs (25:1)</span>
                <span className="text-[10px] text-slate-400">Suited Pair on first 2 cards</span>
              </div>
              <input
                type="number"
                step="0.001"
                min="0"
                disabled={gameState === 'player_turn'}
                value={pairSideBet}
                onChange={(e) => setPairSideBet(parseFloat(e.target.value) || 0)}
                className="w-20 bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-right text-cyan-300 font-mono font-bold"
              />
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-purple-300 block">21+3 Poker (Up to 100:1)</span>
                <span className="text-[10px] text-slate-400">Player 2 cards + Dealer upcard</span>
              </div>
              <input
                type="number"
                step="0.001"
                min="0"
                disabled={gameState === 'player_turn'}
                value={pokerSideBet}
                onChange={(e) => setPokerSideBet(parseFloat(e.target.value) || 0)}
                className="w-20 bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-right text-purple-300 font-mono font-bold"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
