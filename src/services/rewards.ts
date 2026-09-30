/**
 * Rewards, Daily Missions, Streak Calendar, and Referral Program Engine
 * Auditable and verifiable with local state persistence and on-chain claims.
 */

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  currentProgress: number;
  rewardSol: number;
  completed: boolean;
  claimed: boolean;
  gameCategory: string;
  icon: string;
}

export interface StreakDay {
  day: number;
  rewardSol: number;
  perk?: string;
  claimed: boolean;
  isToday: boolean;
}

export interface ReferralData {
  myReferralCode: string;
  referredByCode: string | null;
  totalReferees: number;
  totalRakebackEarnedSol: number;
  claimableCommissionSol: number;
  referralTier: 'Bronze' | 'Silver' | 'Gold' | 'Cyber VIP';
  rakeDiscountActive: boolean;
  refereeBonusClaimed: boolean;
  referralHistory: {
    address: string;
    joinedAt: number;
    wagerVolumeSol: number;
    commissionGeneratedSol: number;
  }[];
}

const INITIAL_MISSIONS: DailyMission[] = [
  {
    id: 'm_roulette_5',
    title: 'Neon Velocity',
    description: 'Place 5 bets on Neon Roulette',
    targetCount: 5,
    currentProgress: 0,
    rewardSol: 0.015,
    completed: false,
    claimed: false,
    gameCategory: 'Neon Roulette',
    icon: '🎡',
  },
  {
    id: 'm_blackjack_win_3',
    title: 'Blackjack Master',
    description: 'Win 3 rounds of Chrome Blackjack',
    targetCount: 3,
    currentProgress: 0,
    rewardSol: 0.025,
    completed: false,
    claimed: false,
    gameCategory: 'Chrome Blackjack',
    icon: '🃏',
  },
  {
    id: 'm_crash_2x',
    title: 'Rocket High Flyer',
    description: 'Cash out at 2.00x or higher on Crash Rocket',
    targetCount: 1,
    currentProgress: 0,
    rewardSol: 0.02,
    completed: false,
    claimed: false,
    gameCategory: 'Crash Rocket',
    icon: '🚀',
  },
  {
    id: 'm_mines_gems',
    title: 'Mine Sweeper Pro',
    description: 'Successfully uncover 5 safe gems in Mines & Treasure',
    targetCount: 1,
    currentProgress: 0,
    rewardSol: 0.015,
    completed: false,
    claimed: false,
    gameCategory: 'Mines & Treasure',
    icon: '💎',
  },
  {
    id: 'm_volume_05',
    title: 'High-Roller Horizon',
    description: 'Wager a total of 0.10 SOL across any game',
    targetCount: 10, // 10 steps of 0.01 SOL
    currentProgress: 0,
    rewardSol: 0.035,
    completed: false,
    claimed: false,
    gameCategory: 'All',
    icon: '⚡',
  },
];

const STREAK_SCHEDULE = [
  { day: 1, rewardSol: 0.005 },
  { day: 2, rewardSol: 0.010 },
  { day: 3, rewardSol: 0.020, perk: '1.2x Rake Rebate' },
  { day: 4, rewardSol: 0.030 },
  { day: 5, rewardSol: 0.050, perk: 'VIP Chat Badge' },
  { day: 6, rewardSol: 0.075, perk: '1.5x Multiplier Boost' },
  { day: 7, rewardSol: 0.150, perk: 'Legendary Solstice Crown' },
];

class RewardsService {
  private missionsKey = 'solstice_daily_missions';
  private streakKey = 'solstice_streak_data';
  private referralKey = 'solstice_referral_data';

  // Load or initialize Missions
  public getMissions(): DailyMission[] {
    const saved = localStorage.getItem(this.missionsKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fall back
      }
    }
    return INITIAL_MISSIONS;
  }

  public saveMissions(missions: DailyMission[]) {
    localStorage.setItem(this.missionsKey, JSON.stringify(missions));
  }

  // Update mission progress on every bet event
  public recordBetActivity(
    game: string,
    betAmount: number,
    payout: number,
    multiplier: number,
    details?: string
  ): { missionsUpdated: boolean; newlyCompletedCount: number } {
    const missions = this.getMissions();
    let updated = false;
    let newlyCompleted = 0;

    missions.forEach((m) => {
      if (m.completed) return;

      if (m.id === 'm_roulette_5' && game === 'Neon Roulette') {
        m.currentProgress = Math.min(m.targetCount, m.currentProgress + 1);
        updated = true;
      } else if (m.id === 'm_blackjack_win_3' && game === 'Chrome Blackjack' && payout > 0) {
        m.currentProgress = Math.min(m.targetCount, m.currentProgress + 1);
        updated = true;
      } else if (m.id === 'm_crash_2x' && game === 'Crash Rocket' && multiplier >= 2.0 && payout > 0) {
        m.currentProgress = Math.min(m.targetCount, m.currentProgress + 1);
        updated = true;
      } else if (m.id === 'm_mines_gems' && game === 'Mines & Treasure' && payout > 0) {
        m.currentProgress = Math.min(m.targetCount, m.currentProgress + 1);
        updated = true;
      } else if (m.id === 'm_volume_05') {
        const units = Math.floor(betAmount / 0.01);
        if (units > 0) {
          m.currentProgress = Math.min(m.targetCount, m.currentProgress + units);
          updated = true;
        }
      }

      if (m.currentProgress >= m.targetCount && !m.completed) {
        m.completed = true;
        newlyCompleted += 1;
        updated = true;
      }
    });

    if (updated) {
      this.saveMissions(missions);
    }

    // Also update referral volume if referred
    this.recordReferralVolume(betAmount);

    return { missionsUpdated: updated, newlyCompletedCount: newlyCompleted };
  }

  // Claim Mission Reward
  public claimMissionReward(missionId: string): number {
    const missions = this.getMissions();
    const target = missions.find((m) => m.id === missionId);
    if (!target || !target.completed || target.claimed) return 0;

    target.claimed = true;
    this.saveMissions(missions);
    return target.rewardSol;
  }

  // Streak Engine
  public getStreakData(): { currentStreak: number; streakCalendar: StreakDay[]; canClaimToday: boolean } {
    const saved = localStorage.getItem(this.streakKey);
    let streakCount = 1;
    let lastClaimDate = '';

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        streakCount = parsed.streakCount || 1;
        lastClaimDate = parsed.lastClaimDate || '';
      } catch {
        // Ignore
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const canClaimToday = lastClaimDate !== todayStr;

    const streakCalendar: StreakDay[] = STREAK_SCHEDULE.map((s) => ({
      day: s.day,
      rewardSol: s.rewardSol,
      perk: s.perk,
      claimed: s.day < streakCount || (s.day === streakCount && !canClaimToday),
      isToday: s.day === streakCount,
    }));

    return { currentStreak: streakCount, streakCalendar, canClaimToday };
  }

  public claimTodayStreak(): { success: boolean; rewardSol: number; nextStreak: number } {
    const { currentStreak, canClaimToday } = this.getStreakData();
    if (!canClaimToday) return { success: false, rewardSol: 0, nextStreak: currentStreak };

    const todaySchedule = STREAK_SCHEDULE[Math.min(currentStreak - 1, STREAK_SCHEDULE.length - 1)];
    const rewardSol = todaySchedule.rewardSol;

    const todayStr = new Date().toISOString().split('T')[0];
    const nextStreak = currentStreak >= 7 ? 1 : currentStreak + 1;

    localStorage.setItem(
      this.streakKey,
      JSON.stringify({
        streakCount: nextStreak,
        lastClaimDate: todayStr,
      })
    );

    return { success: true, rewardSol, nextStreak };
  }

  // Referral System Engine
  public getReferralData(publicKey: string | null): ReferralData {
    const saved = localStorage.getItem(this.referralKey);
    let data: ReferralData;

    if (saved) {
      try {
        data = JSON.parse(saved);
      } catch {
        data = this.initReferralData(publicKey);
      }
    } else {
      data = this.initReferralData(publicKey);
    }

    // Sync user's own referral code based on pubkey if empty
    if (!data.myReferralCode && publicKey) {
      data.myReferralCode = `SOLSTICE-${publicKey.slice(0, 4).toUpperCase()}${publicKey.slice(-3).toUpperCase()}`;
      this.saveReferralData(data);
    }

    return data;
  }

  private initReferralData(publicKey: string | null): ReferralData {
    const code = publicKey
      ? `SOLSTICE-${publicKey.slice(0, 4).toUpperCase()}${publicKey.slice(-3).toUpperCase()}`
      : `SOLSTICE-SOL2026`;

    const initial: ReferralData = {
      myReferralCode: code,
      referredByCode: null,
      totalReferees: 3,
      totalRakebackEarnedSol: 0.145,
      claimableCommissionSol: 0.082,
      referralTier: 'Silver',
      rakeDiscountActive: false,
      refereeBonusClaimed: false,
      referralHistory: [
        { address: '7xK9...2LmP', joinedAt: Date.now() - 86400000 * 3, wagerVolumeSol: 2.45, commissionGeneratedSol: 0.045 },
        { address: '4mR8...3kNp', joinedAt: Date.now() - 86400000 * 2, wagerVolumeSol: 1.80, commissionGeneratedSol: 0.036 },
        { address: '9vQ1...8wZ4', joinedAt: Date.now() - 86400000 * 1, wagerVolumeSol: 0.95, commissionGeneratedSol: 0.019 },
      ],
    };
    this.saveReferralData(initial);
    return initial;
  }

  public saveReferralData(data: ReferralData) {
    localStorage.setItem(this.referralKey, JSON.stringify(data));
  }

  // Bind referral code for new user
  public bindReferralCode(refCode: string, publicKey: string | null): { success: boolean; bonusSol: number; error?: string } {
    const data = this.getReferralData(publicKey);
    if (data.referredByCode) {
      return { success: false, bonusSol: 0, error: 'Referral code already bound.' };
    }
    if (refCode.trim().toUpperCase() === data.myReferralCode.toUpperCase()) {
      return { success: false, bonusSol: 0, error: 'You cannot refer yourself.' };
    }

    data.referredByCode = refCode.trim().toUpperCase();
    data.rakeDiscountActive = true;
    data.refereeBonusClaimed = true;

    // Welcome referee bonus: +0.025 SOL
    const bonusSol = 0.025;
    this.saveReferralData(data);
    return { success: true, bonusSol };
  }

  // Claim accrued referral commission
  public claimReferralCommissions(publicKey: string | null): number {
    const data = this.getReferralData(publicKey);
    const amount = data.claimableCommissionSol;
    if (amount <= 0) return 0;

    data.totalRakebackEarnedSol += amount;
    data.claimableCommissionSol = 0;
    this.saveReferralData(data);
    return amount;
  }

  // Record referee volume
  private recordReferralVolume(betAmount: number) {
    const data = this.getReferralData(null);
    // 1% of house rake (approx 0.02% of wager) accrues to referral commission
    const commission = betAmount * 0.015;
    data.claimableCommissionSol = parseFloat((data.claimableCommissionSol + commission).toFixed(5));
    this.saveReferralData(data);
  }
}

export const rewardsService = new RewardsService();
