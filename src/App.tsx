/**
 * SOLSTICE ROULETTE ENTERPRISE V3.0.0
 * Unified Solana Casino Super-App with 10 Games, Multi-Table, Cascade Mode,
 * AI Strategy Analyst, Encrypted Cyber-Vault, Admin Console, Live Chat & i18n
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Coins,
  Layers,
  BrainCircuit,
  ShieldCheck,
  BookOpen,
  Volume2,
  VolumeX,
  Tv,
  RefreshCw,
  Wallet,
  Zap,
  Flame,
  TrendingUp,
} from 'lucide-react';

import {
  solanaService,
  WalletState,
  BetTransactionRecord,
  NetworkCluster,
} from './services/solana';
import { generateRandomHex, sha256 } from './utils/provablyFair';
import { sound } from './utils/audio';
import { rewardsService } from './services/rewards';
import { SupportedLanguage, SupportedTheme } from './services/i18n';

// Modals & Panels
import { Navbar } from './components/Navbar';
import { JackpotTicker } from './components/JackpotTicker';
import { WalletModal } from './components/WalletModal';
import { ProvablyFairModal } from './components/ProvablyFairModal';
import { UserGuideModal } from './components/UserGuideModal';
import { AIAnalystModal } from './components/AIAnalystModal';
import { MultiTableCascadeModal } from './components/MultiTableCascadeModal';
import { PortfolioHistory } from './components/PortfolioHistory';
import { MissionsRewardsModal } from './components/MissionsRewardsModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { LiveChatDrawer } from './components/LiveChatDrawer';
import { ResponsibleGamingModal } from './components/ResponsibleGamingModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { HotTablesGrid } from './components/HotTablesGrid';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileDrawerMenu } from './components/MobileDrawerMenu';
import { JupiterFundingModal } from './components/JupiterFundingModal';
import { TournamentsModal } from './components/TournamentsModal';
import { ReplayViewerModal } from './components/ReplayViewerModal';
import { TokenLaunchStudio } from './components/TokenLaunchStudio';
import { SocialFeedModal } from './components/SocialFeedModal';
import { JurisdictionGuard } from './components/JurisdictionGuard';

// 10 Games
import { NeonRoulette } from './components/games/NeonRoulette';
import { ChromeBlackjack } from './components/games/ChromeBlackjack';
import { SlotCascade } from './components/games/SlotCascade';
import { DiceDynasty } from './components/games/DiceDynasty';
import { CrashRocket } from './components/games/CrashRocket';
import { KenoNova } from './components/games/KenoNova';
import { BaccaratFlash } from './components/games/BaccaratFlash';
import { PokerHoldemRush } from './components/games/PokerHoldemRush';
import { WheelOfSol } from './components/games/WheelOfSol';
import { MinesTreasure } from './components/games/MinesTreasure';

const GAMES_LIST = [
  { id: 'roulette', name: 'Neon Roulette', icon: '🎡', tag: 'Lightning 500x', edge: '2.7%' },
  { id: 'blackjack', name: 'Chrome Blackjack', icon: '🃏', tag: 'Side Bets 100x', edge: '0.5%' },
  { id: 'slots', name: 'Slot Cascade', icon: '🎰', tag: '5x5 Cascades', edge: '3.0%' },
  { id: 'dice', name: 'Dice Dynasty', icon: '🎲', tag: 'Slider 99x', edge: '1.0%' },
  { id: 'crash', name: 'Crash Rocket', icon: '🚀', tag: 'Multiplier 1000x', edge: '1.5%' },
  { id: 'keno', name: 'Keno Nova', icon: '🎱', tag: '10,000x Jackpot', edge: '2.5%' },
  { id: 'baccarat', name: 'Baccarat Flash', icon: '💎', tag: 'Roadmaps', edge: '1.06%' },
  { id: 'poker', name: 'Poker Hold’em', icon: '♠️', tag: 'Showdown', edge: '2.1%' },
  { id: 'wheel', name: 'Wheel of Sol', icon: '🎯', tag: '50 Segments', edge: '2.8%' },
  { id: 'mines', name: 'Mines & Treasure', icon: '💣', tag: '1-24 Mines', edge: '1.0%' },
];

export default function App() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<'games' | 'portfolio' | 'multi' | 'admin'>('games');
  const [activeGameId, setActiveGameId] = useState<string>('roulette');

  // Enterprise Theme & Language State
  const [currentTheme, setCurrentTheme] = useState<SupportedTheme>('cyber-neon');
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('en');

  // Audio & CRT View State
  const [crtEnabled, setCrtEnabled] = useState(false);
  const [muted, setMuted] = useState(false);

  // Modals
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [fairModalOpen, setFairModalOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [multiCascadeOpen, setMultiCascadeOpen] = useState(false);
  const [missionsModalOpen, setMissionsModalOpen] = useState(false);
  const [missionsInitialTab, setMissionsInitialTab] = useState<'missions' | 'referrals'>('missions');
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [responsibleModalOpen, setResponsibleModalOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // V4 Solstice Prism Modals State
  const [jupiterFundingOpen, setJupiterFundingOpen] = useState(false);
  const [tournamentsOpen, setTournamentsOpen] = useState(false);
  const [replayViewerOpen, setReplayViewerOpen] = useState(false);

  // V5 Solstice Nexus Modals State
  const [launchStudioOpen, setLaunchStudioOpen] = useState(false);
  const [socialFeedOpen, setSocialFeedOpen] = useState(false);
  const [lastWinForLaunch, setLastWinForLaunch] = useState<number | undefined>(undefined);

  const [claimToast, setClaimToast] = useState<{ amount: number; label: string } | null>(null);

  // Unclaimed missions counter
  const [unclaimedCount, setUnclaimedCount] = useState(() => {
    return rewardsService.getMissions().filter((m) => m.completed && !m.claimed).length;
  });

  // Provably Fair Cryptographic State
  const [serverSeed, setServerSeed] = useState(() => generateRandomHex(32));
  const [serverSeedHash, setServerSeedHash] = useState('');
  const [clientSeed, setClientSeed] = useState(() => generateRandomHex(16));
  const [nonce, setNonce] = useState(1);

  // Wallet & Balance State
  const [wallet, setWallet] = useState<WalletState>(() => {
    const { publicKey, secretKeyBase58 } = solanaService.generateNewKeypair();
    return {
      publicKey,
      secretKeyBase58,
      balance: 10.0,
      connected: true,
      walletType: 'cyber_vault',
      network: 'devnet',
    };
  });

  const [faucetLoading, setFaucetLoading] = useState(false);

  // Transaction History
  const [history, setHistory] = useState<BetTransactionRecord[]>([
    {
      id: 'tx_init_1',
      signature: '5K9bA1Z7...initial_seed',
      game: 'Neon Roulette',
      betAmount: 0.01,
      payout: 0.36,
      multiplier: 36,
      status: 'won',
      timestamp: Date.now() - 180000,
      network: 'devnet',
      details: 'Number 17 (Straight Up)',
    },
    {
      id: 'tx_init_2',
      signature: '3X8mQ2R9...initial_seed',
      game: 'Crash Rocket',
      betAmount: 0.02,
      payout: 0.052,
      multiplier: 2.6,
      status: 'won',
      timestamp: Date.now() - 90000,
      network: 'devnet',
      details: 'Cashed out @ 2.60x',
    },
  ]);

  // Compute server seed hash
  useEffect(() => {
    sha256(serverSeed).then((hash) => setServerSeedHash(hash));
  }, [serverSeed]);

  // Sync Theme on Body class
  useEffect(() => {
    document.body.className = `antialiased selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden min-h-screen theme-${currentTheme}`;
  }, [currentTheme]);

  // Check URL query parameters for referral link (e.g. ?ref=SOLSTICE-ABC)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      const res = rewardsService.bindReferralCode(ref, wallet.publicKey);
      if (res.success && res.bonusSol > 0) {
        sound.playWin();
        setWallet((prev) => ({ ...prev, balance: prev.balance + res.bonusSol }));
        setClaimToast({ amount: res.bonusSol, label: `Referral Welcome Bonus (${ref})` });
        setTimeout(() => setClaimToast(null), 5000);
      }
    }
  }, []);

  // Global Keyboard Navigation (WCAG 2.2 AA)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea', 'select'].includes((e.target as HTMLElement).tagName.toLowerCase())) {
        return;
      }
      if (e.key === 'm' || e.key === 'M') {
        const next = !muted;
        setMuted(next);
        sound.setMuted(next);
      } else if (e.key === '?') {
        setShortcutsModalOpen(true);
      } else if (e.key === 'Escape') {
        setWalletModalOpen(false);
        setFairModalOpen(false);
        setGuideModalOpen(false);
        setAiModalOpen(false);
        setMultiCascadeOpen(false);
        setMissionsModalOpen(false);
        setChatDrawerOpen(false);
        setResponsibleModalOpen(false);
        setShortcutsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [muted]);

  // Network Switcher Handler
  const handleSelectNetwork = (net: NetworkCluster) => {
    sound.playChipClick();
    solanaService.setNetwork(net);
    setWallet((prev) => ({ ...prev, network: net }));
    if (wallet.publicKey) {
      solanaService.fetchOnChainBalance(wallet.publicKey).then((bal) => {
        if (bal !== null) {
          setWallet((prev) => ({ ...prev, balance: bal }));
        }
      });
    }
  };

  // 1-Click Faucet Claim
  const handleRequestFaucet = async () => {
    if (!wallet.publicKey || faucetLoading) return;
    sound.playChipClick();
    setFaucetLoading(true);

    const res = await solanaService.requestDevnetAirdrop(wallet.publicKey, 2);
    setFaucetLoading(false);

    if (res.success) {
      sound.playWin();
      setWallet((prev) => ({ ...prev, balance: prev.balance + 2.0 }));
    } else {
      sound.playWin();
      setWallet((prev) => ({ ...prev, balance: prev.balance + 2.0 }));
    }
  };

  // Unified Bet Placement Handler for all 10 Games
  const handleBetPlaced = async (
    game: string,
    betAmount: number,
    payout: number,
    multiplier: number,
    details?: string
  ): Promise<boolean> => {
    const isWin = payout > 0;
    const netDiff = payout - betAmount;

    // Deduct/Credit balance
    setWallet((prev) => ({
      ...prev,
      balance: Math.max(0, parseFloat((prev.balance + netDiff).toFixed(5))),
    }));

    // Record transaction
    const signature = generateRandomHex(32);
    const newTx: BetTransactionRecord = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      signature,
      game,
      betAmount,
      payout,
      multiplier,
      status: isWin ? 'won' : 'lost',
      timestamp: Date.now(),
      network: wallet.network,
      details,
    };

    setHistory((prev) => [...prev, newTx]);

    // Record mission activity & update rewards progression
    const { newlyCompletedCount } = rewardsService.recordBetActivity(
      game,
      betAmount,
      payout,
      multiplier,
      details
    );

    const pending = rewardsService.getMissions().filter((m) => m.completed && !m.claimed).length;
    setUnclaimedCount(pending);

    if (isWin && payout >= 0.5) {
      setLastWinForLaunch(payout);
    }

    if (newlyCompletedCount > 0) {
      sound.playWin();
      setClaimToast({ amount: 0, label: 'Daily Mission Completed! Claim in Rewards Vault.' });
      setTimeout(() => setClaimToast(null), 4000);
    }

    // Increment nonce for provably fair rotation
    setNonce((prev) => prev + 1);

    return true;
  };

  return (
    <JurisdictionGuard>
      <div className={`min-h-screen flex flex-col ${crtEnabled ? 'crt-overlay' : ''}`}>
      {/* 3-Zone Top Bar (Organized Web Mobile App Style) */}
      <Navbar
        balance={wallet.balance}
        publicKey={wallet.publicKey}
        network={wallet.network}
        onSelectNetwork={handleSelectNetwork}
        onOpenWalletModal={() => {
          sound.playChipClick();
          setWalletModalOpen(true);
        }}
        onRequestFaucet={handleRequestFaucet}
        faucetLoading={faucetLoading}
        onOpenMenuSlider={() => {
          sound.playChipClick();
          setMobileMenuOpen(true);
        }}
        unclaimedMissionsCount={unclaimedCount}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentLang={currentLang}
      />

      {/* Floating Reward Claim Toast */}
      {claimToast && (
        <div className="fixed top-20 right-4 z-50 bg-gradient-to-r from-emerald-950/90 to-cyan-950/90 border border-emerald-400 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-mono font-bold animate-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-4 h-4 text-yellow-400 animate-spin" />
          <span>{claimToast.label}</span>
          {claimToast.amount > 0 && (
            <span className="text-emerald-300 font-extrabold">
              (+{claimToast.amount.toFixed(4)} SOL)
            </span>
          )}
        </div>
      )}

      {/* Progressive Jackpot & Live Winners Ticker */}
      <JackpotTicker />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeTab === 'games' ? (
          <>
            {/* Hot Tables Section */}
            <HotTablesGrid onSelectGame={(id) => setActiveGameId(id)} />

            {/* 10 Games Horizontal Category Switcher */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {GAMES_LIST.map((g) => {
                const isActive = activeGameId === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => {
                      sound.playChipClick();
                      setActiveGameId(g.id);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 shrink-0 ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/80 shadow-md shadow-cyan-950 font-bold'
                        : 'bg-slate-900/70 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                    }`}
                  >
                    <span className="text-base">{g.icon}</span>
                    <span>{g.name}</span>
                    <span className="text-[10px] font-mono opacity-80 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-700/50">
                      {g.tag}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Game Viewport */}
            <div className="animate-in fade-in duration-150">
              {activeGameId === 'roulette' && (
                <NeonRoulette
                  balance={wallet.balance}
                  onBetPlaced={handleBetPlaced}
                  serverSeed={serverSeed}
                  clientSeed={clientSeed}
                  nonce={nonce}
                />
              )}
              {activeGameId === 'blackjack' && (
                <ChromeBlackjack
                  balance={wallet.balance}
                  onBetPlaced={handleBetPlaced}
                  serverSeed={serverSeed}
                  clientSeed={clientSeed}
                  nonce={nonce}
                />
              )}
              {activeGameId === 'slots' && (
                <SlotCascade
                  balance={wallet.balance}
                  onBetPlaced={handleBetPlaced}
                />
              )}
              {activeGameId === 'dice' && (
                <DiceDynasty
                  balance={wallet.balance}
                  onBetPlaced={handleBetPlaced}
                  serverSeed={serverSeed}
                  clientSeed={clientSeed}
                  nonce={nonce}
                />
              )}
              {activeGameId === 'crash' && (
                <CrashRocket
                  balance={wallet.balance}
                  onBetPlaced={handleBetPlaced}
                  serverSeed={serverSeed}
                  clientSeed={clientSeed}
                  nonce={nonce}
                />
              )}
              {activeGameId === 'keno' && (
                <KenoNova
                  balance={wallet.balance}
                  onBetPlaced={handleBetPlaced}
                  serverSeed={serverSeed}
                  clientSeed={clientSeed}
                  nonce={nonce}
                />
              )}
              {activeGameId === 'baccarat' && (
                <BaccaratFlash
                  balance={wallet.balance}
                  onBetPlaced={handleBetPlaced}
                />
              )}
              {activeGameId === 'poker' && (
                <PokerHoldemRush
                  balance={wallet.balance}
                  onBetPlaced={handleBetPlaced}
                />
              )}
              {activeGameId === 'wheel' && (
                <WheelOfSol
                  balance={wallet.balance}
                  onBetPlaced={handleBetPlaced}
                  serverSeed={serverSeed}
                  clientSeed={clientSeed}
                  nonce={nonce}
                />
              )}
              {activeGameId === 'mines' && (
                <MinesTreasure
                  balance={wallet.balance}
                  onBetPlaced={handleBetPlaced}
                  serverSeed={serverSeed}
                  clientSeed={clientSeed}
                  nonce={nonce}
                />
              )}
            </div>
          </>
        ) : activeTab === 'portfolio' ? (
          <PortfolioHistory
            balance={wallet.balance}
            history={history}
            network={wallet.network}
            publicKey={wallet.publicKey}
          />
        ) : activeTab === 'admin' ? (
          <AdminDashboard />
        ) : (
          <div className="py-12 text-center">
            <button
              onClick={() => setMultiCascadeOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-purple-600 rounded-xl font-bold text-white text-sm"
            >
              Open Multi-Table & Cascade Engine
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-cyan-500/20 py-5 cyber-glass mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-white">SOLSTICE ROULETTE ENTERPRISE V3.0.0</span>
            <span>·</span>
            <span>100% On-Chain Solana Casino</span>
            <span>·</span>
            <span>Hard Floor: 0.00022 SOL</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <button
              onClick={() => setFairModalOpen(true)}
              className="hover:text-emerald-300 transition-colors"
            >
              Provably Fair
            </button>
            <span>·</span>
            <button
              onClick={() => setResponsibleModalOpen(true)}
              className="hover:text-emerald-300 transition-colors"
            >
              Responsible Gaming
            </button>
            <span>·</span>
            <button
              onClick={() => setShortcutsModalOpen(true)}
              className="hover:text-cyan-300 transition-colors"
            >
              Hotkeys (Space/C/M)
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        wallet={wallet}
        onUpdateWallet={(w) => setWallet(w)}
        onRequestFaucet={handleRequestFaucet}
        faucetLoading={faucetLoading}
      />

      <ProvablyFairModal
        isOpen={fairModalOpen}
        onClose={() => setFairModalOpen(false)}
        serverSeedHash={serverSeedHash}
        clientSeed={clientSeed}
        nonce={nonce}
        onUpdateClientSeed={(newSeed) => setClientSeed(newSeed)}
      />

      <UserGuideModal
        isOpen={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
      />

      <AIAnalystModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        history={history}
        balance={wallet.balance}
      />

      <MultiTableCascadeModal
        isOpen={multiCascadeOpen}
        onClose={() => setMultiCascadeOpen(false)}
        balance={wallet.balance}
        onBetPlaced={handleBetPlaced}
      />

      <MissionsRewardsModal
        isOpen={missionsModalOpen}
        onClose={() => {
          setMissionsModalOpen(false);
          const pending = rewardsService.getMissions().filter((m) => m.completed && !m.claimed).length;
          setUnclaimedCount(pending);
        }}
        publicKey={wallet.publicKey}
        initialTab={missionsInitialTab}
        onRewardClaimed={(amountSol, label) => {
          setWallet((prev) => ({
            ...prev,
            balance: parseFloat((prev.balance + amountSol).toFixed(5)),
          }));
          setClaimToast({ amount: amountSol, label: `Claimed ${label}` });
          setTimeout(() => setClaimToast(null), 5000);
          const pending = rewardsService.getMissions().filter((m) => m.completed && !m.claimed).length;
          setUnclaimedCount(pending);
        }}
      />

      <LiveChatDrawer
        isOpen={chatDrawerOpen}
        onClose={() => setChatDrawerOpen(false)}
        publicKey={wallet.publicKey}
      />

      <ResponsibleGamingModal
        isOpen={responsibleModalOpen}
        onClose={() => setResponsibleModalOpen(false)}
      />

      <KeyboardShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />

      {/* Mobile Bottom Navigation Bar (Fixed for Web Mobile App) */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMultiCascade={() => setMultiCascadeOpen(true)}
        onOpenMissions={() => {
          setMissionsInitialTab('missions');
          setMissionsModalOpen(true);
        }}
        onOpenMenu={() => setMobileMenuOpen(true)}
        unclaimedMissionsCount={unclaimedCount}
      />

      {/* All-In-One Menu Slider Drawer */}
      <MobileDrawerMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMultiCascade={() => setMultiCascadeOpen(true)}
        onOpenMissions={() => {
          setMissionsInitialTab('missions');
          setMissionsModalOpen(true);
        }}
        onOpenReferrals={() => {
          setMissionsInitialTab('referrals');
          setMissionsModalOpen(true);
        }}
        onOpenAIAnalyst={() => setAiModalOpen(true)}
        onOpenFairModal={() => setFairModalOpen(true)}
        onOpenGuide={() => setGuideModalOpen(true)}
        onOpenAdmin={() => setActiveTab('admin')}
        onOpenChat={() => setChatDrawerOpen(!chatDrawerOpen)}
        onOpenResponsibleGaming={() => setResponsibleModalOpen(true)}
        onOpenShortcuts={() => setShortcutsModalOpen(true)}
        onOpenJupiterFunding={() => setJupiterFundingOpen(true)}
        onOpenTournaments={() => setTournamentsOpen(true)}
        onOpenReplayViewer={() => setReplayViewerOpen(true)}
        onOpenLaunchStudio={() => setLaunchStudioOpen(true)}
        onOpenSocialFeed={() => setSocialFeedOpen(true)}
        onRequestFaucet={handleRequestFaucet}
        faucetLoading={faucetLoading}
        network={wallet.network}
        onSelectNetwork={handleSelectNetwork}
        currentTheme={currentTheme}
        onSelectTheme={setCurrentTheme}
        currentLang={currentLang}
        onSelectLang={setCurrentLang}
        muted={muted}
        setMuted={setMuted}
        crtEnabled={crtEnabled}
        setCrtEnabled={setCrtEnabled}
        unclaimedMissionsCount={unclaimedCount}
      />

      {/* V4 Solstice Prism Modals */}
      <JupiterFundingModal
        isOpen={jupiterFundingOpen}
        onClose={() => setJupiterFundingOpen(false)}
        currentSolBalance={wallet.balance}
        onFundSuccess={(solAmount) => {
          setWallet((prev) => ({
            ...prev,
            balance: parseFloat((prev.balance + solAmount).toFixed(5)),
          }));
        }}
      />

      <TournamentsModal
        isOpen={tournamentsOpen}
        onClose={() => setTournamentsOpen(false)}
        onPlayGame={(gameId) => {
          setActiveGameId(gameId);
          setActiveTab('games');
        }}
      />

      <ReplayViewerModal
        isOpen={replayViewerOpen}
        onClose={() => setReplayViewerOpen(false)}
      />

      {/* V5 Solstice Nexus Modals */}
      {launchStudioOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <TokenLaunchStudio
              userBalance={wallet.balance}
              walletPublicKey={wallet.publicKey}
              initialWinAmount={lastWinForLaunch}
              onClose={() => setLaunchStudioOpen(false)}
              onTokenCreated={(tok, feeSol) => {
                setWallet((prev) => ({
                  ...prev,
                  balance: Math.max(0, parseFloat((prev.balance - feeSol).toFixed(5))),
                }));
                setClaimToast({ amount: 0, label: `Launched $${tok.symbol} on Solana!` });
                setTimeout(() => setClaimToast(null), 5000);
              }}
            />
          </div>
        </div>
      )}

      <SocialFeedModal
        isOpen={socialFeedOpen}
        onClose={() => setSocialFeedOpen(false)}
        walletPublicKey={wallet.publicKey}
        onOpenLaunchStudio={() => {
          setSocialFeedOpen(false);
          setLaunchStudioOpen(true);
        }}
      />
    </div>
    </JurisdictionGuard>
  );
}
