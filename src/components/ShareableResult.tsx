import React, { useState, useEffect, useRef } from 'react';
import {
  Share2,
  Copy,
  Twitter,
  Download,
  ExternalLink,
  Sparkles,
  Zap,
  Check,
  Flame,
  Award,
  Link,
  Tv,
  X,
  QrCode,
  Image as ImageIcon,
} from 'lucide-react';
import { sound } from '../utils/audio';
import { rewardsService } from '../services/rewards';

export interface ShareableResultProps {
  isOpen?: boolean;
  onClose?: () => void;
  gameName: string;
  winAmountSol: number;
  betAmountSol?: number;
  multiplier: number;
  publicKey: string | null;
  signature?: string;
  serverSeedHash?: string;
}

export const ShareableResult: React.FC<ShareableResultProps> = ({
  isOpen = true,
  onClose,
  gameName = 'Neon Roulette',
  winAmountSol = 0.36,
  betAmountSol = 0.01,
  multiplier = 36.0,
  publicKey,
  signature,
  serverSeedHash,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ogImageUrl, setOgImageUrl] = useState<string>('');
  const [copiedBlink, setCopiedBlink] = useState(false);
  const [copiedRefLink, setCopiedRefLink] = useState(false);
  const [copiedFcFrame, setCopiedFcFrame] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<'cyber-cyan' | 'sol-gold' | 'neon-purple'>('cyber-cyan');

  // Derive unique referral code & links
  const referralData = rewardsService.getReferralData(publicKey);
  const myRefCode = referralData.myReferralCode || 'SOLSTICE-SOL2026';
  
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://solstice-roulette.app';
  const referralUrl = `${origin}?ref=${myRefCode}&win=${multiplier}x`;

  // Solana Blink Action URL
  const actionApiEndpoint = `${origin}/api/action/play?game=${encodeURIComponent(gameName.toLowerCase().replace(/\s+/g, '_'))}&ref=${myRefCode}`;
  const solanaBlinkUrl = `solana-action:${actionApiEndpoint}`;

  // Generate 1200x630 Branded Dynamic OpenGraph Image on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas Dimensions: 1200 x 630 (Standard OpenGraph Ratio 1.91:1)
    const W = 1200;
    const H = 630;
    canvas.width = W;
    canvas.height = H;

    // Background Gradient based on selected theme
    const bgGradient = ctx.createLinearGradient(0, 0, W, H);
    if (selectedTheme === 'sol-gold') {
      bgGradient.addColorStop(0, '#1c1304');
      bgGradient.addColorStop(0.5, '#060813');
      bgGradient.addColorStop(1, '#2b1b05');
    } else if (selectedTheme === 'neon-purple') {
      bgGradient.addColorStop(0, '#18042b');
      bgGradient.addColorStop(0.5, '#060813');
      bgGradient.addColorStop(1, '#0c021c');
    } else {
      bgGradient.addColorStop(0, '#041724');
      bgGradient.addColorStop(0.5, '#060813');
      bgGradient.addColorStop(1, '#062033');
    }
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, W, H);

    // Subtle Grid Cyber Pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < W; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Glowing Cyber Border Box
    ctx.save();
    ctx.strokeStyle = selectedTheme === 'sol-gold' ? '#f59e0b' : selectedTheme === 'neon-purple' ? '#a855f7' : '#06b6d4';
    ctx.lineWidth = 4;
    ctx.shadowColor = selectedTheme === 'sol-gold' ? '#f59e0b' : selectedTheme === 'neon-purple' ? '#a855f7' : '#06b6d4';
    ctx.shadowBlur = 24;
    ctx.strokeRect(30, 30, W - 60, H - 60);
    ctx.restore();

    // Top Header: Solstice Logo & Verification Badge
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px "Courier New", monospace';
    ctx.fillText('SOLSTICE CASINO ENTERPRISE', 60, 90);

    // Pill: Solana Action / Blink Enabled
    const badgeText = '⚡ SOLANA BLINK / ACTION READY';
    ctx.font = 'bold 18px "Courier New", monospace';
    const badgeW = ctx.measureText(badgeText).width + 30;
    ctx.fillStyle = 'rgba(14, 165, 233, 0.15)';
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(W - 60 - badgeW, 60, badgeW, 40, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(badgeText, W - 60 - badgeW + 15, 86);

    // Main Game Title & Highlight
    ctx.fillStyle = '#94a3b8';
    ctx.font = '24px "Courier New", monospace';
    ctx.fillText('WIN RESULT BROADCAST', 60, 160);

    ctx.fillStyle = selectedTheme === 'sol-gold' ? '#fbbf24' : selectedTheme === 'neon-purple' ? '#c084fc' : '#22d3ee';
    ctx.font = 'bold 52px system-ui, sans-serif';
    ctx.fillText(gameName.toUpperCase(), 60, 220);

    // Huge Multiplier Display
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = selectedTheme === 'sol-gold' ? '#f59e0b' : selectedTheme === 'neon-purple' ? '#a855f7' : '#22d3ee';
    ctx.shadowBlur = 30;
    ctx.font = '900 96px system-ui, sans-serif';
    ctx.fillText(`${multiplier}x MULTIPLIER`, 60, 330);
    ctx.restore();

    // Win Amount Details
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 44px "Courier New", monospace';
    ctx.fillText(`+${winAmountSol.toFixed(4)} SOL WIN`, 60, 395);

    // Decorative divider line
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 440);
    ctx.lineTo(W - 60, 440);
    ctx.stroke();

    // Bottom Metadata Footer
    ctx.fillStyle = '#94a3b8';
    ctx.font = '20px "Courier New", monospace';
    const playerShort = publicKey ? `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}` : 'CyberDegen_X';
    ctx.fillText(`PLAYER: ${playerShort}`, 60, 485);
    ctx.fillText(`VERIFIABLE PROOF: SHA-256 VRF CERTIFIED`, 60, 520);

    // Referral Banner on Card
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.fillText(`PLAY VIA BLINK & GET 15% RAKEBACK:`, 60, 575);

    ctx.fillStyle = selectedTheme === 'sol-gold' ? '#fbbf24' : selectedTheme === 'neon-purple' ? '#e879f9' : '#38bdf8';
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.fillText(`${referralUrl.slice(0, 55)}...`, 560, 575);

    // Solana Actions Pill Decal (Bottom Right)
    ctx.fillStyle = 'rgba(234, 179, 8, 0.12)';
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(W - 320, 470, 260, 90, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.fillText('DIALECT BLINKS', W - 300, 505);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px "Courier New", monospace';
    ctx.fillText('1-Click Play in Social Feed', W - 300, 535);

    // Convert canvas to image data URL
    const dataUrl = canvas.toDataURL('image/png');
    setOgImageUrl(dataUrl);
  }, [gameName, winAmountSol, multiplier, publicKey, selectedTheme, referralUrl]);

  if (!isOpen) return null;

  // Actions
  const handleDownloadImage = () => {
    sound.playChipClick();
    if (!ogImageUrl) return;
    const a = document.createElement('a');
    a.href = ogImageUrl;
    a.download = `solstice_win_${gameName.toLowerCase().replace(/\s+/g, '_')}_${multiplier}x.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyBlink = () => {
    sound.playChipClick();
    navigator.clipboard.writeText(solanaBlinkUrl);
    setCopiedBlink(true);
    setTimeout(() => setCopiedBlink(false), 2500);
  };

  const handleCopyRefLink = () => {
    sound.playChipClick();
    navigator.clipboard.writeText(referralUrl);
    setCopiedRefLink(true);
    setTimeout(() => setCopiedRefLink(false), 2500);
  };

  const handleShareTwitter = () => {
    sound.playWin();
    const tweetText = `💥 BOOM! Just landed a massive ${multiplier}x win (+${winAmountSol.toFixed(4)} SOL) on ${gameName} at @SolsticeCasino!

Play directly in your feed via this Solana Blink or earn 15% rakeback with my invite 👇
${referralUrl}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(solanaBlinkUrl)}`;
    window.open(twitterUrl, '_blank');
  };

  const handleShareFarcaster = () => {
    sound.playWin();
    const castText = `🎰 Hit ${multiplier}x (+${winAmountSol.toFixed(4)} SOL) on ${gameName}! Play with this Solana Blink action frame on Solstice Roulette:`;
    const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}&embeds[]=${encodeURIComponent(actionApiEndpoint)}&embeds[]=${encodeURIComponent(referralUrl)}`;
    window.open(warpcastUrl, '_blank');
  };

  const handleCopyFcFrame = () => {
    sound.playChipClick();
    const frameMeta = `<!-- Farcaster & Solana Blink Meta Tag Embed -->
<meta property="fc:frame" content="vNext" />
<meta property="fc:frame:image" content="${origin}/api/og?game=${encodeURIComponent(gameName)}&win=${multiplier}x" />
<meta property="fc:frame:button:1" content="🎰 Play ${gameName} on Blink" />
<meta property="fc:frame:button:1:action" content="link" />
<meta property="fc:frame:button:1:target" content="${solanaBlinkUrl}" />`;
    navigator.clipboard.writeText(frameMeta);
    setCopiedFcFrame(true);
    setTimeout(() => setCopiedFcFrame(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl cyber-glass-glow rounded-2xl p-5 sm:p-6 border border-cyan-500/40 text-slate-100 shadow-2xl max-h-[92vh] overflow-y-auto space-y-5 font-mono">
        {/* Hidden Canvas used to generate dynamic high-res OpenGraph Image */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-600 to-purple-600 p-0.5 shadow-lg shadow-cyan-950">
              <div className="w-full h-full bg-[#060813] rounded-[10px] flex items-center justify-center text-cyan-400">
                <Share2 className="w-5 h-5 text-cyan-300 animate-pulse" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                SHAREABLE RESULT & SOLANA BLINK GENERATOR
              </h2>
              <p className="text-xs text-cyan-400">
                Dynamic OpenGraph Card with Instant X & Farcaster Blink Triggers
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={() => {
                sound.playChipClick();
                onClose();
              }}
              className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Theme Picker for OpenGraph Card */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            Card Theme:
          </span>
          <div className="flex items-center gap-1.5">
            {(
              [
                { id: 'cyber-cyan', name: 'Cyber Cyan', border: 'border-cyan-400 text-cyan-300 bg-cyan-950/80' },
                { id: 'sol-gold', name: 'Sol Gold', border: 'border-amber-400 text-amber-300 bg-amber-950/80' },
                { id: 'neon-purple', name: 'Neon Purple', border: 'border-purple-400 text-purple-300 bg-purple-950/80' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  sound.playChipClick();
                  setSelectedTheme(t.id);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                  selectedTheme === t.id
                    ? `${t.border} shadow-md`
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Live Generated OpenGraph Preview Card (1200x630 aspect ratio preview) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-cyan-400" />
              Dynamic Branded OpenGraph (OG) Card Preview
            </span>
            <span className="text-[11px] font-mono text-emerald-400">1200 × 630 px</span>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-cyan-500/40 shadow-2xl bg-black group">
            {ogImageUrl ? (
              <img
                src={ogImageUrl}
                alt="OpenGraph Shareable Result"
                className="w-full h-auto object-cover rounded-xl"
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500">
                Generating Dynamic OG Canvas...
              </div>
            )}

            <button
              onClick={handleDownloadImage}
              title="Download high-resolution 1200x630 PNG card"
              className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-slate-950/90 hover:bg-slate-900 border border-cyan-400/60 text-cyan-300 text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PNG Card</span>
            </button>
          </div>
        </div>

        {/* Primary Action: Trigger Solana Blink Section */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-950/40 via-slate-900/90 to-purple-950/40 border border-yellow-500/40 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400 animate-bounce" />
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Solana Blink / Action Trigger
                </span>
                <span className="text-[11px] text-slate-300">
                  Allows anyone on X or Farcaster to play or tip in 1 click without leaving their feed!
                </span>
              </div>
            </div>

            <button
              onClick={handleCopyBlink}
              className="px-3.5 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-400 text-yellow-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0"
            >
              {copiedBlink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-yellow-400" />}
              <span>{copiedBlink ? 'Blink URL Copied!' : 'Copy Blink Action'}</span>
            </button>
          </div>

          <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-300 font-mono truncate select-all flex items-center justify-between gap-2">
            <span className="truncate text-yellow-300">{solanaBlinkUrl}</span>
            <span className="px-2 py-0.5 rounded bg-yellow-950 text-yellow-400 text-[10px] font-bold shrink-0">
              solana-action:
            </span>
          </div>
        </div>

        {/* Social Graph Sharing Buttons (X, Farcaster, Links) */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            1-Click Social Graph Distribution
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Share on X (Twitter) */}
            <button
              onClick={handleShareTwitter}
              className="p-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-950 transition-all active:scale-95"
            >
              <Twitter className="w-4 h-4 text-white" />
              <span>Share on X / Twitter</span>
            </button>

            {/* Share on Farcaster (Warpcast) */}
            <button
              onClick={handleShareFarcaster}
              className="p-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-950 transition-all active:scale-95"
            >
              <Share2 className="w-4 h-4 text-white" />
              <span>Share on Farcaster</span>
            </button>

            {/* Copy Referral Link */}
            <button
              onClick={handleCopyRefLink}
              className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {copiedRefLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Link className="w-4 h-4 text-cyan-400" />}
              <span>{copiedRefLink ? 'Referral Copied!' : 'Copy Referral Link'}</span>
            </button>
          </div>
        </div>

        {/* Farcaster Frame Metadata Payload Option */}
        <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-purple-400" />
            <span className="text-slate-300">Need direct embed Farcaster Frame & OpenGraph HTML tags?</span>
          </div>
          <button
            onClick={handleCopyFcFrame}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 hover:border-purple-400 text-purple-300 font-bold text-xs transition-colors shrink-0"
          >
            {copiedFcFrame ? 'Tags Copied ✓' : 'Copy Frame Tags'}
          </button>
        </div>
      </div>
    </div>
  );
};
