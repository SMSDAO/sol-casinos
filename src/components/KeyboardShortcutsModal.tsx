import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';
import { sound } from '../utils/audio';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const SHORTCUTS = [
    { key: 'Space', desc: 'Execute primary action (Spin / Deal / Roll / Launch)' },
    { key: 'C', desc: 'Cash out active round (Crash Rocket / Mines)' },
    { key: 'M', desc: 'Toggle Master Audio Sound FX (Mute/Unmute)' },
    { key: '1, 2, 3, 4', desc: 'Quick-select bet presets (0.001, 0.01, 0.05, 0.1 SOL)' },
    { key: 'D', desc: 'Double active bet wager amount (2×)' },
    { key: 'H', desc: 'Halve active bet wager amount (½)' },
    { key: 'Esc', desc: 'Close any active overlay modal' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-lg cyber-glass-glow rounded-2xl p-6 relative text-slate-100 shadow-2xl border border-cyan-500/40">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-white">Keyboard Hotkeys & Accessibility</h2>
              <p className="text-xs text-slate-400">WCAG 2.2 AA Keyboard Navigation</p>
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

        <div className="space-y-2 font-mono text-xs">
          {SHORTCUTS.map((s, i) => (
            <div
              key={i}
              className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between"
            >
              <span className="text-slate-300 font-sans">{s.desc}</span>
              <kbd className="px-2.5 py-1 bg-slate-950 text-cyan-300 border border-cyan-500/40 rounded-lg font-bold shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
