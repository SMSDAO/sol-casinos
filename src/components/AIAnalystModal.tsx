import React, { useEffect, useState } from 'react';
import {
  X,
  BrainCircuit,
  TrendingUp,
  ShieldAlert,
  Zap,
  Flame,
  Award,
  RefreshCw,
  LineChart,
} from 'lucide-react';
import { BetTransactionRecord } from '../services/solana';
import { generateAIAnalysis, StrategyReport } from '../services/aiAnalyst';
import { sound } from '../utils/audio';

interface AIAnalystModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: BetTransactionRecord[];
  balance: number;
}

export const AIAnalystModal: React.FC<AIAnalystModalProps> = ({
  isOpen,
  onClose,
  history,
  balance,
}) => {
  const [report, setReport] = useState<StrategyReport | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalysis = async () => {
    setLoading(true);
    const rep = await generateAIAnalysis(history, balance);
    setReport(rep);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchAnalysis();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl cyber-glass-glow rounded-2xl p-6 relative text-slate-100 shadow-2xl border border-cyan-500/40 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950">
              <BrainCircuit className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display tracking-wide text-white">
                Solstice AI Portfolio & Strategy Analyst
              </h2>
              <p className="text-xs text-slate-400">
                Powered by Gemini 3.8 Flash · Real-Time Quant Risk & Kelly Criterion Optimization
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playChipClick();
                fetchAnalysis();
              }}
              title="Refresh AI Analysis"
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
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
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-cyan-300">
              Analyzing on-chain betting telemetry & Kelly curve...
            </p>
          </div>
        ) : report ? (
          <div className="space-y-5">
            {/* Top Score & Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-700/60 text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Risk Exposure Score
                </span>
                <span className="font-mono text-xl font-bold text-cyan-300">
                  {report.riskScore}/100
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{report.riskTier}</span>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-700/60 text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Win Rate (Tracked)
                </span>
                <span className="font-mono text-xl font-bold text-emerald-400">
                  {report.winRate}%
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Across {history.length} bets
                </span>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-700/60 text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Net Profit / Loss
                </span>
                <span
                  className={`font-mono text-xl font-bold ${
                    report.netProfitSol >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {report.netProfitSol >= 0 ? '+' : ''}
                  {report.netProfitSol} SOL
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Vol: {report.totalVolumeSol} SOL
                </span>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-700/60 text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Tilt Risk Alert
                </span>
                <span
                  className={`font-mono text-xl font-bold ${
                    report.tiltRisk === 'High'
                      ? 'text-red-400'
                      : report.tiltRisk === 'Moderate'
                      ? 'text-yellow-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {report.tiltRisk}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Streak Telemetry</span>
              </div>
            </div>

            {/* Kelly Recommendation Box */}
            <div className="p-4 bg-gradient-to-r from-cyan-950/70 via-blue-950/50 to-slate-900/80 rounded-xl border border-cyan-500/30 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                <LineChart className="w-4 h-4 text-cyan-400" />
                <span>Fractional Kelly Criterion Bet Sizing</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-mono">
                {report.kellyRecommendation}
              </p>
            </div>

            {/* AI Insights */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-yellow-400" />
                Quantitative Machine Intelligence Insights
              </h3>
              <div className="space-y-2">
                {report.aiInsights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-900/70 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Strategic Directive */}
            <div className="p-4 bg-orange-950/30 rounded-xl border border-orange-500/30 space-y-1">
              <span className="text-[11px] font-semibold text-orange-400 uppercase tracking-wider block">
                Lead Quantitative Directive
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">
                {report.strategicAdvice}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
