import React, { useState } from 'react';
import {
  X,
  Key,
  Shield,
  Lock,
  Unlock,
  Copy,
  Check,
  Download,
  Upload,
  Zap,
  ExternalLink,
  Wallet,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { solanaService, WalletState, EncryptedVault, NETWORKS } from '../services/solana';
import { sound } from '../utils/audio';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: WalletState;
  onUpdateWallet: (wallet: WalletState) => void;
  onRequestFaucet: () => void;
  faucetLoading: boolean;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  wallet,
  onUpdateWallet,
  onRequestFaucet,
  faucetLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'vault' | 'import' | 'browser' | 'demo'>('vault');
  const [password, setPassword] = useState('');
  const [importKey, setImportKey] = useState('');
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [copiedPubkey, setCopiedPubkey] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [vaultStatus, setVaultStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, isSecret = false) => {
    sound.playChipClick();
    navigator.clipboard.writeText(text);
    if (isSecret) {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedPubkey(true);
      setTimeout(() => setCopiedPubkey(false), 2000);
    }
  };

  // Generate a brand new Keypair & encrypt with password
  const handleGenerateVault = async () => {
    sound.playChipClick();
    setErrorMsg(null);
    try {
      const { keypair, publicKey, secretKeyBase58 } = solanaService.generateNewKeypair();

      if (password.length >= 6) {
        const encrypted = await solanaService.encryptSecretKey(secretKeyBase58, password);
        localStorage.setItem('solstice_vault_encrypted', JSON.stringify(encrypted));
        setVaultStatus('Cyber-Vault encrypted & stored locally with AES-GCM.');
      }

      // Check balance on network
      const onChainBal = await solanaService.fetchOnChainBalance(publicKey);

      onUpdateWallet({
        publicKey,
        secretKeyBase58,
        balance: onChainBal !== null ? onChainBal : 2.5, // Seed with starter test SOL
        connected: true,
        walletType: 'cyber_vault',
        network: solanaService.getNetwork(),
      });
      sound.playWin();
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to generate wallet');
    }
  };

  // Import existing Base58 Private Key
  const handleImportKey = async () => {
    sound.playChipClick();
    setErrorMsg(null);
    try {
      if (!importKey.trim()) {
        setErrorMsg('Please enter a valid Base58 private key.');
        return;
      }
      const { publicKey } = solanaService.importKeypairFromBase58(importKey.trim());
      const onChainBal = await solanaService.fetchOnChainBalance(publicKey);

      if (password.length >= 6) {
        const encrypted = await solanaService.encryptSecretKey(importKey.trim(), password);
        localStorage.setItem('solstice_vault_encrypted', JSON.stringify(encrypted));
      }

      onUpdateWallet({
        publicKey,
        secretKeyBase58: importKey.trim(),
        balance: onChainBal !== null ? onChainBal : 1.0,
        connected: true,
        walletType: 'cyber_vault',
        network: solanaService.getNetwork(),
      });
      sound.playWin();
      onClose();
    } catch {
      setErrorMsg('Invalid Base58 private key format. Ensure exact 64-byte key string.');
    }
  };

  // Connect Browser Extension (Phantom / Solflare / Backpack)
  const handleConnectBrowser = async () => {
    sound.playChipClick();
    setErrorMsg(null);
    const anyWindow = window as unknown as { solana?: { isPhantom?: boolean; connect: () => Promise<{ publicKey: { toBase58: () => string } }> } };
    if (anyWindow.solana) {
      try {
        const resp = await anyWindow.solana.connect();
        const pub = resp.publicKey.toBase58();
        const onChainBal = await solanaService.fetchOnChainBalance(pub);

        onUpdateWallet({
          publicKey: pub,
          secretKeyBase58: null,
          balance: onChainBal !== null ? onChainBal : 5.0,
          connected: true,
          walletType: 'browser_extension',
          network: solanaService.getNetwork(),
        });
        sound.playWin();
        onClose();
      } catch (e: unknown) {
        setErrorMsg(e instanceof Error ? e.message : 'User rejected extension connection.');
      }
    } else {
      setErrorMsg('No Solana browser extension detected (Phantom/Solflare). You can use our In-App Cyber-Vault instead.');
    }
  };

  // High Roller Sandbox Mode (100 SOL virtual bankroll)
  const handleEnableDemoHighRoller = () => {
    sound.playWin();
    const { publicKey, secretKeyBase58 } = solanaService.generateNewKeypair();
    onUpdateWallet({
      publicKey,
      secretKeyBase58,
      balance: 100.0,
      connected: true,
      walletType: 'high_roller_demo',
      network: solanaService.getNetwork(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-xl cyber-glass-glow rounded-2xl p-6 relative text-slate-100 shadow-2xl border border-cyan-500/40 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display tracking-wide text-white">
                Solana Cyber-Vault & Wallet
              </h2>
              <p className="text-xs text-slate-400">
                Encrypted Client-Side Ed25519 Keypair & Browser Adapter
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

        {/* Tab Selection */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-700/50 mb-5 text-xs font-medium">
          <button
            onClick={() => {
              sound.playChipClick();
              setActiveTab('vault');
            }}
            className={`py-2 px-2 rounded-lg transition-all text-center ${
              activeTab === 'vault'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Cyber-Vault
          </button>
          <button
            onClick={() => {
              sound.playChipClick();
              setActiveTab('import');
            }}
            className={`py-2 px-2 rounded-lg transition-all text-center ${
              activeTab === 'import'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Import Key
          </button>
          <button
            onClick={() => {
              sound.playChipClick();
              setActiveTab('browser');
            }}
            className={`py-2 px-2 rounded-lg transition-all text-center ${
              activeTab === 'browser'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Phantom/App
          </button>
          <button
            onClick={() => {
              sound.playChipClick();
              setActiveTab('demo');
            }}
            className={`py-2 px-2 rounded-lg transition-all text-center ${
              activeTab === 'demo'
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            100 SOL Demo
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TAB 1: Cyber-Vault (Generate / Current Keypair) */}
        {activeTab === 'vault' && (
          <div className="space-y-4">
            {wallet.connected && wallet.publicKey ? (
              <div className="space-y-3.5">
                <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Public Address (Solana)</span>
                    <button
                      onClick={() => copyToClipboard(wallet.publicKey!)}
                      className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                    >
                      {copiedPubkey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPubkey ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="font-mono text-xs text-cyan-200 break-all select-all">
                    {wallet.publicKey}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60">
                    <span className="text-xs text-slate-400 block mb-1">Current Balance</span>
                    <span className="font-mono text-lg font-bold text-white">
                      {wallet.balance.toFixed(4)} SOL
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60">
                    <span className="text-xs text-slate-400 block mb-1">Network</span>
                    <span className="font-mono text-sm font-semibold text-cyan-300 capitalize">
                      {NETWORKS[wallet.network].name}
                    </span>
                  </div>
                </div>

                {wallet.secretKeyBase58 && (
                  <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1.5 text-orange-300">
                        <Key className="w-3.5 h-3.5" /> Secret Key (Base58)
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowSecretKey(!showSecretKey)}
                          className="text-xs text-slate-300 hover:text-white"
                        >
                          {showSecretKey ? 'Hide' : 'Reveal'}
                        </button>
                        {showSecretKey && (
                          <button
                            onClick={() => copyToClipboard(wallet.secretKeyBase58!, true)}
                            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                          >
                            {copiedSecret ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="font-mono text-xs text-slate-400 break-all select-all">
                      {showSecretKey ? wallet.secretKeyBase58 : '••••••••••••••••••••••••••••••••••••••••••••••••'}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={onRequestFaucet}
                    disabled={faucetLoading}
                    className="flex-1 py-2.5 px-4 bg-orange-950/60 hover:bg-orange-900/80 border border-orange-500/50 rounded-xl text-xs font-semibold text-orange-300 flex items-center justify-center gap-2 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${faucetLoading ? 'animate-spin' : ''}`} />
                    <span>Airdrop 2 Devnet SOL</span>
                  </button>
                  <button
                    onClick={handleGenerateVault}
                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-xs font-medium text-slate-300 transition-all"
                  >
                    New Keypair
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Generate an instant in-memory Ed25519 Solana wallet. You can optionally set a password to encrypt your vault in local storage with AES-GCM-256.
                </p>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Vault Encryption Password (Optional, $\ge 6$ chars)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter strong vault password..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                </div>

                <button
                  onClick={handleGenerateVault}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-cyan-950/80 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Zap className="w-4 h-4 text-cyan-100" />
                  Generate Encrypted Cyber-Vault (with Starter SOL)
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Import Private Key */}
        {activeTab === 'import' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-300">
              Paste your 64-byte Base58 private key from Phantom, Solflare, or CLI. Keys never leave your browser sandbox.
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Base58 Private Key
              </label>
              <textarea
                rows={3}
                value={importKey}
                onChange={(e) => setImportKey(e.target.value)}
                placeholder="e.g. 5MaiiCavzUb9VsctnnhJv6xK4618z95X... (Base58 string)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400 font-mono resize-none"
              />
            </div>
            <button
              onClick={handleImportKey}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import & Connect Keypair
            </button>
          </div>
        )}

        {/* TAB 3: Browser Extension */}
        {activeTab === 'browser' && (
          <div className="space-y-4 text-center py-3">
            <Wallet className="w-12 h-12 text-cyan-400 mx-auto animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-white">Browser Extension Connector</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
                Connect your installed Solana wallet (Phantom, Solflare, Backpack, Glow) for hardware and signature support.
              </p>
            </div>
            <button
              onClick={handleConnectBrowser}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-purple-950 flex items-center justify-center gap-2 transition-all"
            >
              <Wallet className="w-4 h-4" />
              Connect Browser Wallet (window.solana)
            </button>
          </div>
        )}

        {/* TAB 4: 100 SOL Demo Sandbox */}
        {activeTab === 'demo' && (
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 rounded-2xl bg-orange-950/60 border border-orange-500/50 flex items-center justify-center text-orange-400 mx-auto shadow-lg shadow-orange-950">
              <Zap className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">High-Roller Sandbox Mode</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                Instantly load 100.0 SOL virtual high-roller bankroll to test high-stakes bets, multi-table cascade chains, and AI portfolio analytics without signing prompts.
              </p>
            </div>
            <button
              onClick={handleEnableDemoHighRoller}
              className="w-full py-3 bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 hover:opacity-90 text-white font-bold rounded-xl text-xs shadow-lg shadow-orange-950 flex items-center justify-center gap-2 transition-all"
            >
              <Zap className="w-4 h-4" />
              Launch 100 SOL High-Roller Sandbox
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
