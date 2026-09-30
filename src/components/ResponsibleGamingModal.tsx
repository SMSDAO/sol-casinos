import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Clock,
  Ban,
  AlertTriangle,
  Lock,
  CheckCircle2,
  HeartHandshake,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface ResponsibleGamingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResponsibleGamingModal: React.FC<ResponsibleGamingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [lossLimitSol, setLossLimitSol] = useState('5.0');
  const [sessionReminderMins, setSessionReminderMins] = useState('45');
  const [selfExclusionDays, setSelfExclusionDays] = useState<'none' | '1' | '7' | '30'>('none');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveLimits = () => {
    sound.playChipClick();
    localStorage.setItem(
      'solstice_responsible_gaming_limits',
      JSON.stringify({
        lossLimitSol,
        sessionReminderMins,
        selfExclusionDays,
        updatedAt: Date.now(),
      })
    );
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-xl cyber-glass-glow rounded-2xl p-6 relative text-slate-100 shadow-2xl border border-emerald-500/40">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display tracking-wide text-white">
                Responsible Gaming Controls
              </h2>
              <p className="text-xs text-slate-400">
                Bankroll Protection, Loss Limits & Self-Exclusion Scaffolding
              </p>
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

        {savedSuccess ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <p className="text-sm font-bold text-white">Safety Limits Saved Successfully</p>
            <p className="text-xs text-slate-400">Your custom limits are now actively enforced.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Daily Loss Limit */}
            <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-700/60 space-y-1.5">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>24-Hour Max Loss Limit (SOL)</span>
              </label>
              <p className="text-[11px] text-slate-400">
                Prevents further wagering once net daily loss hits this ceiling.
              </p>
              <input
                type="number"
                step="0.5"
                min="0.1"
                value={lossLimitSol}
                onChange={(e) => setLossLimitSol(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* Reality Check Reminder */}
            <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-700/60 space-y-1.5">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Reality Check Session Interval (Minutes)</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['15', '30', '45', '60'].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSessionReminderMins(mins)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      sessionReminderMins === mins
                        ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-200'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mins} Min
                  </button>
                ))}
              </div>
            </div>

            {/* Self-Exclusion Lock */}
            <div className="p-3.5 bg-slate-900/80 rounded-xl border border-red-500/30 space-y-1.5">
              <label className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                <Ban className="w-4 h-4" />
                <span>Temporary Account Cooldown / Self-Exclusion</span>
              </label>
              <p className="text-[11px] text-slate-400">
                Temporarily lock wagering functionality on this device.
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Off', val: 'none' },
                  { label: '24 Hours', val: '1' },
                  { label: '7 Days', val: '7' },
                  { label: '30 Days', val: '30' },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setSelfExclusionDays(opt.val as 'none' | '1' | '7' | '30')}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      selfExclusionDays === opt.val
                        ? 'bg-red-500/30 border border-red-400 text-red-200'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSaveLimits}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Lock className="w-4 h-4" />
              <span>Apply Responsible Gaming Configuration</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
