import React from 'react';
import {
  Wallet,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { NetworkCluster } from '../services/solana';
import { TRANSLATIONS, SupportedLanguage } from '../services/i18n';
import { sound } from '../utils/audio';
import { PWAInstallButton } from './PWAInstallButton';
import { NotificationCenter } from './NotificationCenter';

interface NavbarProps {
  balance: number;
  publicKey: string | null;
  network: NetworkCluster;
  onSelectNetwork: (net: NetworkCluster) => void;
  onOpenWalletModal: () => void;
  onRequestFaucet: () => void;
  faucetLoading: boolean;
  onOpenMenuSlider: () => void;
  unclaimedMissionsCount?: number;
  activeTab: 'games' | 'portfolio' | 'multi' | 'admin';
  setActiveTab: (tab: 'games' | 'portfolio' | 'multi' | 'admin') => void;
  currentLang: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  balance,
  publicKey,
  network,
  onOpenWalletModal,
  onRequestFaucet,
  faucetLoading,
  onOpenMenuSlider,
  unclaimedMissionsCount = 0,
  activeTab,
  setActiveTab,
  currentLang,
}) => {
  const t = TRANSLATIONS[currentLang as SupportedLanguage] || TRANSLATIONS.en;

  const truncatedPubkey = publicKey
    ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
    : null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-cyan-500/20 cyber-glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        {/* Zone 1: Icon Logo Only */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              sound.playChipClick();
              setActiveTab('games');
            }}
            title="Solstice Roulette - Home"
            className="flex items-center text-left group active:scale-95 transition-transform"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-600 to-orange-500 p-0.5 shadow-lg shadow-cyan-500/30 group-hover:shadow-cyan-500/60 transition-shadow">
              <div className="w-full h-full bg-[#060813] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
          </button>
        </div>

        {/* Zone 2: Optimized Right Controls & All-In-One Menu Slider Icon */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 1-Click Devnet Faucet (Devnet/Testnet) */}
          {(network === 'devnet' || network === 'testnet') && (
            <button
              onClick={onRequestFaucet}
              disabled={faucetLoading}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-orange-200 bg-orange-950/70 border border-orange-500/50 hover:bg-orange-900/80 rounded-xl transition-all shadow-sm shadow-orange-950"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-orange-400 ${faucetLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{faucetLoading ? 'Claiming...' : 'Claim 2 SOL'}</span>
              <span className="sm:hidden font-mono font-bold">2 SOL</span>
            </button>
          )}

          {/* PWA Native Install Button */}
          <PWAInstallButton />

          {/* In-App Notification Center */}
          <NotificationCenter />

          {/* Wallet Balance Pill */}
          <button
            onClick={() => {
              sound.playChipClick();
              onOpenWalletModal();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-950/80 border border-cyan-400/40 transition-all active:scale-95"
          >
            <Wallet className="w-3.5 h-3.5 text-cyan-200" />
            <span className="font-mono font-bold tracking-tight text-white">
              {balance.toFixed(3)} SOL
            </span>
          </button>

          {/* All-In-One Menu Slider Icon Button */}
          <button
            onClick={() => {
              sound.playChipClick();
              onOpenMenuSlider();
            }}
            title="Open Menu Slider"
            className="p-2 rounded-xl bg-slate-900/90 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white shadow-md shadow-cyan-950 transition-all relative flex items-center justify-center active:scale-95"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {unclaimedMissionsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white font-mono text-[9px] font-bold flex items-center justify-center animate-bounce">
                {unclaimedMissionsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
