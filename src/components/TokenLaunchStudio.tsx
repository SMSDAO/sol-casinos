import React, { useState, useRef } from 'react';
import {
  Rocket,
  Upload,
  Coins,
  CheckCircle,
  Sparkles,
  Zap,
  Info,
  Image as ImageIcon,
  X,
  ExternalLink,
  ShieldCheck,
  Flame,
  Percent,
  TrendingUp,
  Share2,
} from 'lucide-react';
import { sound } from '../utils/audio';
import { tokenLaunchService, LaunchedSPLToken } from '../services/tokenLaunch';

interface TokenLaunchStudioProps {
  userBalance: number;
  walletPublicKey: string | null;
  onTokenCreated: (token: LaunchedSPLToken, feeSol: number) => void;
  onClose?: () => void;
  initialWinAmount?: number;
}

export const TokenLaunchStudio: React.FC<TokenLaunchStudioProps> = ({
  userBalance,
  walletPublicKey,
  onTokenCreated,
  onClose,
  initialWinAmount,
}) => {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [decimals, setDecimals] = useState<number>(9);
  const [supply, setSupply] = useState('1000000000'); // 1B
  const [description, setDescription] = useState('');

  // V6 Fair Launch Upgrade Fields
  const [tokenStandard, setTokenStandard] = useState<'SPL' | 'Token-2022'>('SPL');
  const [bondingType, setBondingType] = useState<'Linear' | 'Exponential' | 'Constant-Product'>('Exponential');
  const [transferFee, setTransferFee] = useState<number>(150); // Basis points
  const [permanentDelegate, setPermanentDelegate] = useState<boolean>(false);

  // Logo File Upload State
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLaunching, setIsLaunching] = useState(false);
  const [createdToken, setCreatedToken] = useState<LaunchedSPLToken | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const LAUNCH_FEE_SOL = 0.05;

  // Handle Logo Drag & Drop / File Select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (PNG, JPG, WEBP, or SVG).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('File size exceeds 2MB limit.');
      return;
    }

    setErrorMsg(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLogoPreview(event.target.result as string);
        sound.playChipClick();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLaunchToken = () => {
    if (!name.trim() || !symbol.trim()) {
      setErrorMsg('Token Name and Symbol are required.');
      return;
    }

    if (userBalance < LAUNCH_FEE_SOL) {
      setErrorMsg(`Insufficient SOL balance. Required: ${LAUNCH_FEE_SOL} SOL.`);
      return;
    }

    sound.playChipClick();
    setIsLaunching(true);
    setErrorMsg(null);

    // Simulate on-chain SPL mint creation delay with bonding curve initializing
    setTimeout(() => {
      sound.playWin();
      sound.playJackpot();
      setIsLaunching(false);

      const mintAddress = `${symbol.toUpperCase()}_${Math.random().toString(36).substring(2, 12)}...sol`;
      const txSignature = `5K9bA1Z7_${Math.random().toString(36).substring(2, 10)}`;
      const logoUri = logoPreview || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23060813"/><circle cx="50" cy="50" r="30" fill="%2300f2fe"/></svg>';

      const newTok = tokenLaunchService.launchSPLToken({
        mintAddress,
        name: name.trim(),
        symbol: symbol.trim().toUpperCase(),
        decimals,
        initialSupply: parseFloat(supply) || 1000000,
        description: description.trim() || 'Created via Solstice Fair Launch Bonding Curve Studio',
        logoUrl: logoUri,
        metadataUri: `https://arweave.net/solstice_${symbol.toLowerCase()}_metadata.json`,
        creatorWallet: walletPublicKey || 'Vault_Player',
        launchFeeSol: LAUNCH_FEE_SOL,
        txSignature,
        tokenStandard,
        bondingType,
        marketCapSol: 1.5, // Initial pool capitalization value
        progress: 0, // Freshly launched bonding curve progress
        transferFeeBasisPoints: tokenStandard === 'Token-2022' ? transferFee : 0,
        permanentDelegateEnabled: tokenStandard === 'Token-2022' ? permanentDelegate : false,
        blinkUrl: `solana-action:https://ais-dev-wodqg4vjvosq73rhbpcsrn-58325421054.us-east5.run.app/api/action/buy/${symbol.toUpperCase()}`,
        tipsVolumeSol: 0,
      });

      setCreatedToken(newTok);
      onTokenCreated(newTok, LAUNCH_FEE_SOL);
    }, 2200);
  };

  return (
    <div className="cyber-glass-glow rounded-2xl p-6 border border-cyan-500/40 space-y-5 font-mono text-slate-100 max-w-2xl mx-auto shadow-2xl">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-600 to-purple-600 p-0.5 shadow-lg shadow-cyan-950">
            <div className="w-full h-full bg-[#060813] rounded-[10px] flex items-center justify-center text-cyan-400">
              <Rocket className="w-5 h-5 animate-pulse text-cyan-300" />
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wider flex items-center gap-2">
              FAIR LAUNCH BONDING STUDIO <span className="text-[10px] text-cyan-400 font-extrabold px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/50">V6 APEX</span>
            </h2>
            <p className="text-[10px] text-cyan-400">On-Chain Bonding Curves, Token-2022 Extensions & Blinks</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* "Launch from Win" Promotional Banner if user opened from win */}
      {initialWinAmount && initialWinAmount > 0 && (
        <div className="p-3 bg-yellow-950/80 border border-yellow-500/40 rounded-xl text-yellow-200 text-xs flex items-center gap-2">
          <Flame className="w-4 h-4 text-yellow-400 shrink-0 animate-bounce" />
          <span>
            <strong>Launch from Win Active!</strong> Fund your fair launch bonding curve using your +
            {initialWinAmount.toFixed(4)} SOL casino winnings!
          </span>
        </div>
      )}

      {createdToken ? (
        <div className="p-5 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl space-y-4 text-center animate-in zoom-in-95">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-base font-bold text-white">FAIR LAUNCH BONDING MINT STARTED!</h3>
            <p className="text-xs text-emerald-300 font-bold mt-1">
              ${createdToken.symbol} — {createdToken.name}
            </p>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-1.5 text-left text-slate-300 font-mono">
            <div className="flex justify-between">
              <span>Token Standard:</span>
              <span className="text-purple-400 font-bold">{createdToken.tokenStandard}</span>
            </div>
            <div className="flex justify-between">
              <span>Bonding Curve:</span>
              <span className="text-cyan-400 font-bold">{createdToken.bondingType}</span>
            </div>
            <div className="flex justify-between">
              <span>Mint Address:</span>
              <span className="text-cyan-300 font-bold">{createdToken.mintAddress.slice(0, 16)}...</span>
            </div>
            <div className="flex justify-between">
              <span>Initial Supply:</span>
              <span className="text-yellow-400 font-bold">{createdToken.initialSupply.toLocaleString()}</span>
            </div>
            {createdToken.tokenStandard === 'Token-2022' && (
              <div className="flex justify-between">
                <span>Transfer Fee Basis Points:</span>
                <span className="text-orange-400 font-mono font-bold">{(createdToken.transferFeeBasisPoints || 0)} bp</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-800/80 pt-2">
              <span>Shareable Blink URL:</span>
              <span className="text-emerald-400 text-[10px] break-all select-all font-mono font-semibold">{createdToken.blinkUrl}</span>
            </div>
          </div>

          <button
            onClick={() => {
              setCreatedToken(null);
              setName('');
              setSymbol('');
              setLogoPreview(null);
            }}
            className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs rounded-xl shadow-lg"
          >
            Launch Another Token
          </button>
        </div>
      ) : (
        <div className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 font-mono text-xs">
              {errorMsg}
            </div>
          )}

          {/* Token Standard Toggle */}
          <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-white text-xs font-bold block">Token Protocol Standard</span>
              <span className="text-[10px] text-slate-400 block">SPL is standard; Token-2022 includes custom extensions.</span>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => { sound.playChipClick(); setTokenStandard('SPL'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all border ${
                  tokenStandard === 'SPL'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                SPL
              </button>
              <button
                type="button"
                onClick={() => { sound.playChipClick(); setTokenStandard('Token-2022'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all border ${
                  tokenStandard === 'Token-2022'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Token-2022
              </button>
            </div>
          </div>

          {/* Form Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                Token Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Apex Solstice"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 font-bold"
              />
            </div>

            <div>
              <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                Token Symbol *
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g. APEX"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 font-bold uppercase"
              />
            </div>

            <div>
              <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                Bonding Curve Strategy
              </label>
              <select
                value={bondingType}
                onChange={(e) => setBondingType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none font-bold"
              >
                <option value="Exponential">Exponential Curve (Anti-Sniper)</option>
                <option value="Linear">Linear Curve (Consistent Pricing)</option>
                <option value="Constant-Product">Constant-Product (UniV2 model)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                Initial Token Supply
              </label>
              <input
                type="number"
                value={supply}
                onChange={(e) => setSupply(e.target.value)}
                placeholder="1000000000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>
          </div>

          {/* Token-2022 Extensions Settings */}
          {tokenStandard === 'Token-2022' && (
            <div className="p-3 bg-purple-950/20 rounded-xl border border-purple-500/30 space-y-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                <Percent className="w-3.5 h-3.5" />
                <span>Token-2022 Protocols & Extensions</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-[10px] block mb-1">
                    Transfer Fee (bp, e.g. 150 = 1.5%)
                  </label>
                  <input
                    type="number"
                    value={transferFee}
                    onChange={(e) => setTransferFee(Math.max(0, Math.min(1000, parseInt(e.target.value, 10) || 0)))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div className="flex items-center justify-between pt-4">
                  <div className="space-y-0.5">
                    <span className="text-slate-300 font-bold block">Permanent Delegate</span>
                    <span className="text-[9px] text-slate-400 block">Creator security control extension</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { sound.playChipClick(); setPermanentDelegate(!permanentDelegate); }}
                    className={`px-3 py-1 rounded-lg border text-[11px] font-bold transition-all ${
                      permanentDelegate
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {permanentDelegate ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
              Token Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe utility, bonding curve parameters, or roadmap..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Logo File Upload Section */}
          <div>
            <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
              Token Logo Upload (PNG / JPG / WEBP / SVG)
            </label>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 bg-slate-950/80 rounded-2xl p-4 text-center cursor-pointer transition-all hover:bg-slate-900/60 flex flex-col items-center justify-center gap-2"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              {logoPreview ? (
                <div className="flex items-center gap-3">
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="w-12 h-12 rounded-xl border border-cyan-400 object-cover shadow-lg"
                  />
                  <div className="text-left">
                    <span className="text-white font-bold block text-xs">{fileName}</span>
                    <span className="text-emerald-400 text-[10px] block">
                      ✓ Ready for Permanent Metadata Storage
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-cyan-400 animate-bounce" />
                  <div>
                    <span className="text-white font-bold block">
                      Click or Drag & Drop Token Logo
                    </span>
                    <span className="text-slate-400 text-[10px]">Max 2MB file size</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Launch Fee & Execution Button */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Creation & Permanent Storage Fee:</span>
            <span className="text-cyan-300 font-bold font-mono">{LAUNCH_FEE_SOL} SOL</span>
          </div>

          <button
            onClick={handleLaunchToken}
            disabled={isLaunching}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-950/80 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {isLaunching ? (
              <>
                <Sparkles className="w-4 h-4 text-cyan-200 animate-spin" />
                <span>Initializing Fair Launch Bonding Curve...</span>
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 text-cyan-200" />
                <span>Launch & Start Bonding Curve ({LAUNCH_FEE_SOL} SOL)</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
