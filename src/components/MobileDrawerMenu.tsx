import React from 'react';
import {
  X,
  Gamepad2,
  Layers,
  Wallet,
  Gift,
  Users,
  BrainCircuit,
  ShieldCheck,
  BookOpen,
  Server,
  HeartHandshake,
  Keyboard,
  RefreshCw,
  Sparkles,
  Volume2,
  VolumeX,
  Tv,
  Globe,
  Palette,
  MessageSquare,
  Smartphone,
  Zap,
  Trophy,
  Camera,
  Rocket,
  Heart,
} from 'lucide-react';
import { NetworkCluster, NETWORKS } from '../services/solana';
import { THEMES, TRANSLATIONS, SupportedLanguage, SupportedTheme } from '../services/i18n';
import { sound } from '../utils/audio';
import { PWAInstallButton } from './PWAInstallButton';

interface MenuSliderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'games' | 'portfolio' | 'multi' | 'admin';
  setActiveTab: (tab: 'games' | 'portfolio' | 'multi' | 'admin') => void;
  onOpenMultiCascade: () => void;
  onOpenMissions: () => void;
  onOpenReferrals: () => void;
  onOpenAIAnalyst: () => void;
  onOpenFairModal: () => void;
  onOpenGuide: () => void;
  onOpenAdmin: () => void;
  onOpenChat: () => void;
  onOpenResponsibleGaming: () => void;
  onOpenShortcuts: () => void;
  onOpenJupiterFunding?: () => void;
  onOpenTournaments?: () => void;
  onOpenReplayViewer?: () => void;
  onOpenLaunchStudio?: () => void;
  onOpenSocialFeed?: () => void;
  onRequestFaucet: () => void;
  faucetLoading: boolean;
  network: NetworkCluster;
  onSelectNetwork: (net: NetworkCluster) => void;
  currentTheme: string;
  onSelectTheme: (theme: SupportedTheme) => void;
  currentLang: string;
  onSelectLang: (lang: SupportedLanguage) => void;
  muted: boolean;
  setMuted: (val: boolean) => void;
  crtEnabled: boolean;
  setCrtEnabled: (val: boolean) => void;
  unclaimedMissionsCount?: number;
}

export const MobileDrawerMenu: React.FC<MenuSliderDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  onOpenMultiCascade,
  onOpenMissions,
  onOpenReferrals,
  onOpenAIAnalyst,
  onOpenFairModal,
  onOpenGuide,
  onOpenAdmin,
  onOpenChat,
  onOpenResponsibleGaming,
  onOpenShortcuts,
  onOpenJupiterFunding,
  onOpenTournaments,
  onOpenReplayViewer,
  onOpenLaunchStudio,
  onOpenSocialFeed,
  onRequestFaucet,
  faucetLoading,
  network,
  onSelectNetwork,
  currentTheme,
  onSelectTheme,
  currentLang,
  onSelectLang,
  muted,
  setMuted,
  crtEnabled,
  setCrtEnabled,
  unclaimedMissionsCount = 0,
}) => {
  if (!isOpen) return null;

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    sound.setMuted(next);
    if (!next) sound.playChipClick();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm h-full bg-[#060813] border-l border-cyan-500/30 p-5 space-y-5 overflow-y-auto flex flex-col justify-between shadow-2xl font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="font-display font-extrabold text-white text-base tracking-wider">
              ALL-IN-ONE MENU
            </span>
          </div>
          <button
            onClick={() => {
              sound.playChipClick();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Main Platform Navigation */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block mb-1">
            Platform Navigation
          </span>

          <button
            onClick={() => {
              sound.playChipClick();
              onClose();
              setActiveTab('games');
            }}
            className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all ${
              activeTab === 'games'
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 font-bold shadow-md shadow-cyan-950'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-cyan-400" />
              <span>10 Casino Games</span>
            </div>
            <span className="text-[10px] text-cyan-400">Live</span>
          </button>

          <button
            onClick={() => {
              sound.playChipClick();
              onClose();
              setActiveTab('multi');
              onOpenMultiCascade();
            }}
            className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all ${
              activeTab === 'multi'
                ? 'bg-orange-950/80 border-orange-400 text-orange-200 font-bold shadow-md shadow-orange-950'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-400" />
              <span>Multi-Table & Cascade</span>
            </div>
            <span className="text-[10px] text-orange-400 font-bold">Compounding</span>
          </button>

          <button
            onClick={() => {
              sound.playChipClick();
              onClose();
              setActiveTab('portfolio');
            }}
            className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all ${
              activeTab === 'portfolio'
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 font-bold shadow-md shadow-cyan-950'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-cyan-400" />
              <span>Portfolio & History</span>
            </div>
          </button>

          <button
            onClick={() => {
              sound.playChipClick();
              onClose();
              onOpenMissions();
            }}
            className="w-full p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 flex items-center justify-between hover:bg-slate-800"
          >
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-yellow-400" />
              <span>Missions & Streaks</span>
            </div>
            {unclaimedMissionsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white font-bold text-[10px] animate-bounce">
                {unclaimedMissionsCount} Pending
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sound.playChipClick();
              onClose();
              onOpenReferrals();
            }}
            className="w-full p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 flex items-center justify-between hover:bg-slate-800"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Referral Program</span>
            </div>
            <span className="text-[10px] text-purple-400 font-bold">15% Rakeback</span>
          </button>
        </div>

        {/* Section 2: Enterprise Tools & Analytics */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800">
          <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block mb-1">
            V5 Nexus Pillars
          </span>

          {onOpenLaunchStudio && (
            <button
              onClick={() => {
                sound.playChipClick();
                onClose();
                onOpenLaunchStudio();
              }}
              className="w-full p-2.5 rounded-xl bg-gradient-to-r from-purple-950 via-pink-950 to-red-950 border border-purple-500/50 text-purple-200 flex items-center justify-between hover:bg-slate-800"
            >
              <div className="flex items-center gap-2 font-bold">
                <Rocket className="w-4 h-4 text-pink-400" />
                <span>SPL Token Launch Studio</span>
              </div>
              <span className="text-[10px] text-pink-300 font-bold">Logo Upload</span>
            </button>
          )}

          {onOpenSocialFeed && (
            <button
              onClick={() => {
                sound.playChipClick();
                onClose();
                onOpenSocialFeed();
              }}
              className="w-full p-2.5 rounded-xl bg-gradient-to-r from-pink-950/80 to-purple-950/80 border border-pink-500/40 text-pink-200 flex items-center justify-between hover:bg-slate-800"
            >
              <div className="flex items-center gap-2 font-bold">
                <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
                <span>Social Like & Play Feed</span>
              </div>
              <span className="text-[10px] text-pink-300 font-bold">Community</span>
            </button>
          )}

          {onOpenJupiterFunding && (
            <button
              onClick={() => {
                sound.playChipClick();
                onClose();
                onOpenJupiterFunding();
              }}
              className="w-full p-2.5 rounded-xl bg-gradient-to-r from-cyan-950 to-blue-950 border border-cyan-500/40 text-cyan-200 flex items-center justify-between hover:bg-slate-800"
            >
              <div className="flex items-center gap-2 font-bold">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>Jupiter 1-Click Funding</span>
              </div>
              <span className="text-[10px] text-cyan-300 font-bold">Swap SPL</span>
            </button>
          )}

          {onOpenTournaments && (
            <button
              onClick={() => {
                sound.playChipClick();
                onClose();
                onOpenTournaments();
              }}
              className="w-full p-2.5 rounded-xl bg-gradient-to-r from-yellow-950/80 to-orange-950/80 border border-yellow-500/40 text-yellow-200 flex items-center justify-between hover:bg-slate-800"
            >
              <div className="flex items-center gap-2 font-bold">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span>Tournaments & Challenges</span>
              </div>
              <span className="text-[10px] text-yellow-400 font-bold">50 SOL Pool</span>
            </button>
          )}

          {onOpenReplayViewer && (
            <button
              onClick={() => {
                sound.playChipClick();
                onClose();
                onOpenReplayViewer();
              }}
              className="w-full p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 flex items-center justify-between hover:bg-slate-800"
            >
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-purple-400" />
                <span>3D Replay & Camera</span>
              </div>
              <span className="text-[10px] text-purple-300">VRF Proof</span>
            </button>
          )}

          <button
            onClick={() => {
              sound.playChipClick();
              onClose();
              onOpenAIAnalyst();
            }}
            className="w-full p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 flex items-center justify-between hover:bg-slate-800"
          >
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-cyan-400" />
              <span>AI Quant Strategy</span>
            </div>
            <span className="text-[10px] text-cyan-400">Gemini 3.8</span>
          </button>

          <button
            onClick={() => {
              sound.playChipClick();
              onClose();
              onOpenFairModal();
            }}
            className="w-full p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 flex items-center justify-between hover:bg-slate-800"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Provably Fair SHA-256</span>
            </div>
            <span className="text-[10px] text-emerald-400">VRF Engine</span>
          </button>

          <button
            onClick={() => {
              sound.playChipClick();
              onClose();
              onOpenGuide();
            }}
            className="w-full p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 flex items-center justify-between hover:bg-slate-800"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-yellow-400" />
              <span>10 Game Paytables & Rules</span>
            </div>
          </button>

          <button
            onClick={() => {
              sound.playChipClick();
              onClose();
              onOpenAdmin();
            }}
            className="w-full p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 flex items-center justify-between hover:bg-slate-800"
          >
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>Admin Operator Console</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">Multi-Sig</span>
          </button>

          <button
            onClick={() => {
              sound.playChipClick();
              onClose();
              onOpenChat();
            }}
            className="w-full p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 flex items-center justify-between hover:bg-slate-800"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>High-Roller Live Room</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">Live Chat</span>
          </button>

          <button
            onClick={() => {
              sound.playChipClick();
              onClose();
              onOpenResponsibleGaming();
            }}
            className="w-full p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 flex items-center justify-between hover:bg-slate-800"
          >
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-emerald-400" />
              <span>Responsible Gaming Locks</span>
            </div>
          </button>

          <button
            onClick={() => {
              sound.playChipClick();
              onClose();
              onOpenShortcuts();
            }}
            className="w-full p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 flex items-center justify-between hover:bg-slate-800"
          >
            <div className="flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-cyan-400" />
              <span>Keyboard Hotkeys</span>
            </div>
          </button>
        </div>

        {/* Section 3: Audio, Theme & Network System Settings */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block mb-1">
              System Settings & App Install
            </span>
            <PWAInstallButton />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 ${
                muted ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300'
              }`}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{muted ? 'Audio Off' : 'Audio On'}</span>
            </button>

            <button
              onClick={() => setCrtEnabled(!crtEnabled)}
              className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 ${
                crtEnabled ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>{crtEnabled ? 'CRT On' : 'CRT Off'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-slate-400 text-[9px] uppercase block mb-0.5">Theme</label>
              <select
                value={currentTheme}
                onChange={(e) => onSelectTheme(e.target.value as SupportedTheme)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 focus:outline-none"
              >
                {THEMES.map((th) => (
                  <option key={th.id} value={th.id}>
                    {th.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 text-[9px] uppercase block mb-0.5">Language</label>
              <select
                value={currentLang}
                onChange={(e) => onSelectLang(e.target.value as SupportedLanguage)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 focus:outline-none uppercase"
              >
                <option value="en">EN</option>
                <option value="es">ES</option>
                <option value="ja">JA</option>
                <option value="zh">ZH</option>
                <option value="de">DE</option>
                <option value="fr">FR</option>
              </select>
            </div>
          </div>

          {(network === 'devnet' || network === 'testnet') && (
            <button
              onClick={onRequestFaucet}
              disabled={faucetLoading}
              className="w-full mt-2 py-2.5 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-950"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${faucetLoading ? 'animate-spin' : ''}`} />
              <span>{faucetLoading ? 'Airdropping...' : 'Claim 2 SOL Devnet Faucet'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
