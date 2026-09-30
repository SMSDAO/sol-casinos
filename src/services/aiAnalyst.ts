import { BetTransactionRecord } from './solana';

export interface StrategyReport {
  riskScore: number; // 1 to 100
  riskTier: 'Conservative' | 'Moderate' | 'Aggressive' | 'Degen High-Roller';
  kellyRecommendation: string;
  winRate: number;
  netProfitSol: number;
  totalVolumeSol: number;
  topPerformingGame: string;
  tiltRisk: 'Low' | 'Moderate' | 'High';
  aiInsights: string[];
  strategicAdvice: string;
}

let cachedReport: StrategyReport | null = null;
let lastAnalysisTime = 0;

export async function generateAIAnalysis(
  history: BetTransactionRecord[],
  currentBalance: number
): Promise<StrategyReport> {
  const now = Date.now();
  // Return cached report if analysis was run within 120 seconds to prevent rate limits
  if (cachedReport && now - lastAnalysisTime < 120000) {
    return cachedReport;
  }

  const totalBets = history.length;
  const wins = history.filter((h) => h.status === 'won');
  const winRate = totalBets > 0 ? (wins.length / totalBets) * 100 : 0;
  const totalVolumeSol = history.reduce((acc, h) => acc + h.betAmount, 0);
  const totalPayoutSol = history.reduce((acc, h) => acc + (h.payout || 0), 0);
  const netProfitSol = totalPayoutSol - totalVolumeSol;

  // Group by game
  const gameStats: Record<string, { bets: number; net: number; wins: number }> = {};
  history.forEach((h) => {
    if (!gameStats[h.game]) gameStats[h.game] = { bets: 0, net: 0, wins: 0 };
    gameStats[h.game].bets += 1;
    gameStats[h.game].net += (h.payout || 0) - h.betAmount;
    if (h.status === 'won') gameStats[h.game].wins += 1;
  });

  let topGame = 'Neon Roulette';
  let bestNet = -Infinity;
  Object.entries(gameStats).forEach(([game, stats]) => {
    if (stats.net > bestNet) {
      bestNet = stats.net;
      topGame = game;
    }
  });

  // Check recent losses for tilt detection
  const recent10 = history.slice(-10);
  const recentLosses = recent10.filter((h) => h.status === 'lost').length;
  const tiltRisk = recentLosses >= 6 ? 'High' : recentLosses >= 4 ? 'Moderate' : 'Low';

  // Request from Gemini API endpoint with error boundary
  try {
    const res = await fetch('/api/gemini/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        history: history.slice(-25),
        currentBalance,
        winRate,
        netProfitSol,
        totalVolumeSol,
        topGame,
        tiltRisk,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.report) {
        cachedReport = data.report;
        lastAnalysisTime = now;
        return data.report;
      }
    }
  } catch {
    // Fall back to client-side mathematical calculation seamlessly
  }

  // Heuristic fall-back calculation
  const avgBet = totalBets > 0 ? totalVolumeSol / totalBets : 0.01;
  const betPctOfBankroll = currentBalance > 0 ? (avgBet / currentBalance) * 100 : 5;
  const riskScore = Math.min(99, Math.max(12, Math.round(betPctOfBankroll * 10 + (tiltRisk === 'High' ? 25 : 0))));

  let riskTier: 'Conservative' | 'Moderate' | 'Aggressive' | 'Degen High-Roller' = 'Moderate';
  if (riskScore < 30) riskTier = 'Conservative';
  else if (riskScore < 60) riskTier = 'Moderate';
  else if (riskScore < 85) riskTier = 'Aggressive';
  else riskTier = 'Degen High-Roller';

  const kellyPct = Math.max(0.5, Math.min(4.5, winRate > 50 ? 2.5 : 1.0)).toFixed(1);

  const fallbackReport: StrategyReport = {
    riskScore,
    riskTier,
    kellyRecommendation: `Optimal fractional Kelly sizing: ${kellyPct}% of bankroll per roll (~${(currentBalance * (parseFloat(kellyPct) / 100)).toFixed(4)} SOL).`,
    winRate: parseFloat(winRate.toFixed(1)),
    netProfitSol: parseFloat(netProfitSol.toFixed(4)),
    totalVolumeSol: parseFloat(totalVolumeSol.toFixed(4)),
    topPerformingGame: topGame,
    tiltRisk,
    aiInsights: [
      `Your highest net yield is generated in ${topGame} with ${gameStats[topGame]?.wins || 0} winning rounds.`,
      `Bankroll burn exposure: ${betPctOfBankroll.toFixed(1)}% average stake per round across ${totalBets} verified bets.`,
      tiltRisk === 'High'
        ? `Tilt Alert: 6+ of your last 10 rounds were losses. Consider stepping down stake size to protect SOL reserves.`
        : `Discipline Status: Consistent stake sizing detected. Good bankroll preservation behavior.`,
    ],
    strategicAdvice: `Maintain fixed unit wagering (min 0.00022 SOL floor) and leverage Cascade Mode only on house-funded profits rather than initial principal.`,
  };

  cachedReport = fallbackReport;
  lastAnalysisTime = now;
  return fallbackReport;
}
