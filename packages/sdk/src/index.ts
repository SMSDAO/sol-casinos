/**
 * SOLSTICE ROULETTE ENTERPRISE V3.0.0 TYPESCRIPT SDK
 * Client library for interacting with Solstice Casino Anchor Program on Solana.
 */

import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import bs58 from 'bs58';

export const PROGRAM_ID = new PublicKey('SoLStiCeRou1ette1111111111111111111111111111');
export const MIN_BET_FLOOR_LAMPORTS = 220_000; // 0.00022 SOL

export enum SolsticeGameId {
  NeonRoulette = 1,
  ChromeBlackjack = 2,
  SlotCascade = 3,
  DiceDynasty = 4,
  CrashRocket = 5,
  KenoNova = 6,
  BaccaratFlash = 7,
  PokerHoldemRush = 8,
  WheelOfSol = 9,
  MinesTreasure = 10,
}

export interface PlaceBetParams {
  gameId: SolsticeGameId;
  betAmountLamports: number;
  clientSeed: Uint8Array;
  referrer?: PublicKey;
}

export class SolsticeClient {
  public connection: Connection;
  public programId: PublicKey;

  constructor(endpoint: string, programId: PublicKey = PROGRAM_ID) {
    this.connection = new Connection(endpoint, 'confirmed');
    this.programId = programId;
  }

  public getHouseBankPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync([Buffer.from('house_bank')], this.programId);
  }

  public async createBetTransaction(
    playerKeypair: Keypair,
    params: PlaceBetParams
  ): Promise<Transaction> {
    if (params.betAmountLamports < MIN_BET_FLOOR_LAMPORTS) {
      throw new Error(`Bet amount below 0.00022 SOL floor (${MIN_BET_FLOOR_LAMPORTS} lamports)`);
    }

    const [houseBankPDA] = this.getHouseBankPDA();
    const { blockhash } = await this.connection.getLatestBlockhash('confirmed');

    const tx = new Transaction();
    tx.add(
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 5000 }),
      SystemProgram.transfer({
        fromPubkey: playerKeypair.publicKey,
        toPubkey: houseBankPDA,
        lamports: params.betAmountLamports,
      })
    );

    tx.recentBlockhash = blockhash;
    tx.feePayer = playerKeypair.publicKey;
    tx.sign(playerKeypair);

    return tx;
  }
}
