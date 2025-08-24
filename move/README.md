# Deadman's Wallet Aptos Deployment Guide

## Prerequisites

1. Install Aptos CLI:
   ```bash
   curl -fsSL https://aptos.dev/scripts/install.sh | bash
   ```

2. Initialize Aptos CLI:
   ```bash
   aptos init
   ```

3. Fund your testnet account from the [Aptos Faucet](https://aptos.dev/faucet/)

## Contract Deployment

### 1. Compile the Move Contract

```bash
# Navigate to move directory
cd move

# Compile the contract
aptos move compile --named-addresses deadman_wallet=YOUR_ACCOUNT_ADDRESS
```

### 2. Deploy to Testnet

```bash
# Deploy the contract
aptos move publish --named-addresses deadman_wallet=YOUR_ACCOUNT_ADDRESS
```

### 3. Test the Contract

```bash
# Initialize wallet
aptos move run --function-id YOUR_ACCOUNT_ADDRESS::deadman_wallet::init_wallet --args default_heir:0xHEIR_ADDRESS --args default_inactivity_limit:604800000000 --type-args 0x1::aptos_coin::AptosCoin

# Lock assets
aptos move run --function-id YOUR_ACCOUNT_ADDRESS::deadman_wallet::lock_assets --args amount:1000000 --args heir:0xHEIR_ADDRESS --args inactivity_limit_days:7 --type-args 0x1::aptos_coin::AptosCoin

# Send heartbeat
aptos move run --function-id YOUR_ACCOUNT_ADDRESS::deadman_wallet::send_heartbeat

# Check and transfer
aptos move run --function-id YOUR_ACCOUNT_ADDRESS::deadman_wallet::check_and_transfer --args owner:OWNER_ADDRESS --type-args 0x1::aptos_coin::AptosCoin
```

## Contract Functions

### Core Functions

1. **init_wallet(user: &signer, default_heir: address, default_inactivity_limit: u64)**
   - Initializes a new wallet configuration
   - Sets default heir and inactivity limit

2. **lock_assets<CoinType>(user: &signer, amount: u64, heir: address, inactivity_limit_days: u64)**
   - Locks specified amount of coins
   - Sets heir and inactivity period
   - Transfers coins to escrow

3. **send_heartbeat(user: &signer)**
   - Updates last activity timestamp
   - Proves user is still active

4. **check_and_transfer<CoinType>(caller: &signer, owner: address)**
   - Checks if inactivity limit is reached
   - Transfers assets to heir if conditions are met
   - Can be called by anyone

### Management Functions

5. **cancel_locked_assets<CoinType>(user: &signer)**
   - Cancels locked assets and returns to owner
   - Only callable by asset owner

6. **update_wallet_config(user: &signer, new_default_heir: address, new_inactivity_limit_days: u64)**
   - Updates wallet configuration
   - Changes default heir or inactivity limit

7. **deactivate_wallet(user: &signer)**
   - Emergency stop function
   - Deactivates wallet temporarily

8. **reactivate_wallet(user: &signer)**
   - Reactivates a deactivated wallet

### View Functions

9. **get_locked_asset(owner: address): LockedAsset**
   - Returns locked asset information

10. **get_wallet_config(owner: address): WalletConfig**
    - Returns wallet configuration

11. **should_transfer(owner: address): bool**
    - Checks if assets should be transferred

12. **get_time_until_transfer(owner: address): u64**
    - Returns remaining time until transfer

## Integration with Frontend

### TypeScript Integration

```typescript
import { AptosClient, AptosAccount, TokenTypes } from 'aptos';

const client = new AptosClient('https://fullnode.testnet.aptoslabs.com');

// Contract address (replace with your deployed address)
const CONTRACT_ADDRESS = 'YOUR_CONTRACT_ADDRESS';

// Initialize wallet
async function initWallet(account: AptosAccount, heir: string, inactivityLimit: number) {
  const payload = {
    function: `${CONTRACT_ADDRESS}::deadman_wallet::init_wallet`,
    type_arguments: [],
    arguments: [heir, inactivityLimit * 24 * 60 * 60 * 1000000] // Convert days to microseconds
  };
  
  const txnRequest = await client.generateTransaction(account.address(), payload);
  const signedTxn = await client.signTransaction(account, txnRequest);
  const txnResult = await client.submitTransaction(signedTxn);
  
  return txnResult;
}

// Lock assets
async function lockAssets(account: AptosAccount, amount: number, heir: string, inactivityDays: number) {
  const payload = {
    function: `${CONTRACT_ADDRESS}::deadman_wallet::lock_assets`,
    type_arguments: ['0x1::aptos_coin::AptosCoin'],
    arguments: [amount, heir, inactivityDays]
  };
  
  const txnRequest = await client.generateTransaction(account.address(), payload);
  const signedTxn = await client.signTransaction(account, txnRequest);
  const txnResult = await client.submitTransaction(signedTxn);
  
  return txnResult;
}

// Send heartbeat
async function sendHeartbeat(account: AptosAccount) {
  const payload = {
    function: `${CONTRACT_ADDRESS}::deadman_wallet::send_heartbeat`,
    type_arguments: [],
    arguments: []
  };
  
  const txnRequest = await client.generateTransaction(account.address(), payload);
  const signedTxn = await client.signTransaction(account, txnRequest);
  const txnResult = await client.submitTransaction(signedTxn);
  
  return txnResult;
}

// Check and transfer
async function checkAndTransfer(account: AptosAccount, ownerAddress: string) {
  const payload = {
    function: `${CONTRACT_ADDRESS}::deadman_wallet::check_and_transfer`,
    type_arguments: ['0x1::aptos_coin::AptosCoin'],
    arguments: [ownerAddress]
  };
  
  const txnRequest = await client.generateTransaction(account.address(), payload);
  const signedTxn = await client.signTransaction(account, txnRequest);
  const txnResult = await client.submitTransaction(signedTxn);
  
  return txnResult;
}

// Get asset status
async function getAssetStatus(ownerAddress: string) {
  const payload = {
    function: `${CONTRACT_ADDRESS}::deadman_wallet::get_locked_asset`,
    type_arguments: [],
    arguments: [ownerAddress]
  };
  
  const result = await client.view(payload);
  return result;
}
```

## Testing Strategy

### Unit Testing
```bash
# Run unit tests
aptos move test
```

### Integration Testing
1. Deploy to testnet
2. Test all functions with different scenarios
3. Verify edge cases (very short/long inactivity periods)
4. Test with different coin types

### Security Considerations
1. **Access Control**: Only asset owners can cancel locked assets
2. **Input Validation**: All inputs are validated before processing
3. **Escrow Security**: Assets are held in contract account until conditions are met
4. **Emergency Stop**: Deactivate function for emergency scenarios
5. **Time Precision**: Uses microseconds for accurate time tracking

## Monitoring and Events

The contract should emit events for:
- Asset locked
- Heartbeat sent
- Asset transferred
- Asset cancelled
- Wallet configuration updated

These events can be monitored by off-chain services for real-time notifications and analytics.

## Production Deployment

When moving to mainnet:
1. Audit the contract thoroughly
2. Test extensively on testnet
3. Implement proper error handling
4. Set up monitoring and alerting
5. Consider gas optimization
6. Implement proper rate limiting
7. Add multi-signature controls for critical operations