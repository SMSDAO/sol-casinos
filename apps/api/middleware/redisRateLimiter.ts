import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

// Initialize Redis Client with configuration
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
let redisClient: Redis | null = null;

try {
  redisClient = new Redis(redisUrl, {
    connectTimeout: 2000,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // Stop reconnect loops if Redis isn't active
  });

  redisClient.on('connect', () => {
    console.log('⚡ Redis Rate Limiting Active in apps/api');
  });

  redisClient.on('error', () => {
    redisClient = null;
  });
} catch {
  redisClient = null;
}

// Memory Store Fallback in case Redis is offline
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const memoryStore = new Map<string, RateLimitRecord>();

interface RateLimiterOptions {
  prefix: string;
  maxRequests: number;
  windowSec: number;
}

/**
 * Server-side rate limiter protecting endpoints using Redis (with In-Memory fallback).
 * Tracks requests by BOTH wallet address (header/body) and client IP address.
 */
export function createRedisRateLimiter(options: RateLimiterOptions) {
  const { prefix, maxRequests, windowSec } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      req.ip ||
      '127.0.0.1';

    // Extract wallet from header or body
    const wallet =
      (req.headers['x-wallet-pubkey'] as string) ||
      req.body?.playerWallet ||
      req.body?.creatorWallet ||
      'anonymous';

    // Track both IP and Wallet independently to prevent bypasses
    const ipKey = `ratelimit:${prefix}:ip:${ip}`;
    const walletKey = `ratelimit:${prefix}:wallet:${wallet}`;

    const keysToCheck = wallet !== 'anonymous' ? [ipKey, walletKey] : [ipKey];

    // 1. Try Redis sliding window strategy
    if (redisClient) {
      try {
        let isLimitExceeded = false;
        let maxRemainingTtl = windowSec;

        for (const key of keysToCheck) {
          const count = await redisClient.incr(key);
          if (count === 1) {
            await redisClient.expire(key, windowSec);
          }

          if (count > maxRequests) {
            isLimitExceeded = true;
            const ttl = await redisClient.ttl(key);
            if (ttl > 0 && ttl < maxRemainingTtl) {
              maxRemainingTtl = ttl;
            }
          }
        }

        if (isLimitExceeded) {
          res.setHeader('Retry-After', maxRemainingTtl);
          return res.status(200).json({
            error: `Too many requests. Please wait ${maxRemainingTtl}s before retrying.`,
            rateLimited: true,
            fallback: true,
          });
        }

        return next();
      } catch (err) {
        // Fallback to memory store below
      }
    }

    // 2. In-Memory Fallback
    const now = Date.now();
    const windowMs = windowSec * 1000;
    let isMemoryLimitExceeded = false;
    let longestResetTime = now + windowMs;

    for (const key of keysToCheck) {
      const record = memoryStore.get(key);

      if (!record || now > record.resetTime) {
        memoryStore.set(key, { count: 1, resetTime: now + windowMs });
      } else {
        record.count += 1;
        if (record.count > maxRequests) {
          isMemoryLimitExceeded = true;
          if (record.resetTime > longestResetTime) {
            longestResetTime = record.resetTime;
          }
        }
      }
    }

    if (isMemoryLimitExceeded) {
      const retryAfterSec = Math.ceil((longestResetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(200).json({
        error: `Too many requests. Please wait ${retryAfterSec}s before retrying.`,
        rateLimited: true,
        fallback: true,
      });
    }

    return next();
  };
}
