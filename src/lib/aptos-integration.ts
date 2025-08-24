// Aptos Integration for Deadman's Wallet
// Simplified version using @aptos-labs/ts-sdk

import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

// Configuration for different networks
const NETWORKS = {
  testnet: {
    name: Network.TESTNET,
    faucetUrl: 'https://aptos.dev/faucet/'
  },
  mainnet: {
    name: Network.MAINNET,
    faucetUrl: null
  }
};

// Contract configuration - replace with your deployed contract address
const CONTRACT_ADDRESS = '0xYOUR_CONTRACT_ADDRESS'; // Replace with actual deployed address

class DeadmanWalletAptos {
  private aptos: Aptos;
  private network: 'testnet' | 'mainnet';
  
  constructor(network: 'testnet' | 'mainnet' = 'testnet') {
    this.network = network;
    const config = new AptosConfig({ network: NETWORKS[network].name });
    this.aptos = new Aptos(config);
  }

  // Get real account balance from blockchain
  async getAccountBalance(accountAddress: string, coinType: string = '0x1::aptos_coin::AptosCoin'): Promise<number> {
    try {
      const balance = await this.aptos.getAccountCoinAmount({
        accountAddress,
        coinType
      });
      return balance;
    } catch (error) {
      console.error('Failed to get account balance:', error);
      return 0;
    }
  }

  // Get all account resources (including coins)
  async getAccountResources(accountAddress: string): Promise<any[]> {
    try {
      const resources = await this.aptos.getAccountResources({
        accountAddress
      });
      return resources;
    } catch (error) {
      console.error('Failed to get account resources:', error);
      return [];
    }
  }

  // Get account data including balances
  async getAccountData(accountAddress: string): Promise<any> {
    try {
      const [account, resources] = await Promise.all([
        this.aptos.getAccountInfo({ accountAddress }),
        this.getAccountResources(accountAddress)
      ]);

      // Extract coin balances from resources
      const balances: { [key: string]: number } = {};
      
      console.log('Account resources:', resources);
      
      resources.forEach(resource => {
        const type = resource.type;
        console.log('Resource type:', type);
        if (type.includes('CoinStore')) {
          // Extract coin type from resource type
          const coinType = type.split('<')[1].split('>')[0];
          const balance = parseInt(resource.data.coin.value);
          balances[coinType] = balance;
          console.log(`Found balance: ${balance} for coin type: ${coinType}`);
        }
      });

      return {
        address: accountAddress,
        sequence_number: account.sequence_number,
        balances: balances,
        // Common coin types for display - updated for Aptos testnet
        displayBalances: {
          ETH: balances['0x1::aptos_coin::AptosCoin'] || 0,
          USDC: balances['0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::coin::T'] || 0,
          APT: balances['0x1::aptos_coin::AptosCoin'] || 0 // Add APT as the main token
        }
      };
    } catch (error) {
      console.error('Failed to get account data:', error);
      return {
        address: accountAddress,
        sequence_number: 0,
        balances: {},
        // Common coin types for display - updated for Aptos testnet
        displayBalances: {
          ETH: 0,
          USDC: 0,
          APT: 0 // Add APT as the main token
        }
      };
    }
  }

  // Fund account using faucet (testnet only)
  async fundAccountWithFaucet(accountAddress: string, amount: number = 10000000): Promise<any> {
    if (this.network !== 'testnet') {
      return {
        success: false,
        error: 'Faucet only available on testnet'
      };
    }

    try {
      const response = await fetch(`${NETWORKS.testnet.faucetUrl}?address=${accountAddress}&amount=${amount}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: result,
          message: `Successfully funded ${amount} Octas to ${accountAddress}`
        };
      } else {
        return {
          success: false,
          error: result.message || 'Faucet request failed'
        };
      }
    } catch (error) {
      console.error('Failed to fund account:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check if account exists and has funds
  async checkAccountStatus(accountAddress: string): Promise<any> {
    try {
      const account = await this.aptos.getAccountInfo({ accountAddress });
      const accountData = await this.getAccountData(accountAddress);
      
      const hasFunds = Object.values(accountData.displayBalances).some(balance => balance > 0);
      
      return {
        exists: true,
        hasFunds: hasFunds,
        accountData: accountData,
        message: hasFunds ? 'Account has funds' : 'Account exists but has no funds'
      };
    } catch (error) {
      // Account doesn't exist
      return {
        exists: false,
        hasFunds: false,
        accountData: null,
        message: 'Account does not exist'
      };
    }
  }

  // Create new account (simplified - just return address)
  createAccount(): string {
    // For demo purposes, generate a random address
    return '0x' + Math.random().toString(16).substr(2, 40);
  }

  // Get account address from private key (simplified)
  getAddressFromPrivateKey(privateKey: string): string {
    // For demo purposes, just return a formatted address
    return '0x' + privateKey.substr(0, 40);
  }
}

// Export for use in React components
export default DeadmanWalletAptos;

// Simple account interface for demo purposes
export interface AptosAccount {
  address(): string;
  privateKey(): string;
}

// Example usage in React component:
/*
import { useState, useEffect } from 'react';


function DeadmanWalletComponent() {
  const [wallet, setWallet] = useState(null);
  const [deadmanWallet, setDeadmanWallet] = useState(null);
  const [accountData, setAccountData] = useState(null);
  const [status, setStatus] = useState('Not connected');

  useEffect(() => {
    // Initialize Aptos integration
    const aptosWallet = new DeadmanWalletAptos('testnet');
    setDeadmanWallet(aptosWallet);
  }, []);

  const connectWallet = async () => {
    try {
      // Create or import account
      const accountAddress = deadmanWallet.createAccount();
      setWallet(accountAddress);
      setStatus('Connected');
      
      // Get real account data from blockchain
      const data = await deadmanWallet.getAccountData(accountAddress);
      setAccountData(data);
      
      // Check if account has funds, if not, use faucet
      const accountStatus = await deadmanWallet.checkAccountStatus(accountAddress);
      if (!accountStatus.hasFunds) {
        const fundResult = await deadmanWallet.fundAccountWithFaucet(accountAddress);
        console.log('Faucet result:', fundResult);
        
        // Refresh account data after funding
        const updatedData = await deadmanWallet.getAccountData(accountAddress);
        setAccountData(updatedData);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setStatus('Connection failed');
    }
  };

  return (
    <div>
      <button onClick={connectWallet}>Connect Wallet</button>
      <p>Status: {status}</p>
      {accountData && (
        <div>
          <p>Address: {accountData.address}</p>
          <p>ETH Balance: {accountData.displayBalances.ETH}</p>
          <p>USDC Balance: {accountData.displayBalances.USDC}</p>
        </div>
      )}
    </div>
  );
}
*/