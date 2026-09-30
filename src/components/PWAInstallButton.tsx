import React from 'react';
import { Download, CheckCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { sound } from '../utils/audio';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall();

  // If already running as an installed PWA, render small status pill
  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
        <span>PWA Active</span>
      </div>
    );
  }

  // Chromium / Android / Desktop native install flow
  if (isInstallable) {
    return (
      <button
        onClick={() => {
          sound.playChipClick();
          install();
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs font-bold shadow-lg shadow-purple-950 border border-purple-400/40 transition-all active:scale-95 animate-pulse"
      >
        <Download className="w-3.5 h-3.5 text-purple-200" />
        <span>Install App</span>
      </button>
    );
  }

  // No banner or popup for iOS / unsupported browsers
  return null;
};
