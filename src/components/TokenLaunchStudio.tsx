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

    // Simulate on-chain SPL mint creation delay
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
        description: description.trim() || 'Created via Solstice SPL Token Launch Studio',
        logoUrl: logoUri,
        metadataUri: `https://arweave.net/solstice_${symbol.toLowerCase()}_metadata.json`,
        creatorWallet: walletPublicKey || 'Vault_Player',
        launchFeeSol: LAUNCH_FEE_SOL,
        txSignature,
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
              SPL TOKEN LAUNCH STUDIO
            </h2>
            <p className="text-[10px] text-cyan-400">On-Chain SPL Token Creation & Permanent Metadata</p>
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
            <strong>Launch from Win Active!</strong> Fund your token mint using your +
            {initialWinAmount.toFixed(3)} SOL casino winnings!
          </span>
        </div>
      )}

      {createdToken ? (
        <div className="p-5 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl space-y-4 text-center animate-in zoom-in-95">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-base font-bold text-white">SPL TOKEN LAUNCHED ON-CHAIN!</h3>
            <p className="text-xs text-emerald-300 font-bold mt-1">
              ${createdToken.symbol} — {createdToken.name}
            </p>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-1.5 text-left text-slate-300 font-mono">
            <div className="flex justify-between">
              <span>Mint Address:</span>
              <span className="text-cyan-300 font-bold">{createdToken.mintAddress.slice(0, 16)}...</span>
            </div>
            <div className="flex justify-between">
              <span>Initial Supply:</span>
              <span className="text-yellow-400 font-bold">{createdToken.initialSupply.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Decimals:</span>
              <span className="text-slate-200">{createdToken.decimals}</span>
            </div>
            <div className="flex justify-between">
              <span>Transaction Sig:</span>
              <span className="text-emerald-400">{createdToken.txSignature.slice(0, 14)}...</span>
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
            Launch Another SPL Token
          </button>
        </div>
      ) : (
        <div className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 font-mono text-xs">
              {errorMsg}
            </div>
          )}

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
                placeholder="e.g. Solstice Prism"
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
                placeholder="e.g. PRISM"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 font-bold uppercase"
              />
            </div>

            <div>
              <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                Initial Total Supply
              </label>
              <input
                type="number"
                value={supply}
                onChange={(e) => setSupply(e.target.value)}
                placeholder="1000000000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                Decimals
              </label>
              <select
                value={decimals}
                onChange={(e) => setDecimals(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none font-bold"
              >
                <option value={9}>9 (Standard SOL Precision)</option>
                <option value={6}>6 (USDC Precision)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
              Token Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe utility, roadmap, or community focus..."
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
                      ✓ Ready for Arweave Permanent Metadata Storage
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
            <span className="text-slate-400">Creation & Arweave Storage Fee:</span>
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
                <span>Creating SPL Token & Metadata...</span>
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 text-cyan-200" />
                <span>Launch SPL Token ({LAUNCH_FEE_SOL} SOL)</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
