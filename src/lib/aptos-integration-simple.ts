// Simplified Aptos Integration for Deadman's Wallet
// This version simulates wallet connections with consistent mock data for demonstration

import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

class DeadmanWalletAptosSimple {
  private aptos: Aptos;
  private network: 'testnet' | 'mainnet';
  private mockWalletAddresses: { [key: string]: string } = {
    petra: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890',
    metamask: '0x9876543210fedcba0987654321fedcba0987654321fedcba0987654321fedcba',
    other: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
  };
  
  constructor(network: 'testnet' | 'mainnet' = 'testnet') {
    this.network = network;
    const config = new AptosConfig({ network: network === 'testnet' ? Network.TESTNET : Network.MAINNET });
    this.aptos = new Aptos(config);
  }

  // Simulate wallet connection with consistent addresses
  async connectWallet(walletType: string): Promise<any> {
    console.log(`Connecting to ${walletType} wallet...`);
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const address = this.mockWalletAddresses[walletType] || this.mockWalletAddresses.other;
    
    return {
      success: true,
      address: address,
      walletType: walletType,
      message: `Successfully connected to ${walletType} wallet`
    };
  }

  // Get account data - mix real blockchain data with mock data for demo
  async getAccountData(accountAddress: string): Promise<any> {
    try {
      console.log(`Fetching account data for: ${accountAddress}`);
      
      // Try to get real account data first
      let realBalances = { ETH: 0, USDC: 0, APT: 0, FastCoin: 0 };
      let totalBalance = 0;
      
      try {
        const account = await this.aptos.getAccountInfo({ accountAddress });
        const resources = await this.aptos.getAccountResources({ accountAddress });
        
        const balances: { [key: string]: number } = {};
        
        resources.forEach(resource => {
          const type = resource.type;
          
          if (type.includes('CoinStore')) {
            try {
              const coinType = type.split('<')[1].split('>')[0];
              const balance = parseInt(resource.data.coin.value);
              balances[coinType] = balance;
              
              // Map to our display tokens
              if (coinType.includes('aptos_coin') || coinType.includes('AptosCoin')) {
                realBalances.APT = balance / 100000000; // Convert octas to APT
              } else if (coinType.includes('usdc') || coinType.includes('USDC')) {
                realBalances.USDC = balance / 1000000; // Convert to USDC
              } else if (coinType.includes('ethereum') || coinType.includes('ETH')) {
                realBalances.ETH = balance / 1000000000000000000; // Convert wei to ETH
              } else if (coinType.includes('fast_coin') || coinType.includes('FastCoin')) {
                realBalances.FastCoin = balance / 1000000; // Convert to FastCoin
              }
            } catch (error) {
              console.log('Error parsing coin resource:', error);
            }
          }
        });
        
        totalBalance = Object.values(realBalances).reduce((sum, val) => sum + val, 0);
        
      } catch (error) {
        console.log('Real blockchain fetch failed, using mock data:', error.message);
        
        // Use mock data if real fetch fails
        realBalances = this.generateMockBalances();
        totalBalance = Object.values(realBalances).reduce((sum, val) => sum + val, 0);
      }
      
      const result = {
        address: accountAddress,
        sequence_number: "0",
        balances: realBalances,
        totalBalance: totalBalance,
        displayBalances: {
          ETH: realBalances.ETH.toFixed(6),
          USDC: realBalances.USDC.toFixed(2),
          APT: realBalances.APT.toFixed(6),
          FastCoin: realBalances.FastCoin.toFixed(2),
          TOTAL: totalBalance.toFixed(6)
        }
      };
      
      console.log('Final result:', result);
      return result;
      
    } catch (error) {
      console.error('Failed to get account data:', error);
      return {
        address: accountAddress,
        sequence_number: 0,
        balances: {},
        displayBalances: {
          ETH: "0.000000",
          USDC: "0.00",
          APT: "0.000000",
          FastCoin: "0.00",
          TOTAL: "0.000000"
        }
      };
    }
  }

  // Generate mock balances for demonstration
  private generateMockBalances(): { [key: string]: number } {
    return {
      ETH: Math.random() * 10, // 0-10 ETH
      USDC: Math.random() * 5000, // 0-5000 USDC
      APT: Math.random() * 100, // 0-100 APT
      FastCoin: Math.random() * 10000 // 0-10000 FastCoin
    };
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
      console.log(`Funding account ${accountAddress} with ${amount} octas`);
      
      // Try multiple faucet endpoints
      const faucetEndpoints = [
        `https://aptos.dev/faucet/?address=${accountAddress}&amount=${amount}`,
        `https://testnet.aptoslabs.com/faucet?address=${accountAddress}&amount=${amount}`
      ];
      
      let lastError = null;
      
      for (const endpoint of faucetEndpoints) {
        try {
          console.log(`Trying faucet endpoint: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          console.log(`Faucet response status: ${response.status}`);
          
          if (response.ok) {
            const result = await response.json();
            console.log('Faucet success:', result);
            
            return {
              success: true,
              data: result,
              message: `Successfully funded ${amount} Octas to ${accountAddress}`
            };
          } else {
            const errorText = await response.text();
            console.log(`Faucet failed with status ${response.status}:`, errorText);
            lastError = errorText;
          }
        } catch (error) {
          console.log(`Faucet endpoint error:`, error.message);
          lastError = error.message;
        }
      }
      
      // If all endpoints failed, try GET method as fallback
      try {
        console.log('Trying GET method as fallback...');
        const response = await fetch(`https://aptos.dev/faucet/?address=${accountAddress}&amount=${amount}`);
        
        if (response.ok) {
          const result = await response.text();
          console.log('GET faucet response:', result.substring(0, 200));
          
          return {
            success: true,
            data: result,
            message: `Faucet request sent to ${accountAddress}`
          };
        }
      } catch (error) {
        console.log('GET faucet failed:', error.message);
      }
      
      return {
        success: false,
        error: lastError || 'All faucet endpoints failed'
      };
      
    } catch (error) {
      console.error('Failed to fund account:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check if account exists
  async checkAccountExists(accountAddress: string): Promise<boolean> {
    try {
      await this.aptos.getAccountInfo({ accountAddress });
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default DeadmanWalletAptosSimple;