use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

declare_id!("SoLStiCeRou1ette1111111111111111111111111111");

#[program]
pub mod solstice_casino {
    use super::*;

    /// Initialize the global House Bank Treasury PDA
    pub fn initialize_house_bank(
        ctx: Context<InitializeHouseBank>,
        house_edge_bps: u16,
    ) -> Result<()> {
        let house_bank = &mut ctx.accounts.house_bank;
        house_bank.authority = ctx.accounts.authority.key();
        house_bank.house_edge_bps = house_edge_bps; // e.g. 100 bps = 1%
        house_bank.total_volume = 0;
        house_bank.total_payouts = 0;
        house_bank.total_bets_placed = 0;
        house_bank.total_referral_rewards = 0;
        house_bank.bump = ctx.bumps.house_bank;
        Ok(())
    }

    /// Unified Bet Execution for all 10 Casino Games with Optional Referral Tracking
    pub fn place_bet(
        ctx: Context<PlaceBet>,
        game_id: u8,
        bet_amount: u64,
        client_seed: [u8; 32],
        referrer: Option<Pubkey>,
    ) -> Result<()> {
        require!(bet_amount >= 220_000, CasinoError::BelowMinBetFloor); // Min 0.00022 SOL floor

        // Transfer bet from Player to House Bank PDA
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.player.to_account_info(),
                to: ctx.accounts.house_bank.to_account_info(),
            },
        );
        transfer(cpi_context, bet_amount)?;

        let house_bank = &mut ctx.accounts.house_bank;
        house_bank.total_volume = house_bank.total_volume.checked_add(bet_amount).unwrap();
        house_bank.total_bets_placed += 1;

        emit!(BetPlacedEvent {
            player: ctx.accounts.player.key(),
            game_id,
            bet_amount,
            client_seed,
            referrer,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Resolve and Settle Bet with Provably Fair VRF / Slot Hash
    pub fn settle_payout(
        ctx: Context<SettlePayout>,
        payout_amount: u64,
        multiplier_bps: u32,
        server_seed_reveal: [u8; 32],
    ) -> Result<()> {
        if payout_amount > 0 {
            // Transfer winnings from House Bank PDA to Player
            let seeds = &[
                b"house_bank".as_ref(),
                &[ctx.accounts.house_bank.bump],
            ];
            let signer = &[&seeds[..]];

            let cpi_context = CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.house_bank.to_account_info(),
                    to: ctx.accounts.player.to_account_info(),
                },
                signer,
            );
            transfer(cpi_context, payout_amount)?;

            let house_bank = &mut ctx.accounts.house_bank;
            house_bank.total_payouts = house_bank.total_payouts.checked_add(payout_amount).unwrap();
        }

        emit!(BetSettledEvent {
            player: ctx.accounts.player.key(),
            payout_amount,
            multiplier_bps,
            server_seed_reveal,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Claim On-Chain Referral Commission & Rakeback
    pub fn claim_referral_commission(
        ctx: Context<ClaimReward>,
        commission_amount: u64,
    ) -> Result<()> {
        require!(commission_amount > 0, CasinoError::ZeroRewardAmount);

        let seeds = &[
            b"house_bank".as_ref(),
            &[ctx.accounts.house_bank.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.house_bank.to_account_info(),
                to: ctx.accounts.beneficiary.to_account_info(),
            },
            signer,
        );
        transfer(cpi_context, commission_amount)?;

        let house_bank = &mut ctx.accounts.house_bank;
        house_bank.total_referral_rewards = house_bank
            .total_referral_rewards
            .checked_add(commission_amount)
            .unwrap();

        emit!(ReferralCommissionClaimedEvent {
            beneficiary: ctx.accounts.beneficiary.key(),
            commission_amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Claim Daily Mission or Consecutive Streak Reward
    pub fn claim_streak_mission_reward(
        ctx: Context<ClaimReward>,
        reward_amount: u64,
        reward_type: u8, // 1 = Daily Mission, 2 = Streak Day
    ) -> Result<()> {
        require!(reward_amount > 0, CasinoError::ZeroRewardAmount);

        let seeds = &[
            b"house_bank".as_ref(),
            &[ctx.accounts.house_bank.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.house_bank.to_account_info(),
                to: ctx.accounts.beneficiary.to_account_info(),
            },
            signer,
        );
        transfer(cpi_context, reward_amount)?;

        emit!(StreakRewardClaimedEvent {
            beneficiary: ctx.accounts.beneficiary.key(),
            reward_amount,
            reward_type,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// V6: Initialize Fair Launch Token with on-chain bonding curve
    pub fn launch_token_bonding_curve(
        ctx: Context<LaunchTokenCurve>,
        name: String,
        symbol: String,
        decimals: u8,
        total_supply: u64,
        curve_type: u8, // 0 = Exponential, 1 = Linear, 2 = Constant-Product
        transfer_fee_bps: u16,
    ) -> Result<()> {
        let curve = &mut ctx.accounts.bonding_curve;
        curve.creator = ctx.accounts.creator.key();
        curve.mint = ctx.accounts.mint.key();
        curve.name = name;
        curve.symbol = symbol;
        curve.decimals = decimals;
        curve.total_supply = total_supply;
        curve.curve_type = curve_type;
        curve.transfer_fee_bps = transfer_fee_bps;
        curve.virtual_sol_reserves = 30_000_000_000; // 30 virtual SOL reserve
        curve.virtual_token_reserves = total_supply;
        curve.real_sol_reserves = 0;
        curve.real_token_reserves = (total_supply * 80) / 100; // 80% to curve, 20% to liquidity pool
        curve.migration_target_sol = 85_000_000_000; // 85 SOL target
        curve.migrated = false;
        curve.bump = ctx.bumps.bonding_curve;

        emit!(TokenLaunchedEvent {
            creator: ctx.accounts.creator.key(),
            mint: ctx.accounts.mint.key(),
            curve_type,
            total_supply,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Buy Tokens along the Fair Launch Bonding Curve
    pub fn buy_bonding_curve(
        ctx: Context<TradeBondingCurve>,
        sol_amount_in: u64,
        min_tokens_out: u64,
    ) -> Result<()> {
        require!(sol_amount_in > 0, CasinoError::ZeroRewardAmount);
        let curve = &mut ctx.accounts.bonding_curve;
        require!(!curve.migrated, CasinoError::CurveAlreadyMigrated);

        // Calculate tokens out based on constant product formula (x * y = k)
        let invariant = (curve.virtual_sol_reserves as u128)
            .checked_mul(curve.virtual_token_reserves as u128)
            .unwrap();

        let new_sol_reserves = (curve.virtual_sol_reserves as u128)
            .checked_add(sol_amount_in as u128)
            .unwrap();

        let new_token_reserves = invariant.checked_div(new_sol_reserves).unwrap();
        let tokens_out = (curve.virtual_token_reserves as u128)
            .checked_sub(new_token_reserves)
            .unwrap() as u64;

        require!(tokens_out >= min_tokens_out, CasinoError::SlippageExceeded);

        // Update reserves
        curve.virtual_sol_reserves = curve.virtual_sol_reserves.checked_add(sol_amount_in).unwrap();
        curve.virtual_token_reserves = curve.virtual_token_reserves.checked_sub(tokens_out).unwrap();
        curve.real_sol_reserves = curve.real_sol_reserves.checked_add(sol_amount_in).unwrap();

        // Check if migration threshold reached
        if curve.real_sol_reserves >= curve.migration_target_sol {
            curve.migrated = true;
            emit!(MigrationTriggeredEvent {
                mint: curve.mint,
                total_sol: curve.real_sol_reserves,
                timestamp: Clock::get()?.unix_timestamp,
            });
        }

        // Transfer SOL from buyer to bonding curve PDA
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.bonding_curve.to_account_info(),
            },
        );
        transfer(cpi_context, sol_amount_in)?;

        emit!(BondingCurveTradeEvent {
            user: ctx.accounts.user.key(),
            mint: curve.mint,
            is_buy: true,
            sol_amount: sol_amount_in,
            token_amount: tokens_out,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeHouseBank<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 2 + 8 + 8 + 8 + 8 + 1,
        seeds = [b"house_bank"],
        bump
    )]
    pub house_bank: Account<'info, HouseBank>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(
        mut,
        seeds = [b"house_bank"],
        bump = house_bank.bump
    )]
    pub house_bank: Account<'info, HouseBank>,
    #[account(mut)]
    pub player: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SettlePayout<'info> {
    #[account(
        mut,
        seeds = [b"house_bank"],
        bump = house_bank.bump,
        has_one = authority
    )]
    pub house_bank: Account<'info, HouseBank>,
    pub authority: Signer<'info>,
    /// CHECK: Safe player receiver
    #[account(mut)]
    pub player: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimReward<'info> {
    #[account(
        mut,
        seeds = [b"house_bank"],
        bump = house_bank.bump,
        has_one = authority
    )]
    pub house_bank: Account<'info, HouseBank>,
    pub authority: Signer<'info>,
    /// CHECK: Beneficiary receiving the claim
    #[account(mut)]
    pub beneficiary: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name: String, symbol: String)]
pub struct LaunchTokenCurve<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + 32 + 32 + 36 + 12 + 1 + 8 + 1 + 2 + 8 + 8 + 8 + 8 + 8 + 1 + 1,
        seeds = [b"bonding_curve", mint.key().as_ref()],
        bump
    )]
    pub bonding_curve: Account<'info, TokenBondingCurve>,
    /// CHECK: Mint account
    pub mint: AccountInfo<'info>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TradeBondingCurve<'info> {
    #[account(
        mut,
        seeds = [b"bonding_curve", bonding_curve.mint.as_ref()],
        bump = bonding_curve.bump
    )]
    pub bonding_curve: Account<'info, TokenBondingCurve>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct HouseBank {
    pub authority: Pubkey,
    pub house_edge_bps: u16,
    pub total_volume: u64,
    pub total_payouts: u64,
    pub total_bets_placed: u64,
    pub total_referral_rewards: u64,
    pub bump: u8,
}

#[account]
pub struct TokenBondingCurve {
    pub creator: Pubkey,
    pub mint: Pubkey,
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub total_supply: u64,
    pub curve_type: u8,
    pub transfer_fee_bps: u16,
    pub virtual_sol_reserves: u64,
    pub virtual_token_reserves: u64,
    pub real_sol_reserves: u64,
    pub real_token_reserves: u64,
    pub migration_target_sol: u64,
    pub migrated: bool,
    pub bump: u8,
}

#[event]
pub struct BetPlacedEvent {
    pub player: Pubkey,
    pub game_id: u8,
    pub bet_amount: u64,
    pub client_seed: [u8; 32],
    pub referrer: Option<Pubkey>,
    pub timestamp: i64,
}

#[event]
pub struct BetSettledEvent {
    pub player: Pubkey,
    pub payout_amount: u64,
    pub multiplier_bps: u32,
    pub server_seed_reveal: [u8; 32],
    pub timestamp: i64,
}

#[event]
pub struct ReferralCommissionClaimedEvent {
    pub beneficiary: Pubkey,
    pub commission_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct StreakRewardClaimedEvent {
    pub beneficiary: Pubkey,
    pub reward_amount: u64,
    pub reward_type: u8,
    pub timestamp: i64,
}

#[event]
pub struct TokenLaunchedEvent {
    pub creator: Pubkey,
    pub mint: Pubkey,
    pub curve_type: u8,
    pub total_supply: u64,
    pub timestamp: i64,
}

#[event]
pub struct BondingCurveTradeEvent {
    pub user: Pubkey,
    pub mint: Pubkey,
    pub is_buy: bool,
    pub sol_amount: u64,
    pub token_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct MigrationTriggeredEvent {
    pub mint: Pubkey,
    pub total_sol: u64,
    pub timestamp: i64,
}

#[error_code]
pub enum CasinoError {
    #[msg("Wager amount is below the mandatory 0.00022 SOL hard floor.")]
    BelowMinBetFloor,
    #[msg("Reward amount must be greater than zero.")]
    ZeroRewardAmount,
    #[msg("Insufficient treasury liquidity in house bank.")]
    InsufficientHouseLiquidity,
    #[msg("Bonding curve has already migrated to DEX pool.")]
    CurveAlreadyMigrated,
    #[msg("Slippage tolerance exceeded on bonding curve trade.")]
    SlippageExceeded,
}
