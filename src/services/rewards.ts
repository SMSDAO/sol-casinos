/**
 * Rewards, Daily Missions, Streak Calendar, Badges & Referral Program Engine
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
  perk?: string;
  badgeId?: string;
  badgeName?: string;
}

export interface PlayerBadge {
  id: string;
  name: string;
  description: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  perk: string;
  source: 'mission' | 'streak' | 'achievement';
}

export interface StreakDay {
  day: number;
  rewardSol: number;
  perk?: string;
  badgeId?: string;
  badgeName?: string;
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

export interface FortuneWheelSlice {
  id: number;
  label: string;
  type: 'sol' | 'luck' | 'pass';
  amount: number;
  perk?: string;
  color: string;
  probabilityWeight: number;
}

export interface FortuneWheelState {
  lastSpinDate: string;
  canSpinToday: boolean;
  lastReward: FortuneWheelSlice | null;
}

export const FORTUNE_WHEEL_SLICES: FortuneWheelSlice[] = [
  { id: 1, label: '+0.010 SOL', type: 'sol', amount: 0.010, color: '#06b6d4', probabilityWeight: 30 },
  { id: 2, label: '+0.025 SOL', type: 'sol', amount: 0.025, color: '#3b82f6', probabilityWeight: 22 },
  { id: 3, label: '⚡ +10% Luck Buff', type: 'luck', amount: 0, perk: '+10% Win Multiplier Buff (24h)', color: '#8b5cf6', probabilityWeight: 18 },
  { id: 4, label: '+0.050 SOL', type: 'sol', amount: 0.050, color: '#ec4899', probabilityWeight: 12 },
  { id: 5, label: '👑 +20% Rake Rebate', type: 'luck', amount: 0, perk: 'Permanent VIP Rake Rebate', color: '#f59e0b', probabilityWeight: 8 },
  { id: 6, label: '+0.150 SOL JACKPOT', type: 'sol', amount: 0.150, color: '#ef4444', probabilityWeight: 4 },
  { id: 7, label: '🎟️ Free Tourney Pass', type: 'pass', amount: 0, perk: 'Free Entry to Next Tournament', color: '#10b981', probabilityWeight: 10 },
  { id: 8, label: '+0.005 SOL', type: 'sol', amount: 0.005, color: '#64748b', probabilityWeight: 16 },
];

export const INITIAL_BADGES: PlayerBadge[] = [
  {
    id: 'badge_roulette_prodigy',
    name: 'Roulette Prodigy',
    description: 'Placed 5 bets on Neon Roulette in a single session',
    rarity: 'Rare',
    icon: '🎡',
    unlocked: false,
    perk: '+2% Straight-Up Multiplier Bonus',
    source: 'mission',
  },
  {
    id: 'badge_blackjack_master',
    name: '21 Blackjack Master',
    description: 'Won 3 hands of Chrome Blackjack like a quant card shark',
    rarity: 'Epic',
    icon: '🃏',
    unlocked: false,
    perk: '+5% Dealer Bust Bonus Rakeback',
    source: 'mission',
  },
  {
    id: 'badge_crash_pilot',
    name: 'Rocket Ace Pilot',
    description: 'Cashed out at 2.00x or higher on Crash Rocket',
    rarity: 'Rare',
    icon: '🚀',
    unlocked: false,
    perk: 'Auto-Eject Instant Turbo Buffer',
    source: 'mission',
  },
  {
    id: 'badge_mines_explorer',
    name: 'Crystal Mine Sweeper',
    description: 'Successfully uncovered 5 safe tiles in Mines & Treasure',
    rarity: 'Rare',
    icon: '💎',
    unlocked: false,
    perk: 'Deflector Shield Priority Key',
    source: 'mission',
  },
  {
    id: 'badge_high_roller_volume',
    name: 'Cyber High-Roller',
    description: 'Wagered 0.10 SOL across casino tables in a single day',
    rarity: 'Epic',
    icon: '⚡',
    unlocked: false,
    perk: '1.25x Rakeback Multiplier Aura',
    source: 'mission',
  },
  {
    id: 'badge_streak_3',
    name: 'Bronze Streak Sentinel',
    description: 'Maintained a 3-Day login and wagering streak',
    rarity: 'Rare',
    icon: '🔥',
    unlocked: false,
    perk: 'Bronze Roll Neon Decal',
    source: 'streak',
  },
  {
    id: 'badge_streak_5',
    name: 'Silver Flame Veteran',
    description: 'Maintained a 5-Day consecutive login and gaming streak',
    rarity: 'Epic',
    icon: '🛡️',
    unlocked: false,
    perk: 'VIP Chat Badge & 1.2x Rebate',
    source: 'streak',
  },
  {
    id: 'badge_streak_7',
    name: 'Legendary Solstice Crown',
    description: 'Achieved the maximum 7-Day Solstice Streak',
    rarity: 'Legendary',
    icon: '👑',
    unlocked: false,
    perk: 'Permanent Crown Aura & +15% Rakeback',
    source: 'streak',
  },
];

const INITIAL_MISSIONS: DailyMission[] = [
  {
    id: 'm_roulette_5_bets',
    title: 'Neon Wheel Master',
    description: 'Place 5 bets on Neon Roulette',
    targetCount: 5,
    currentProgress: 0,
    rewardSol: 0.020,
    completed: false,
    claimed: false,
    gameCategory: 'Neon Roulette',
    icon: '🎡',
    perk: 'Lightning Spin Decal',
    badgeId: 'badge_roulette_prodigy',
    badgeName: 'Roulette Prodigy Badge',
  },
  {
    id: 'm_blackjack_win_3',
    title: 'Blackjack Sharpshooter',
    description: 'Win 3 hands of Chrome Blackjack',
    targetCount: 3,
    currentProgress: 0,
    rewardSol: 0.025,
    completed: false,
    claimed: false,
    gameCategory: 'Chrome Blackjack',
    icon: '🃏',
    perk: '+5% Dealer Bust Bonus',
    badgeId: 'badge_blackjack_master',
    badgeName: '21 Blackjack Master Badge',
  },
  {
    id: 'm_crash_2x',
    title: 'Stratosphere High Flyer',
    description: 'Cash out at 2.00x or higher on Crash Rocket',
    targetCount: 1,
    currentProgress: 0,
    rewardSol: 0.020,
    completed: false,
    claimed: false,
    gameCategory: 'Crash Rocket',
    icon: '🚀',
    perk: 'Auto-Eject Booster',
    badgeId: 'badge_crash_pilot',
    badgeName: 'Rocket Ace Pilot Badge',
  },
  {
    id: 'm_mines_5_gems',
    title: 'Mine Field Prospector',
    description: 'Uncover 5 safe crystals in Mines & Treasure',
    targetCount: 5,
    currentProgress: 0,
    rewardSol: 0.015,
    completed: false,
    claimed: false,
    gameCategory: 'Mines & Treasure',
    icon: '💎',
    perk: 'Deflector Shield Key',
    badgeId: 'badge_mines_explorer',
    badgeName: 'Crystal Mine Sweeper Badge',
  },
  {
    id: 'm_play_3_games',
    title: 'Casino Explorer',
    description: 'Play at least 3 different games today',
    targetCount: 3,
    currentProgress: 0,
    rewardSol: 0.015,
    completed: false,
    claimed: false,
    gameCategory: 'All 10 Games',
    icon: '🎰',
    perk: 'Explorer VIP Glow Tier',
  },
  {
    id: 'm_volume_01',
    title: 'High-Roller Horizon',
    description: 'Wager a total of 0.10 SOL across any game',
    targetCount: 10, // 10 units of 0.01 SOL
    currentProgress: 0,
    rewardSol: 0.035,
    completed: false,
    claimed: false,
    gameCategory: 'All',
    icon: '⚡',
    perk: '1.25x Rakeback Multiplier',
    badgeId: 'badge_high_roller_volume',
    badgeName: 'Cyber High-Roller Badge',
  },
];

const STREAK_SCHEDULE: { day: number; rewardSol: number; perk: string; badgeId?: string; badgeName?: string }[] = [
  { day: 1, rewardSol: 0.005, perk: 'Welcome Roll Decal' },
  { day: 2, rewardSol: 0.010, perk: '+10% Speed Spin' },
  { day: 3, rewardSol: 0.020, perk: 'Bronze Sentinel Badge', badgeId: 'badge_streak_3', badgeName: 'Bronze Streak Sentinel' },
  { day: 4, rewardSol: 0.035, perk: '1.2x Rake Rebate' },
  { day: 5, rewardSol: 0.050, perk: 'Silver Flame Badge', badgeId: 'badge_streak_5', badgeName: 'Silver Flame Veteran' },
  { day: 6, rewardSol: 0.080, perk: '1.5x Multiplier Boost' },
  { day: 7, rewardSol: 0.150, perk: 'Legendary Solstice Crown', badgeId: 'badge_streak_7', badgeName: 'Legendary Solstice Crown' },
];

class RewardsService {
  private missionsKey = 'solstice_daily_missions';
  private streakKey = 'solstice_streak_data';
  private referralKey = 'solstice_referral_data';
  private gamesPlayedKey = 'solstice_games_played_today';
  private badgesKey = 'solstice_player_badges';
  private equippedBadgeKey = 'solstice_equipped_badge';
  private missionsDateKey = 'solstice_missions_date';

  private listeners: (() => void)[] = [];

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (e) {
        console.error('Error notifying rewards listener:', e);
      }
    });
  }

  // Calculate Time Until Next UTC Midnight Reset
  public getTimeUntilDailyReset(): { hours: number; minutes: number; seconds: number; formatted: string } {
    const now = new Date();
    const nextMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
    const diffMs = Math.max(0, nextMidnight.getTime() - now.getTime());

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    const pad = (n: number) => n.toString().padStart(2, '0');
    return {
      hours,
      minutes,
      seconds,
      formatted: `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`,
    };
  }

  // Load or initialize Player Badges
  public getBadges(): PlayerBadge[] {
    const saved = localStorage.getItem(this.badgesKey);
    if (saved) {
      try {
        const parsed: PlayerBadge[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map((b) => b.id));
        const merged = [...parsed];
        for (const initB of INITIAL_BADGES) {
          if (!existingIds.has(initB.id)) {
            merged.push(initB);
          }
        }
        return merged;
      } catch {
        // Fall back
      }
    }
    return INITIAL_BADGES;
  }

  public saveBadges(badges: PlayerBadge[]) {
    localStorage.setItem(this.badgesKey, JSON.stringify(badges));
    this.notifyListeners();
  }

  public unlockBadge(badgeId: string): PlayerBadge | null {
    const badges = this.getBadges();
    const target = badges.find((b) => b.id === badgeId);
    if (!target) return null;

    if (!target.unlocked) {
      target.unlocked = true;
      target.unlockedAt = Date.now();
      this.saveBadges(badges);
      return target;
    }
    return null;
  }

  public getEquippedBadge(): PlayerBadge | null {
    const equippedId = localStorage.getItem(this.equippedBadgeKey);
    if (!equippedId) return null;
    const badges = this.getBadges();
    return badges.find((b) => b.id === equippedId && b.unlocked) || null;
  }

  public equipBadge(badgeId: string): boolean {
    const badges = this.getBadges();
    const target = badges.find((b) => b.id === badgeId && b.unlocked);
    if (!target) return false;
    localStorage.setItem(this.equippedBadgeKey, badgeId);
    this.notifyListeners();
    return true;
  }

  // Load or initialize Missions with UTC Date Check
  public getMissions(): DailyMission[] {
    const todayStr = new Date().toISOString().split('T')[0];
    const savedDate = localStorage.getItem(this.missionsDateKey);

    // If day changed, reset daily mission progress
    if (savedDate !== todayStr) {
      localStorage.setItem(this.missionsDateKey, todayStr);
      localStorage.removeItem(this.missionsKey);
      localStorage.removeItem(this.gamesPlayedKey);
      return INITIAL_MISSIONS;
    }

    const saved = localStorage.getItem(this.missionsKey);
    if (saved) {
      try {
        const parsed: DailyMission[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map((m) => m.id));
        const merged = [...parsed];
        for (const initM of INITIAL_MISSIONS) {
          if (!existingIds.has(initM.id)) {
            merged.push(initM);
          }
        }
        return merged;
      } catch {
        // Fall back
      }
    }
    return INITIAL_MISSIONS;
  }

  public saveMissions(missions: DailyMission[]) {
    localStorage.setItem(this.missionsKey, JSON.stringify(missions));
    this.notifyListeners();
  }

  // Track unique games played today
  private getUniqueGamesPlayed(): string[] {
    const saved = localStorage.getItem(this.gamesPlayedKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const todayStr = new Date().toISOString().split('T')[0];
        if (parsed.date === todayStr && Array.isArray(parsed.games)) {
          return parsed.games;
        }
      } catch {
        // Fall back
      }
    }
    return [];
  }

  private recordGamePlayed(game: string): string[] {
    const todayStr = new Date().toISOString().split('T')[0];
    const games = this.getUniqueGamesPlayed();
    if (!games.includes(game)) {
      games.push(game);
      localStorage.setItem(
        this.gamesPlayedKey,
        JSON.stringify({ date: todayStr, games })
      );
    }
    return games;
  }

  // Update mission progress on every bet event
  public recordBetActivity(
    game: string,
    betAmount: number,
    payout: number,
    multiplier: number,
    details?: string
  ): {
    missionsUpdated: boolean;
    newlyCompletedCount: number;
    newlyCompletedMissions: DailyMission[];
  } {
    const missions = this.getMissions();
    let updated = false;
    const newlyCompletedMissions: DailyMission[] = [];

    // Track unique games
    const uniqueGames = this.recordGamePlayed(game);

    missions.forEach((m) => {
      if (m.completed) return;

      // 1. 'Place 5 bets on Neon Roulette'
      const isRoulette = game === 'Neon Roulette' || game.toLowerCase().includes('roulette');
      if (m.id === 'm_roulette_5_bets' && isRoulette) {
        m.currentProgress = Math.min(m.targetCount, m.currentProgress + 1);
        updated = true;
      }
      // 2. 'Win 3 hands of Blackjack'
      const isBlackjack = game === 'Chrome Blackjack' || game.toLowerCase().includes('blackjack');
      const isBlackjackWin =
        isBlackjack &&
        (multiplier >= 1.5 ||
          payout > betAmount ||
          details?.toLowerCase().includes('win') ||
          details?.toLowerCase().includes('natural'));

      if (m.id === 'm_blackjack_win_3' && isBlackjackWin) {
        m.currentProgress = Math.min(m.targetCount, m.currentProgress + 1);
        updated = true;
      }
      // 3. 'Crash 2x'
      else if (
        m.id === 'm_crash_2x' &&
        (game === 'Crash Rocket' || game.toLowerCase().includes('crash')) &&
        multiplier >= 2.0 &&
        payout > 0
      ) {
        m.currentProgress = Math.min(m.targetCount, m.currentProgress + 1);
        updated = true;
      }
      // 4. 'Uncover 5 safe crystals in Mines & Treasure'
      else if (
        m.id === 'm_mines_5_gems' &&
        (game === 'Mines & Treasure' || game.toLowerCase().includes('mines')) &&
        payout > 0
      ) {
        m.currentProgress = Math.min(m.targetCount, m.currentProgress + 1);
        updated = true;
      }
      // 5. 'Play 3 different games today'
      else if (m.id === 'm_play_3_games') {
        const count = uniqueGames.length;
        if (count > m.currentProgress) {
          m.currentProgress = Math.min(m.targetCount, count);
          updated = true;
        }
      }
      // 6. 'Wager total 0.10 SOL across any game'
      else if (m.id === 'm_volume_01') {
        const units = Math.floor(betAmount / 0.01);
        if (units > 0) {
          m.currentProgress = Math.min(m.targetCount, m.currentProgress + units);
          updated = true;
        }
      }

      if (m.currentProgress >= m.targetCount && !m.completed) {
        m.completed = true;
        newlyCompletedMissions.push({ ...m });
        updated = true;

        // Auto-unlock badge if associated
        if (m.badgeId) {
          this.unlockBadge(m.badgeId);
        }
      }
    });

    if (updated) {
      this.saveMissions(missions);
    }

    // Also update referral volume if referred
    this.recordReferralVolume(betAmount);

    return {
      missionsUpdated: updated,
      newlyCompletedCount: newlyCompletedMissions.length,
      newlyCompletedMissions,
    };
  }

  // Claim Mission Reward (Returns SOL amount and any newly unlocked Badge)
  public claimMissionReward(missionId: string): { rewardSol: number; unlockedBadge?: PlayerBadge } {
    const missions = this.getMissions();
    const target = missions.find((m) => m.id === missionId);
    if (!target || !target.completed || target.claimed) return { rewardSol: 0 };

    target.claimed = true;
    this.saveMissions(missions);

    let unlockedBadge: PlayerBadge | undefined;
    if (target.badgeId) {
      unlockedBadge = this.unlockBadge(target.badgeId) || undefined;
    }

    return { rewardSol: target.rewardSol, unlockedBadge };
  }

  // Streak Engine with Consecutive Date Validation
  public getStreakData(): {
    currentStreak: number;
    streakCalendar: StreakDay[];
    canClaimToday: boolean;
    lastClaimDate: string;
    daysUntilReset: number;
  } {
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

    // Check if yesterday or older
    if (lastClaimDate) {
      const todayDate = new Date(todayStr);
      const lastDate = new Date(lastClaimDate);
      const diffTime = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

      // If user missed more than 1 day, streak resets to 1
      if (diffDays > 1) {
        streakCount = 1;
      }
    }

    const canClaimToday = lastClaimDate !== todayStr;

    const streakCalendar: StreakDay[] = STREAK_SCHEDULE.map((s) => ({
      day: s.day,
      rewardSol: s.rewardSol,
      perk: s.perk,
      badgeId: s.badgeId,
      badgeName: s.badgeName,
      claimed: s.day < streakCount || (s.day === streakCount && !canClaimToday),
      isToday: s.day === streakCount,
    }));

    return {
      currentStreak: streakCount,
      streakCalendar,
      canClaimToday,
      lastClaimDate,
      daysUntilReset: 7 - streakCount,
    };
  }

  public claimTodayStreak(): {
    success: boolean;
    rewardSol: number;
    nextStreak: number;
    perk?: string;
    unlockedBadge?: PlayerBadge;
  } {
    const { currentStreak, canClaimToday } = this.getStreakData();
    if (!canClaimToday) return { success: false, rewardSol: 0, nextStreak: currentStreak };

    const todaySchedule = STREAK_SCHEDULE[Math.min(currentStreak - 1, STREAK_SCHEDULE.length - 1)];
    const rewardSol = todaySchedule.rewardSol;
    const perk = todaySchedule.perk;

    const todayStr = new Date().toISOString().split('T')[0];
    const nextStreak = currentStreak >= 7 ? 1 : currentStreak + 1;

    localStorage.setItem(
      this.streakKey,
      JSON.stringify({
        streakCount: nextStreak,
        lastClaimDate: todayStr,
      })
    );

    let unlockedBadge: PlayerBadge | undefined;
    if (todaySchedule.badgeId) {
      unlockedBadge = this.unlockBadge(todaySchedule.badgeId) || undefined;
    }

    this.notifyListeners();
    return { success: true, rewardSol, nextStreak, perk, unlockedBadge };
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
    this.notifyListeners();
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
    const commission = betAmount * 0.015;
    data.claimableCommissionSol = parseFloat((data.claimableCommissionSol + commission).toFixed(5));
    this.saveReferralData(data);
  }

  // Daily Fortune Wheel Engine
  private wheelKey = 'solstice_fortune_wheel_state';

  public getFortuneWheelState(): FortuneWheelState {
    const todayStr = new Date().toISOString().slice(0, 10);
    const saved = localStorage.getItem(this.wheelKey);
    if (saved) {
      try {
        const state: FortuneWheelState = JSON.parse(saved);
        const canSpinToday = state.lastSpinDate !== todayStr;
        return { ...state, canSpinToday };
      } catch {
        // fallback
      }
    }
    return {
      lastSpinDate: '',
      canSpinToday: true,
      lastReward: null,
    };
  }

  public spinFortuneWheel(): { success: boolean; reward: FortuneWheelSlice; error?: string } {
    const todayStr = new Date().toISOString().slice(0, 10);
    const state = this.getFortuneWheelState();
    if (!state.canSpinToday) {
      return { success: false, reward: FORTUNE_WHEEL_SLICES[0], error: 'Fortune Wheel already spun today. Come back tomorrow!' };
    }

    const totalWeight = FORTUNE_WHEEL_SLICES.reduce((acc, s) => acc + s.probabilityWeight, 0);
    let randomVal = Math.random() * totalWeight;
    let selectedSlice = FORTUNE_WHEEL_SLICES[0];

    for (const slice of FORTUNE_WHEEL_SLICES) {
      if (randomVal < slice.probabilityWeight) {
        selectedSlice = slice;
        break;
      }
      randomVal -= slice.probabilityWeight;
    }

    const newState: FortuneWheelState = {
      lastSpinDate: todayStr,
      canSpinToday: false,
      lastReward: selectedSlice,
    };

    localStorage.setItem(this.wheelKey, JSON.stringify(newState));
    this.notifyListeners();
    return { success: true, reward: selectedSlice };
  }
}

export const rewardsService = new RewardsService();
