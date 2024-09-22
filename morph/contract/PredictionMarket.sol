// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PredictionMarket {
    enum MarketStatus { Open, Closed, Resolved }
    enum BetOutcome { Yes, No }

    struct Market {
        string question;
        uint256 deadline;
        uint256 totalYesBets;
        uint256 totalNoBets;
        MarketStatus status;
        BetOutcome finalOutcome;
        mapping(address => Bet) bets;
    }

    struct Bet {
        BetOutcome outcome;
        uint256 amount;
        bool claimed;
    }

    mapping(uint256 => Market) public markets;
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier marketExists(uint256 marketId) {
        require(markets[marketId].deadline != 0, "Market does not exist");
        _;
    }

    modifier isOpen(uint256 marketId) {
        require(markets[marketId].status == MarketStatus.Open, "Market is not open");
        require(block.timestamp < markets[marketId].deadline, "Market has passed the deadline");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Create a new market with a specific marketId, question, and duration in hours
    function createMarket(uint256 marketId, string memory question, uint256 durationInHours) public onlyOwner {
        require(markets[marketId].deadline == 0, "Market ID already exists"); // Ensure market ID is unique

        // Convert duration from hours to seconds
        uint256 durationInSeconds = durationInHours * 1 hours;

        // Set up the new market
        Market storage newMarket = markets[marketId];
        newMarket.question = question;
        newMarket.deadline = block.timestamp + durationInSeconds;
        newMarket.status = MarketStatus.Open;
    }

    // Place a bet on either Yes or No outcome
    function placeBet(uint256 marketId, BetOutcome outcome) public payable marketExists(marketId) isOpen(marketId) {
        require(msg.value > 0, "Bet amount must be greater than zero");
        Market storage market = markets[marketId];
        Bet storage userBet = market.bets[msg.sender];

        require(userBet.outcome == BetOutcome.Yes && userBet.amount == 0 || userBet.outcome == BetOutcome.No && userBet.amount == 0, 
            "You have already placed a bet");

        userBet.outcome = outcome;
        userBet.amount = msg.value;

        if (outcome == BetOutcome.Yes) {
            market.totalYesBets += msg.value;
        } else {
            market.totalNoBets += msg.value;
        }
    }

    // Close the market, ensuring no more bets can be placed
    function closeMarket(uint256 marketId) public onlyOwner marketExists(marketId) {
        Market storage market = markets[marketId];
        require(block.timestamp >= market.deadline, "Cannot close market before deadline");
        require(market.status == MarketStatus.Open, "Market is not open");
        market.status = MarketStatus.Closed;
    }

    // Resolve the market by setting the final outcome (Yes or No)
    function resolveMarket(uint256 marketId, BetOutcome outcome) public onlyOwner marketExists(marketId) {
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Closed, "Market is not closed yet");
        market.status = MarketStatus.Resolved;
        market.finalOutcome = outcome;
    }

    // Claim winnings for users who correctly bet on the outcome
    function claimWinnings(uint256 marketId) public marketExists(marketId) {
        Market storage market = markets[marketId];
        Bet storage userBet = market.bets[msg.sender];

        require(market.status == MarketStatus.Resolved, "Market is not resolved yet");
        require(!userBet.claimed, "Winnings already claimed");
        require(userBet.outcome == market.finalOutcome, "You did not win the bet");

        uint256 totalBets = (market.finalOutcome == BetOutcome.Yes) ? market.totalYesBets : market.totalNoBets;
        uint256 payout = (userBet.amount * address(this).balance) / totalBets;

        userBet.claimed = true;
        payable(msg.sender).transfer(payout);
    }

    // Get details about a specific market
    function getMarketDetails(uint256 marketId) public view marketExists(marketId) returns (
        string memory question,
        uint256 deadline,
        uint256 totalYesBets,
        uint256 totalNoBets,
        MarketStatus status,
        BetOutcome finalOutcome
    ) {
        Market storage market = markets[marketId];
        return (
            market.question,
            market.deadline,
            market.totalYesBets,
            market.totalNoBets,
            market.status,
            market.finalOutcome
        );
    }
}