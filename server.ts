import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Import our secure Redis Rate Limiter middleware
import { createRedisRateLimiter } from './apps/api/middleware/redisRateLimiter';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Real-time Spectator Live Telemetry Interface
export interface SpectatorPlayerState {
  id: string;
  name: string;
  wallet: string;
  activeGame: string;
  betAmountSol: number;
  currentMultiplier: number;
  status: 'playing' | 'cashed_out' | 'bust' | 'won';
  currentScore: number;
  activeArtifacts: string[];
  chosenPath: string[];
  events: string[];
  stats: {
    winRate: number;
    totalWageredSol: number;
    netProfitSol: number;
    streak: number;
  };
  lastUpdate: number;
}

// Authoritative Spectator State on Server
const spectatorPlayers: SpectatorPlayerState[] = [
  {
    id: 'stream-p1',
    name: 'CyberDegen_Apex',
    wallet: 'DegenApe88xK9pL2mP8wZ44mR83kNp2bY79qTx8fL31aCs',
    activeGame: 'Mines & Treasure',
    betAmountSol: 0.05,
    currentMultiplier: 2.14,
    status: 'playing',
    currentScore: 420,
    activeArtifacts: ['Golden Prism Key', 'Deflector Shield'],
    chosenPath: ['Tile [1,2] - Safe', 'Tile [3,4] - Safe', 'Tile [2,2] - Diamond Gem (2.14x)'],
    events: ['Wagered 0.05 SOL', 'Found Emerald (+0.025 SOL)', 'Multiplier elevated to 2.14x'],
    stats: {
      winRate: 64.2,
      totalWageredSol: 12.85,
      netProfitSol: 4.35,
      streak: 4,
    },
    lastUpdate: Date.now(),
  },
  {
    id: 'stream-p2',
    name: 'SolanaSniper_X',
    wallet: 'SolPrism7xK9pL2mP8wZ44mR83kNp2bY79qTx8fL31aCs',
    activeGame: 'Crash Rocket',
    betAmountSol: 0.12,
    currentMultiplier: 1.95,
    status: 'playing',
    currentScore: 680,
    activeArtifacts: ['Auto-Eject Protocol', 'Fuel Cell Booster'],
    chosenPath: ['Launch @ 1.00x', 'Mach 1 @ 1.50x', 'Stratosphere @ 1.95x'],
    events: ['Rocket ignition confirmed', 'Surpassed 1.50x threshold', 'Auto-cashout primed at 2.50x'],
    stats: {
      winRate: 58.0,
      totalWageredSol: 24.50,
      netProfitSol: 6.82,
      streak: 2,
    },
    lastUpdate: Date.now(),
  },
  {
    id: 'stream-p3',
    name: 'NeonValkyrie',
    wallet: 'ApeLord22xK9pL2mP8wZ44mR83kNp2bY79qTx8fL31aCs',
    activeGame: 'Neon Roulette',
    betAmountSol: 0.025,
    currentMultiplier: 36.0,
    status: 'won',
    currentScore: 920,
    activeArtifacts: ['Lucky Chip Charm', 'Lightning Multiplier'],
    chosenPath: ['Inside Bet: Straight-Up #17 Black', 'Lightning Multiplier Triggered (36x)'],
    events: ['Wheel spin locked in', 'Ball landed on #17 Black!', 'Instant payout: +0.900 SOL credited!'],
    stats: {
      winRate: 49.5,
      totalWageredSol: 18.20,
      netProfitSol: 9.15,
      streak: 3,
    },
    lastUpdate: Date.now(),
  },
  {
    id: 'stream-p4',
    name: 'HighRoller_Ghost',
    wallet: 'Roller99xK9pL2mP8wZ44mR83kNp2bY79qTx8fL31aCs',
    activeGame: 'Chrome Blackjack',
    betAmountSol: 0.20,
    currentMultiplier: 2.0,
    status: 'playing',
    currentScore: 750,
    activeArtifacts: ['Insurance Card Protector'],
    chosenPath: ['Player Hand: 10♠, 8♦ (18)', 'Dealer Shows: 6♣', 'Decision: STAND'],
    events: ['Bet placed 0.20 SOL', 'Player stands on 18', 'Dealer drawing cards...'],
    stats: {
      winRate: 61.8,
      totalWageredSol: 45.00,
      netProfitSol: 12.40,
      streak: 5,
    },
    lastUpdate: Date.now(),
  },
];

// Active SSE connection clients
const sseSpectatorClients: Response[] = [];

export interface SpectatorChatMessage {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  timestamp: number;
  tier?: string;
}

const spectatorChatHistory: SpectatorChatMessage[] = [
  {
    id: 'sc-1',
    sender: 'CyberDegen_99',
    avatar: '🤖',
    text: 'Apex is on a 4-win streak! Let it ride! 🔥',
    timestamp: Date.now() - 45000,
    tier: 'VIP',
  },
  {
    id: 'sc-2',
    sender: 'SolanaSniper',
    avatar: '🎯',
    text: 'Rocket approaching 3x altitude... hold on! 🚀',
    timestamp: Date.now() - 25000,
    tier: 'High-Roller',
  },
  {
    id: 'sc-3',
    sender: 'WhaleWatcher',
    avatar: '🐋',
    text: 'Mirrored 0.05 SOL bet on Mines. Safe tile cleared! 💎',
    timestamp: Date.now() - 10000,
    tier: 'Whale',
  },
];

function broadcastSpectatorChat(msg: SpectatorChatMessage) {
  const payload = JSON.stringify({
    type: 'spectator_chat',
    message: msg,
    timestamp: Date.now(),
  });
  for (let i = sseSpectatorClients.length - 1; i >= 0; i--) {
    const client = sseSpectatorClients[i];
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      sseSpectatorClients.splice(i, 1);
    }
  }
}

function broadcastSpectatorState() {
  const payload = JSON.stringify({
    type: 'telemetry_sync',
    players: spectatorPlayers,
    timestamp: Date.now(),
  });
  for (let i = sseSpectatorClients.length - 1; i >= 0; i--) {
    const client = sseSpectatorClients[i];
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      sseSpectatorClients.splice(i, 1);
    }
  }
}

// Background Authoritative Game State Engine (Real-Time Game State Generator)
setInterval(() => {
  let changed = false;
  spectatorPlayers.forEach((p) => {
    if (p.status === 'playing') {
      changed = true;
      if (p.activeGame === 'Crash Rocket') {
        const nextMult = parseFloat((p.currentMultiplier + 0.08).toFixed(2));
        if (nextMult > 3.8 && Math.random() > 0.4) {
          p.status = 'cashed_out';
          p.events.push(`Cashed out at ${nextMult}x! Payout: ${(p.betAmountSol * nextMult).toFixed(4)} SOL`);
          p.stats.netProfitSol = parseFloat((p.stats.netProfitSol + p.betAmountSol * (nextMult - 1)).toFixed(4));
          p.stats.streak += 1;
        } else if (Math.random() > 0.94) {
          p.status = 'bust';
          p.events.push(`💥 Rocket exploded at ${nextMult}x!`);
          p.stats.netProfitSol = parseFloat((p.stats.netProfitSol - p.betAmountSol).toFixed(4));
          p.stats.streak = 0;
        } else {
          p.currentMultiplier = nextMult;
          p.currentScore += 15;
          p.chosenPath.push(`Altitude ${nextMult}x`);
          if (p.chosenPath.length > 5) p.chosenPath.shift();
        }
      } else if (p.activeGame === 'Mines & Treasure') {
        if (Math.random() > 0.6) {
          const r = Math.floor(Math.random() * 5);
          const c = Math.floor(Math.random() * 5);
          if (Math.random() > 0.85) {
            p.status = 'bust';
            p.events.push(`Hit bomb at [${r}, ${c}]!`);
            p.stats.streak = 0;
          } else {
            const nextMult = parseFloat((p.currentMultiplier + 0.35).toFixed(2));
            p.currentMultiplier = nextMult;
            p.chosenPath.push(`Tile [${r},${c}] - Gem (${nextMult}x)`);
            if (p.chosenPath.length > 5) p.chosenPath.shift();
            p.events.push(`Safe Gem revealed at [${r}, ${c}] (+0.015 SOL)`);
          }
        }
      } else if (p.activeGame === 'Chrome Blackjack') {
        if (Math.random() > 0.7) {
          const win = Math.random() > 0.45;
          p.status = win ? 'won' : 'bust';
          p.events.push(win ? 'Dealer busts at 24! Player Wins 2.0x' : 'Dealer makes 20. Player lost round.');
          if (win) {
            p.stats.streak += 1;
            p.stats.netProfitSol = parseFloat((p.stats.netProfitSol + p.betAmountSol).toFixed(4));
          } else {
            p.stats.streak = 0;
            p.stats.netProfitSol = parseFloat((p.stats.netProfitSol - p.betAmountSol).toFixed(4));
          }
        }
      }
      if (p.events.length > 8) p.events.shift();
      p.lastUpdate = Date.now();
    } else {
      // Respawn resolved players with new games after brief cooldown
      if (Math.random() > 0.7) {
        changed = true;
        const games = ['Crash Rocket', 'Mines & Treasure', 'Neon Roulette', 'Chrome Blackjack'];
        p.activeGame = games[Math.floor(Math.random() * games.length)];
        p.betAmountSol = parseFloat((0.02 + Math.random() * 0.15).toFixed(3));
        p.currentMultiplier = 1.0;
        p.status = 'playing';
        p.chosenPath = ['Round initialized on-chain'];
        p.events = [`Initiated new round on ${p.activeGame} (${p.betAmountSol} SOL)`];
        p.lastUpdate = Date.now();
      }
    }
  });

  if (changed && sseSpectatorClients.length > 0) {
    broadcastSpectatorState();
  }

  // Occasional spectator chat chatter
  if (Math.random() > 0.75 && sseSpectatorClients.length > 0) {
    const chatterList = [
      { sender: 'ApexFan_Sol', avatar: '⚡', text: 'Apex holding strong, that Kelly sizing is working!', tier: 'Member' },
      { sender: 'RocketRider', avatar: '🚀', text: 'Passed 2.0x! Who else is still in the rocket?', tier: 'High-Roller' },
      { sender: 'CryptoQueen', avatar: '👑', text: 'Tipping 0.01 SOL to table! Big luck vibes 🍀', tier: 'VIP' },
      { sender: 'SolanaQuant', avatar: '📊', text: 'Statistically 4 safe gems in a row is 68% RTP right now', tier: 'Member' },
      { sender: 'BlackjackPro', avatar: '🃏', text: 'Dealer showing 6 is always an auto-stand on 18.', tier: 'VIP' },
    ];
    const picked = chatterList[Math.floor(Math.random() * chatterList.length)];
    const autoMsg: SpectatorChatMessage = {
      id: `sc-auto-${Date.now()}`,
      sender: picked.sender,
      avatar: picked.avatar,
      text: picked.text,
      timestamp: Date.now(),
      tier: picked.tier,
    };
    spectatorChatHistory.push(autoMsg);
    if (spectatorChatHistory.length > 50) spectatorChatHistory.shift();
    broadcastSpectatorChat(autoMsg);
  }
}, 2000);

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

  // Redis Rate Limiter Middlewares protecting endpoints from brute-force (Wallet + IP tracking)
  const aiRateLimiter = createRedisRateLimiter({
    prefix: 'gemini-analyze',
    maxRequests: 10,
    windowSec: 60,
  });

  const launchRateLimiter = createRedisRateLimiter({
    prefix: 'token-launch',
    maxRequests: 5,
    windowSec: 60,
  });

  const betRateLimiter = createRedisRateLimiter({
    prefix: 'casino-bet',
    maxRequests: 30,
    windowSec: 60,
  });

  // Solana Actions / Blinks specification endpoints
  app.get('/actions.json', (_req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');
    res.json({
      rules: [
        {
          pathPattern: '/api/action/**',
          apiPath: '/api/action/**',
        },
      ],
    });
  });

  app.options('/api/action/*', (_req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Encoding, Accept-Encoding');
    res.setHeader('Access-Control-Expose-Headers', 'X-Action-Version, X-Blockchain-Ids');
    res.setHeader('X-Action-Version', '2.1.3');
    res.setHeader('X-Blockchain-Ids', 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp');
    res.status(204).end();
  });

  app.get('/api/action/play', (req: Request, res: Response) => {
    const game = (req.query.game as string) || 'roulette';
    const ref = (req.query.ref as string) || 'SOLSTICE-SOL2026';
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'X-Action-Version, X-Blockchain-Ids');
    res.setHeader('X-Action-Version', '2.1.3');
    res.setHeader('X-Blockchain-Ids', 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp');
    res.json({
      icon: 'https://ais-dev-wodqg4vjvosq73rhbpcsrn-58325421054.us-east5.run.app/icon.svg',
      title: `Play Solstice ${game.replace(/_/g, ' ').toUpperCase()} on Solana`,
      description: `Wager on-chain with provably fair SHA-256 VRF settlements. Use ref code ${ref} for 15% lifetime rakeback!`,
      label: 'Play Now',
      links: {
        actions: [
          {
            label: 'Bet 0.01 SOL',
            href: `/api/action/bet?amount=0.01&game=${game}&ref=${ref}`,
          },
          {
            label: 'Bet 0.05 SOL',
            href: `/api/action/bet?amount=0.05&game=${game}&ref=${ref}`,
          },
          {
            label: 'Bet 0.10 SOL',
            href: `/api/action/bet?amount=0.10&game=${game}&ref=${ref}`,
          },
        ],
      },
    });
  });

  // Real-Time Spectator SSE Stream
  app.get('/api/spectator/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders?.();

    // Initial snapshot including players & chat history
    const initialPayload = JSON.stringify({
      type: 'init',
      players: spectatorPlayers,
      chatMessages: spectatorChatHistory,
      timestamp: Date.now(),
    });
    res.write(`data: ${initialPayload}\n\n`);

    sseSpectatorClients.push(res);

    req.on('close', () => {
      const idx = sseSpectatorClients.indexOf(res);
      if (idx !== -1) sseSpectatorClients.splice(idx, 1);
    });
  });

  // Spectator Snapshot REST Endpoint
  app.get('/api/spectator/players', (_req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ success: true, players: spectatorPlayers, timestamp: Date.now() });
  });

  // Spectator Chat Endpoints
  app.get('/api/spectator/chat', (_req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ success: true, messages: spectatorChatHistory });
  });

  app.post('/api/spectator/chat', (req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { sender, text, avatar, tier } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Empty message' });
    }
    const newMsg: SpectatorChatMessage = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sender: sender ? String(sender).slice(0, 24) : 'Spectator',
      avatar: avatar || '🕶️',
      text: text.trim().slice(0, 160),
      timestamp: Date.now(),
      tier: tier || 'Spectator',
    };
    spectatorChatHistory.push(newMsg);
    if (spectatorChatHistory.length > 50) spectatorChatHistory.shift();
    broadcastSpectatorChat(newMsg);
    return res.json({ success: true, message: newMsg });
  });

  // Spectator Tip Endpoint
  app.post('/api/spectator/tip', (req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { playerId, amountSol, senderWallet } = req.body;
    const player = spectatorPlayers.find((p) => p.id === playerId);
    if (player) {
      const senderText = senderWallet ? `${senderWallet.slice(0, 4)}...${senderWallet.slice(-4)}` : 'Anonymous Spectator';
      player.events.push(`💖 Tip of +${amountSol} SOL received from ${senderText}!`);
      if (player.events.length > 8) player.events.shift();
      player.stats.netProfitSol = parseFloat((player.stats.netProfitSol + (amountSol || 0.01)).toFixed(4));
      broadcastSpectatorState();
      return res.json({ success: true, message: 'Tip delivered to player stream!' });
    }
    return res.status(404).json({ success: false, error: 'Spectated player not found' });
  });

  // Casino Betting Settlement Endpoint with Rate Limiting & Real-time Spectator Broadcast
  app.post('/api/bet', betRateLimiter, async (req: Request, res: Response) => {
    const { game, betAmountSol, playerWallet } = req.body;
    const isWin = Math.random() > 0.48; // 48% win probability (house edge 2%)
    const multiplier = isWin ? 2.0 : 0.0;
    const payoutSol = isWin ? betAmountSol * multiplier : 0;

    // Reflect bet in spectator feed
    if (playerWallet) {
      const matched = spectatorPlayers.find((p) => p.wallet === playerWallet);
      if (matched) {
        matched.activeGame = game;
        matched.betAmountSol = betAmountSol;
        matched.currentMultiplier = multiplier;
        matched.status = isWin ? 'won' : 'bust';
        matched.events.push(`Placed ${betAmountSol} SOL on ${game} -> ${isWin ? 'WON (+ ' + payoutSol + ' SOL)' : 'LOST'}`);
        if (matched.events.length > 8) matched.events.shift();
        matched.lastUpdate = Date.now();
        broadcastSpectatorState();
      }
    }

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
    const { symbol, creatorWallet } = req.body;
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
      time: new Date().toISOString(),
    });
  });

  // Vite development middleware vs Static Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.use('*', async (req: Request, res: Response, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api') || url.startsWith('/@') || url.startsWith('/node_modules') || url.startsWith('/src')) {
        return next();
      }
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
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
