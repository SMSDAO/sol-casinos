import React, { useState } from 'react';
import {
  X,
  ArrowDownUp,
  Sparkles,
  Zap,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Coins,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface JupiterFundingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFundSuccess: (solAmount: number) => void;
  currentSolBalance: number;
}

interface SwapToken {
  symbol: string;
  name: string;
  icon: string;
  balance: number;
  rateToSol: number; // e.g. USDC = 0.00512 SOL
}

const SUPPORTED_SWAP_TOKENS: SwapToken[] = [
  { symbol: 'USDC', name: 'USD Coin', icon: '💲', balance: 145.5, rateToSol: 0.00512 },
  { symbol: 'BONK', name: 'Bonk', icon: '🐕', balance: 2500000, rateToSol: 0.000000028 },
  { symbol: 'JUP', name: 'Jupiter', icon: '🪐', balance: 85.0, rateToSol: 0.0048 },
  { symbol: 'RAY', name: 'Raydium', icon: '⚡', balance: 42.0, rateToSol: 0.0125 },
  { symbol: 'WIF', name: 'dogwifhat', icon: '🎩', balance: 120.0, rateToSol: 0.0092 },
];

export const JupiterFundingModal: React.FC<JupiterFundingModalProps> = ({
  isOpen,
  onClose,
  onFundSuccess,
  currentSolBalance,
}) => {
  const [selectedToken, setSelectedToken] = useState<SwapToken>(SUPPORTED_SWAP_TOKENS[0]);
  const [inputAmount, setInputAmount] = useState('50');
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapSuccessMsg, setSwapSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const numAmount = parseFloat(inputAmount) || 0;
  const estimatedSolOutput = numAmount * selectedToken.rateToSol;
  const priceImpactPct = 0.02; // 0.02%

  const handleExecuteSwap = () => {
    if (numAmount <= 0) return;
    sound.playChipClick();
    setIsSwapping(true);

    setTimeout(() => {
      sound.playCashout();
      setIsSwapping(false);
      onFundSuccess(estimatedSolOutput);
      setSwapSuccessMsg(`Swapped ${numAmount} ${selectedToken.symbol} for +${estimatedSolOutput.toFixed(4)} SOL via Jupiter API`);

      setTimeout(() => {
        setSwapSuccessMsg(null);
        onClose();
      }, 2500);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-[#060813] border border-cyan-500/40 p-6 shadow-2xl font-mono text-slate-100 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Zap className="w-5 h-5 text-cyan-300 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wider flex items-center gap-1.5">
                JUPITER ONE-CLICK FUNDING
              </h3>
              <p className="text-[10px] text-cyan-400">Swap any SPL Token → SOL Bankroll</p>
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

        {swapSuccessMsg ? (
          <div className="p-4 bg-emerald-950/90 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs font-bold flex flex-col items-center justify-center gap-2 text-center py-8 animate-in zoom-in-95">
            <CheckCircle className="w-8 h-8 text-emerald-400 animate-bounce" />
            <span>{swapSuccessMsg}</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pay Token Input */}
            <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">You Pay</span>
                <span className="text-slate-400">
                  Balance: {selectedToken.balance.toLocaleString()} {selectedToken.symbol}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value)}
                  className="w-full bg-transparent text-xl font-bold font-mono text-white focus:outline-none"
                  placeholder="0.0"
                />

                <select
                  value={selectedToken.symbol}
                  onChange={(e) => {
                    const found = SUPPORTED_SWAP_TOKENS.find((t) => t.symbol === e.target.value);
                    if (found) setSelectedToken(found);
                  }}
                  className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 font-bold text-xs focus:outline-none"
                >
                  {SUPPORTED_SWAP_TOKENS.map((tok) => (
                    <option key={tok.symbol} value={tok.symbol}>
                      {tok.icon} {tok.symbol}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Swap Divider */}
            <div className="flex justify-center -my-2 relative z-10">
              <div className="p-2 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-400 shadow-lg">
                <ArrowDownUp className="w-4 h-4" />
              </div>
            </div>

            {/* Receive SOL Output */}
            <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">You Receive (Solana Bankroll)</span>
                <span className="text-cyan-400 font-bold">
                  Current: {currentSolBalance.toFixed(3)} SOL
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xl font-bold font-mono text-cyan-300">
                  +{estimatedSolOutput.toFixed(4)} SOL
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] border border-cyan-500/40 font-bold">
                  Solstice Wallet
                </span>
              </div>
            </div>

            {/* Swap Details */}
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] space-y-1.5 text-slate-400">
              <div className="flex justify-between">
                <span>Exchange Rate:</span>
                <span className="text-slate-200">
                  1 {selectedToken.symbol} ≈ {selectedToken.rateToSol} SOL
                </span>
              </div>
              <div className="flex justify-between">
                <span>Routing Protocol:</span>
                <span className="text-cyan-400 font-bold">Jupiter v6 Direct Route</span>
              </div>
              <div className="flex justify-between">
                <span>Slippage Tolerance:</span>
                <span className="text-slate-200">0.5% (Auto)</span>
              </div>
            </div>

            {/* Swap Execution Button */}
            <button
              onClick={handleExecuteSwap}
              disabled={isSwapping || numAmount <= 0}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:opacity-90 font-bold text-xs text-white rounded-xl shadow-lg shadow-cyan-950/80 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSwapping ? (
                <>
                  <RefreshCw className="w-4 h-4 text-cyan-200 animate-spin" />
                  <span>Swapping via Jupiter API...</span>
                </>
              ) : (
                <>
                  <Coins className="w-4 h-4 text-cyan-200" />
                  <span>Execute One-Click Funding ({numAmount} {selectedToken.symbol})</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
