import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Trophy,
  Users,
  Flame,
  Calendar,
  Gift,
  Check,
  Copy,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  Coins,
  Crown,
  Share2,
} from 'lucide-react';
import {
  rewardsService,
  DailyMission,
  StreakDay,
  ReferralData,
} from '../services/rewards';
import { sound } from '../utils/audio';

interface MissionsRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  publicKey: string | null;
  onRewardClaimed: (amountSol: number, label: string) => void;
  initialTab?: 'missions' | 'referrals';
}

export const MissionsRewardsModal: React.FC<MissionsRewardsModalProps> = ({
  isOpen,
  onClose,
  publicKey,
  onRewardClaimed,
  initialTab = 'missions',
}) => {
  const [activeTab, setActiveTab] = useState<'missions' | 'referrals'>(initialTab);
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [streakData, setStreakData] = useState<{
    currentStreak: number;
    streakCalendar: StreakDay[];
    canClaimToday: boolean;
  }>({ currentStreak: 1, streakCalendar: [], canClaimToday: true });
  const [referralData, setReferralData] = useState<ReferralData | null>(null);

  const [inputRefCode, setInputRefCode] = useState('');
  const [refMessage, setRefMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const loadData = () => {
    setMissions(rewardsService.getMissions());
    setStreakData(rewardsService.getStreakData());
    setReferralData(rewardsService.getReferralData(publicKey));
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab, publicKey]);

  if (!isOpen || !referralData) return null;

  // Claim Daily Mission Reward
  const handleClaimMission = (missionId: string, rewardSol: number, title: string) => {
    sound.playWin();
    const claimed = rewardsService.claimMissionReward(missionId);
    if (claimed > 0) {
      confetti({ particleCount: 70, spread: 60 });
      onRewardClaimed(claimed, `Mission: ${title}`);
      loadData();
    }
  };

  // Claim Streak Reward
  const handleClaimStreak = () => {
    sound.playJackpot();
    const res = rewardsService.claimTodayStreak();
    if (res.success) {
      confetti({ particleCount: 90, spread: 80 });
      onRewardClaimed(res.rewardSol, `Day ${streakData.currentStreak} Streak Reward`);
      loadData();
    }
  };

  // Bind Referral Code
  const handleBindCode = () => {
    sound.playChipClick();
    setRefMessage(null);
    if (!inputRefCode.trim()) return;

    const res = rewardsService.bindReferralCode(inputRefCode.trim(), publicKey);
    if (res.success) {
      sound.playWin();
      confetti({ particleCount: 80, spread: 70 });
      onRewardClaimed(res.bonusSol, `Referral Welcome Bonus (${inputRefCode})`);
      setRefMessage({
        type: 'success',
        text: `Referral code applied! +${res.bonusSol} SOL welcome bonus credited and 50% rake rebate activated.`,
      });
      setInputRefCode('');
      loadData();
    } else {
      setRefMessage({
        type: 'error',
        text: res.error || 'Failed to bind referral code.',
      });
    }
  };

  // Claim Referral Commission
  const handleClaimCommission = () => {
    sound.playCashout();
    const claimed = rewardsService.claimReferralCommissions(publicKey);
    if (claimed > 0) {
      confetti({ particleCount: 80, spread: 70 });
      onRewardClaimed(claimed, 'Referral Commissions & Rakeback');
      loadData();
    }
  };

  const copyCode = () => {
    sound.playChipClick();
    navigator.clipboard.writeText(referralData.myReferralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = () => {
    sound.playChipClick();
    const shareUrl = `${window.location.origin}?ref=${referralData.myReferralCode}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const completedUnclaimedCount = missions.filter((m) => m.completed && !m.claimed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-3xl cyber-glass-glow rounded-2xl p-6 relative text-slate-100 shadow-2xl border border-cyan-500/40 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950">
              <Gift className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display tracking-wide text-white">
                Missions, Streaks & Referral Vault
              </h2>
              <p className="text-xs text-slate-400">
                Earn Free SOL, VIP Rakeback, and Compound Your Bankroll
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

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/90 rounded-xl border border-slate-700/60 mb-5 text-xs font-medium">
          <button
            onClick={() => {
              sound.playChipClick();
              setActiveTab('missions');
            }}
            className={`py-2 px-3 rounded-lg transition-all text-center flex items-center justify-center gap-2 ${
              activeTab === 'missions'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4 text-cyan-400" />
            <span>Daily Missions & 7-Day Streak</span>
            {completedUnclaimedCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-orange-500 text-white font-mono text-[10px] font-bold flex items-center justify-center animate-bounce">
                {completedUnclaimedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sound.playChipClick();
              setActiveTab('referrals');
            }}
            className={`py-2 px-3 rounded-lg transition-all text-center flex items-center justify-center gap-2 ${
              activeTab === 'referrals'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-400 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4 text-purple-400" />
            <span>Referral Program & Rakeback</span>
            {referralData.claimableCommissionSol > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-purple-900 text-purple-200 font-mono text-[10px] font-bold border border-purple-400/50">
                +{referralData.claimableCommissionSol.toFixed(3)} SOL
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: Daily Missions & 7-Day Streak */}
        {activeTab === 'missions' && (
          <div className="space-y-6">
            {/* 7-Day Consecutive Streak Calendar */}
            <div className="p-4 bg-slate-900/80 rounded-2xl border border-orange-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400 animate-bounce" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    7-Day Login & Wagering Streak ({streakData.currentStreak}/7 Days)
                  </span>
                </div>

                <button
                  disabled={!streakData.canClaimToday}
                  onClick={handleClaimStreak}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
                    streakData.canClaimToday
                      ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:opacity-90 text-white animate-pulse'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {streakData.canClaimToday
                    ? `Claim Day ${streakData.currentStreak} Reward`
                    : 'Claimed Today ✓'}
                </button>
              </div>

              {/* 7 Days Grid */}
              <div className="grid grid-cols-7 gap-1.5 font-mono text-xs">
                {streakData.streakCalendar.map((s) => (
                  <div
                    key={s.day}
                    className={`p-2 rounded-xl border text-center flex flex-col justify-between min-h-[72px] transition-all ${
                      s.isToday
                        ? 'bg-orange-950/80 border-orange-400 text-white ring-2 ring-orange-500 shadow-lg shadow-orange-950/50'
                        : s.claimed
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] text-slate-400 block font-sans">Day {s.day}</span>
                    <span className="font-bold text-white text-xs block my-0.5">
                      +{s.rewardSol} SOL
                    </span>
                    {s.claimed ? (
                      <span className="text-[10px] text-emerald-400 font-bold">✓ Done</span>
                    ) : s.perk ? (
                      <span className="text-[9px] text-yellow-300 font-sans truncate" title={s.perk}>
                        ★ {s.perk}
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-500">Pending</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Missions List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  Active Daily Missions (Resets in 18h 42m)
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {missions.filter((m) => m.claimed).length}/{missions.length} Claimed
                </span>
              </div>

              <div className="space-y-2.5">
                {missions.map((m) => {
                  const progressPct = Math.min(100, (m.currentProgress / m.targetCount) * 100);
                  return (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                        m.claimed
                          ? 'bg-slate-900/40 border-slate-800/80 opacity-60'
                          : m.completed
                          ? 'bg-gradient-to-r from-emerald-950/60 to-cyan-950/40 border-emerald-500/60 shadow-lg shadow-emerald-950/40'
                          : 'bg-slate-900/80 border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{m.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{m.title}</span>
                            <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/40">
                              +{m.rewardSol} SOL
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5">{m.description}</p>
                          {/* Progress Meter */}
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="w-28 sm:w-40 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300"
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">
                              {m.currentProgress}/{m.targetCount}
                            </span>
                          </div>
                        </div>
                      </div>

                      {m.claimed ? (
                        <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-semibold">
                          Claimed ✓
                        </span>
                      ) : m.completed ? (
                        <button
                          onClick={() => handleClaimMission(m.id, m.rewardSol, m.title)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-950 flex items-center gap-1.5 animate-pulse shrink-0"
                        >
                          <Gift className="w-3.5 h-3.5" />
                          <span>Claim +{m.rewardSol} SOL</span>
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 text-xs font-mono shrink-0">
                          In Progress
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Referral Program & Rakeback */}
        {activeTab === 'referrals' && (
          <div className="space-y-6">
            {/* Unique Referral Code & Invite Banner */}
            <div className="p-4 bg-gradient-to-br from-purple-950/80 via-slate-900/90 to-indigo-950/80 rounded-2xl border border-purple-500/40 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 block">
                    Your Unique Referral Identity
                  </span>
                  <div className="font-mono text-lg font-black text-white flex items-center gap-2 mt-0.5">
                    <span>{referralData.myReferralCode}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-400/40 font-sans font-semibold">
                      Tier: {referralData.referralTier} (15% Rake)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copyCode}
                    className="px-3 py-1.5 bg-purple-900/80 hover:bg-purple-800 border border-purple-400/50 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition-all"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                  </button>
                  <button
                    onClick={copyLink}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-md shadow-purple-950 transition-all"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Link Copied!' : 'Share Link'}</span>
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed border-t border-purple-500/20 pt-2">
                Invite friends with your link. When they place their first bet, you instantly earn a <strong className="text-purple-300">0.05 SOL Bonus</strong> + <strong className="text-purple-300">15% Lifetime Rakeback</strong> from every wager!
              </p>
            </div>

            {/* Claimable Commission Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-700/60 text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Active Referred Players
                </span>
                <span className="font-mono text-xl font-bold text-white">
                  {referralData.totalReferees} Players
                </span>
              </div>

              <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-700/60 text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Lifetime Rakeback Earned
                </span>
                <span className="font-mono text-xl font-bold text-emerald-400">
                  {referralData.totalRakebackEarnedSol.toFixed(4)} SOL
                </span>
              </div>

              <div className="p-3.5 bg-purple-950/40 rounded-xl border border-purple-500/40 text-center flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-purple-300 uppercase tracking-wider block mb-1">
                    Claimable Commission
                  </span>
                  <span className="font-mono text-xl font-bold text-purple-200">
                    {referralData.claimableCommissionSol.toFixed(4)} SOL
                  </span>
                </div>
                <button
                  disabled={referralData.claimableCommissionSol <= 0}
                  onClick={handleClaimCommission}
                  className="mt-2 w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold disabled:opacity-50 transition-all shadow-md shadow-purple-950"
                >
                  Claim to Wallet
                </button>
              </div>
            </div>

            {/* Enter Referral Code (for New Users) */}
            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-700/60 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-white block">
                Have a Solstice Referral Code?
              </span>
              <p className="text-xs text-slate-300">
                Enter a sponsor's code to instantly claim <span className="text-emerald-400 font-bold">+0.025 SOL Welcome Bonus</span> and activate a 50% house edge rake discount on your bets.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputRefCode}
                  onChange={(e) => setInputRefCode(e.target.value)}
                  placeholder="e.g. SOLSTICE-ALPHA"
                  disabled={!!referralData.referredByCode}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-400 uppercase"
                />
                <button
                  disabled={!inputRefCode.trim() || !!referralData.referredByCode}
                  onClick={handleBindCode}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {referralData.referredByCode ? 'Code Applied ✓' : 'Apply Code'}
                </button>
              </div>

              {refMessage && (
                <div
                  className={`p-2.5 rounded-lg text-xs font-mono ${
                    refMessage.type === 'success'
                      ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                      : 'bg-red-950/80 border border-red-500/50 text-red-300'
                  }`}
                >
                  {refMessage.text}
                </div>
              )}
            </div>

            {/* Auditable Referee Ledger */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Auditable Referee Activity Ledger
              </span>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-900 text-slate-400 text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Referee Address</th>
                      <th className="p-2.5">Joined Date</th>
                      <th className="p-2.5">Wagering Volume</th>
                      <th className="p-2.5 text-right">Rakeback Commission</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                    {referralData.referralHistory.map((h, i) => (
                      <tr key={i} className="hover:bg-slate-900/40">
                        <td className="p-2.5 text-slate-200">{h.address}</td>
                        <td className="p-2.5 text-slate-400 text-[11px]">
                          {new Date(h.joinedAt).toLocaleDateString()}
                        </td>
                        <td className="p-2.5 text-cyan-300">{h.wagerVolumeSol.toFixed(2)} SOL</td>
                        <td className="p-2.5 text-right text-emerald-400 font-bold">
                          +{h.commissionGeneratedSol.toFixed(4)} SOL
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
