import React from 'react';
import { Gamepad2, Flame, Layers, Wallet, Gift, Menu } from 'lucide-react';
import { sound } from '../utils/audio';

interface MobileBottomNavProps {
  activeTab: 'games' | 'portfolio' | 'multi' | 'admin';
  setActiveTab: (tab: 'games' | 'portfolio' | 'multi' | 'admin') => void;
  onOpenMultiCascade: () => void;
  onOpenMissions: () => void;
  onOpenMenu: () => void;
  unclaimedMissionsCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenMultiCascade,
  onOpenMissions,
  onOpenMenu,
  unclaimedMissionsCount = 0,
}) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#060813]/95 backdrop-blur-xl border-t border-cyan-500/20 px-2 py-2 shadow-2xl safe-area-bottom">
      <div className="grid grid-cols-5 gap-1 text-center font-mono text-[10px]">
        {/* Games Tab */}
        <button
          onClick={() => {
            sound.playChipClick();
            setActiveTab('games');
          }}
          className={`py-1.5 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === 'games'
              ? 'text-cyan-400 font-bold bg-cyan-950/60 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gamepad2 className="w-5 h-5" />
          <span>Games</span>
        </button>

        {/* Multi-Table Tab */}
        <button
          onClick={() => {
            sound.playChipClick();
            setActiveTab('multi');
            onOpenMultiCascade();
          }}
          className={`py-1.5 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === 'multi'
              ? 'text-orange-400 font-bold bg-orange-950/60 border border-orange-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-5 h-5 text-orange-400" />
          <span>Multi</span>
        </button>

        {/* Portfolio Tab */}
        <button
          onClick={() => {
            sound.playChipClick();
            setActiveTab('portfolio');
          }}
          className={`py-1.5 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === 'portfolio'
              ? 'text-cyan-400 font-bold bg-cyan-950/60 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span>Portfolio</span>
        </button>

        {/* Rewards / Missions */}
        <button
          onClick={() => {
            sound.playChipClick();
            onOpenMissions();
          }}
          className="py-1.5 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-200 relative"
        >
          <Gift className="w-5 h-5 text-yellow-400" />
          <span>Rewards</span>
          {unclaimedMissionsCount > 0 && (
            <span className="absolute top-1 right-3 w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center animate-bounce">
              {unclaimedMissionsCount}
            </span>
          )}
        </button>

        {/* Mobile Menu Drawer Trigger */}
        <button
          onClick={() => {
            sound.playChipClick();
            onOpenMenu();
          }}
          className="py-1.5 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-200"
        >
          <Menu className="w-5 h-5 text-purple-400" />
          <span>Menu</span>
        </button>
      </div>
    </div>
  );
};
