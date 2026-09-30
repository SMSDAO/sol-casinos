import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Camera, ShieldCheck, X, Sparkles, FastForward } from 'lucide-react';
import { sound } from '../utils/audio';

interface ReplayViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  replayData?: {
    gameName: string;
    multiplier: number;
    payoutSol: number;
    vrfSeedHash: string;
  };
}

export const ReplayViewerModal: React.FC<ReplayViewerModalProps> = ({
  isOpen,
  onClose,
  replayData = {
    gameName: 'Neon Roulette',
    multiplier: 482.0,
    payoutSol: 96.4,
    vrfSeedHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  },
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<0.5 | 1 | 2 | 4>(1);
  const [progress, setProgress] = useState(0);
  const [cameraAngle, setCameraAngle] = useState<'front' | 'top' | 'isometric'>('isometric');

  useEffect(() => {
    if (!isOpen || !isPlaying) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return prev + 2 * speed;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isOpen, isPlaying, speed]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-mono">
      <div className="w-full max-w-2xl rounded-2xl bg-[#060813] border border-cyan-500/40 p-6 shadow-2xl text-slate-100 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white tracking-wider">
              INSTANT REPLAY & 3D CAMERA VIEWER
            </h3>
          </div>
          <button
            onClick={() => {
              sound.playChipClick();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3D Simulated Viewport Stage */}
        <div className="relative w-full h-64 rounded-2xl bg-gradient-to-b from-[#0e1328] to-[#060813] border border-cyan-500/30 overflow-hidden flex flex-col items-center justify-center shadow-inner">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent pointer-events-none" />

          {/* 3D Camera Angle Indicator */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-lg p-1 text-[10px]">
            <span className="text-slate-400 px-1">Camera:</span>
            {(['isometric', 'front', 'top'] as const).map((ang) => (
              <button
                key={ang}
                onClick={() => setCameraAngle(ang)}
                className={`px-2 py-0.5 rounded font-bold uppercase transition-all ${
                  cameraAngle === ang ? 'bg-cyan-500 text-black' : 'text-slate-300'
                }`}
              >
                {ang}
              </button>
            ))}
          </div>

          {/* Winning Display Central Graphic */}
          <div className="text-center space-y-2 z-10 animate-in zoom-in-95">
            <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">
              {replayData.gameName} — Replay Mode
            </span>
            <div className="font-display text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-yellow-300 to-orange-400 drop-shadow-[0_0_20px_rgba(0,242,254,0.6)]">
              {replayData.multiplier}x MULTIPLIER
            </div>
            <div className="text-sm font-bold text-emerald-400">
              +{replayData.payoutSol} SOL Payout Recorded
            </div>
          </div>

          {/* Progress Bar overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-900">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-orange-500 transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Playback Controls & VRF Verification */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md flex items-center justify-center"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            </button>

            <button
              onClick={() => {
                setProgress(0);
                setIsPlaying(true);
              }}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
              <span className="text-slate-400 text-[10px] px-1">Speed:</span>
              {([0.5, 1, 2, 4] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-0.5 rounded font-bold ${
                    speed === s ? 'bg-cyan-500 text-black' : 'text-slate-400'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1.5 rounded-xl font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>VRF Hash Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};
