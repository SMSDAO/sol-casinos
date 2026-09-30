/**
 * Provably Fair Cryptographic Engine
 * Based on HMAC-SHA256 & SHA-256 Commit-Reveal verification.
 */

export interface ProvablyFairRound {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  revealed: boolean;
  game: string;
  resultSummary: string;
}

export async function sha256(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateRandomHex(bytes = 32): string {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return Array.from(array).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Derives a float [0, 1) from serverSeed + clientSeed + nonce using HMAC-SHA256 approximation
 */
export async function getVerifiableFloat(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  index = 0
): Promise<number> {
  const raw = `${serverSeed}:${clientSeed}:${nonce}:${index}`;
  const hash = await sha256(raw);
  // Take first 8 hex characters (32 bits)
  const sub = hash.slice(0, 8);
  const intVal = parseInt(sub, 16);
  return intVal / 0x100000000;
}

/**
 * Game Specific Result Calculations
 */

// 1. Neon Roulette (0-36)
export async function calculateRouletteOutcome(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): Promise<{ number: number; color: 'green' | 'red' | 'black'; multiplier: number }> {
  const floatVal = await getVerifiableFloat(serverSeed, clientSeed, nonce);
  const num = Math.floor(floatVal * 37); // 0 to 36

  // Lightning Multipliers (chance of 50x, 100x, 200x, 500x on 1-3 lucky numbers)
  const multFloat = await getVerifiableFloat(serverSeed, clientSeed, nonce, 1);
  let multiplier = 36;
  if (multFloat > 0.95) {
    multiplier = 500;
  } else if (multFloat > 0.90) {
    multiplier = 200;
  } else if (multFloat > 0.80) {
    multiplier = 100;
  } else if (multFloat > 0.65) {
    multiplier = 50;
  }

  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  let color: 'green' | 'red' | 'black' = 'black';
  if (num === 0) color = 'green';
  else if (redNumbers.includes(num)) color = 'red';

  return { number: num, color, multiplier };
}

// 2. Crash Rocket Multiplier (1.00x -> 1000x)
export async function calculateCrashOutcome(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): Promise<number> {
  const floatVal = await getVerifiableFloat(serverSeed, clientSeed, nonce);
  // 3% instant house crash
  if (floatVal < 0.03) return 1.0;

  // Standard crash distribution: (100 / (1 - floatVal)) * (1 - houseEdge)
  const e = 2 ** 32;
  const h = floatVal * e;
  if (h % 33 === 0) return 1.0;

  const result = Math.floor((100 * e - floatVal) / (e - floatVal)) / 100;
  // Format to 2 decimal places, minimum 1.01x, max 1000.00x
  const crashPoint = Math.max(1.01, Math.min(1000.0, 0.98 / (1.0 - floatVal * 0.97)));
  return parseFloat(crashPoint.toFixed(2));
}

// 3. Dice Dynasty (0.00 to 99.99)
export async function calculateDiceOutcome(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): Promise<number> {
  const floatVal = await getVerifiableFloat(serverSeed, clientSeed, nonce);
  return parseFloat((floatVal * 100).toFixed(2));
}

// 4. Mines & Treasure (25 tiles, 1-24 mines)
export async function calculateMinesOutcome(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  mineCount: number
): Promise<number[]> {
  const tiles = Array.from({ length: 25 }, (_, i) => i);
  // Fisher-Yates shuffle with provably fair floats
  for (let i = tiles.length - 1; i > 0; i--) {
    const floatVal = await getVerifiableFloat(serverSeed, clientSeed, nonce, i);
    const j = Math.floor(floatVal * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  return tiles.slice(0, mineCount);
}

// 5. Keno Nova (20 drawn out of 1-80)
export async function calculateKenoOutcome(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): Promise<number[]> {
  const pool = Array.from({ length: 80 }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const floatVal = await getVerifiableFloat(serverSeed, clientSeed, nonce, i);
    const j = Math.floor(floatVal * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 20);
}

// 6. Wheel of Sol (50 segments)
export const WHEEL_SEGMENTS = [
  { value: 1, label: '1x', color: '#00f0ff', weight: 22 },
  { value: 2, label: '2x', color: '#3b82f6', weight: 14 },
  { value: 5, label: '5x', color: '#eab308', weight: 7 },
  { value: 10, label: '10x', color: '#f97316', weight: 4 },
  { value: 20, label: '20x', color: '#ef4444', weight: 2 },
  { value: 40, label: '40x', color: '#a855f7', weight: 1 },
];

export async function calculateWheelOutcome(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): Promise<{ index: number; multiplier: number; label: string; color: string }> {
  // 50 total slots
  const slots: { multiplier: number; label: string; color: string }[] = [];
  WHEEL_SEGMENTS.forEach((seg) => {
    for (let i = 0; i < seg.weight; i++) {
      slots.push({ multiplier: seg.value, label: seg.label, color: seg.color });
    }
  });

  const floatVal = await getVerifiableFloat(serverSeed, clientSeed, nonce);
  const index = Math.floor(floatVal * slots.length);
  return { index, ...slots[index] };
}
