// Deadman's Wallet Move Smart Contract
// Designed for Aptos Testnet Deployment
// This contract implements the core logic for asset locking, heartbeat tracking, and automatic inheritance

module deadman_wallet::deadman_wallet {
    use aptos_framework::coin;
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use aptos_framework::signer;
    use std::string::String;
    use std::vector;

    // Struct to store locked asset information
    struct LockedAsset has key {
        id: u64,
        amount: u64,
        heir: address,
        inactivity_limit: u64, // in microseconds
        last_heartbeat: u64,
        coin_type: String,
        status: u8, // 0: locked, 1: transferred, 2: cancelled
        created_at: u64,
        transferred_at: u64,
    }

    // Struct to store wallet configuration
    struct WalletConfig has key {
        owner: address,
        default_heir: address,
        default_inactivity_limit: u64, // in microseconds (default: 7 days)
        is_active: bool,
    }

    // Struct to store global contract state
    struct GlobalState has key {
        total_locked_assets: u64,
        total_transferred_assets: u64,
        contract_owner: address,
    }

    // Error codes
    const EASSET_NOT_FOUND: u64 = 1;
    const EINSUFFICIENT_BALANCE: u64 = 2;
    const EINVALID_HEIR: u64 = 3;
    const EINVALID_INACTIVITY_LIMIT: u64 = 4;
    const EASSET_ALREADY_LOCKED: u64 = 5;
    const EASSET_NOT_LOCKED: u64 = 6;
    const EINACTIVITY_LIMIT_NOT_REACHED: u64 = 7;
    const EUNAUTHORIZED: u64 = 8;
    const EINVALID_AMOUNT: u64 = 9;
    const EWALLET_NOT_ACTIVE: u64 = 10;

    // Initialize the contract
    public fun init(module: &signer) {
        let contract_owner = signer::address_of(module);
        
        // Initialize global state
        move_to(module, GlobalState {
            total_locked_assets: 0,
            total_transferred_assets: 0,
            contract_owner: contract_owner,
        });
    }

    // Initialize wallet for a new user
    public fun init_wallet(
        user: &signer,
        default_heir: address,
        default_inactivity_limit: u64,
    ) {
        let user_addr = signer::address_of(user);
        
        // Validate inputs
        assert!(default_heir != @0x0, EINVALID_HEIR);
        assert!(default_inactivity_limit > 0, EINVALID_INACTIVITY_LIMIT);
        
        // Check if wallet already exists
        assert!(!exists<WalletConfig>(user_addr), EASSET_ALREADY_LOCKED);
        
        // Create wallet configuration
        move_to(user, WalletConfig {
            owner: user_addr,
            default_heir: default_heir,
            default_inactivity_limit: default_inactivity_limit,
            is_active: true,
        });
    }

    // Lock assets with specified conditions
    public fun lock_assets<CoinType>(
        user: &signer,
        amount: u64,
        heir: address,
        inactivity_limit_days: u64,
    ) acquires WalletConfig, GlobalState {
        let user_addr = signer::address_of(user);
        
        // Validate inputs
        assert!(amount > 0, EINVALID_AMOUNT);
        assert!(heir != @0x0, EINVALID_HEIR);
        assert!(inactivity_limit_days > 0, EINVALID_INACTIVITY_LIMIT);
        
        // Check wallet exists and is active
        assert!(exists<WalletConfig>(user_addr), EWALLET_NOT_ACTIVE);
        let wallet_config = borrow_global<WalletConfig>(user_addr);
        assert!(wallet_config.is_active, EWALLET_NOT_ACTIVE);
        
        // Check if user has sufficient balance
        assert!(coin::balance<CoinType>(user_addr) >= amount, EINSUFFICIENT_BALANCE);
        
        // Convert days to microseconds for timestamp comparison
        let inactivity_limit_microseconds = inactivity_limit_days * 24 * 60 * 60 * 1000000;
        
        // Transfer coins to this module's account (escrow)
        coin::transfer<CoinType>(user, @deadman_wallet, amount);
        
        // Create locked asset record
        let locked_asset = LockedAsset {
            id: timestamp::now_microseconds(),
            amount: amount,
            heir: if (heir == @0x1) wallet_config.default_heir else heir,
            inactivity_limit: inactivity_limit_microseconds,
            last_heartbeat: timestamp::now_microseconds(),
            coin_type: std::string::utf8(b"CoinType"), // In real implementation, this would be the actual coin type
            status: 0, // locked
            created_at: timestamp::now_microseconds(),
            transferred_at: 0,
        };
        
        move_to(user, locked_asset);
        
        // Update global state
        let global_state = borrow_global_mut<GlobalState>(@deadman_wallet);
        global_state.total_locked_assets = global_state.total_locked_assets + 1;
    }

    // Send heartbeat to prove user activity
    public fun send_heartbeat(user: &signer) acquires LockedAsset, WalletConfig {
        let user_addr = signer::address_of(user);
        
        // Check wallet exists and is active
        assert!(exists<WalletConfig>(user_addr), EWALLET_NOT_ACTIVE);
        let wallet_config = borrow_global<WalletConfig>(user_addr);
        assert!(wallet_config.is_active, EWALLET_NOT_ACTIVE);
        
        // Check if user has locked assets
        assert!(exists<LockedAsset>(user_addr), EASSET_NOT_FOUND);
        
        // Update last heartbeat timestamp
        let locked_asset = borrow_global_mut<LockedAsset>(user_addr);
        locked_asset.last_heartbeat = timestamp::now_microseconds();
    }

    // Check and transfer assets if inactivity limit is reached
    // This can be called by anyone to trigger the transfer
    public fun check_and_transfer<CoinType>(
        caller: &signer,
        owner: address,
    ) acquires LockedAsset, WalletConfig, GlobalState {
        let caller_addr = signer::address_of(caller);
        
        // Check if owner has locked assets
        assert!(exists<LockedAsset>(owner), EASSET_NOT_FOUND);
        
        // Check if owner's wallet is active
        assert!(exists<WalletConfig>(owner), EWALLET_NOT_ACTIVE);
        let wallet_config = borrow_global<WalletConfig>(owner);
        assert!(wallet_config.is_active, EWALLET_NOT_ACTIVE);
        
        let locked_asset = borrow_global_mut<LockedAsset>(owner);
        
        // Check if asset is still locked
        assert!(locked_asset.status == 0, EASSET_NOT_LOCKED);
        
        // Check if inactivity limit has been reached
        let current_time = timestamp::now_microseconds();
        let time_since_heartbeat = current_time - locked_asset.last_heartbeat;
        
        assert!(time_since_heartbeat >= locked_asset.inactivity_limit, EINACTIVITY_LIMIT_NOT_REACHED);
        
        // Transfer assets to heir
        let heir = locked_asset.heir;
        let amount = locked_asset.amount;
        
        // Transfer from escrow to heir
        coin::transfer<CoinType>(@deadman_wallet, heir, amount);
        
        // Update asset status
        locked_asset.status = 1; // transferred
        locked_asset.transferred_at = current_time;
        
        // Update global state
        let global_state = borrow_global_mut<GlobalState>(@deadman_wallet);
        global_state.total_transferred_assets = global_state.total_transferred_assets + 1;
        
        // Emit event (in real implementation)
        // event::emit(AssetTransferredEvent {
        //     asset_id: locked_asset.id,
        //     owner: owner,
        //     heir: heir,
        //     amount: amount,
        //     transferred_at: current_time,
        // });
    }

    // Cancel locked assets and return to owner (only owner can call)
    public fun cancel_locked_assets<CoinType>(
        user: &signer,
    ) acquires LockedAsset, WalletConfig, GlobalState {
        let user_addr = signer::address_of(user);
        
        // Check if user has locked assets
        assert!(exists<LockedAsset>(user_addr), EASSET_NOT_FOUND);
        
        let locked_asset = borrow_global_mut<LockedAsset>(user_addr);
        
        // Check if asset is still locked
        assert!(locked_asset.status == 0, EASSET_NOT_LOCKED);
        
        // Transfer assets back to owner
        let amount = locked_asset.amount;
        coin::transfer<CoinType>(@deadman_wallet, user_addr, amount);
        
        // Update asset status
        locked_asset.status = 2; // cancelled
        locked_asset.transferred_at = timestamp::now_microseconds();
        
        // Update global state
        let global_state = borrow_global_mut<GlobalState>(@deadman_wallet);
        global_state.total_locked_assets = global_state.total_locked_assets - 1;
    }

    // Update wallet configuration
    public fun update_wallet_config(
        user: &signer,
        new_default_heir: address,
        new_inactivity_limit_days: u64,
    ) acquires WalletConfig {
        let user_addr = signer::address_of(user);
        
        // Validate inputs
        assert!(new_default_heir != @0x0, EINVALID_HEIR);
        assert!(new_inactivity_limit_days > 0, EINVALID_INACTIVITY_LIMIT);
        
        // Check wallet exists
        assert!(exists<WalletConfig>(user_addr), EWALLET_NOT_ACTIVE);
        
        let wallet_config = borrow_global_mut<WalletConfig>(user_addr);
        wallet_config.default_heir = new_default_heir;
        wallet_config.default_inactivity_limit = new_inactivity_limit_days * 24 * 60 * 60 * 1000000;
    }

    // Deactivate wallet (emergency stop)
    public fun deactivate_wallet(
        user: &signer,
    ) acquires WalletConfig {
        let user_addr = signer::address_of(user);
        
        // Check wallet exists
        assert!(exists<WalletConfig>(user_addr), EWALLET_NOT_ACTIVE);
        
        let wallet_config = borrow_global_mut<WalletConfig>(user_addr);
        wallet_config.is_active = false;
    }

    // Reactivate wallet
    public fun reactivate_wallet(
        user: &signer,
    ) acquires WalletConfig {
        let user_addr = signer::address_of(user);
        
        // Check wallet exists
        assert!(exists<WalletConfig>(user_addr), EWALLET_NOT_ACTIVE);
        
        let wallet_config = borrow_global_mut<WalletConfig>(user_addr);
        wallet_config.is_active = true;
    }

    // View functions for reading state

    // Get locked asset information
    public fun get_locked_asset(owner: address): LockedAsset acquires LockedAsset {
        assert!(exists<LockedAsset>(owner), EASSET_NOT_FOUND);
        borrow_global<LockedAsset>(owner)
    }

    // Get wallet configuration
    public fun get_wallet_config(owner: address): WalletConfig acquires WalletConfig {
        assert!(exists<WalletConfig>(owner), EWALLET_NOT_ACTIVE);
        borrow_global<WalletConfig>(owner)
    }

    // Get global state
    public fun get_global_state(): GlobalState acquires GlobalState {
        borrow_global<GlobalState>(@deadman_wallet)
    }

    // Check if asset should be transferred (view function)
    public fun should_transfer(owner: address): bool acquires LockedAsset {
        if (!exists<LockedAsset>(owner)) {
            return false
        };
        
        let locked_asset = borrow_global<LockedAsset>(owner);
        
        // Check if asset is still locked
        if (locked_asset.status != 0) {
            return false
        };
        
        // Check if inactivity limit has been reached
        let current_time = timestamp::now_microseconds();
        let time_since_heartbeat = current_time - locked_asset.last_heartbeat;
        
        time_since_heartbeat >= locked_asset.inactivity_limit
    }

    // Get time until transfer (in microseconds)
    public fun get_time_until_transfer(owner: address): u64 acquires LockedAsset {
        if (!exists<LockedAsset>(owner)) {
            return 0
        };
        
        let locked_asset = borrow_global<LockedAsset>(owner);
        
        // Check if asset is still locked
        if (locked_asset.status != 0) {
            return 0
        };
        
        let current_time = timestamp::now_microseconds();
        let time_since_heartbeat = current_time - locked_asset.last_heartbeat;
        let remaining_time = locked_asset.inactivity_limit - time_since_heartbeat;
        
        if (remaining_time > 0) {
            remaining_time
        } else {
            0
        }
    }

    // Get asset status as string
    public fun get_asset_status_string(owner: address): String acquires LockedAsset {
        if (!exists<LockedAsset>(owner)) {
            return std::string::utf8(b"No Asset")
        };
        
        let locked_asset = borrow_global<LockedAsset>(owner);
        
        if (locked_asset.status == 0) {
            std::string::utf8(b"Locked")
        } else if (locked_asset.status == 1) {
            std::string::utf8(b"Transferred")
        } else {
            std::string::utf8(b"Cancelled")
        }
    }
}

// Events for off-chain monitoring (would be implemented in real deployment)
/*
struct AssetTransferredEvent has drop, store {
    asset_id: u64,
    owner: address,
    heir: address,
    amount: u64,
    transferred_at: u64,
}

struct HeartbeatSentEvent has drop, store {
    user: address,
    timestamp: u64,
}

struct AssetLockedEvent has drop, store {
    asset_id: u64,
    owner: address,
    heir: address,
    amount: u64,
    inactivity_limit: u64,
    locked_at: u64,
}
*/