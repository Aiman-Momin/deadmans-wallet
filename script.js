// ===== GLOBAL STATE =====
let wallet = {
    address: "",
    balance: { ETH: 0, USDC: 0, APT: 0 },
    heir: "",
    inactivityLimit: 7,
    lastHeartbeat: null,
    lockedAssets: [],
    isConnected: false,
    connectedWalletType: "",
    walletName: ""
};

let actionLog = [];

// ===== APTOS INTEGRATION =====
class AptosIntegration {
    constructor() {
        this.network = 'testnet';
        this.nodeUrl = 'https://fullnode.testnet.aptoslabs.com';
    }

    // Connect to wallet (simplified for demo)
    async connectWallet(walletType) {
        try {
            // In a real implementation, this would use wallet extension APIs
            // For demo purposes, we'll simulate the connection
            console.log(`Connecting to ${walletType} wallet...`);
            
            // Simulate wallet connection delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Return mock wallet data
            return {
                success: true,
                address: this.generateMockAddress(),
                balance: this.generateMockBalance()
            };
        } catch (error) {
            console.error('Wallet connection failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Generate mock wallet address for demo
    generateMockAddress() {
        return '0x' + Math.random().toString(16).substr(2, 40);
    }

    // Generate mock balance for demo
    generateMockBalance() {
        return {
            ETH: Math.floor(Math.random() * 10000) / 1000,
            USDC: Math.floor(Math.random() * 5000),
            APT: Math.floor(Math.random() * 8000) / 1000
        };
    }

    // Get account data from blockchain (simplified)
    async getAccountData(address) {
        try {
            // In a real implementation, this would fetch from Aptos blockchain
            console.log(`Fetching account data for: ${address}`);
            
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Return mock account data
            return {
                address: address,
                sequence_number: "0",
                balances: this.generateMockBalance()
            };
        } catch (error) {
            console.error('Failed to fetch account data:', error);
            throw error;
        }
    }

    // Lock assets on blockchain (simplified)
    async lockAssets(userAddress, amount, token, heirAddress, timeLimit) {
        try {
            // In a real implementation, this would call the Move smart contract
            console.log(`Locking ${amount} ${token} for ${heirAddress} with ${timeLimit} days limit`);
            
            // Simulate blockchain transaction delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Return mock transaction result
            return {
                success: true,
                transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
                blockNumber: Math.floor(Math.random() * 1000000)
            };
        } catch (error) {
            console.error('Failed to lock assets:', error);
            throw error;
        }
    }

    // Update heartbeat on blockchain (simplified)
    async updateHeartbeat(userAddress) {
        try {
            // In a real implementation, this would call the Move smart contract
            console.log(`Updating heartbeat for: ${userAddress}`);
            
            // Simulate blockchain transaction delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            return {
                success: true,
                timestamp: new Date().toISOString(),
                transactionHash: '0x' + Math.random().toString(16).substr(2, 64)
            };
        } catch (error) {
            console.error('Failed to update heartbeat:', error);
            throw error;
        }
    }

    // Check and transfer if inactive (simplified)
    async checkAndTransfer(userAddress) {
        try {
            // In a real implementation, this would call the Move smart contract
            console.log(`Checking inactivity for: ${userAddress}`);
            
            // Simulate blockchain transaction delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            return {
                success: true,
                transferred: wallet.lockedAssets.length > 0,
                assetsTransferred: wallet.lockedAssets.length
            };
        } catch (error) {
            console.error('Failed to check and transfer:', error);
            throw error;
        }
    }
}

// Initialize Aptos integration
const aptosIntegration = new AptosIntegration();

// ===== UI FUNCTIONS =====
function addToActionLog(action, message) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
        time: timestamp,
        action: action,
        message: message
    };
    
    actionLog = [...actionLog, logEntry];
    updateActionLogDisplay();
}

function updateActionLogDisplay() {
    const logContainer = document.getElementById('logContainer');
    logContainer.innerHTML = '';
    
    actionLog.forEach(entry => {
        const logDiv = document.createElement('div');
        logDiv.className = 'log-entry';
        logDiv.innerHTML = `
            <span class="log-time">${entry.time}</span>
            <span class="log-action">${entry.action}</span>
            <span class="log-message">${entry.message}</span>
        `;
        logContainer.appendChild(logDiv);
    });
    
    // Scroll to bottom
    logContainer.scrollTop = logContainer.scrollHeight;
}

function updateWalletDisplay() {
    const walletStatus = document.getElementById('walletStatus');
    
    if (wallet.isConnected) {
        walletStatus.className = 'wallet-status status-connected';
        walletStatus.innerHTML = `
            <div class="wallet-info">
                <h3><i class="fas fa-check-circle"></i> ${wallet.walletName}</h3>
                <div class="wallet-address">Address: ${wallet.address.substring(0, 10)}...${wallet.address.substring(wallet.address.length - 6)}</div>
                <div class="balances">
                    <div class="balance-item">
                        <div class="balance-label">ETH</div>
                        <div class="balance-value">${wallet.balance.ETH}</div>
                    </div>
                    <div class="balance-item">
                        <div class="balance-label">USDC</div>
                        <div class="balance-value">${wallet.balance.USDC}</div>
                    </div>
                    <div class="balance-item">
                        <div class="balance-label">APT</div>
                        <div class="balance-value">${wallet.balance.APT}</div>
                    </div>
                </div>
            </div>
        `;
    } else {
        walletStatus.className = 'wallet-status';
        walletStatus.innerHTML = `
            <div class="status-disconnected">
                <i class="fas fa-exclamation-triangle"></i>
                <span>No wallet connected</span>
            </div>
        `;
    }
}

function updateStatusDisplay() {
    const lastHeartbeatEl = document.getElementById('lastHeartbeat');
    const daysInactiveEl = document.getElementById('daysInactive');
    const inactivityLimitEl = document.getElementById('inactivityLimitDisplay');
    
    if (wallet.lastHeartbeat) {
        lastHeartbeatEl.textContent = wallet.lastHeartbeat.toLocaleString();
        
        const daysInactive = getDaysInactive();
        daysInactiveEl.textContent = daysInactive;
        
        // Color code based on inactivity level
        if (daysInactive >= wallet.inactivityLimit) {
            daysInactiveEl.style.color = '#e74c3c';
        } else if (daysInactive >= wallet.inactivityLimit * 0.7) {
            daysInactiveEl.style.color = '#f39c12';
        } else {
            daysInactiveEl.style.color = '#27ae60';
        }
    } else {
        lastHeartbeatEl.textContent = 'Never';
        daysInactiveEl.textContent = '0';
        daysInactiveEl.style.color = '#b0b0b0';
    }
    
    inactivityLimitEl.textContent = wallet.inactivityLimit > 0 ? `${wallet.inactivityLimit} days` : 'Not set';
}

function getDaysInactive() {
    if (!wallet.lastHeartbeat) return 0;
    
    const now = new Date();
    const timeDiff = now - wallet.lastHeartbeat;
    return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
}

function showCustomWalletInput() {
    document.getElementById('customWalletInput').style.display = 'block';
}

function hideCustomWalletInput() {
    document.getElementById('customWalletInput').style.display = 'none';
    document.getElementById('walletAddress').value = '';
}

// ===== WALLET FUNCTIONS =====
async function connectWallet(walletType) {
    console.log(`Connecting to ${walletType} wallet...`);
    
    if (walletType === 'other') {
        showCustomWalletInput();
        addToActionLog('Info', 'Please enter your Aptos wallet address');
        return;
    }
    
    try {
        // Show loading state
        addToActionLog('Connecting', `Connecting to ${walletType}...`);
        
        // Connect to wallet
        const result = await aptosIntegration.connectWallet(walletType);
        
        if (result.success) {
            // Update wallet state
            wallet = {
                ...wallet,
                address: result.address,
                balance: result.balance,
                isConnected: true,
                connectedWalletType: walletType,
                walletName: walletType.charAt(0).toUpperCase() + walletType.slice(1) + ' Wallet'
            };
            
            // Update UI
            updateWalletDisplay();
            addToActionLog('Success', `${wallet.walletName} connected: ${result.address.substring(0, 10)}...`);
            
            // Fetch real account data
            const accountData = await aptosIntegration.getAccountData(result.address);
            wallet.balance = accountData.balances;
            updateWalletDisplay();
            addToActionLog('Balance', `Fetched balances: ETH=${wallet.balance.ETH}, USDC=${wallet.balance.USDC}, APT=${wallet.balance.APT}`);
        } else {
            addToActionLog('Error', `Connection failed: ${result.error}`);
        }
    } catch (error) {
        console.error('Failed to connect wallet:', error);
        addToActionLog('Error', `Connection failed: ${error.message}`);
    }
}

async function handleCustomWalletSubmit() {
    const addressInput = document.getElementById('walletAddress');
    const address = addressInput.value.trim();
    
    if (!address) {
        addToActionLog('Error', 'Please enter a wallet address');
        return;
    }
    
    if (!address.startsWith('0x') || address.length < 10) {
        addToActionLog('Error', 'Invalid wallet address format. Must start with 0x and be at least 10 characters long.');
        return;
    }
    
    try {
        // Update wallet state
        wallet = {
            ...wallet,
            address: address,
            isConnected: true,
            connectedWalletType: 'other',
            walletName: 'Custom Wallet',
            balance: { ETH: 0, USDC: 0, APT: 0 }
        };
        
        // Update UI
        updateWalletDisplay();
        hideCustomWalletInput();
        addToActionLog('Success', `Custom Wallet connected: ${address.substring(0, 10)}...`);
        
        // Fetch real account data
        const accountData = await aptosIntegration.getAccountData(address);
        wallet.balance = accountData.balances;
        updateWalletDisplay();
        addToActionLog('Balance', `Fetched balances: ETH=${wallet.balance.ETH}, USDC=${wallet.balance.USDC}, APT=${wallet.balance.APT}`);
    } catch (error) {
        console.error('Failed to connect custom wallet:', error);
        addToActionLog('Error', `Connection failed: ${error.message}`);
    }
}

// ===== ASSET MANAGEMENT FUNCTIONS =====
async function lockAssets() {
    if (!wallet.isConnected) {
        addToActionLog('Error', 'Please connect your wallet first');
        return;
    }
    
    const amount = parseFloat(document.getElementById('amount').value);
    const token = document.getElementById('token').value;
    const heir = document.getElementById('heir').value.trim();
    const inactivityLimit = parseInt(document.getElementById('inactivityLimit').value);
    
    // Validate inputs
    if (!amount || amount <= 0) {
        addToActionLog('Error', 'Please enter a valid amount');
        return;
    }
    
    if (!heir || !heir.startsWith('0x') || heir.length < 10) {
        addToActionLog('Error', 'Please enter a valid heir wallet address');
        return;
    }
    
    if (!inactivityLimit || inactivityLimit < 1) {
        addToActionLog('Error', 'Please enter a valid inactivity limit');
        return;
    }
    
    if (wallet.balance[token] < amount) {
        addToActionLog('Error', `Insufficient ${token} balance`);
        return;
    }
    
    try {
        // Show loading state
        addToActionLog('Processing', `Locking ${amount} ${token}...`);
        
        // Call blockchain (simplified)
        const result = await aptosIntegration.lockAssets(
            wallet.address,
            amount,
            token,
            heir,
            inactivityLimit
        );
        
        if (result.success) {
            // Update wallet state
            const lockedAsset = {
                id: Date.now(),
                amount: amount,
                token: token,
                heir: heir,
                inactivityLimit: inactivityLimit,
                timestamp: new Date(),
                status: 'locked',
                transactionHash: result.transactionHash
            };
            
            wallet = {
                ...wallet,
                lockedAssets: [...wallet.lockedAssets, lockedAsset],
                heir: heir,
                inactivityLimit: inactivityLimit,
                balance: {
                    ...wallet.balance,
                    [token]: wallet.balance[token] - amount
                },
                lastHeartbeat: new Date()
            };
            
            // Update UI
            updateWalletDisplay();
            updateStatusDisplay();
            
            addToActionLog('Success', `Locked ${amount} ${token} for ${heir.substring(0, 10)}...`);
            addToActionLog('Transaction', `Hash: ${result.transactionHash.substring(0, 20)}...`);
            
            // Clear form
            document.getElementById('amount').value = '';
            document.getElementById('heir').value = '';
            document.getElementById('inactivityLimit').value = '7';
        } else {
            addToActionLog('Error', `Failed to lock assets: ${result.error}`);
        }
    } catch (error) {
        console.error('Failed to lock assets:', error);
        addToActionLog('Error', `Failed to lock assets: ${error.message}`);
    }
}

async function sendHeartbeat() {
    if (!wallet.isConnected) {
        addToActionLog('Error', 'Please connect your wallet first');
        return;
    }
    
    if (wallet.lockedAssets.length === 0) {
        addToActionLog('Error', 'No assets locked. Please lock assets first.');
        return;
    }
    
    try {
        // Show loading state
        addToActionLog('Processing', 'Sending heartbeat...');
        
        // Call blockchain (simplified)
        const result = await aptosIntegration.updateHeartbeat(wallet.address);
        
        if (result.success) {
            // Update wallet state
            const now = new Date();
            wallet = {
                ...wallet,
                lastHeartbeat: now
            };
            
            // Update UI
            updateStatusDisplay();
            
            addToActionLog('Success', `Heartbeat sent at ${now.toLocaleTimeString()}`);
            addToActionLog('Transaction', `Hash: ${result.transactionHash.substring(0, 20)}...`);
            
            // Check if any assets need to be transferred
            setTimeout(() => {
                checkInactivityAndTransfer();
            }, 100);
        } else {
            addToActionLog('Error', `Failed to send heartbeat: ${result.error}`);
        }
    } catch (error) {
        console.error('Failed to send heartbeat:', error);
        addToActionLog('Error', `Failed to send heartbeat: ${error.message}`);
    }
}

async function simulateInactivity() {
    if (!wallet.isConnected) {
        addToActionLog('Error', 'Please connect your wallet first');
        return;
    }
    
    if (wallet.lockedAssets.length === 0) {
        addToActionLog('Error', 'No assets locked. Please lock assets first.');
        return;
    }
    
    if (!wallet.lastHeartbeat) {
        addToActionLog('Error', 'No heartbeat recorded. Please send heartbeat first.');
        return;
    }
    
    // Simulate inactivity by setting last heartbeat to past
    const simulatedInactiveDays = wallet.inactivityLimit + 1;
    const newHeartbeatTime = new Date(Date.now() - (simulatedInactiveDays * 24 * 60 * 60 * 1000));
    
    wallet = {
        ...wallet,
        lastHeartbeat: newHeartbeatTime
    };
    
    updateStatusDisplay();
    
    addToActionLog('Simulation', `Set last heartbeat to ${simulatedInactiveDays} days ago`);
    
    // Check if inactivity triggers transfer
    setTimeout(() => {
        checkInactivityAndTransfer();
    }, 100);
}

async function checkInactivityAndTransfer() {
    if (!wallet.lastHeartbeat || !wallet.isConnected) return;
    
    const daysInactive = getDaysInactive();
    
    console.log(`Checking inactivity: ${daysInactive} days since last heartbeat, limit: ${wallet.inactivityLimit} days`);
    
    if (daysInactive >= wallet.inactivityLimit) {
        await transferAssetsToHeir();
    } else {
        addToActionLog('Check', `User active (${daysInactive} days since last heartbeat, limit: ${wallet.inactivityLimit} days)`);
    }
}

async function transferAssetsToHeir() {
    try {
        // Show loading state
        addToActionLog('Processing', 'Checking inactivity and transferring assets...');
        
        // Call blockchain (simplified)
        const result = await aptosIntegration.checkAndTransfer(wallet.address);
        
        if (result.success && result.transferred) {
            let totalTransferred = 0;
            const updatedAssets = wallet.lockedAssets.map(asset => {
                if (asset.status === 'locked') {
                    asset.status = 'transferred';
                    asset.transferTime = new Date();
                    totalTransferred += asset.amount;
                    
                    addToActionLog('Transferred', `${asset.amount} ${asset.token} transferred to heir`);
                }
                return asset;
            });
            
            if (totalTransferred > 0) {
                wallet = {
                    ...wallet,
                    lockedAssets: updatedAssets
                };
                
                addToActionLog('Complete', `Total of ${totalTransferred} assets transferred to ${wallet.heir.substring(0, 10)}...`);
                
                // Show notification
                setTimeout(() => {
                    alert('🚨 User inactive. Assets have been transferred to the heir!');
                }, 500);
            }
        } else {
            addToActionLog('Check', 'No assets transferred - user still active');
        }
    } catch (error) {
        console.error('Failed to transfer assets:', error);
        addToActionLog('Error', `Failed to transfer assets: ${error.message}`);
    }
}

// ===== UTILITY FUNCTIONS =====
function clearLog() {
    actionLog = [];
    updateActionLogDisplay();
    addToActionLog('System', 'Action log cleared');
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    addToActionLog('System', 'Deadman\'s Wallet initialized');
    
    // Update status display every second
    setInterval(() => {
        updateStatusDisplay();
        checkInactivityAndTransfer();
    }, 1000);
    
    // Handle Enter key in wallet address input
    document.getElementById('walletAddress').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleCustomWalletSubmit();
        }
    });
    
    // Add input validation
    document.getElementById('walletAddress').addEventListener('input', function(e) {
        const value = e.target.value;
        if (value && !value.startsWith('0x')) {
            e.target.setCustomValidity('Wallet address must start with 0x');
        } else if (value && value.length < 10) {
            e.target.setCustomValidity('Wallet address must be at least 10 characters long');
        } else {
            e.target.setCustomValidity('');
        }
    });
    
    console.log('Deadman\'s Wallet dApp initialized successfully');
});

// ===== BLOCKCHAIN INTEGRATION COMMENTS =====
/*
The following functions would be implemented with actual Move smart contract calls:

1. connectWallet() - Would use Petra wallet extension API:
   - window.aptos.connect()
   - window.aptos.account()
   - window.aptos.getBalance()

2. lockAssets() - Would call Move smart contract:
   - await window.aptos.signAndSubmitTransaction({
         type: "entry_function_payload",
         function: "0xYourContractAddress::deadmans_wallet::lock_assets",
         type_arguments: [token_type],
         arguments: [amount, heir_address, time_limit]
     })

3. sendHeartbeat() - Would call Move smart contract:
   - await window.aptos.signAndSubmitTransaction({
         type: "entry_function_payload",
         function: "0xYourContractAddress::deadmans_wallet::update_heartbeat",
         arguments: []
     })

4. checkInactivityAndTransfer() - Would be handled by the Move smart contract automatically:
   - The contract would have a timer mechanism
   - Automatic transfer when inactivity period exceeds limit
   - No frontend transaction needed for automatic transfers

The current implementation simulates these blockchain interactions for demo purposes.
*/