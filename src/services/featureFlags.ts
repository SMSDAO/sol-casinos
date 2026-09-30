/**
 * Enterprise Feature Flag & Remote Configuration Engine
 * Auditable, persistent, and dynamically toggled per environment.
 */

export interface GameRiskConfig {
  gameId: string;
  gameName: string;
  houseEdgeBps: number; // e.g. 270 = 2.70%
  minBetSol: number;
  maxBetSol: number;
  enabled: boolean;
  maxPayoutMultiplier: number;
}

export interface EnterpriseFeatureFlags {
  enableLightningRoulette: boolean;
  enableMultiCascade: boolean;
  enableAiAnalyst: boolean;
  enableLiveChat: boolean;
  enableDevnetFaucet: boolean;
  enableResponsibleGaming: boolean;
  enableMultiSigTreasury: boolean;
  maintenanceMode: boolean;
  geoRestrictionEnforced: boolean;
}

export const DEFAULT_FLAGS: EnterpriseFeatureFlags = {
  enableLightningRoulette: true,
  enableMultiCascade: true,
  enableAiAnalyst: true,
  enableLiveChat: true,
  enableDevnetFaucet: true,
  enableResponsibleGaming: true,
  enableMultiSigTreasury: true,
  maintenanceMode: false,
  geoRestrictionEnforced: false,
};

export const DEFAULT_GAME_RISK_CONFIGS: Record<string, GameRiskConfig> = {
  roulette: {
    gameId: 'roulette',
    gameName: 'Neon Roulette',
    houseEdgeBps: 270,
    minBetSol: 0.00022,
    maxBetSol: 25.0,
    enabled: true,
    maxPayoutMultiplier: 500,
  },
  blackjack: {
    gameId: 'blackjack',
    gameName: 'Chrome Blackjack',
    houseEdgeBps: 50,
    minBetSol: 0.00022,
    maxBetSol: 50.0,
    enabled: true,
    maxPayoutMultiplier: 100,
  },
  slots: {
    gameId: 'slots',
    gameName: 'Slot Cascade',
    houseEdgeBps: 300,
    minBetSol: 0.00022,
    maxBetSol: 15.0,
    enabled: true,
    maxPayoutMultiplier: 1000,
  },
  dice: {
    gameId: 'dice',
    gameName: 'Dice Dynasty',
    houseEdgeBps: 100,
    minBetSol: 0.00022,
    maxBetSol: 100.0,
    enabled: true,
    maxPayoutMultiplier: 990,
  },
  crash: {
    gameId: 'crash',
    gameName: 'Crash Rocket',
    houseEdgeBps: 150,
    minBetSol: 0.00022,
    maxBetSol: 20.0,
    enabled: true,
    maxPayoutMultiplier: 1000,
  },
  keno: {
    gameId: 'keno',
    gameName: 'Keno Nova',
    houseEdgeBps: 250,
    minBetSol: 0.00022,
    maxBetSol: 10.0,
    enabled: true,
    maxPayoutMultiplier: 10000,
  },
  baccarat: {
    gameId: 'baccarat',
    gameName: 'Baccarat Flash',
    houseEdgeBps: 106,
    minBetSol: 0.00022,
    maxBetSol: 75.0,
    enabled: true,
    maxPayoutMultiplier: 11,
  },
  poker: {
    gameId: 'poker',
    gameName: 'Poker Hold’em Rush',
    houseEdgeBps: 210,
    minBetSol: 0.00022,
    maxBetSol: 30.0,
    enabled: true,
    maxPayoutMultiplier: 100,
  },
  wheel: {
    gameId: 'wheel',
    gameName: 'Wheel of Sol',
    houseEdgeBps: 280,
    minBetSol: 0.00022,
    maxBetSol: 20.0,
    enabled: true,
    maxPayoutMultiplier: 100,
  },
  mines: {
    gameId: 'mines',
    gameName: 'Mines & Treasure',
    houseEdgeBps: 100,
    minBetSol: 0.00022,
    maxBetSol: 15.0,
    enabled: true,
    maxPayoutMultiplier: 5000000,
  },
};

class FeatureFlagService {
  private flagsKey = 'solstice_enterprise_flags';
  private riskKey = 'solstice_game_risk_configs';

  public getFlags(): EnterpriseFeatureFlags {
    const saved = localStorage.getItem(this.flagsKey);
    if (saved) {
      try {
        return { ...DEFAULT_FLAGS, ...JSON.parse(saved) };
      } catch {
        // Fall back
      }
    }
    return DEFAULT_FLAGS;
  }

  public setFlag<K extends keyof EnterpriseFeatureFlags>(key: K, val: EnterpriseFeatureFlags[K]) {
    const current = this.getFlags();
    current[key] = val;
    localStorage.setItem(this.flagsKey, JSON.stringify(current));
  }

  public getGameRiskConfigs(): Record<string, GameRiskConfig> {
    const saved = localStorage.getItem(this.riskKey);
    if (saved) {
      try {
        return { ...DEFAULT_GAME_RISK_CONFIGS, ...JSON.parse(saved) };
      } catch {
        // Fall back
      }
    }
    return DEFAULT_GAME_RISK_CONFIGS;
  }

  public updateGameRiskConfig(gameId: string, partial: Partial<GameRiskConfig>) {
    const configs = this.getGameRiskConfigs();
    if (configs[gameId]) {
      configs[gameId] = { ...configs[gameId], ...partial };
      localStorage.setItem(this.riskKey, JSON.stringify(configs));
    }
  }
}

export const featureFlagService = new FeatureFlagService();
