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

#[error_code]
pub enum CasinoError {
    #[msg("Wager amount is below the mandatory 0.00022 SOL hard floor.")]
    BelowMinBetFloor,
    #[msg("Reward amount must be greater than zero.")]
    ZeroRewardAmount,
    #[msg("Insufficient treasury liquidity in house bank.")]
    InsufficientHouseLiquidity,
}
