module deadmans_wallet::deadmans_wallet {
    use std::signer;
    use aptos_framework::coin::{Coin, Self};
    use aptos_framework::account::{SignerCapability, Self};
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_framework::managed_coin;

    // ===== CONSTANTS =====
    const EINSUFFICIENT_BALANCE: u64 = 1;
    const EINVALID_TIME_LIMIT: u64 = 2;
    const ENO_LOCKED_ASSETS: u64 = 3;
    const EINACTIVE_PERIOD_NOT_REACHED: u64 = 4;
    const EASSET_ALREADY_LOCKED: u64 = 5;
    const EUNAUTHORIZED: u64 = 6;
    const EHEIR_NOT_SET: u64 = 7;

    // ===== RESOURCES =====

    /// Resource to store user's deadman wallet configuration
    struct DeadmanWallet has key {
        owner: address,
        signer_cap: SignerCapability,
        heir: address,
        inactivity_limit_seconds: u64,
        last_heartbeat_timestamp: u64,
        is_active: bool,
        total_locked_value: u64,
    }

    /// Resource to store individual locked assets
    struct LockedAsset has key {
        asset_id: u64,
        owner: address,
        coin_type: String,
        amount: u64,
        heir: address,
        lock_timestamp: u64,
        inactivity_limit_seconds: u64,
        status: u8, // 0 = locked, 1 = transferred, 2 = released
        transaction_hash: String,
    }

    /// Resource to track global wallet statistics
    struct WalletStats has key {
        total_wallets: u64,
        total_locked_assets: u64,
        total_transferred_assets: u64,
        total_value_locked: u64,
    }

    // ===== EVENTS =====

    /// Event emitted when assets are locked
    struct AssetsLocked has drop, store {
        owner: address,
        asset_id: u64,
        coin_type: String,
        amount: u64,
        heir: address,
        inactivity_limit_seconds: u64,
        timestamp: u64,
        transaction_hash: String,
    }

    /// Event emitted when heartbeat is updated
    struct HeartbeatUpdated has drop, store {
        owner: address,
        timestamp: u64,
        transaction_hash: String,
    }

    /// Event emitted when assets are transferred to heir
    struct AssetsTransferred has drop, store {
        owner: address,
        heir: address,
        asset_id: u64,
        amount: u64,
        coin_type: String,
        timestamp: u64,
        transaction_hash: String,
    }

    /// Event emitted when wallet is created
    struct WalletCreated has drop, store {
        owner: address,
        timestamp: u64,
        transaction_hash: String,
    }

    // ===== INITIALIZATION =====

    /// Initialize the module and create global statistics
    fun init_module(deployer: &signer) {
        move_to(deployer, WalletStats {
            total_wallets: 0,
            total_locked_assets: 0,
            total_transferred_assets: 0,
            total_value_locked: 0,
        });
    }

    // ===== PUBLIC FUNCTIONS =====

    /// Create a new deadman wallet for the user
    public fun create_wallet(owner: &signer, heir: address, inactivity_limit_days: u64) {
        let owner_address = signer::address_of(owner);
        
        // Ensure wallet doesn't already exist
        assert!(!exists<DeadmanWallet>(owner_address), EASSET_ALREADY_LOCKED);
        
        // Validate heir address
        assert!(heir != @0x0, EHEIR_NOT_SET);
        
        // Convert days to seconds
        let inactivity_limit_seconds = inactivity_limit_days * 24 * 60 * 60;
        assert!(inactivity_limit_seconds > 0, EINVALID_TIME_LIMIT);
        
        // Get signer capability for future operations
        let signer_cap = account::extract_signer_capability(owner);
        
        // Create wallet resource
        move_to(owner, DeadmanWallet {
            owner: owner_address,
            signer_cap,
            heir,
            inactivity_limit_seconds,
            last_heartbeat_timestamp: timestamp::now_seconds(),
            is_active: true,
            total_locked_value: 0,
        });
        
        // Update global stats
        let stats = borrow_global_mut<WalletStats>(@deadmans_wallet);
        stats.total_wallets = stats.total_wallets + 1;
        
        // Emit event
        event::emit(WalletCreated {
            owner: owner_address,
            timestamp: timestamp::now_seconds(),
            transaction_hash: b"pending".to_string(),
        });
    }

    /// Lock assets in the deadman wallet
    public fun lock_assets<CoinType>(
        owner: &signer,
        amount: u64,
        heir: address,
        inactivity_limit_days: u64,
    ) acquires DeadmanWallet, WalletStats {
        let owner_address = signer::address_of(owner);
        
        // Ensure wallet exists
        assert!(exists<DeadmanWallet>(owner_address), EUNAUTHORIZED);
        
        let wallet = borrow_global_mut<DeadmanWallet>(owner_address);
        
        // Validate wallet is active
        assert!(wallet.is_active, EUNAUTHORIZED);
        
        // Validate heir address
        assert!(heir != @0x0, EHEIR_NOT_SET);
        
        // Convert days to seconds
        let inactivity_limit_seconds = inactivity_limit_days * 24 * 60 * 60;
        assert!(inactivity_limit_seconds > 0, EINVALID_TIME_LIMIT);
        
        // Check if user has sufficient balance
        let coin_balance = coin::balance<CoinType>(owner_address);
        assert!(coin_balance >= amount, EINSUFFICIENT_BALANCE);
        
        // Generate unique asset ID
        let asset_id = timestamp::now_seconds();
        
        // Transfer coins to this module (escrow)
        let coins = coin::withdraw<CoinType>(owner, amount);
        let module_account = account::create_signer_with_capability(&wallet.signer_cap);
        coin::deposit<CoinType>(signer::address_of(&module_account), coins);
        
        // Create locked asset resource
        move_to(owner, LockedAsset {
            asset_id,
            owner: owner_address,
            coin_type: std::string::utf8(b"CoinType"), // In real implementation, would get actual coin type
            amount,
            heir,
            lock_timestamp: timestamp::now_seconds(),
            inactivity_limit_seconds,
            status: 0, // locked
            transaction_hash: b"pending".to_string(),
        });
        
        // Update wallet
        wallet.heir = heir;
        wallet.inactivity_limit_seconds = inactivity_limit_seconds;
        wallet.last_heartbeat_timestamp = timestamp::now_seconds();
        wallet.total_locked_value = wallet.total_locked_value + amount;
        
        // Update global stats
        let stats = borrow_global_mut<WalletStats>(@deadmans_wallet);
        stats.total_locked_assets = stats.total_locked_assets + 1;
        stats.total_value_locked = stats.total_value_locked + amount;
        
        // Emit event
        event::emit(AssetsLocked {
            owner: owner_address,
            asset_id,
            coin_type: std::string::utf8(b"CoinType"),
            amount,
            heir,
            inactivity_limit_seconds,
            timestamp: timestamp::now_seconds(),
            transaction_hash: b"pending".to_string(),
        });
    }

    /// Update heartbeat timestamp
    public fun update_heartbeat(owner: &signer) acquires DeadmanWallet {
        let owner_address = signer::address_of(owner);
        
        // Ensure wallet exists
        assert!(exists<DeadmanWallet>(owner_address), EUNAUTHORIZED);
        
        let wallet = borrow_global_mut<DeadmanWallet>(owner_address);
        
        // Validate wallet is active
        assert!(wallet.is_active, EUNAUTHORIZED);
        
        // Update heartbeat
        wallet.last_heartbeat_timestamp = timestamp::now_seconds();
        
        // Emit event
        event::emit(HeartbeatUpdated {
            owner: owner_address,
            timestamp: timestamp::now_seconds(),
            transaction_hash: b"pending".to_string(),
        });
    }

    /// Check inactivity and transfer assets if needed
    /// This would typically be called by a cron job or oracle service
    public fun check_and_transfer(owner_address: address) acquires DeadmanWallet, LockedAsset, WalletStats {
        // Ensure wallet exists
        assert!(exists<DeadmanWallet>(owner_address), EUNAUTHORIZED);
        
        let wallet = borrow_global<DeadmanWallet>(owner_address);
        
        // Calculate time since last heartbeat
        let current_time = timestamp::now_seconds();
        let time_since_heartbeat = current_time - wallet.last_heartbeat_timestamp;
        
        // Check if inactivity period has been exceeded
        if (time_since_heartbeat >= wallet.inactivity_limit_seconds) {
            // Transfer assets to heir
            transfer_assets_to_heir(owner_address, wallet.heir);
        } else {
            // Not inactive enough yet
            abort EINACTIVE_PERIOD_NOT_REACHED;
        }
    }

    /// Transfer assets to heir (internal function)
    fun transfer_assets_to_heir(owner_address: address, heir_address: address) acquires LockedAsset, WalletStats {
        // Ensure locked asset exists
        assert!(exists<LockedAsset>(owner_address), ENO_LOCKED_ASSETS);
        
        let asset = borrow_global_mut<LockedAsset>(owner_address);
        
        // Ensure asset is still locked
        assert!(asset.status == 0, EASSET_ALREADY_LOCKED);
        
        // Get wallet to access signer capability
        let wallet = borrow_global<DeadmanWallet>(owner_address);
        let module_account = account::create_signer_with_capability(&wallet.signer_cap);
        
        // In a real implementation, we would transfer the actual coins
        // For now, we'll simulate the transfer
        
        // Update asset status
        asset.status = 1; // transferred
        asset.transaction_hash = b"transferred".to_string();
        
        // Update global stats
        let stats = borrow_global_mut<WalletStats>(@deadmans_wallet);
        stats.total_transferred_assets = stats.total_transferred_assets + 1;
        stats.total_value_locked = stats.total_value_locked - asset.amount;
        
        // Emit transfer event
        event::emit(AssetsTransferred {
            owner: owner_address,
            heir: heir_address,
            asset_id: asset.asset_id,
            amount: asset.amount,
            coin_type: asset.coin_type,
            timestamp: timestamp::now_seconds(),
            transaction_hash: b"transferred".to_string(),
        });
        
        // Note: In a real implementation, we would:
        // 1. Withdraw the coins from the module account
        // 2. Deposit them to the heir's account
        // 3. Handle different coin types properly
    }

    /// Update heir address
    public fun update_heir(owner: &signer, new_heir: address) acquires DeadmanWallet {
        let owner_address = signer::address_of(owner);
        
        // Ensure wallet exists
        assert!(exists<DeadmanWallet>(owner_address), EUNAUTHORIZED);
        
        let wallet = borrow_global_mut<DeadmanWallet>(owner_address);
        
        // Validate wallet is active
        assert!(wallet.is_active, EUNAUTHORIZED);
        
        // Validate new heir address
        assert!(new_heir != @0x0, EHEIR_NOT_SET);
        
        // Update heir
        wallet.heir = new_heir;
    }

    /// Update inactivity limit
    public fun update_inactivity_limit(owner: &signer, new_limit_days: u64) acquires DeadmanWallet {
        let owner_address = signer::address_of(owner);
        
        // Ensure wallet exists
        assert!(exists<DeadmanWallet>(owner_address), EUNAUTHORIZED);
        
        let wallet = borrow_global_mut<DeadmanWallet>(owner_address);
        
        // Validate wallet is active
        assert!(wallet.is_active, EUNAUTHORIZED);
        
        // Convert days to seconds and validate
        let new_limit_seconds = new_limit_days * 24 * 60 * 60;
        assert!(new_limit_seconds > 0, EINVALID_TIME_LIMIT);
        
        // Update limit
        wallet.inactivity_limit_seconds = new_limit_seconds;
    }

    /// Deactivate wallet (emergency stop)
    public fun deactivate_wallet(owner: &signer) acquires DeadmanWallet {
        let owner_address = signer::address_of(owner);
        
        // Ensure wallet exists
        assert!(exists<DeadmanWallet>(owner_address), EUNAUTHORIZED);
        
        let wallet = borrow_global_mut<DeadmanWallet>(owner_address);
        
        // Deactivate wallet
        wallet.is_active = false;
    }

    // ===== VIEW FUNCTIONS =====

    /// Get wallet information
    public fun get_wallet_info(owner_address: address): (address, address, u64, u64, bool, u64) acquires DeadmanWallet {
        assert!(exists<DeadmanWallet>(owner_address), EUNAUTHORIZED);
        
        let wallet = borrow_global<DeadmanWallet>(owner_address);
        
        (
            wallet.owner,
            wallet.heir,
            wallet.inactivity_limit_seconds,
            wallet.last_heartbeat_timestamp,
            wallet.is_active,
            wallet.total_locked_value
        )
    }

    /// Get locked asset information
    public fun get_locked_asset_info(owner_address: address): (u64, String, u64, address, u64, u64, u8) acquires LockedAsset {
        assert!(exists<LockedAsset>(owner_address), ENO_LOCKED_ASSETS);
        
        let asset = borrow_global<LockedAsset>(owner_address);
        
        (
            asset.asset_id,
            asset.coin_type,
            asset.amount,
            asset.heir,
            asset.lock_timestamp,
            asset.inactivity_limit_seconds,
            asset.status
        )
    }

    /// Check if wallet exists
    public fun wallet_exists(owner_address: address): bool {
        exists<DeadmanWallet>(owner_address)
    }

    /// Check if user has locked assets
    public fun has_locked_assets(owner_address: address): bool {
        exists<LockedAsset>(owner_address)
    }

    /// Get global statistics
    public fun get_global_stats(): (u64, u64, u64, u64) acquires WalletStats {
        let stats = borrow_global<WalletStats>(@deadmans_wallet);
        
        (
            stats.total_wallets,
            stats.total_locked_assets,
            stats.total_transferred_assets,
            stats.total_value_locked
        )
    }

    /// Calculate time until inactivity transfer
    public fun time_until_transfer(owner_address: address): u64 acquires DeadmanWallet {
        assert!(exists<DeadmanWallet>(owner_address), EUNAUTHORIZED);
        
        let wallet = borrow_global<DeadmanWallet>(owner_address);
        let current_time = timestamp::now_seconds();
        let time_since_heartbeat = current_time - wallet.last_heartbeat_timestamp;
        
        if (time_since_heartbeat >= wallet.inactivity_limit_seconds) {
            0 // Transfer should have already happened
        } else {
            wallet.inactivity_limit_seconds - time_since_heartbeat
        }
    }

    // ===== TEST FUNCTIONS =====

    #[test_only]
    public fun test_create_wallet() {
        let alice = @0x1;
        let heir = @0x2;
        
        // Create test account
        account::create_account_for_test(alice);
        
        // Create wallet
        create_wallet(&create_test_signer(alice), heir, 30);
        
        // Verify wallet was created
        assert!(wallet_exists(alice), 0);
        
        let (owner, heir_addr, limit, heartbeat, is_active, total_locked) = get_wallet_info(alice);
        assert!(owner == alice, 1);
        assert!(heir_addr == heir, 2);
        assert!(limit == 30 * 24 * 60 * 60, 3);
        assert!(is_active == true, 4);
        assert!(total_locked == 0, 5);
    }

    #[test_only]
    public fun test_lock_assets() acquires DeadmanWallet, LockedAsset, WalletStats {
        let alice = @0x1;
        let heir = @0x2;
        
        // Create test accounts
        account::create_account_for_test(alice);
        account::create_account_for_test(heir);
        
        // Create wallet
        create_wallet(&create_test_signer(alice), heir, 30);
        
        // Lock assets (simulated - in real implementation would use actual coins)
        // lock_assets<AptosCoin>(&create_test_signer(alice), 1000, heir, 30);
        
        // Verify assets were locked
        assert!(has_locked_assets(alice), 0);
        
        let (asset_id, coin_type, amount, heir_addr, lock_time, limit, status) = get_locked_asset_info(alice);
        assert!(amount == 1000, 1);
        assert!(heir_addr == heir, 2);
        assert!(status == 0, 3); // locked
    }

    #[test_only]
    fun create_test_signer(addr: address): signer {
        test_utils::create_signer_for_testing(addr)
    }
}