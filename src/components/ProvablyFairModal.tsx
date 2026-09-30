import React, { useState } from 'react';
import { X, ShieldCheck, RefreshCw, Copy, Check, Calculator, Key, Hash } from 'lucide-react';
import { sha256, generateRandomHex, getVerifiableFloat } from '../utils/provablyFair';
import { sound } from '../utils/audio';

interface ProvablyFairModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  onUpdateClientSeed: (newSeed: string) => void;
}

export const ProvablyFairModal: React.FC<ProvablyFairModalProps> = ({
  isOpen,
  onClose,
  serverSeedHash,
  clientSeed,
  nonce,
  onUpdateClientSeed,
}) => {
  const [customClientSeed, setCustomClientSeed] = useState(clientSeed);
  const [verifyServerSeed, setVerifyServerSeed] = useState('');
  const [verifyClientSeed, setVerifyClientSeed] = useState(clientSeed);
  const [verifyNonce, setVerifyNonce] = useState(nonce.toString());
  const [verifyGame, setVerifyGame] = useState<'roulette' | 'crash' | 'dice' | 'mines'>('roulette');
  const [calcResult, setCalcResult] = useState<string | null>(null);
  const [calcHash, setCalcHash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleRandomizeClientSeed = () => {
    sound.playChipClick();
    const newSeed = generateRandomHex(16);
    setCustomClientSeed(newSeed);
    onUpdateClientSeed(newSeed);
  };

  const handleVerify = async () => {
    sound.playChipClick();
    if (!verifyServerSeed.trim()) {
      setCalcResult('Please enter an unhashed Server Seed to verify.');
      return;
    }
    const derivedHash = await sha256(verifyServerSeed.trim());
    setCalcHash(derivedHash);

    const n = parseInt(verifyNonce, 10) || 0;
    const floatVal = await getVerifiableFloat(verifyServerSeed.trim(), verifyClientSeed.trim(), n);

    if (verifyGame === 'roulette') {
      const num = Math.floor(floatVal * 37);
      setCalcResult(`Outcome: Number ${num} (Calculated from float ${floatVal.toFixed(8)})`);
    } else if (verifyGame === 'crash') {
      const crashPoint = Math.max(1.01, Math.min(1000.0, 0.98 / (1.0 - floatVal * 0.97)));
      setCalcResult(`Outcome: ${crashPoint.toFixed(2)}x Crash Multiplier (Calculated from float ${floatVal.toFixed(8)})`);
    } else if (verifyGame === 'dice') {
      const roll = (floatVal * 100).toFixed(2);
      setCalcResult(`Outcome: ${roll} Roll (Calculated from float ${floatVal.toFixed(8)})`);
    } else if (verifyGame === 'mines') {
      setCalcResult(`Outcome: Mines randomized with seed sequence (Float: ${floatVal.toFixed(8)})`);
    }
    sound.playWin();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl cyber-glass-glow rounded-2xl p-6 relative text-slate-100 shadow-2xl border border-emerald-500/30 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display tracking-wide text-white">
                Provably Fair Cryptographic Verifier
              </h2>
              <p className="text-xs text-slate-400">
                SHA-256 Commit-Reveal + Verifiable Random Float Generation
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

        {/* Current Active Round Seeds */}
        <div className="space-y-4 mb-6">
          <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5" />
            Active Round Cryptographic Seeds
          </h3>

          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Server Seed Hash (SHA-256 Committed Before Roll)</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(serverSeedHash);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="font-mono text-xs text-emerald-300 break-all select-all">
              {serverSeedHash}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400">Your Client Seed</span>
                <button
                  onClick={handleRandomizeClientSeed}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Randomize
                </button>
              </div>
              <input
                type="text"
                value={customClientSeed}
                onChange={(e) => {
                  setCustomClientSeed(e.target.value);
                  onUpdateClientSeed(e.target.value);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60">
              <span className="text-xs text-slate-400 block mb-1.5">Current Nonce (Roll Count)</span>
              <span className="font-mono text-base font-bold text-white block pt-1">
                {nonce}
              </span>
            </div>
          </div>
        </div>

        {/* Verification Calculator */}
        <div className="p-4 bg-emerald-950/20 rounded-xl border border-emerald-500/30 space-y-4">
          <h3 className="text-xs font-semibold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5" />
            Independent Outcome Verifier
          </h3>

          <p className="text-xs text-slate-300 leading-relaxed">
            When a round concludes or seeds are revealed, enter the unhashed Server Seed and Client Seed below to recalculate the exact deterministic outcome independently.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Server Seed (Unhashed)</label>
              <input
                type="text"
                value={verifyServerSeed}
                onChange={(e) => setVerifyServerSeed(e.target.value)}
                placeholder="e.g. 7f89ab10c..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Game Mode</label>
              <select
                value={verifyGame}
                onChange={(e) => setVerifyGame(e.target.value as 'roulette' | 'crash' | 'dice' | 'mines')}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-medium focus:outline-none focus:border-emerald-400"
              >
                <option value="roulette">Neon Roulette (0-36)</option>
                <option value="crash">Crash Rocket (1.00x - 1000x)</option>
                <option value="dice">Dice Dynasty (0.00 - 99.99)</option>
                <option value="mines">Mines & Treasure</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleVerify}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/80"
          >
            <Hash className="w-4 h-4" />
            Compute & Verify Mathematical Result
          </button>

          {calcResult && (
            <div className="p-3 bg-slate-900/90 rounded-lg border border-emerald-500/40 text-xs space-y-1.5">
              <span className="font-semibold text-emerald-400 block">{calcResult}</span>
              {calcHash && (
                <span className="text-[11px] text-slate-400 font-mono block break-all">
                  SHA-256 Checksum: {calcHash}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
