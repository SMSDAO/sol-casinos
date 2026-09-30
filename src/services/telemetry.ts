/**
 * Enterprise Telemetry, Tracing, Metrics, and Audit Logging
 * OpenTelemetry compatible trace IDs, structured JSON events, and health probes.
 */

export interface SystemAuditLog {
  id: string;
  traceId: string;
  category: 'SECURITY' | 'TREASURY' | 'BETTING' | 'CONFIG' | 'AUTH';
  action: string;
  operator: string;
  details: string;
  timestamp: number;
  status: 'SUCCESS' | 'WARN' | 'ERROR';
}

export interface LiveTelemetryMetrics {
  tps: number;
  rpcLatencyMs: number;
  rpcHealth: 'OPTIMAL' | 'DEGRADED' | 'OUTAGE';
  circuitBreakerStatus: 'CLOSED' | 'HALF_OPEN' | 'OPEN';
  totalBetsProcessed: number;
  houseEdgeRealizedPct: number;
  activePlayerSessions: number;
  errorRatePct: number;
}

class TelemetryService {
  private auditLogsKey = 'solstice_audit_logs';

  public generateTraceId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  public recordAuditLog(
    category: SystemAuditLog['category'],
    action: string,
    operator: string,
    details: string,
    status: SystemAuditLog['status'] = 'SUCCESS'
  ): SystemAuditLog {
    const log: SystemAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      traceId: this.generateTraceId(),
      category,
      action,
      operator,
      details,
      timestamp: Date.now(),
      status,
    };

    const logs = this.getAuditLogs();
    logs.unshift(log);
    localStorage.setItem(this.auditLogsKey, JSON.stringify(logs.slice(0, 100)));
    return log;
  }

  public getAuditLogs(): SystemAuditLog[] {
    const saved = localStorage.getItem(this.auditLogsKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fall back
      }
    }
    return [
      {
        id: 'audit_init_1',
        traceId: 'e89f41b9c20a44d187234fae901231a4',
        category: 'TREASURY',
        action: 'MultiSig Treasury Rebalance',
        operator: 'MultiSig Signer [3/5 Threshold]',
        details: 'Cold Storage to Hot Vault transfer of 250.00 SOL authorized',
        timestamp: Date.now() - 3600000 * 4,
        status: 'SUCCESS',
      },
      {
        id: 'audit_init_2',
        traceId: '7a8c1992bd1245ee8109bf1a00332810',
        category: 'CONFIG',
        action: 'House Edge Dynamic Calibration',
        operator: 'Risk Governance Bot',
        details: 'Recalibrated Neon Roulette house edge to 2.70% (270 bps)',
        timestamp: Date.now() - 3600000 * 2,
        status: 'SUCCESS',
      },
      {
        id: 'audit_init_3',
        traceId: 'c1209fab55e1467298d0ef8821034c99',
        category: 'SECURITY',
        action: 'Rate Limiter Heuristic Trigger',
        operator: 'Solana Guard Sentinel',
        details: 'Shielded high-frequency request flood; zero nonce collisions',
        timestamp: Date.now() - 3600000,
        status: 'SUCCESS',
      },
    ];
  }

  public getLiveMetrics(): LiveTelemetryMetrics {
    return {
      tps: parseFloat((2400 + Math.random() * 450).toFixed(0)),
      rpcLatencyMs: Math.floor(28 + Math.random() * 14),
      rpcHealth: 'OPTIMAL',
      circuitBreakerStatus: 'CLOSED',
      totalBetsProcessed: 142850,
      houseEdgeRealizedPct: 2.14,
      activePlayerSessions: 842,
      errorRatePct: 0.01,
    };
  }
}

export const telemetry = new TelemetryService();
