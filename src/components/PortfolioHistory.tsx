import React, { useState, useEffect } from 'react';
import {
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Download,
  ExternalLink,
  Filter,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Sparkles,
  Rocket,
  Flame,
  Share2,
} from 'lucide-react';
import { BetTransactionRecord, NETWORKS, NetworkCluster } from '../services/solana';
import { sound } from '../utils/audio';
import { fetchRealSolPrice, PriceOracleData } from '../services/oracle';
import { tokenLaunchService, LaunchedSPLToken } from '../services/tokenLaunch';
import { ShareableResult } from './ShareableResult';

interface PortfolioHistoryProps {
  balance: number;
  history: BetTransactionRecord[];
  network: NetworkCluster;
  publicKey: string | null;
}

export const PortfolioHistory: React.FC<PortfolioHistoryProps> = ({
  balance,
  history,
  network,
  publicKey,
}) => {
  const [filterGame, setFilterGame] = useState<string>('all');
  const [oracle, setOracle] = useState<PriceOracleData>({
    solPriceUsd: 195.4,
    lastUpdatedMs: Date.now(),
    source: 'Jupiter v2',
    confidence: 0.99,
  });

  const [launchedTokens, setLaunchedTokens] = useState<LaunchedSPLToken[]>([]);
  const [selectedShareTx, setSelectedShareTx] = useState<BetTransactionRecord | null>(null);

  // Fetch real live price from Jupiter/Pyth oracles
  useEffect(() => {
    fetchRealSolPrice().then(setOracle);
    setLaunchedTokens(tokenLaunchService.getLaunchedTokens());
  }, []);

  const totalWagered = history.reduce((acc, h) => acc + h.betAmount, 0);
  const totalPayout = history.reduce((acc, h) => acc + (h.payout || 0), 0);
  const netProfit = totalPayout - totalWagered;
  const winsCount = history.filter((h) => h.status === 'won').length;
  const winRate = history.length > 0 ? ((winsCount / history.length) * 100).toFixed(1) : '0.0';
  const highestMult = history.reduce((max, h) => Math.max(max, h.multiplier || 0), 0);

  // Filter list
  const filteredHistory =
    filterGame === 'all'
      ? history
      : history.filter((h) => h.game.toLowerCase().includes(filterGame.toLowerCase()));

  // Export CSV function
  const handleExportCSV = () => {
    sound.playChipClick();
    const headers = 'ID,Game,BetAmountSOL,PayoutSOL,Multiplier,Status,Timestamp,Signature,Details\n';
    const rows = history
      .map(
        (h) =>
          `"${h.id}","${h.game}",${h.betAmount},${h.payout},${h.multiplier},"${h.status}",${new Date(
            h.timestamp
          ).toISOString()},"${h.signature}","${h.details || ''}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `solstice_bet_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenShare = (tx: BetTransactionRecord) => {
    sound.playChipClick();
    setSelectedShareTx(tx);
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Token Balances (Real Price Oracle + Launched Tokens) */}
      <div className="cyber-glass rounded-2xl p-6 border border-cyan-500/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold font-display text-white">
              Solana On-Chain Portfolio Balances
            </h2>
          </div>
          <span className="font-mono text-xs text-slate-400">
            Oracle: <span className="text-emerald-400 font-bold">{oracle.source}</span> (1 SOL ≈ ${oracle.solPriceUsd.toFixed(2)} USD)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Native SOL */}
          <div className="p-4 bg-slate-900/80 rounded-xl border border-cyan-500/30">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-bold text-white">SOL (Native)</span>
              <span className="text-[10px] text-cyan-400 font-mono">Live Pyth/Jupiter</span>
            </div>
            <div className="font-mono text-xl font-bold text-cyan-300">
              {balance.toFixed(4)} SOL
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              ≈ ${(balance * oracle.solPriceUsd).toFixed(2)} USD
            </div>
          </div>

          {/* USDC */}
          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-bold text-blue-300">USDC (SPL)</span>
              <span className="text-[10px] text-slate-400 font-mono">Stable</span>
            </div>
            <div className="font-mono text-xl font-bold text-white">
              {(balance * oracle.solPriceUsd).toFixed(2)} USDC
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              ≈ ${(balance * oracle.solPriceUsd).toFixed(2)} USD
            </div>
          </div>

          {/* Launched SPL Tokens List */}
          {launchedTokens.slice(0, 2).map((tok) => (
            <div key={tok.mintAddress} className="p-4 bg-slate-900/80 rounded-xl border border-purple-500/40">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-bold text-purple-300">${tok.symbol} (SPL)</span>
                <span className="text-[10px] text-purple-400 font-mono">Newly Minted</span>
              </div>
              <div className="font-mono text-xl font-bold text-white">
                {tok.initialSupply.toLocaleString()} {tok.symbol}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center justify-between">
                <span>Creator Token</span>
                <span className="text-pink-400 font-bold">♥ {tok.likesCount} Likes</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lifetime Betting Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="cyber-glass rounded-xl p-4 border border-cyan-500/20 text-center">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
            Total Wager Volume
          </span>
          <span className="font-mono text-lg font-bold text-white">
            {totalWagered.toFixed(4)} SOL
          </span>
        </div>

        <div className="cyber-glass rounded-xl p-4 border border-cyan-500/20 text-center">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
            Net Profit / Loss
          </span>
          <span
            className={`font-mono text-lg font-bold ${
              netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {netProfit >= 0 ? '+' : ''}
            {netProfit.toFixed(4)} SOL
          </span>
        </div>

        <div className="cyber-glass rounded-xl p-4 border border-cyan-500/20 text-center">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
            Lifetime Win Rate
          </span>
          <span className="font-mono text-lg font-bold text-cyan-300">{winRate}%</span>
        </div>

        <div className="cyber-glass rounded-xl p-4 border border-cyan-500/20 text-center">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
            Highest Multiplier Hit
          </span>
          <span className="font-mono text-lg font-bold text-yellow-300">
            {highestMult.toFixed(2)}x
          </span>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="cyber-glass rounded-2xl p-6 border border-cyan-500/20 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold font-display text-white">
              On-Chain Transaction & Bet History
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 font-mono text-[10px] border border-cyan-500/40">
              {history.length} Logs
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterGame}
              onChange={(e) => setFilterGame(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="all">All 10 Games</option>
              <option value="roulette">Neon Roulette</option>
              <option value="blackjack">Chrome Blackjack</option>
              <option value="slot">Slot Cascade</option>
              <option value="dice">Dice Dynasty</option>
              <option value="crash">Crash Rocket</option>
              <option value="keno">Keno Nova</option>
              <option value="baccarat">Baccarat Flash</option>
              <option value="poker">Poker Hold'em</option>
              <option value="wheel">Wheel of Sol</option>
              <option value="mines">Mines & Treasure</option>
            </select>

            <button
              onClick={handleExportCSV}
              disabled={history.length === 0}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-cyan-300 font-medium rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>

        {filteredHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800/80 text-[11px]">
                  <th className="pb-2.5 font-semibold">Game</th>
                  <th className="pb-2.5 font-semibold">Bet Amount</th>
                  <th className="pb-2.5 font-semibold">Payout</th>
                  <th className="pb-2.5 font-semibold">Multiplier</th>
                  <th className="pb-2.5 font-semibold">Details</th>
                  <th className="pb-2.5 font-semibold">Time</th>
                  <th className="pb-2.5 font-semibold">Promo Share</th>
                  <th className="pb-2.5 font-semibold text-right">Solana Tx</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredHistory.slice().reverse().map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 font-semibold text-white">{tx.game}</td>
                    <td className="py-3 text-slate-300">{tx.betAmount.toFixed(4)} SOL</td>
                    <td className="py-3">
                      <span
                        className={`font-bold ${
                          tx.status === 'won' ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        {tx.payout > 0 ? `+${tx.payout.toFixed(4)} SOL` : '0.0000 SOL'}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          tx.multiplier > 1
                            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                            : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        {tx.multiplier}x
                      </span>
                    </td>
                    <td className="py-3 text-slate-400 text-[11px] max-w-xs truncate">
                      {tx.details || '-'}
                    </td>
                    <td className="py-3 text-slate-400 text-[11px]">
                      {new Date(tx.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => handleOpenShare(tx)}
                        className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 text-[11px] font-bold transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Promo</span>
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <a
                        href={`https://explorer.solana.com/tx/${tx.signature}?cluster=${network}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-[11px]"
                      >
                        <span>{tx.signature.slice(0, 4)}...{tx.signature.slice(-4)}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs font-mono">
            No transactions recorded yet. Place your first bet to log on-chain telemetry.
          </div>
        )}
      </div>

      {/* Slide-In Social Shareable Result & Solana Blink Modal */}
      {selectedShareTx && (
        <ShareableResult
          isOpen={true}
          onClose={() => setSelectedShareTx(null)}
          gameName={selectedShareTx.game}
          multiplier={selectedShareTx.multiplier}
          winAmountSol={selectedShareTx.payout}
          betAmountSol={selectedShareTx.betAmount}
          publicKey={publicKey}
          signature={selectedShareTx.signature}
        />
      )}
    </div>
  );
};
