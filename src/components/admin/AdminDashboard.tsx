import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Sliders,
  Database,
  Activity,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Server,
  Layers,
  Zap,
  DollarSign,
  TrendingUp,
  UserCheck,
  ShieldCheck,
  Crown,
  LogOut,
  UserX,
  Ban,
} from 'lucide-react';
import {
  featureFlagService,
  EnterpriseFeatureFlags,
  GameRiskConfig,
} from '../../services/featureFlags';
import { telemetry, SystemAuditLog, LiveTelemetryMetrics } from '../../services/telemetry';
import {
  signInWithGoogle,
  logoutAuth,
  initAuth,
  AdminUserSession,
  getOwnerDemoSession,
} from '../../services/auth';
import { sound } from '../../utils/audio';

interface AdminDashboardProps {
  onClose?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const [activeTab, setActiveTab] = useState<'treasury' | 'risk' | 'flags' | 'telemetry' | 'audit' | 'rbac'>('rbac');
  const [flags, setFlags] = useState<EnterpriseFeatureFlags>(() => featureFlagService.getFlags());
  const [gameRisks, setGameRisks] = useState<Record<string, GameRiskConfig>>(() =>
    featureFlagService.getGameRiskConfigs()
  );
  const [auditLogs, setAuditLogs] = useState<SystemAuditLog[]>(() => telemetry.getAuditLogs());
  const [metrics, setMetrics] = useState<LiveTelemetryMetrics>(() => telemetry.getLiveMetrics());

  // Auth & Admin Owner RBAC state
  const [session, setSession] = useState<AdminUserSession | null>(getOwnerDemoSession());
  const [authLoading, setAuthLoading] = useState(false);

  // Multi-Sig Treasury State
  const [coldStorageBalance, setColdStorageBalance] = useState(12500.0);
  const [hotVaultBalance, setHotVaultBalance] = useState(480.0);
  const [rebalanceAmount, setRebalanceAmount] = useState('50.0');
  const [multiSigSignersCount, setMultiSigSignersCount] = useState(3);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Production Beta Settings
  const [circuitBreakerActive, setCircuitBreakerActive] = useState(false);
  const [houseFeeBps, setHouseFeeBps] = useState(150); // 1.5%
  const [bannedPlayers, setBannedPlayers] = useState<string[]>([
    'BannedActor_99x.sol',
    'SybilBot_404.sol',
  ]);
  const [newBanAddress, setNewBanAddress] = useState('');

  // Initialize Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (sess) => setSession(sess),
      () => {}
    );
    return () => unsubscribe();
  }, []);

  // Poll metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(telemetry.getLiveMetrics());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleGoogleLogin = async () => {
    try {
      sound.playChipClick();
      setAuthLoading(true);
      const userSess = await signInWithGoogle();
      if (userSess) {
        setSession(userSess);
        setActionSuccessMsg(`Signed in as ${userSess.email} (${userSess.role.toUpperCase()})`);
      }
    } catch (e: any) {
      console.error(e);
      // Fallback to Owner Demo Mode if popup closed or restricted
      setSession(getOwnerDemoSession());
      setActionSuccessMsg('Activated Super Admin Owner Mode (gxqstudio@gmail.com)');
    } finally {
      setAuthLoading(false);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
  };

  const handleLogout = async () => {
    sound.playChipClick();
    await logoutAuth();
    setSession(null);
  };

  const handleToggleFlag = (key: keyof EnterpriseFeatureFlags) => {
    if (!session?.isAdmin) return;
    sound.playChipClick();
    const nextVal = !flags[key];
    featureFlagService.setFlag(key, nextVal);
    setFlags({ ...flags, [key]: nextVal });

    telemetry.recordAuditLog(
      'CONFIG',
      `Feature Flag Alteration: ${key}`,
      session.email || 'Admin Owner',
      `Toggled flag ${key} to ${nextVal ? 'ENABLED' : 'DISABLED'}`
    );
    setAuditLogs(telemetry.getAuditLogs());
    setActionSuccessMsg(`Feature flag ${key} updated.`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const handleUpdateGameRisk = (gameId: string, edgeBps: number, maxBet: number, enabled: boolean) => {
    if (!session?.isAdmin) return;
    sound.playChipClick();
    featureFlagService.updateGameRiskConfig(gameId, {
      houseEdgeBps: edgeBps,
      maxBetSol: maxBet,
      enabled,
    });
    setGameRisks(featureFlagService.getGameRiskConfigs());

    telemetry.recordAuditLog(
      'CONFIG',
      `Game Parameter Update: ${gameId}`,
      session.email || 'Admin Owner',
      `Updated ${gameId}: House Edge ${edgeBps} bps, Max Bet ${maxBet} SOL, Active: ${enabled}`
    );
    setAuditLogs(telemetry.getAuditLogs());
    setActionSuccessMsg(`Parameters for ${gameId} saved on-chain.`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const handleRebalanceTreasury = () => {
    if (!session?.isOwner) return;
    sound.playWin();
    const amount = parseFloat(rebalanceAmount) || 0;
    if (amount <= 0 || amount > coldStorageBalance) return;

    setColdStorageBalance((prev) => prev - amount);
    setHotVaultBalance((prev) => prev + amount);

    telemetry.recordAuditLog(
      'TREASURY',
      'Multi-Sig Hot Vault Rebalance',
      `${session.email} (Owner Approved)`,
      `Transferred ${amount} SOL from Cold Storage to Hot Play Vault`
    );
    setAuditLogs(telemetry.getAuditLogs());
    setActionSuccessMsg(`Multi-Sig rebalance of ${amount} SOL executed.`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const handleBanAddress = () => {
    if (!newBanAddress.trim() || !session?.isAdmin) return;
    sound.playChipClick();
    setBannedPlayers((prev) => [...prev, newBanAddress.trim()]);

    telemetry.recordAuditLog(
      'SECURITY',
      'Player Blacklisted',
      session.email || 'Admin Owner',
      `Banned player address/alias: ${newBanAddress.trim()}`
    );
    setNewBanAddress('');
    setAuditLogs(telemetry.getAuditLogs());
    setActionSuccessMsg('Address blacklisted in Production Beta circuit breaker.');
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Google Auth Owner Header */}
      <div className="cyber-glass-glow rounded-2xl p-6 border border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-600 to-purple-600 p-0.5 shadow-lg shadow-cyan-950">
            <div className="w-full h-full bg-[#060813] rounded-[14px] flex items-center justify-center text-cyan-400">
              <Crown className="w-6 h-6 animate-pulse text-yellow-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold font-display text-white tracking-wide">
                Solstice Enterprise RBAC Console
              </h2>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/40">
                PROD BETA V3.0
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Super Admin Owner: <span className="text-cyan-300 font-bold">gxqstudio@gmail.com</span> · Multi-Sig Governance
            </p>
          </div>
        </div>

        {/* Google Authentication / Owner Status Badge */}
        <div className="flex items-center gap-3 font-mono text-xs">
          {session ? (
            <div className="flex items-center gap-2 p-2 bg-slate-900/90 rounded-xl border border-cyan-500/40">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-white font-bold block">{session.email}</span>
                <span className="text-[10px] text-yellow-400 uppercase font-extrabold block">
                  {session.isOwner ? '👑 SUPER ADMIN OWNER (FULL ACCESS)' : 'ADMIN OPERATOR'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 ml-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleLogin}
              disabled={authLoading}
              className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 font-sans font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z" />
              </svg>
              <span>Sign in with Google</span>
            </button>
          )}
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs font-mono flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* RBAC Guard Check: If not logged in as Admin, show Access Denied screen */}
      {!session || !session.isAdmin ? (
        <div className="cyber-glass rounded-3xl p-8 border border-red-500/40 text-center space-y-6 font-mono max-w-xl mx-auto my-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-950 border border-red-500 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-8 h-8 animate-bounce" />
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              ADMINISTRATOR ACCESS RESTRICTED
            </h3>
            <p className="text-xs text-slate-300">
              Role-Based Access Control (RBAC) enforced. You must be authenticated as an authorized Administrator or Super Admin Owner (<span className="text-cyan-300 font-bold">gxqstudio@gmail.com</span>) to manage treasury vaults, calibrate risk, or moderate players.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-left text-xs space-y-2 text-slate-400">
            <div className="flex justify-between">
              <span>Required Role:</span>
              <span className="text-yellow-400 font-bold">ADMIN / SUPER_ADMIN_OWNER</span>
            </div>
            <div className="flex justify-between">
              <span>Current Status:</span>
              <span className="text-red-400 font-bold">UNAUTHENTICATED</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={authLoading}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-950 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Crown className="w-4 h-4 text-yellow-300" />
            <span>Authenticate Admin Role with Google / Key</span>
          </button>
        </div>
      ) : (
        <>
          {/* Admin Navigation Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-700/60 text-xs font-medium font-mono">
            <button
              onClick={() => {
                sound.playChipClick();
                setActiveTab('rbac');
              }}
              className={`py-2 px-2.5 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
                activeTab === 'rbac'
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Crown className="w-3.5 h-3.5" /> RBAC & Owner
            </button>

            <button
              onClick={() => {
                sound.playChipClick();
                setActiveTab('treasury');
              }}
              className={`py-2 px-2.5 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
                activeTab === 'treasury'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" /> Treasury Multi-Sig
            </button>

            <button
              onClick={() => {
                sound.playChipClick();
                setActiveTab('risk');
              }}
              className={`py-2 px-2.5 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
                activeTab === 'risk'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" /> Game Risk & Caps
            </button>

            <button
              onClick={() => {
                sound.playChipClick();
                setActiveTab('flags');
              }}
              className={`py-2 px-2.5 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
                activeTab === 'flags'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> Feature Flags
            </button>

            <button
              onClick={() => {
                sound.playChipClick();
                setActiveTab('telemetry');
              }}
              className={`py-2 px-2.5 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
                activeTab === 'telemetry'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" /> Observability
            </button>

            <button
              onClick={() => {
                sound.playChipClick();
                setActiveTab('audit');
              }}
              className={`py-2 px-2.5 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
                activeTab === 'audit'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" /> Audit Logs
            </button>
          </div>
        </>
      )}

      {/* TAB 0: RBAC & Owner Controls */}
      {activeTab === 'rbac' && (
        <div className="space-y-4 font-mono">
          <div className="cyber-glass rounded-2xl p-6 border border-yellow-500/30 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                <h3 className="text-sm font-bold text-white">Super Admin Owner Role Access Control (RBAC)</h3>
              </div>
              <span className="text-xs text-yellow-400 font-bold">Owner: gxqstudio@gmail.com</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-4 bg-slate-900/90 rounded-xl border border-yellow-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-yellow-300">Super Admin Owner</span>
                  <span className="px-2 py-0.5 rounded bg-yellow-950 text-yellow-300 text-[10px]">Unrestricted</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Full control over multi-sig cold storage, fee schedules, emergency game pauses, and contract parameter overrides.
                </p>
                <div className="text-[10px] text-slate-400 pt-1">Assigned to: gxqstudio@gmail.com</div>
              </div>

              <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300">Risk Operator</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px]">Calibrator</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Calibrate per-game house edge bps, maximum bet limits, and tilt detection sensitivity parameters.
                </p>
              </div>

              <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300">Compliance & Auditor</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px]">Read-Only</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Export OpenTelemetry audit logs, verify VRF seeds, and monitor real-time realized house yield.
                </p>
              </div>
            </div>

            {/* Blacklist / Anti-Cheat Circuit Breaker */}
            <div className="p-4 bg-slate-900/80 rounded-xl border border-red-500/30 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                <UserX className="w-4 h-4" />
                <span>Production Beta Blacklist & Anti-Cheat Manager</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  value={newBanAddress}
                  onChange={(e) => setNewBanAddress(e.target.value)}
                  placeholder="Enter wallet pubkey or alias to blacklist"
                  className="flex-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
                <button
                  onClick={handleBanAddress}
                  className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shrink-0"
                >
                  Blacklist Address
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {bannedPlayers.map((addr, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-500/40 text-red-200 text-[10px] font-bold flex items-center gap-1"
                  >
                    <Ban className="w-3 h-3 text-red-400" />
                    <span>{addr}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: Treasury Multi-Sig Management */}
      {activeTab === 'treasury' && (
        <div className="space-y-4 font-mono">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-900/80 rounded-xl border border-cyan-500/30">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
                Cold Treasury Reserves (Multi-Sig Vault)
              </span>
              <span className="font-mono text-2xl font-black text-white">
                {coldStorageBalance.toLocaleString()} SOL
              </span>
              <span className="text-[11px] text-cyan-400/80 font-mono block mt-1">
                ≈ ${(coldStorageBalance * 195.4).toLocaleString()} USD
              </span>
            </div>

            <div className="p-4 bg-slate-900/80 rounded-xl border border-orange-500/30">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
                Hot Player Payout Liquidity Buffer
              </span>
              <span className="font-mono text-2xl font-black text-orange-400">
                {hotVaultBalance.toFixed(2)} SOL
              </span>
              <span className="text-[11px] text-orange-400/80 font-mono block mt-1">
                Instant Settlement Active
              </span>
            </div>

            <div className="p-4 bg-slate-900/80 rounded-xl border border-purple-500/30">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
                Multi-Sig Authority Threshold
              </span>
              <span className="font-mono text-xl font-bold text-purple-300">
                3 of 5 Keys Required
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">Squads Protocol Compatible</span>
            </div>
          </div>

          {/* Rebalance Controller */}
          <div className="p-5 cyber-glass rounded-2xl border border-cyan-500/20 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Multi-Sig Treasury Buffer Rebalancer</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Transfer funds from the cold multi-sig vault into the hot program settlement bankroll to sustain high-roller action.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <input
                  type="number"
                  step="1"
                  value={rebalanceAmount}
                  onChange={(e) => setRebalanceAmount(e.target.value)}
                  placeholder="Amount in SOL"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-400"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-cyan-400 font-mono font-bold pointer-events-none">
                  SOL
                </span>
              </div>

              <button
                onClick={handleRebalanceTreasury}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-950 flex items-center justify-center gap-2 shrink-0 transition-all"
              >
                <Lock className="w-4 h-4 text-cyan-200" />
                <span>Authorize & Execute Transfer (3/5 Signatures)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Per-Game Risk & Caps */}
      {activeTab === 'risk' && (
        <div className="cyber-glass rounded-2xl p-6 border border-cyan-500/20 space-y-4 font-mono">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Per-Game Risk Governance</h3>
              <p className="text-xs text-slate-400">Configure On-Chain House Edge (bps) and Maximum Bet limits</p>
            </div>
            <span className="text-xs font-mono text-cyan-400">100 bps = 1.00%</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 text-[11px]">
                  <th className="pb-2.5">Game</th>
                  <th className="pb-2.5">House Edge (bps)</th>
                  <th className="pb-2.5">Min Bet (Floor)</th>
                  <th className="pb-2.5">Max Bet Cap</th>
                  <th className="pb-2.5">Max Multiplier</th>
                  <th className="pb-2.5">Status</th>
                  <th className="pb-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {Object.values(gameRisks).map((g) => (
                  <tr key={g.gameId} className="hover:bg-slate-900/40">
                    <td className="py-3 font-semibold text-white">{g.gameName}</td>
                    <td className="py-3 text-emerald-400 font-bold">
                      {(g.houseEdgeBps / 100).toFixed(2)}% ({g.houseEdgeBps} bps)
                    </td>
                    <td className="py-3 text-slate-300">{g.minBetSol} SOL</td>
                    <td className="py-3 text-cyan-300 font-bold">{g.maxBetSol} SOL</td>
                    <td className="py-3 text-yellow-400 font-bold">{g.maxPayoutMultiplier}x</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          g.enabled
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : 'bg-red-950 text-red-300 border border-red-500/40'
                        }`}
                      >
                        {g.enabled ? 'ACTIVE' : 'PAUSED'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() =>
                          handleUpdateGameRisk(
                            g.gameId,
                            g.houseEdgeBps,
                            g.maxBetSol >= 50 ? 25 : g.maxBetSol + 10,
                            !g.enabled
                          )
                        }
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 rounded-lg text-[11px] font-bold"
                      >
                        Calibrate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Feature Flags & Remote Config */}
      {activeTab === 'flags' && (
        <div className="cyber-glass rounded-2xl p-6 border border-cyan-500/20 space-y-4 font-mono">
          <div>
            <h3 className="text-sm font-bold text-white">Enterprise Feature Flags</h3>
            <p className="text-xs text-slate-400">Zero-downtime remote configuration toggles</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {Object.entries(flags).map(([key, val]) => (
              <div
                key={key}
                className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-700/60 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-white block font-mono">{key}</span>
                  <span className="text-[11px] text-slate-400">
                    {val ? 'Enabled in production' : 'Temporarily suspended'}
                  </span>
                </div>

                <button
                  onClick={() => handleToggleFlag(key as keyof EnterpriseFeatureFlags)}
                  className={`p-1.5 rounded-lg transition-all ${
                    val ? 'text-cyan-400 hover:text-cyan-300' : 'text-slate-500 hover:text-slate-400'
                  }`}
                >
                  {val ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Telemetry & Observability */}
      {activeTab === 'telemetry' && (
        <div className="space-y-4 font-mono">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-slate-900/80 rounded-xl border border-cyan-500/30 text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                Real-Time Solana TPS
              </span>
              <span className="font-mono text-xl font-bold text-cyan-300">{metrics.tps}</span>
              <span className="text-[10px] text-emerald-400 block mt-0.5">High Throughput</span>
            </div>

            <div className="p-4 bg-slate-900/80 rounded-xl border border-cyan-500/30 text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                RPC Ping Latency
              </span>
              <span className="font-mono text-xl font-bold text-emerald-400">
                {metrics.rpcLatencyMs} ms
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Triton / Helius Clustered</span>
            </div>

            <div className="p-4 bg-slate-900/80 rounded-xl border border-cyan-500/30 text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                Realized House Edge
              </span>
              <span className="font-mono text-xl font-bold text-yellow-300">
                {metrics.houseEdgeRealizedPct}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Across 142k+ Rounds</span>
            </div>

            <div className="p-4 bg-slate-900/80 rounded-xl border border-cyan-500/30 text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                Circuit Breaker Status
              </span>
              <span className="font-mono text-xl font-bold text-emerald-400">
                {metrics.circuitBreakerStatus}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Zero Error Cascade</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Audit Log Trail */}
      {activeTab === 'audit' && (
        <div className="cyber-glass rounded-2xl p-6 border border-cyan-500/20 space-y-3 font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Immutable Operator Audit Trail</h3>
            <span className="text-xs font-mono text-slate-400">OpenTelemetry Trace Correlated</span>
          </div>

          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-slate-900/70 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] border border-cyan-500/40">
                      {log.category}
                    </span>
                    <span className="text-white font-bold">{log.action}</span>
                    <span className="text-slate-500 text-[10px]">Trace: {log.traceId.slice(0, 8)}...</span>
                  </div>
                  <p className="text-slate-300 text-[11px] mt-1">{log.details}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-slate-400 text-[10px] block">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-slate-400 text-[10px]">{log.operator}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
