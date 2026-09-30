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
} from 'lucide-react';
import { sound } from '../utils/audio';
import { tokenLaunchService, LaunchedSPLToken } from '../services/tokenLaunch';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-mono">
      <div className="w-full max-w-2xl rounded-2xl bg-[#060813] border border-cyan-500/40 p-6 shadow-2xl text-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
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
              <p className="text-[10px] text-pink-400">Like & Play Community Launches & Big Win Cards</p>
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
                  Launch your SPL token on-chain and gain community likes!
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
        <div className="space-y-3">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
            Trending Launched Tokens & Social Activity
          </span>

          {tokens.map((tok) => {
            const activeWallet = walletPublicKey || 'Vault_Player';
            const isLikedByMe = tok.likedByWallets?.includes(activeWallet);

            return (
              <div
                key={tok.mintAddress}
                className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {tok.logoUrl ? (
                      <img
                        src={tok.logoUrl}
                        alt={tok.symbol}
                        className="w-10 h-10 rounded-xl border border-cyan-400/50 object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-400/50 flex items-center justify-center font-bold text-cyan-300 shrink-0">
                        ${tok.symbol.slice(0, 3)}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{tok.name}</h4>
                        <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold text-[10px] border border-cyan-500/40">
                          ${tok.symbol}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{tok.description}</p>
                    </div>
                  </div>

                  {/* Like Button */}
                  <button
                    onClick={() => handleToggleLike(tok.mintAddress)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                      isLikedByMe
                        ? 'bg-pink-950/80 border-pink-500 text-pink-300 font-bold shadow-md shadow-pink-950'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${isLikedByMe ? 'fill-pink-400 text-pink-400' : ''}`}
                    />
                    <span className="font-bold text-xs">{tok.likesCount}</span>
                  </button>
                </div>

                {/* Footer Metadata */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800">
                  <span>
                    Creator: <strong className="text-slate-200">{tok.creatorWallet.slice(0, 12)}...</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleShareToken(tok)}
                      className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-bold"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>{copiedId === tok.mintAddress ? 'Link Copied!' : 'Share'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
