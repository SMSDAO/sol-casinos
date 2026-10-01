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
  Clock,
  Award,
  Star,
  CheckCircle2,
  ExternalLink,
  Code,
  Shield,
} from 'lucide-react';
import {
  rewardsService,
  DailyMission,
  StreakDay,
  PlayerBadge,
  ReferralData,
} from '../services/rewards';
import { metaplexMintService, MintedNftRecord } from '../services/metaplexMint';
import { sound } from '../utils/audio';

interface MissionsRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  publicKey: string | null;
  onRewardClaimed: (amountSol: number, label: string) => void;
  initialTab?: 'missions' | 'streaks' | 'badges' | 'referrals';
}

export const MissionsRewardsModal: React.FC<MissionsRewardsModalProps> = ({
  isOpen,
  onClose,
  publicKey,
  onRewardClaimed,
  initialTab = 'missions',
}) => {
  const [activeTab, setActiveTab] = useState<'missions' | 'streaks' | 'badges' | 'referrals'>(initialTab);
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [streakData, setStreakData] = useState<{
    currentStreak: number;
    streakCalendar: StreakDay[];
    canClaimToday: boolean;
    lastClaimDate: string;
    daysUntilReset: number;
  }>({
    currentStreak: 1,
    streakCalendar: [],
    canClaimToday: true,
    lastClaimDate: '',
    daysUntilReset: 6,
  });
  const [badges, setBadges] = useState<PlayerBadge[]>([]);
  const [equippedBadge, setEquippedBadge] = useState<PlayerBadge | null>(null);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [resetCountdown, setResetCountdown] = useState<string>('');

  // Metaplex NFT Minting state
  const [mintingBadgeId, setMintingBadgeId] = useState<string | null>(null);
  const [mintedNftModalRecord, setMintedNftModalRecord] = useState<MintedNftRecord | null>(null);
  const [mintError, setMintError] = useState<string | null>(null);

  const [inputRefCode, setInputRefCode] = useState('');
  const [refMessage, setRefMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const loadData = () => {
    setMissions(rewardsService.getMissions());
    setStreakData(rewardsService.getStreakData());
    setBadges(rewardsService.getBadges());
    setEquippedBadge(rewardsService.getEquippedBadge());
    setReferralData(rewardsService.getReferralData(publicKey));
    setResetCountdown(rewardsService.getTimeUntilDailyReset().formatted);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setActiveTab(initialTab);
      const unsubscribe = rewardsService.subscribe(() => {
        loadData();
      });

      // 1-second countdown interval
      const timer = setInterval(() => {
        setResetCountdown(rewardsService.getTimeUntilDailyReset().formatted);
      }, 1000);

      return () => {
        unsubscribe();
        clearInterval(timer);
      };
    }
  }, [isOpen, initialTab, publicKey]);

  if (!isOpen || !referralData) return null;

  // Claim Daily Mission Reward
  const handleClaimMission = (missionId: string, rewardSol: number, title: string) => {
    sound.playWin();
    const result = rewardsService.claimMissionReward(missionId);
    if (result.rewardSol > 0) {
      confetti({ particleCount: 75, spread: 65 });
      const badgeText = result.unlockedBadge ? ` + Unlocked Badge: ${result.unlockedBadge.name}!` : '';
      onRewardClaimed(result.rewardSol, `Mission: ${title}${badgeText}`);
      loadData();
    }
  };

  // Claim Streak Reward
  const handleClaimStreak = () => {
    sound.playJackpot();
    const res = rewardsService.claimTodayStreak();
    if (res.success) {
      confetti({ particleCount: 90, spread: 80 });
      const badgeText = res.unlockedBadge ? ` + Unlocked ${res.unlockedBadge.name}!` : '';
      onRewardClaimed(res.rewardSol, `Day ${streakData.currentStreak} Streak Reward${badgeText}`);
      loadData();
    }
  };

  // Equip / Unequip Badge
  const handleEquipBadge = (badge: PlayerBadge) => {
    sound.playChipClick();
    if (equippedBadge?.id === badge.id) {
      localStorage.removeItem('solstice_equipped_badge');
      setEquippedBadge(null);
    } else {
      rewardsService.equipBadge(badge.id);
      setEquippedBadge(badge);
      confetti({ particleCount: 40, spread: 45 });
    }
  };

  // Mint Metaplex NFT for Achievement Badge
  const handleMintBadgeNft = async (badge: PlayerBadge) => {
    if (!badge.unlocked) return;
    setMintingBadgeId(badge.id);
    setMintError(null);
    sound.playChipClick();

    const res = await metaplexMintService.mintBadgeAsNft(badge, publicKey);
    setMintingBadgeId(null);

    if (res.success && res.record) {
      sound.playJackpot();
      confetti({ particleCount: 120, spread: 95 });
      setMintedNftModalRecord(res.record);
      loadData();
    } else {
      setMintError(res.error || 'Failed to mint Metaplex NFT.');
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

  const handleClaimCommission = () => {
    sound.playWin();
    const amount = rewardsService.claimReferralCommissions(publicKey);
    if (amount > 0) {
      confetti({ particleCount: 75, spread: 65 });
      onRewardClaimed(amount, 'Referral Commission');
      loadData();
    }
  };

  const copyRefCode = () => {
    sound.playChipClick();
    navigator.clipboard.writeText(referralData.myReferralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyShareLink = () => {
    sound.playChipClick();
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://solstice-roulette.app';
    const link = `${origin}/?ref=${referralData.myReferralCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const pendingMissionsCount = missions.filter((m) => m.completed && !m.claimed).length;
  const unlockedBadgesCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl cyber-glass-glow rounded-3xl p-5 sm:p-6 border border-cyan-500/40 text-slate-100 shadow-2xl max-h-[92vh] flex flex-col font-mono relative overflow-hidden bg-[#060813]/95">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600 p-0.5 shadow-lg shadow-yellow-950">
              <div className="w-full h-full bg-[#060813] rounded-[10px] flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-wider">
                  SOLSTICE REWARDS & METAPLEX NFTS
                </h2>
                {equippedBadge && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-[10px] text-cyan-300 font-bold">
                    <span>{equippedBadge.icon}</span>
                    <span>{equippedBadge.name}</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Daily missions, consecutive streaks, on-chain Metaplex NFT achievement minting & VIP referrals
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playChipClick();
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4-Tab Navigation Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 shrink-0">
          <button
            onClick={() => {
              sound.playChipClick();
              setActiveTab('missions');
            }}
            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'missions'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-950/60'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Daily Missions</span>
            {pendingMissionsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white font-extrabold text-[10px]">
                {pendingMissionsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sound.playChipClick();
              setActiveTab('streaks');
            }}
            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'streaks'
                ? 'bg-orange-500/20 border-orange-400 text-orange-200 shadow-md shadow-orange-950/60'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>Streak Rewards</span>
            {streakData.canClaimToday && (
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => {
              sound.playChipClick();
              setActiveTab('badges');
            }}
            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'badges'
                ? 'bg-purple-500/20 border-purple-400 text-purple-200 shadow-md shadow-purple-950/60'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-purple-400" />
            <span>Badges & NFTs ({unlockedBadgesCount}/{badges.length})</span>
          </button>

          <button
            onClick={() => {
              sound.playChipClick();
              setActiveTab('referrals');
            }}
            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'referrals'
                ? 'bg-blue-500/20 border-blue-400 text-blue-200 shadow-md shadow-blue-950/60'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>VIP Referrals</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-4">
          {/* TAB 1: DAILY MISSIONS */}
          {activeTab === 'missions' && (
            <div className="space-y-4">
              {/* Reset Banner */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Daily Objectives Refresh at 00:00 UTC
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Complete objectives below to claim instant SOL bonuses & unlock unique collectible badges!
                    </span>
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-cyan-500/30 flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Reset In:</span>
                  <span className="text-xs font-mono font-extrabold text-cyan-300">
                    {resetCountdown || '24h 00m 00s'}
                  </span>
                </div>
              </div>

              {/* Missions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {missions.map((mission) => {
                  const progressPct = Math.min(100, Math.round((mission.currentProgress / mission.targetCount) * 100));
                  return (
                    <div
                      key={mission.id}
                      className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between space-y-3 ${
                        mission.completed && !mission.claimed
                          ? 'bg-gradient-to-br from-cyan-950/80 via-slate-900 to-emerald-950/80 border-cyan-400/80 shadow-lg shadow-cyan-950/80'
                          : mission.claimed
                          ? 'bg-slate-950/60 border-slate-800/80 opacity-70'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{mission.icon}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-white">{mission.title}</h4>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-bold">
                                  {mission.gameCategory}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">{mission.description}</p>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-slate-400">Progress</span>
                            <span className="text-cyan-300 font-bold">
                              {mission.currentProgress} / {mission.targetCount} ({progressPct}%)
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>

                        {/* Reward & Badge Preview */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px]">
                          <span className="px-2 py-0.5 rounded-lg bg-yellow-950/80 border border-yellow-500/40 text-yellow-300 font-bold flex items-center gap-1">
                            <Coins className="w-3 h-3 text-yellow-400" />
                            <span>+{mission.rewardSol.toFixed(3)} SOL</span>
                          </span>

                          {mission.badgeName && (
                            <span className="px-2 py-0.5 rounded-lg bg-purple-950/80 border border-purple-500/40 text-purple-300 font-bold flex items-center gap-1">
                              <Award className="w-3 h-3 text-purple-400" />
                              <span>{mission.badgeName}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div>
                        {mission.claimed ? (
                          <button
                            disabled
                            className="w-full py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 text-xs font-bold cursor-not-allowed flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>Claimed</span>
                          </button>
                        ) : mission.completed ? (
                          <button
                            onClick={() => handleClaimMission(mission.id, mission.rewardSol, mission.title)}
                            className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-emerald-600 hover:from-cyan-400 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-cyan-950 flex items-center justify-center gap-1.5 transition-transform active:scale-95 animate-pulse"
                          >
                            <Gift className="w-4 h-4 text-yellow-300" />
                            <span>Claim +{mission.rewardSol.toFixed(3)} SOL</span>
                          </button>
                        ) : (
                          <div className="w-full py-2 rounded-xl bg-slate-950/80 border border-slate-800/80 text-slate-500 text-xs font-bold text-center">
                            In Progress
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: 7-DAY STREAK REWARDS */}
          {activeTab === 'streaks' && (
            <div className="space-y-4">
              {/* Streak Hero Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-orange-950/60 via-slate-900 to-amber-950/60 border border-orange-500/40 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 z-10">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/20 border border-orange-400 flex items-center justify-center shadow-lg shadow-orange-950 shrink-0">
                    <Flame className="w-8 h-8 text-orange-400 animate-bounce" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl sm:text-2xl font-black text-white">
                        {streakData.currentStreak} DAY STREAK
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-orange-950 border border-orange-500/40 text-[10px] text-orange-300 font-bold uppercase">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Log in and place a wager daily to keep your multiplier burning. Don't let the flame die!
                    </p>
                  </div>
                </div>

                <div className="z-10 w-full sm:w-auto">
                  {streakData.canClaimToday ? (
                    <button
                      onClick={handleClaimStreak}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-extrabold text-xs shadow-xl shadow-orange-950 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                      <Gift className="w-4 h-4 text-yellow-200" />
                      <span>Claim Day {streakData.currentStreak} Reward</span>
                    </button>
                  ) : (
                    <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 font-bold text-center">
                      Claimed Today • Next in {resetCountdown}
                    </div>
                  )}
                </div>
              </div>

              {/* 7 Days Interactive Calendar Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                {streakData.streakCalendar.map((item) => {
                  const isPast = item.day < streakData.currentStreak;
                  const isCurrent = item.day === streakData.currentStreak;
                  return (
                    <div
                      key={item.day}
                      className={`p-3 rounded-2xl border text-center relative overflow-hidden flex flex-col justify-between space-y-2 transition-all ${
                        isCurrent
                          ? 'bg-gradient-to-b from-orange-950/80 to-slate-900 border-orange-400 shadow-md shadow-orange-950'
                          : isPast
                          ? 'bg-slate-950/80 border-emerald-500/40'
                          : 'bg-slate-900/40 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className={isCurrent ? 'text-orange-300' : 'text-slate-400'}>
                          Day {item.day}
                        </span>
                        {isPast ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : isCurrent ? (
                          <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                        ) : (
                          <span className="text-[9px] text-slate-600">Locked</span>
                        )}
                      </div>

                      <div className="py-1">
                        <span className="text-xs font-black text-yellow-300 block font-mono">
                          +{item.rewardSol.toFixed(3)} SOL
                        </span>
                        {item.badgeName && (
                          <span className="text-[9px] text-purple-300 font-bold block truncate mt-0.5">
                            🏅 {item.badgeName}
                          </span>
                        )}
                      </div>

                      <div className="text-[8px] text-slate-400 truncate border-t border-slate-800 pt-1">
                        {item.perk || 'Streak Multiplier'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: UNIQUE BADGES & METAPLEX NFT MINTING */}
          {activeTab === 'badges' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div>
                  <span className="text-xs font-bold text-white block">Metaplex NFT Achievement Badges</span>
                  <p className="text-[10px] text-slate-400">
                    Mint your unlocked achievement badges into verified on-chain Metaplex NFTs with custom Arweave metadata.
                  </p>
                </div>
                {equippedBadge && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/80 border border-purple-500/50">
                    <span className="text-lg">{equippedBadge.icon}</span>
                    <div>
                      <span className="text-[9px] text-purple-300 font-bold uppercase block">Equipped Badge:</span>
                      <span className="text-xs font-extrabold text-white">{equippedBadge.name}</span>
                    </div>
                  </div>
                )}
              </div>

              {mintError && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-500 text-red-200 text-xs font-bold">
                  {mintError}
                </div>
              )}

              {/* Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {badges.map((badge) => {
                  const isEquipped = equippedBadge?.id === badge.id;
                  const isMinted = metaplexMintService.isMinted(badge.id);
                  const isMinting = mintingBadgeId === badge.id;
                  const nftRecord = metaplexMintService.getRecord(badge.id);

                  return (
                    <div
                      key={badge.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 relative overflow-hidden ${
                        badge.unlocked
                          ? isEquipped
                            ? 'bg-slate-900/90 border-purple-400 shadow-lg shadow-purple-950'
                            : 'bg-slate-900/70 border-slate-700 hover:border-slate-500'
                          : 'bg-slate-950/40 border-slate-900 opacity-50 grayscale'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-3xl p-1 rounded-xl bg-slate-950 border border-slate-800 inline-block">
                            {badge.icon}
                          </span>
                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase ${
                                badge.rarity === 'Legendary'
                                  ? 'bg-yellow-950 text-yellow-300 border-yellow-500/50'
                                  : badge.rarity === 'Epic'
                                  ? 'bg-purple-950 text-purple-300 border-purple-500/50'
                                  : 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                              }`}
                            >
                              {badge.rarity}
                            </span>
                            {isMinted && (
                              <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-extrabold flex items-center gap-0.5">
                                <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                                <span>NFT Minted</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-white">{badge.name}</h4>
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{badge.description}</p>
                        </div>

                        <div className="pt-1 text-[9px] text-emerald-400 font-bold border-t border-slate-800">
                          ⚡ Perk: {badge.perk}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-1.5 pt-2">
                        {badge.unlocked ? (
                          <>
                            <button
                              onClick={() => handleEquipBadge(badge)}
                              className={`w-full py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                isEquipped
                                  ? 'bg-purple-950 border-purple-400 text-purple-200'
                                  : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-white'
                              }`}
                            >
                              {isEquipped ? 'EQUIPPED ✓' : 'Equip Badge'}
                            </button>

                            {isMinted ? (
                              <button
                                onClick={() => nftRecord && setMintedNftModalRecord(nftRecord)}
                                className="w-full py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] flex items-center justify-center gap-1 transition-all"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>View Metaplex NFT</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleMintBadgeNft(badge)}
                                disabled={isMinting}
                                className="w-full py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-50 text-white font-extrabold text-[11px] flex items-center justify-center gap-1 shadow-md transition-all active:scale-95 animate-pulse"
                              >
                                <Sparkles className="w-3 h-3 text-yellow-300" />
                                <span>{isMinting ? 'Minting NFT...' : 'Mint Metaplex NFT'}</span>
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="w-full py-1.5 rounded-xl bg-slate-950/80 border border-slate-900 text-[10px] text-slate-600 font-bold text-center">
                            Locked (Complete Goal)
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: VIP REFERRAL VAULT */}
          {activeTab === 'referrals' && (
            <div className="space-y-4">
              {/* Referral Code & Commission Banner */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-slate-300 block">Your Exclusive Referral Code</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm text-cyan-300 font-bold tracking-wider">
                      {referralData.myReferralCode}
                    </div>
                    <button
                      onClick={copyRefCode}
                      className="px-3 py-2.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={copyShareLink}
                      className="px-3 py-2.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 text-purple-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                      <span>{copiedLink ? 'Copied' : 'Share'}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Earn <strong>50% lifetime house rake rebate</strong> on all wagers placed by your referees.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/40 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-xs font-bold text-emerald-300 block">Claimable Rake Commission</span>
                    <span className="text-2xl font-black text-white font-mono mt-1 block">
                      +{referralData.claimableCommissionSol.toFixed(4)} SOL
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Total earned to date: {referralData.totalRakebackEarnedSol.toFixed(4)} SOL
                    </span>
                  </div>

                  <button
                    onClick={handleClaimCommission}
                    disabled={referralData.claimableCommissionSol <= 0}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950 transition-all"
                  >
                    <Coins className="w-4 h-4 text-yellow-300" />
                    <span>Claim Rake Commission</span>
                  </button>
                </div>
              </div>

              {/* Bind Friend's Code */}
              {!referralData.referredByCode && (
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-slate-300 block">
                    Have a Friend's Referral Code? (Claim +0.025 SOL Welcome Bonus)
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inputRefCode}
                      onChange={(e) => setInputRefCode(e.target.value)}
                      placeholder="e.g. SOLSTICE-SOL2026"
                      className="flex-1 p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                    />
                    <button
                      onClick={handleBindCode}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                    >
                      Bind Code
                    </button>
                  </div>
                  {refMessage && (
                    <span
                      className={`text-[10px] font-bold block ${
                        refMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {refMessage.text}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Metaplex NFT Mint Success / Details Modal */}
      {mintedNftModalRecord && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md cyber-glass-glow rounded-3xl p-5 border border-purple-500/50 bg-[#070b19] text-slate-100 shadow-2xl space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-purple-500/30 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400 animate-spin" />
                <h3 className="text-sm font-black text-white">Metaplex NFT Minted Successfully!</h3>
              </div>
              <button
                onClick={() => setMintedNftModalRecord(null)}
                className="w-7 h-7 rounded-xl bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase block">NFT Mint Address</span>
                <span className="font-bold text-cyan-300 break-all">{mintedNftModalRecord.mintAddress}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase block">Solana Transaction Signature</span>
                <span className="font-bold text-purple-300 break-all text-[11px]">{mintedNftModalRecord.signature}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase block">Metaplex Standard Metadata JSON</span>
                <pre className="text-[10px] text-emerald-300 bg-slate-950 p-2 rounded overflow-x-auto max-h-[110px]">
                  {JSON.stringify(mintedNftModalRecord.metadataJson, null, 2)}
                </pre>
              </div>

              <a
                href={mintedNftModalRecord.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <ExternalLink className="w-4 h-4" />
                <span>View on Solana Explorer</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
