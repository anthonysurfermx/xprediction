use starknet::ContractAddress;

#[derive(Drop, Copy, Serde, starknet::Store, PartialEq)]
enum MarketStatus {
    Open,
    Closed,
    Resolved,
}

#[derive(Drop, Copy, Serde, starknet::Store, PartialEq)]
enum BetOutcome {
    Yes,
    No,
}

#[starknet::interface]
trait IPredictionMarket<TContractState> {
    fn create_market(
        ref self: TContractState,
        market_id: u256,
        question: felt252,
        duration_in_hours: u64,
    );
    fn place_bet(
        ref self: TContractState,
        market_id: u256,
        outcome: BetOutcome,
        amount: u256,
    );
    fn close_market(ref self: TContractState, market_id: u256);
    fn resolve_market(
        ref self: TContractState,
        market_id: u256,
        outcome: BetOutcome,
    );
    fn claim_winnings(ref self: TContractState, market_id: u256);
    fn get_market_details(
        self: @TContractState,
        market_id: u256,
    ) -> (
        felt252,
        u64,
        u256,
        u256,
        MarketStatus,
        BetOutcome,
    );
}

#[starknet::contract]
mod PredictionMarket {
    use super::MarketStatus;
    use super::BetOutcome;
    use starknet::contract_address::ContractAddressZeroable;
    use starknet::get_block_timestamp;
    use starknet::get_caller_address;
    use starknet::ContractAddress;

    #[storage]
    struct Storage {
        owner: ContractAddress,
        markets: starknet::storage::Map<u256, Market>,
        bets: starknet::storage::Map<(u256, ContractAddress), Bet>,
    }

    #[derive(Drop, Copy, Serde, starknet::Store)]
    struct Market {
        question: felt252,
        deadline: u64,
        total_yes_bets: u256,
        total_no_bets: u256,
        status: MarketStatus,
        final_outcome: BetOutcome,
    }

    #[derive(Drop, Copy, Serde, starknet::Store)]
    struct Bet {
        outcome: BetOutcome,
        amount: u256,
        claimed: bool,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.owner.write(get_caller_address());
    }

    #[abi(embed_v0)]
    impl PredictionMarketImpl of super::IPredictionMarket<ContractState> {
        fn create_market(
            ref self: ContractState,
            market_id: u256,
            question: felt252,
            duration_in_hours: u64,
        ) {

            let deadline = get_block_timestamp() + (duration_in_hours * 3600_u64);
            let new_market = Market {
                question: question,
                deadline: deadline,
                total_yes_bets: 0_u256,
                total_no_bets: 0_u256,
                status: MarketStatus::Open,
                final_outcome: BetOutcome::Yes, // Default value
            };
            self.markets.write(market_id, new_market);
        }

        fn place_bet(
            ref self: ContractState,
            market_id: u256,
            outcome: BetOutcome,
            amount: u256,
        ) {
            let market = self.markets.read(market_id);
            assert(
                market.status == MarketStatus::Open,
                'Market is not open',
            );
            assert(
                get_block_timestamp() < market.deadline,
                'Market has expired',
            );

            let caller = get_caller_address();

            let bet = Bet {
                outcome: outcome,
                amount: amount,
                claimed: false,
            };
            self.bets.write((market_id, caller), bet);

            if outcome == BetOutcome::Yes {
                self.markets.write(
                    market_id,
                    Market {
                        total_yes_bets: market.total_yes_bets + amount,
                        ..market
                    },
                );
            } else {
                self.markets.write(
                    market_id,
                    Market {
                        total_no_bets: market.total_no_bets + amount,
                        ..market
                    },
                );
            }

            // Note: Implement token transfer logic from the user to the contract here
        }

        fn close_market(ref self: ContractState, market_id: u256) {
            let caller = get_caller_address();
            assert(
                caller == self.owner.read(),
                'Only owner can close markets',
            );

            let market = self.markets.read(market_id);
            assert(
                market.status == MarketStatus::Open,
                'Market is not open',
            );
            assert(
                get_block_timestamp() >= market.deadline,
                'Market has not expired yet',
            );

            self.markets.write(
                market_id,
                Market {
                    status: MarketStatus::Closed,
                    ..market
                },
            );
        }

        fn resolve_market(
            ref self: ContractState,
            market_id: u256,
            outcome: BetOutcome,
        ) {
            let caller = get_caller_address();
            assert(
                caller == self.owner.read(),
                'Only owner can resolve markets',
            );

            let market = self.markets.read(market_id);
            assert(
                market.status == MarketStatus::Closed,
                'Market is not closed',
            );

            self.markets.write(
                market_id,
                Market {
                    status: MarketStatus::Resolved,
                    final_outcome: outcome,
                    ..market
                },
            );
        }

        fn claim_winnings(ref self: ContractState, market_id: u256) {
            let market = self.markets.read(market_id);
            assert(
                market.status == MarketStatus::Resolved,
                'Market is not resolved',
            );

            let caller = get_caller_address();
            let bet = self.bets.read((market_id, caller));
            assert(!bet.claimed, 'Winnings already claimed');
            assert(
                bet.outcome == market.final_outcome,
                'Bet did not win',
            );

            let total_bets =
                market.total_yes_bets + market.total_no_bets;
            let winning_bets = if market.final_outcome == BetOutcome::Yes {
                market.total_yes_bets
            } else {
                market.total_no_bets
            };
            let _payout = (bet.amount * total_bets) / winning_bets;

            self.bets.write(
                (market_id, caller),
                Bet {
                    claimed: true,
                    ..bet
                },
            );
            // Note: Implement token transfer logic from the contract to the user here
        }

        fn get_market_details(
            self: @ContractState,
            market_id: u256,
        ) -> (
            felt252,
            u64,
            u256,
            u256,
            MarketStatus,
            BetOutcome,
        ) {
            let market = self.markets.read(market_id);
            (
                market.question,
                market.deadline,
                market.total_yes_bets,
                market.total_no_bets,
                market.status,
                market.final_outcome,
            )
        }
    }
}