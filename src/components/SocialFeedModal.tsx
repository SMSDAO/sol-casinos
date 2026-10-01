import React, { useState, useEffect } from 'react';
import {
  Heart,
  Share2,
  X,
  Flame,
  Rocket,
  Trophy,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Users,
  Coins,
  Percent,
  Copy,
  CheckCircle,
  Play,
  Send,
  Tv,
} from 'lucide-react';
import { sound } from '../utils/audio';
import { tokenLaunchService, LaunchedSPLToken, FeedComment } from '../services/tokenLaunch';

interface SocialFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletPublicKey: string | null;
  onOpenLaunchStudio?: () => void;
}

export const SocialFeedModal: React.FC<SocialFeedModalProps> = ({
  isOpen,
  onClose,
  walletPublicKey,
  onOpenLaunchStudio,
}) => {
  const [tokens, setTokens] = useState<LaunchedSPLToken[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedBlinkId, setCopiedBlinkId] = useState<string | null>(null);
  const [tipAmounts, setTipAmounts] = useState<Record<string, string>>({});
  const [tippingState, setTippingState] = useState<Record<string, boolean>>({});

  // Comments state per token mint address
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  // Replay modal state
  const [activeReplayToken, setActiveReplayToken] = useState<LaunchedSPLToken | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTokens(tokenLaunchService.getLaunchedTokens());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleLike = (mintAddress: string) => {
    sound.playChipClick();
    const activeWallet = walletPublicKey || 'Vault_Player';
    const res = tokenLaunchService.toggleLikeToken(mintAddress, activeWallet);
    if (res.isLiked) {
      sound.playWin();
    }
    setTokens(tokenLaunchService.getLaunchedTokens());
  };

  const handleShareToken = (token: LaunchedSPLToken) => {
    sound.playChipClick();
    const shareUrl = `${window.location.origin}?token=${token.symbol}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(token.mintAddress);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleCopyBlink = (token: LaunchedSPLToken) => {
    sound.playChipClick();
    const actionUrl = token.blinkUrl || `solana-action:https://ais-dev-wodqg4vjvosq73rhbpcsrn-58325421054.us-east5.run.app/api/action/buy/${token.symbol}`;
    navigator.clipboard.writeText(actionUrl);
    setCopiedBlinkId(token.mintAddress);
    setTimeout(() => setCopiedBlinkId(null), 3000);
  };

  const handleSendTip = (mintAddress: string) => {
    const rawAmt = tipAmounts[mintAddress] || '0.05';
    const amt = parseFloat(rawAmt);
    if (isNaN(amt) || amt <= 0) return;

    sound.playChipClick();
    setTippingState((prev) => ({ ...prev, [mintAddress]: true }));

    setTimeout(() => {
      sound.playWin();
      sound.playJackpot();
      tokenLaunchService.tipToken(mintAddress, amt);
      setTokens(tokenLaunchService.getLaunchedTokens());
      setTipAmounts((prev) => ({ ...prev, [mintAddress]: '' }));
      setTippingState((prev) => ({ ...prev, [mintAddress]: false }));
    }, 1200);
  };

  const handleAddComment = (mintAddress: string) => {
    const text = commentInputs[mintAddress] || '';
    if (!text.trim()) return;

    sound.playChipClick();
    const senderName = walletPublicKey
      ? `${walletPublicKey.slice(0, 4)}...${walletPublicKey.slice(-4)}`
      : 'DegenTrader';

    const updated = tokenLaunchService.addComment(mintAddress, senderName, text);
    setTokens(updated);
    setCommentInputs((prev) => ({ ...prev, [mintAddress]: '' }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-mono">
      <div className="w-full max-w-2xl rounded-2xl bg-[#060813] border border-cyan-500/40 p-5 sm:p-6 shadow-2xl text-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 p-0.5 shadow-lg shadow-purple-950">
              <div className="w-full h-full bg-[#060813] rounded-[10px] flex items-center justify-center">
                <Heart className="w-5 h-5 text-pink-400 animate-pulse fill-pink-400" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wider flex items-center gap-2">
                SOLSTICE SOCIAL FEED & LAUNCHES
              </h3>
              <p className="text-[10px] text-pink-400">Community shared wins, bonding curves & interactive replay feeds</p>
            </div>
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

        {/* Launch Banner CTA */}
        {onOpenLaunchStudio && (
          <div className="p-4 bg-gradient-to-r from-cyan-950/80 via-blue-950/80 to-purple-950/80 rounded-2xl border border-cyan-500/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Rocket className="w-5 h-5 text-cyan-400 shrink-0" />
              <div>
                <strong className="text-white text-xs block">Have a winning streak or token idea?</strong>
                <span className="text-[10px] text-slate-300">
                  Launch your token with on-chain bonding curves and permanent metadata!
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playChipClick();
                onClose();
                onOpenLaunchStudio();
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-lg shrink-0"
            >
              Launch SPL Token
            </button>
          </div>
        )}

        {/* Tokens & Big Wins Feed */}
        <div className="space-y-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Community Payouts & Launch Feed ({tokens.length})
          </span>

          {tokens.map((token) => {
            const isLiked = walletPublicKey ? token.likedByWallets.includes(walletPublicKey) : false;
            const commentsList = token.comments || [];
            const isCommentsOpen = expandedComments[token.mintAddress] || false;

            return (
              <div
                key={token.mintAddress}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 relative overflow-hidden"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-950 border border-cyan-500/40 overflow-hidden flex items-center justify-center shrink-0">
                      {token.logoUrl.startsWith('data:image/svg+xml') ? (
                        <div dangerouslySetInnerHTML={{ __html: token.logoUrl }} className="w-8 h-8" />
                      ) : (
                        <img src={token.logoUrl} alt={token.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{token.name}</h4>
                        <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[10px] font-extrabold">
                          ${token.symbol}
                        </span>
                        <span className="text-[9px] text-purple-300 px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-500/30">
                          {token.tokenStandard}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Creator: {token.creatorWallet.slice(0, 6)}...{token.creatorWallet.slice(-4)} • Market Cap: {token.marketCapSol} SOL
                      </span>
                    </div>
                  </div>

                  {/* Replay Button */}
                  <button
                    onClick={() => {
                      sound.playChipClick();
                      setActiveReplayToken(token);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-950 transition-all active:scale-95 shrink-0"
                  >
                    <Tv className="w-3.5 h-3.5 text-yellow-300" />
                    <span>Replay Win</span>
                  </button>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  {token.description}
                </p>

                {/* Bonding Curve Progress */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Bonding Curve Progress (DEX Migration)</span>
                    <span className="text-cyan-300 font-bold">{token.progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full"
                      style={{ width: `${token.progress}%` }}
                    />
                  </div>
                </div>

                {/* Action Bar (Likes, Comments Toggle, Share) */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    {/* Like button */}
                    <button
                      onClick={() => handleToggleLike(token.mintAddress)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        isLiked
                          ? 'bg-pink-950/80 border-pink-500 text-pink-300 shadow-sm shadow-pink-950'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-pink-400 text-pink-400' : ''}`} />
                      <span>{token.likesCount}</span>
                    </button>

                    {/* Comments Toggle */}
                    <button
                      onClick={() => {
                        sound.playChipClick();
                        setExpandedComments((prev) => ({
                          ...prev,
                          [token.mintAddress]: !prev[token.mintAddress],
                        }));
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Comments ({commentsList.length})</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleShareToken(token)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-300 hover:text-white flex items-center gap-1"
                    >
                      {copiedId === token.mintAddress ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === token.mintAddress ? 'Copied Link' : 'Share'}</span>
                    </button>

                    <button
                      onClick={() => handleCopyBlink(token)}
                      className="px-2.5 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-[10px] text-purple-300 hover:text-purple-200 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-yellow-300" />
                      <span>{copiedBlinkId === token.mintAddress ? 'Blink Copied ✓' : 'Copy Blink'}</span>
                    </button>
                  </div>
                </div>

                {/* Collapsible Comment Section */}
                {isCommentsOpen && (
                  <div className="pt-3 border-t border-slate-800 space-y-3 animate-in fade-in duration-150">
                    <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                      {commentsList.length > 0 ? (
                        commentsList.map((comm) => (
                          <div key={comm.id} className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-0.5">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-cyan-300">{comm.sender}</span>
                              <span className="text-slate-500">
                                {new Date(comm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-200 text-xs break-words">{comm.text}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-[11px] text-slate-500 text-center py-2">
                          No comments yet. Start the discussion!
                        </div>
                      )}
                    </div>

                    {/* Add Comment Input */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={commentInputs[token.mintAddress] || ''}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({ ...prev, [token.mintAddress]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddComment(token.mintAddress);
                          }
                        }}
                        placeholder="Discuss this payout or token..."
                        maxLength={140}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                      <button
                        onClick={() => handleAddComment(token.mintAddress)}
                        className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1 shadow-md"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Replay Win Modal Viewer */}
      {activeReplayToken && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#070b19] border border-cyan-500/50 p-5 shadow-2xl text-slate-100 space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3">
              <div className="flex items-center gap-2">
                <Tv className="w-5 h-5 text-cyan-400 animate-pulse" />
                <h3 className="text-sm font-black text-white">REPLAY: {activeReplayToken.name} ($ {activeReplayToken.symbol})</h3>
              </div>
              <button
                onClick={() => setActiveReplayToken(null)}
                className="w-7 h-7 rounded-xl bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-cyan-950 border border-cyan-400/60 mx-auto flex items-center justify-center text-3xl">
                  🏆
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Winning Payout Multiplier</span>
                  <span className="text-2xl font-black text-yellow-300">500.0x JACKPOT</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  {activeReplayToken.description}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Mint Address:</span>
                  <span className="text-cyan-300 font-bold truncate max-w-[200px]">{activeReplayToken.mintAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Market Cap:</span>
                  <span className="text-white font-bold">{activeReplayToken.marketCapSol} SOL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tips Pool:</span>
                  <span className="text-emerald-400 font-bold">{activeReplayToken.tipsVolumeSol} SOL</span>
                </div>
              </div>

              <button
                onClick={() => setActiveReplayToken(null)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-lg"
              >
                Close Replay Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
