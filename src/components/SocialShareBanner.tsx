import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Twitter,
  ExternalLink,
  Flame,
  Award,
  Zap,
  Sparkles,
  Camera,
  CheckCircle,
  Maximize2,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface SocialShareBannerProps {
  playerName?: string;
  gameName?: string;
  multiplier?: number;
  winAmountSol?: number;
  mintAddress?: string;
  tokenSymbol?: string;
  onClose?: () => void;
}

export const SocialShareBanner: React.FC<SocialShareBannerProps> = ({
  playerName = 'CyberDegen_X',
  gameName = 'Neon Roulette',
  multiplier = 36.0,
  winAmountSol = 0.852,
  mintAddress,
  tokenSymbol,
  onClose,
}) => {
  const [theme, setTheme] = useState<'neon' | 'gold' | 'obsidian'>('neon');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedFarcaster, setCopiedFarcaster] = useState<boolean>(false);

  const getThemeClass = () => {
    switch (theme) {
      case 'gold':
        return 'bg-gradient-to-br from-yellow-950 via-slate-950 to-amber-950 border-amber-400/60 shadow-amber-950/40';
      case 'obsidian':
        return 'bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 border-slate-600 shadow-slate-950/40';
      default:
        return 'bg-gradient-to-br from-cyan-950 via-slate-950 to-purple-950 border-cyan-400/60 shadow-cyan-950/40';
    }
  };

  const getGlowText = () => {
    switch (theme) {
      case 'gold':
        return 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]';
      case 'obsidian':
        return 'text-slate-200 drop-shadow-[0_0_8px_rgba(241,245,249,0.5)]';
      default:
        return 'text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]';
    }
  };

  const shareText = tokenSymbol
    ? `🔥 I just launched $${tokenSymbol} with a Fair Launch Bonding Curve on Solstice Roulette! Swap & trade on-chain metadata: `
    : `🎰 BOOM! I just hit a massive ${multiplier}x win on ${gameName} at Solstice Roulette Casino! Real-time on-chain proof verified. `;

  const appUrl = 'https://ais-dev-wodqg4vjvosq73rhbpcsrn-58325421054.us-east5.run.app';

  const handleCopyTwitter = () => {
    sound.playChipClick();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(appUrl)}`;
    window.open(twitterUrl, '_blank');
  };

  const handleCopyLink = () => {
    sound.playChipClick();
    navigator.clipboard.writeText(`${appUrl}?win=${multiplier}x`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyFarcasterFrame = () => {
    sound.playChipClick();
    // Farcaster FC Frame Metadata schema payload
    const fcFrameMeta = `<meta property="fc:frame" content="vNext" />
<meta property="fc:frame:image" content="${appUrl}/assets/promo_win_banner.png" />
<meta property="fc:frame:button:1" content="🎰 Play Solstice Roulette" />
<meta property="fc:frame:button:1:action" content="link" />
<meta property="fc:frame:button:1:target" content="${appUrl}" />`;
    navigator.clipboard.writeText(fcFrameMeta);
    setCopiedFarcaster(true);
    setTimeout(() => setCopiedFarcaster(false), 2500);
  };

  return (
    <div className="p-5 cyber-glass-glow rounded-2xl border border-cyan-500/40 space-y-5 font-mono max-w-xl mx-auto text-slate-100 shadow-2xl">
      {/* Upper selector */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Camera className="w-4.5 h-4.5 text-cyan-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">DeFi Casino Promo Generator</span>
        </div>

        <div className="flex gap-1">
          {(['neon', 'gold', 'obsidian'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { sound.playChipClick(); setTheme(t); }}
              className={`px-2 py-1 rounded text-[10px] font-bold uppercase border transition-all ${
                theme === t
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Actual Generated Visual Banner Card */}
      <div className={`p-5 rounded-xl border relative overflow-hidden flex flex-col justify-between min-h-[170px] transition-all duration-300 ${getThemeClass()}`}>
        {/* Background Scanline Lines & Grid Decals */}
        <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 mix-blend-overlay pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest text-slate-400">SOLSTICE APEX V6</span>
          </div>
          <div className="px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-[9px] font-semibold text-emerald-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-400 animate-pulse" />
            <span>PROVABLY FAIR</span>
          </div>
        </div>

        {/* Mid Stats info representing real DeFi games wins */}
        <div className="my-3 z-10">
          {tokenSymbol ? (
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase block tracking-wider font-semibold">Fair Launch Studio</span>
              <h2 className={`text-2xl font-extrabold ${getGlowText()} leading-none uppercase`}>
                ${tokenSymbol} launched
              </h2>
              <p className="text-[10px] text-purple-300 font-bold block">Permanent Metadata & Bonding Curve Active</p>
            </div>
          ) : (
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase block tracking-wider font-semibold">Casino Multiplier Jackpot</span>
              <h2 className={`text-2.5xl font-extrabold ${getGlowText()} leading-none uppercase tracking-tight`}>
                💥 {multiplier}x multiplier
              </h2>
              <p className="text-xs font-extrabold text-slate-200">
                Piped +{winAmountSol.toFixed(4)} SOL straight to wallet!
              </p>
            </div>
          )}
        </div>

        {/* Bottom Banner Row */}
        <div className="flex items-center justify-between border-t border-slate-200/10 pt-2 z-10 text-[9px] text-slate-400">
          <span>PLAYER: {playerName.slice(0, 14)}...</span>
          <span>SYSTEM VERIFIED</span>
        </div>
      </div>

      {/* Share Actions Panel */}
      <div className="space-y-2.5">
        <span className="text-[10px] text-slate-400 uppercase font-bold block">Instantly Broadcast to social graphs</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Twitter / X */}
          <button
            onClick={handleCopyTwitter}
            className="p-2.5 bg-slate-950 border border-slate-800 hover:border-cyan-400 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all text-slate-200"
          >
            <Twitter className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Post on X</span>
          </button>

          {/* Farcaster Frame code */}
          <button
            onClick={handleCopyFarcasterFrame}
            className="p-2.5 bg-slate-950 border border-slate-800 hover:border-purple-400 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all text-slate-200"
          >
            <Share2 className="w-4 h-4 text-purple-400 shrink-0" />
            <span>{copiedFarcaster ? 'Frame Copied!' : 'Copy FC Frame'}</span>
          </button>

          {/* Direct Clipboard Link */}
          <button
            onClick={handleCopyLink}
            className="p-2.5 bg-slate-950 border border-slate-800 hover:border-emerald-400 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all text-slate-200"
          >
            <Copy className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{copiedLink ? 'Link Copied!' : 'Copy Promo Link'}</span>
          </button>
        </div>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="w-full py-2 bg-slate-900 border border-slate-800 rounded-xl font-bold text-xs text-slate-400 hover:text-white transition-all text-center block"
        >
          Close Promo Generator
        </button>
      )}
    </div>
  );
};
