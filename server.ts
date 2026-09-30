import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Redis from 'ioredis';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Redis Client for Distributed Rate Limiting (with graceful fallback)
let redisClient: Redis | null = null;
try {
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  const client = new Redis(redisUrl, {
    connectTimeout: 1500,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // Avoid continuous reconnect logging if Redis server is unprovisioned
  });

  client.on('connect', () => {
    console.log('⚡ Redis Rate Limiting Active');
    redisClient = client;
  });

  client.on('error', () => {
    redisClient = null;
  });
} catch {
  redisClient = null;
}

// In-Memory Fallback Rate Limiting Store
interface MemoryRateLimitRecord {
  count: number;
  resetTime: number;
}
const memoryRateLimitStore = new Map<string, MemoryRateLimitRecord>();

function createRateLimiter(prefix: string, maxRequests: number, windowSec: number) {
  return async (req: Request, res: Response, next: () => void) => {
    const identifier =
      (req.headers['x-wallet-pubkey'] as string) ||
      (req.headers['x-forwarded-for'] as string) ||
      req.ip ||
      'unknown-client';

    const key = `ratelimit:${prefix}:${identifier}`;

    // 1. Try Redis Rate Limiting
    if (redisClient) {
      try {
        const requests = await redisClient.incr(key);
        if (requests === 1) {
          await redisClient.expire(key, windowSec);
        }

        if (requests > maxRequests) {
          const ttl = await redisClient.ttl(key);
          const retryAfterSec = ttl > 0 ? ttl : windowSec;
          res.setHeader('Retry-After', retryAfterSec);
          return res.status(200).json({
            error: `Rate limit exceeded. Retry in ${retryAfterSec}s.`,
            fallback: true,
            rateLimited: true,
          });
        }
        return next();
      } catch {
        // Fallback to in-memory store if Redis throws error
      }
    }

    // 2. Fallback to In-Memory Sliding Window
    const now = Date.now();
    const windowMs = windowSec * 1000;
    const record = memoryRateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      memoryRateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(200).json({
        error: `Rate limit exceeded. Retry in ${retryAfterSec}s.`,
        fallback: true,
        rateLimited: true,
      });
    }

    record.count += 1;
    return next();
  };
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // Initialize Gemini AI SDK
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // Rate Limiter Middlewares (Redis + In-Memory Fallback)
  const aiRateLimiter = createRateLimiter('gemini-analyze', 10, 60);
  const launchRateLimiter = createRateLimiter('token-launch', 5, 60);
  const betRateLimiter = createRateLimiter('casino-bet', 30, 60);

  // Casino Betting Settlement Endpoint with Rate Limiting
  app.post('/api/bet', betRateLimiter, async (req: Request, res: Response) => {
    const { game, betAmountSol, playerWallet, choice } = req.body;
    const isWin = Math.random() > 0.48; // 48% win probability (house edge 2%)
    const multiplier = isWin ? 2.0 : 0.0;
    const payoutSol = isWin ? betAmountSol * multiplier : 0;

    return res.json({
      success: true,
      txSignature: `5K_BET_${Math.random().toString(36).substring(2, 12)}`,
      game,
      playerWallet,
      betAmountSol,
      payoutSol,
      multiplier,
      status: isWin ? 'won' : 'lost',
      timestamp: Date.now(),
    });
  });

  // Token Launch Studio API Endpoint with Rate Limiting
  app.post('/api/launch-token', launchRateLimiter, async (req: Request, res: Response) => {
    const { name, symbol, supply, decimals, creatorWallet } = req.body;
    return res.json({
      success: true,
      mintAddress: `${symbol?.toUpperCase()}_${Math.random().toString(36).substring(2, 10)}`,
      txSignature: `5K_${Math.random().toString(36).substring(2, 12)}`,
      creatorWallet,
      timestamp: Date.now(),
    });
  });

  // AI Portfolio & Betting Strategy Analyst Endpoint
  app.post('/api/gemini/analyze', aiRateLimiter, async (req: Request, res: Response) => {
    try {
      const {
        history,
        currentBalance,
        winRate,
        netProfitSol,
        totalVolumeSol,
        topGame,
        tiltRisk,
      } = req.body;

      if (!ai) {
        return res.status(200).json({ fallback: true });
      }

      const prompt = `You are the lead quantitative risk and bankroll strategist for SOLSTICE ROULETTE on Solana.
Analyze this player's telemetry data and provide mathematical, Kelly-criterion grounded advice.

Player Stats:
- Current SOL Balance: ${currentBalance} SOL
- Total Bets Placed: ${history?.length || 0}
- Win Rate: ${winRate}%
- Net Profit/Loss: ${netProfitSol} SOL
- Total Wagering Volume: ${totalVolumeSol} SOL
- Top Performing Game: ${topGame}
- Tilt / Streak Risk: ${tiltRisk}

Recent Bets Summary:
${JSON.stringify(history?.slice(-15) || [])}

Provide your analysis in JSON with the exact schema.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are an expert crypto casino quant & risk analyst. Output pure structured JSON with actionable insights.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              riskScore: { type: Type.INTEGER, description: 'Risk score 1-100' },
              riskTier: {
                type: Type.STRING,
                description: 'Conservative, Moderate, Aggressive, or Degen High-Roller',
              },
              kellyRecommendation: {
                type: Type.STRING,
                description: 'Specific Kelly criterion recommendation for stake sizing',
              },
              winRate: { type: Type.NUMBER },
              netProfitSol: { type: Type.NUMBER },
              totalVolumeSol: { type: Type.NUMBER },
              topPerformingGame: { type: Type.STRING },
              tiltRisk: { type: Type.STRING, description: 'Low, Moderate, or High' },
              aiInsights: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 high-value mathematical insights about player style',
              },
              strategicAdvice: {
                type: Type.STRING,
                description: 'Summary directive for maximizing longevity and edge',
              },
            },
            required: [
              'riskScore',
              'riskTier',
              'kellyRecommendation',
              'winRate',
              'netProfitSol',
              'totalVolumeSol',
              'topPerformingGame',
              'tiltRisk',
              'aiInsights',
              'strategicAdvice',
            ],
          },
        },
      });

      if (response && response.text) {
        const parsed = JSON.parse(response.text.trim());
        return res.json({ report: parsed });
      }

      return res.status(200).json({ fallback: true });
    } catch {
      return res.status(200).json({
        fallback: true,
      });
    }
  });

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      redisActive: !!redisClient,
      time: new Date().toISOString(),
    });
  });

  // Vite development middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Solstice Roulette server running at http://localhost:${PORT}`);
  });
}

startServer();
