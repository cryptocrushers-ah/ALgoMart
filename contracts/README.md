# AlgoMart Smart Contracts

## Escrow Contract

The escrow contract (`escrow.py`) provides secure payment handling for marketplace transactions.

### Features

- **Buyer Protection**: Funds held in escrow until buyer confirms delivery
- **Seller Protection**: Automatic payment release on confirmation
- **Timeout Mechanism**: Automatic refund if transaction times out (24 hours)
- **On-chain Security**: All transactions recorded on Algorand blockchain

### Contract Flow

1. **Creation**: Contract initialized with buyer, seller, and amount
2. **Funding**: Buyer sends payment to contract address
3. **Confirmation**: Buyer confirms receipt → funds released to seller
4. **Refund**: If timeout expires, buyer can reclaim funds

### Compilation

```bash
pip install pyteal
python contracts/escrow.py
```

This generates:
- `escrow_approval.teal` - Main contract logic
- `escrow_clear.teal` - Clear state program

### Deployment

Using Algorand CLI:

```bash
goal app create \
  --creator YOUR_ADDRESS \
  --approval-prog escrow_approval.teal \
  --clear-prog escrow_clear.teal \
  --global-byteslices 3 \
  --global-ints 2 \
  --local-byteslices 0 \
  --local-ints 0 \
  --app-arg addr:BUYER_ADDRESS \
  --app-arg addr:SELLER_ADDRESS \
  --app-arg int:AMOUNT_MICROALGOS
```

### Testing on TestNet

1. Get TestNet ALGO from [dispenser](https://bank.testnet.algorand.network/)
2. Deploy contract with test addresses
3. Test fund → confirm → release flow
4. Verify transactions on [AlgoExplorer TestNet](https://testnet.algoexplorer.io/)

### Integration

The frontend currently implements direct payment (simplified for MVP). To integrate the full escrow:

1. Deploy escrow contract for each transaction
2. Update `handleBuyNow` in `ListingDetail.tsx` to:
   - Create app call transaction to escrow
   - Fund escrow contract
   - Store `app_id` in trades table
3. Add "Confirm Delivery" button that calls `confirm` method
4. Monitor contract state for automatic refunds

### Security Notes

- Contract uses inner transactions for secure fund transfers
- All state changes are atomic
- Timeout prevents indefinite fund locks
- Only buyer can confirm and trigger release
