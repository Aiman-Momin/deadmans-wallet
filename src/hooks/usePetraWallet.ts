'use client'

import { useState, useCallback, useEffect } from 'react'
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk'

// Add TypeScript declaration for window.aptos
declare global {
  interface Window {
    aptos?: any
    petra?: any
    coinbaseWalletExtension?: any
    ethereum?: any
  }
}

interface PetraWalletState {
  address: string | null
  isConnected: boolean
  balance: string
  network: string | null
  publicKey: string | null
}

export const usePetraWallet = () => {
  const [walletState, setWalletState] = useState<PetraWalletState>({
    address: null,
    isConnected: false,
    balance: '0',
    network: null,
    publicKey: null
  })

  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize wallet detection
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      console.log('Initializing wallet detection...')
      
      // Wait a bit for wallet to be injected
      const timer = setTimeout(() => {
        console.log('Checking wallet availability after timeout...')
        checkPetraWallet()
        setIsInitialized(true)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [isInitialized])

  // Listen for wallet events
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleAccountsChanged = (accounts: string[]) => {
        console.log('Accounts changed:', accounts)
        if (accounts.length === 0) {
          // User disconnected
          disconnectWallet()
        } else if (accounts[0] !== walletState.address) {
          // Account changed, reconnect
          connectWallet()
        }
      }

      const handleChainChanged = (chainId: string) => {
        console.log('Chain changed:', chainId)
        // Refresh wallet info
        if (walletState.isConnected) {
          refreshBalance()
        }
      }

      // Add event listeners if wallet is available
      if (window.aptos) {
        window.aptos.on('accountChanged', handleAccountsChanged)
        window.aptos.on('networkChanged', handleChainChanged)
      } else if (window.petra) {
        window.petra.on('accountChanged', handleAccountsChanged)
        window.petra.on('networkChanged', handleChainChanged)
      }

      return () => {
        // Clean up event listeners
        if (window.aptos) {
          window.aptos.off('accountChanged', handleAccountsChanged)
          window.aptos.off('networkChanged', handleChainChanged)
        } else if (window.petra) {
          window.petra.off('accountChanged', handleAccountsChanged)
          window.petra.off('networkChanged', handleChainChanged)
        }
      }
    }
  }, [walletState.isConnected, walletState.address])

  // Check if Petra wallet is installed
  const checkPetraWallet = useCallback(() => {
    if (typeof window !== 'undefined') {
      console.log('Checking for Petra wallet...')
      console.log('window.aptos:', typeof window.aptos)
      console.log('window.petra:', typeof window.petra)
      console.log('window.ethereum:', typeof window.ethereum)
      
      // Check multiple possible interfaces
      if (window.aptos) {
        console.log('Found window.aptos interface')
        console.log('Available methods:', Object.keys(window.aptos))
        return true
      }
      
      if (window.petra) {
        console.log('Found window.petra interface')
        console.log('Available methods:', Object.keys(window.petra))
        return true
      }
      
      // Check if ethereum exists and has petra-specific methods
      if (window.ethereum && window.ethereum.isPetra) {
        console.log('Found Petra wallet via ethereum interface')
        console.log('Available methods:', Object.keys(window.ethereum))
        return true
      }
      
      // Check for any wallet that might be Petra
      if (window.ethereum && window.ethereum.providers) {
        const petraProvider = window.ethereum.providers.find(
          (provider: any) => provider.isPetra || provider.name?.toLowerCase().includes('petra')
        )
        if (petraProvider) {
          console.log('Found Petra wallet via ethereum providers')
          console.log('Available methods:', Object.keys(petraProvider))
          return true
        }
      }
      
      console.log('Petra wallet not found')
      return false
    }
    return false
  }, [])

  // Initialize Aptos SDK
  const getAptosClient = useCallback(() => {
    const config = new AptosConfig({ network: Network.TESTNET })
    return new Aptos(config)
  }, [])

  // Connect to Petra wallet
  const connectWallet = useCallback(async () => {
    console.log('Starting Petra wallet connection...')
    
    if (!checkPetraWallet()) {
      console.log('Petra wallet not found')
      setError('Petra wallet is not installed. Please install Petra wallet to continue.')
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      console.log('Connecting to Petra wallet...')
      
      let response: any
      
      // Try different connection methods based on available interface
      if (window.aptos) {
        console.log('Using window.aptos interface')
        try {
          response = await window.aptos.connect()
          console.log('window.aptos.connect() response:', response)
        } catch (error) {
          console.error('window.aptos.connect() failed:', error)
          throw error
        }
      } else if (window.petra) {
        console.log('Using window.petra interface')
        try {
          response = await window.petra.connect()
          console.log('window.petra.connect() response:', response)
        } catch (error) {
          console.error('window.petra.connect() failed:', error)
          throw error
        }
      } else if (window.ethereum && window.ethereum.isPetra) {
        console.log('Using ethereum.isPetra interface')
        // For Petra wallet that exposes through ethereum interface
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
          response = {
            address: accounts[0],
            network: 'testnet' // Default to testnet
          }
          console.log('ethereum.isPetra response:', response)
        } catch (error) {
          console.error('ethereum.isPetra request failed:', error)
          throw error
        }
      } else if (window.ethereum && window.ethereum.providers) {
        console.log('Using ethereum providers interface')
        const petraProvider = window.ethereum.providers.find(
          (provider: any) => provider.isPetra || provider.name?.toLowerCase().includes('petra')
        )
        if (petraProvider) {
          try {
            const accounts = await petraProvider.request({ method: 'eth_requestAccounts' })
            response = {
              address: accounts[0],
              network: 'testnet'
            }
            console.log('ethereum providers response:', response)
          } catch (error) {
            console.error('ethereum providers request failed:', error)
            throw error
          }
        }
      }
      
      console.log('Petra connection response:', response)
      
      if (!response || !response.address) {
        throw new Error('Failed to get wallet address from connection response')
      }

      // Validate address format
      if (!response.address.startsWith('0x') || response.address.length !== 66) {
        throw new Error(`Invalid address format: ${response.address}`)
      }

      // Get account info
      const aptos = getAptosClient()
      const accountInfo = await aptos.getAccountInfo({
        accountAddress: response.address
      })
      
      console.log('Account info:', accountInfo)
      
      // Get balance using the new SDK API - try multiple methods
      let balance = BigInt(0)
      try {
        console.log('Attempting to get balance for address:', response.address)
        
        // Method 1: Try getting account resources first (most reliable)
        try {
          const resources = await aptos.getAccountResources({
            accountAddress: response.address
          })
          console.log('Account resources retrieved:', resources.length, 'resources found')
          console.log('Available resource types:', resources.map(r => r.type))
          
          // Look for APT coin resource - check multiple possible formats
          const aptosCoinResource = resources.find(resource => {
            const resourceType = resource.type
            console.log('Checking resource type:', resourceType)
            return resourceType === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>' ||
                   resourceType === '0x1::aptos_coin::AptosCoin' ||
                   resourceType.includes('coin::CoinStore') && resourceType.includes('aptos_coin::AptosCoin') ||
                   resourceType.includes('AptosCoin')
          })
          
          if (aptosCoinResource) {
            console.log('Found APT coin resource:', aptosCoinResource)
            console.log('Resource data:', aptosCoinResource.data)
            
            // Try different possible data structures
            if (aptosCoinResource.data && aptosCoinResource.data.coin) {
              balance = BigInt(aptosCoinResource.data.coin.value)
              console.log('Balance from coin.value:', balance.toString())
            } else if (aptosCoinResource.data && aptosCoinResource.data.value) {
              balance = BigInt(aptosCoinResource.data.value)
              console.log('Balance from direct value:', balance.toString())
            }
          } else {
            console.log('APT coin resource not found in resources')
            console.log('All resource types:', resources.map(r => r.type))
          }
        } catch (resourceError) {
          console.log('Resource method failed:', resourceError)
        }
        
        // Method 2: If resource method failed or returned 0, try getAccountAPTAmount
        if (balance === BigInt(0)) {
          try {
            console.log('Trying getAccountAPTAmount method...')
            const aptBalance = await aptos.getAccountAPTAmount({
              accountAddress: response.address
            })
            balance = aptBalance
            console.log('Balance from getAccountAPTAmount:', balance.toString())
          } catch (aptAmountError) {
            console.log('getAccountAPTAmount failed:', aptAmountError)
          }
        }
        
        // Method 3: Try fungible asset balances
        if (balance === BigInt(0)) {
          try {
            console.log('Trying fungible asset balances...')
            const fungibleAssets = await aptos.getFungibleAssetBalances({
              accountAddress: response.address
            })
            console.log('Fungible assets:', fungibleAssets)
            
            const aptAsset = fungibleAssets.find(asset => 
              asset.asset_type === '0x1::aptos_coin::AptosCoin'
            )
            
            if (aptAsset) {
              balance = BigInt(aptAsset.amount)
              console.log('Balance from fungible assets:', balance.toString())
            }
          } catch (fungibleError) {
            console.log('Fungible assets method failed:', fungibleError)
          }
        }
        
        // Method 4: Try direct coin type query
        if (balance === BigInt(0)) {
          try {
            console.log('Trying direct coin type query...')
            const coinBalance = await aptos.getAccountCoinAmount({
              accountAddress: response.address,
              coinType: '0x1::aptos_coin::AptosCoin'
            })
            balance = coinBalance
            console.log('Balance from direct coin query:', balance.toString())
          } catch (coinError) {
            console.log('Direct coin query failed:', coinError)
          }
        }
        
      } catch (error) {
        console.error('All balance retrieval methods failed:', error)
      }
      
      console.log('Final balance:', balance.toString())

      setWalletState({
        address: response.address,
        isConnected: true,
        balance: balance.toString(),
        network: response.network || 'testnet',
        publicKey: response.publicKey || null
      })

      console.log('Petra wallet connected successfully!')

    } catch (err: any) {
      console.error('Error connecting Petra wallet:', err)
      setError(err.message || 'Failed to connect Petra wallet')
    } finally {
      setIsConnecting(false)
    }
  }, [checkPetraWallet, getAptosClient])

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    console.log('Disconnecting Petra wallet...')
    
    // Try different disconnect methods based on available interface
    if (window.aptos && window.aptos.disconnect) {
      window.aptos.disconnect()
    } else if (window.petra && window.petra.disconnect) {
      window.petra.disconnect()
    } else if (window.ethereum && window.ethereum.isPetra) {
      // For Petra wallet that exposes through ethereum interface
      // Ethereum wallets typically don't have a disconnect method
    }
    
    setWalletState({
      address: null,
      isConnected: false,
      balance: '0',
      network: null,
      publicKey: null
    })
    setError(null)
  }, [])

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (walletState.isConnected && walletState.address) {
      try {
        console.log('Refreshing Petra wallet balance...')
        console.log('Address:', walletState.address)
        
        const aptos = getAptosClient()
        
        // Get balance using the new SDK API - try multiple methods
        let balance = BigInt(0)
        try {
          console.log('Attempting to get balance for address:', walletState.address)
          
          // Method 1: Try getting account resources first (most reliable)
          try {
            const resources = await aptos.getAccountResources({
              accountAddress: walletState.address
            })
            console.log('Account resources retrieved:', resources.length, 'resources found')
            console.log('Available resource types:', resources.map(r => r.type))
            
            // Look for APT coin resource - check multiple possible formats
            const aptosCoinResource = resources.find(resource => {
              const resourceType = resource.type
              console.log('Checking resource type:', resourceType)
              return resourceType === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>' ||
                     resourceType === '0x1::aptos_coin::AptosCoin' ||
                     resourceType.includes('coin::CoinStore') && resourceType.includes('aptos_coin::AptosCoin') ||
                     resourceType.includes('AptosCoin')
            })
            
            if (aptosCoinResource) {
              console.log('Found APT coin resource:', aptosCoinResource)
              console.log('Resource data:', aptosCoinResource.data)
              
              // Try different possible data structures
              if (aptosCoinResource.data && aptosCoinResource.data.coin) {
                balance = BigInt(aptosCoinResource.data.coin.value)
                console.log('Balance from coin.value:', balance.toString())
              } else if (aptosCoinResource.data && aptosCoinResource.data.value) {
                balance = BigInt(aptosCoinResource.data.value)
                console.log('Balance from direct value:', balance.toString())
              }
            } else {
              console.log('APT coin resource not found in resources')
              console.log('All resource types:', resources.map(r => r.type))
            }
          } catch (resourceError) {
            console.log('Resource method failed:', resourceError)
          }
          
          // Method 2: If resource method failed or returned 0, try getAccountAPTAmount
          if (balance === BigInt(0)) {
            try {
              console.log('Trying getAccountAPTAmount method...')
              const aptBalance = await aptos.getAccountAPTAmount({
                accountAddress: walletState.address
              })
              balance = aptBalance
              console.log('Balance from getAccountAPTAmount:', balance.toString())
            } catch (aptAmountError) {
              console.log('getAccountAPTAmount failed:', aptAmountError)
            }
          }
          
          // Method 3: Try fungible asset balances
          if (balance === BigInt(0)) {
            try {
              console.log('Trying fungible asset balances...')
              const fungibleAssets = await aptos.getFungibleAssetBalances({
                accountAddress: walletState.address
              })
              console.log('Fungible assets:', fungibleAssets)
              
              const aptAsset = fungibleAssets.find(asset => 
                asset.asset_type === '0x1::aptos_coin::AptosCoin'
              )
              
              if (aptAsset) {
                balance = BigInt(aptAsset.amount)
                console.log('Balance from fungible assets:', balance.toString())
              }
            } catch (fungibleError) {
              console.log('Fungible assets method failed:', fungibleError)
            }
          }
          
          // Method 4: Try direct coin type query
          if (balance === BigInt(0)) {
            try {
              console.log('Trying direct coin type query...')
              const coinBalance = await aptos.getAccountCoinAmount({
                accountAddress: walletState.address,
                coinType: '0x1::aptos_coin::AptosCoin'
              })
              balance = coinBalance
              console.log('Balance from direct coin query:', balance.toString())
            } catch (coinError) {
              console.log('Direct coin query failed:', coinError)
            }
          }
          
        } catch (error) {
          console.error('All balance retrieval methods failed:', error)
        }
        
        console.log('Final refreshed balance:', balance.toString())
        
        setWalletState(prev => ({
          ...prev,
          balance: balance.toString()
        }))
        console.log('Balance refreshed in state:', balance.toString())
      } catch (err) {
        console.error('Error refreshing balance:', err)
      }
    }
  }, [walletState.isConnected, walletState.address, getAptosClient])

  // Send transaction (transfer APT)
  const sendTransaction = useCallback(async (to: string, amount: string) => {
    if (!walletState.isConnected || !walletState.address) {
      throw new Error('Wallet not connected')
    }

    try {
      console.log('Sending APT transaction...')
      console.log('To:', to, 'Amount:', amount)
      
      // Convert amount to octas (1 APT = 100,000,000 octas)
      // Handle both integer and decimal amounts
      let amountFloat: number
      let amountInOctas: bigint
      
      // Check if amount is already in octas (very large number) or in APT (smaller number)
      if (amount.length > 10) {
        // Likely already in octas
        amountInOctas = BigInt(amount)
        amountFloat = Number(amountInOctas) / 100000000
        console.log('Amount appears to be in octas, converting to APT:', amountFloat)
      } else {
        // Convert from APT to octas
        amountFloat = parseFloat(amount)
        if (isNaN(amountFloat) || amountFloat <= 0) {
          throw new Error('Invalid amount')
        }
        amountInOctas = BigInt(Math.floor(amountFloat * 100000000))
        console.log('Amount converted from APT to octas:', amountInOctas.toString())
      }
      
      console.log('Final amount in APT:', amountFloat)
      console.log('Final amount in octas:', amountInOctas.toString())
      
      // Check if user has sufficient balance
      const currentBalance = BigInt(walletState.balance)
      console.log('Current balance:', currentBalance.toString())
      console.log('Amount to send:', amountInOctas.toString())
      console.log('Balance sufficient:', currentBalance >= amountInOctas)
      
      if (currentBalance < amountInOctas) {
        const balanceInAPT = Number(currentBalance) / 100000000
        throw new Error(`Insufficient APT balance. You have ${balanceInAPT.toFixed(6)} APT but tried to transfer ${amountFloat} APT.`)
      }
      
      // Create transaction payload in the format Petra wallet expects
      const transactionPayload = {
        type: "entry_function_payload",
        function: "0x1::aptos_account::transfer",
        type_arguments: [],
        arguments: [
          to,
          amountInOctas.toString()
        ]
      }
      
      console.log('Transaction payload:', JSON.stringify(transactionPayload, null, 2))
      
      // Sign and submit transaction using the appropriate interface
      let response: any
      
      if (window.aptos) {
        console.log('Using window.aptos for transaction signing')
        try {
          response = await window.aptos.signAndSubmitTransaction(transactionPayload)
        } catch (signError) {
          console.error('window.aptos signAndSubmitTransaction failed:', signError)
          throw signError
        }
      } else if (window.petra) {
        console.log('Using window.petra for transaction signing')
        try {
          response = await window.petra.signAndSubmitTransaction(transactionPayload)
        } catch (signError) {
          console.error('window.petra signAndSubmitTransaction failed:', signError)
          throw signError
        }
      } else if (window.ethereum && window.ethereum.isPetra) {
        console.log('Using ethereum.isPetra for transaction signing')
        // This might need different handling for Petra wallet through ethereum interface
        throw new Error('Transaction signing not yet supported for this interface')
      } else if (window.ethereum && window.ethereum.providers) {
        console.log('Using ethereum providers for transaction signing')
        const petraProvider = window.ethereum.providers.find(
          (provider: any) => provider.isPetra || provider.name?.toLowerCase().includes('petra')
        )
        if (petraProvider) {
          // This might need different handling for Petra wallet through ethereum interface
          throw new Error('Transaction signing not yet supported for this interface')
        }
      } else {
        throw new Error('No compatible wallet interface found')
      }
      
      console.log('Transaction response:', response)
      
      if (!response || !response.hash) {
        throw new Error('Transaction failed - no hash returned')
      }
      
      // Wait for transaction to be processed using Aptos SDK
      const aptos = getAptosClient()
      const pendingTransaction = await aptos.waitForTransaction({
        transactionHash: response.hash
      })
      
      console.log('Transaction confirmed:', pendingTransaction)
      
      return {
        hash: response.hash,
        blockNumber: pendingTransaction.block_height || 0,
        gasUsed: pendingTransaction.gas_used || 0,
        status: pendingTransaction.success ? 'success' : 'failed',
        timestamp: Date.now()
      }
    } catch (err) {
      console.error('Error sending transaction:', err)
      throw err
    }
  }, [walletState.isConnected, walletState.address, walletState.balance, getAptosClient])

  // Get account resources (for tokens)
  const getAccountResources = useCallback(async () => {
    if (!walletState.isConnected || !walletState.address) {
      return []
    }

    try {
      console.log('Getting account resources...')
      const aptos = getAptosClient()
      const resources = await aptos.getAccountResources({
        accountAddress: walletState.address
      })
      
      console.log('Account resources:', resources)
      return resources
    } catch (err) {
      console.error('Error getting account resources:', err)
      return []
    }
  }, [walletState.isConnected, walletState.address, getAptosClient])

  // Get token balance (for fungible tokens)
  const getTokenBalance = useCallback(async (tokenAddress: string) => {
    if (!walletState.isConnected || !walletState.address) {
      return '0'
    }

    try {
      console.log('Getting token balance for:', tokenAddress)
      const aptos = getAptosClient()
      
      // Get token balance using the new SDK approach
      const fungibleAssetBalances = await aptos.getFungibleAssetBalances({
        accountAddress: walletState.address
      })
      
      const tokenBalance = fungibleAssetBalances.find(
        balance => balance.asset_type === tokenAddress
      )
      
      console.log('Token balance:', tokenBalance?.amount || '0')
      return tokenBalance?.amount?.toString() || '0'
    } catch (err) {
      console.error('Error getting token balance:', err)
      return '0'
    }
  }, [walletState.isConnected, walletState.address, getAptosClient])

  // Fund account using faucet (testnet only)
  const fundAccountWithFaucet = useCallback(async (accountAddress?: string, amount: number = 10000000) => {
    const targetAddress = accountAddress || walletState.address
    
    if (!targetAddress) {
      throw new Error('No address provided for faucet funding')
    }

    if (walletState.network !== 'testnet') {
      throw new Error('Faucet only available on testnet')
    }

    try {
      console.log(`Funding account ${targetAddress} with ${amount} octas`)
      
      // Try multiple faucet endpoints
      const faucetEndpoints = [
        `https://aptos.dev/faucet/?address=${targetAddress}&amount=${amount}`,
        `https://testnet.aptoslabs.com/faucet?address=${targetAddress}&amount=${amount}`
      ]
      
      let lastError = null
      
      for (const endpoint of faucetEndpoints) {
        try {
          console.log(`Trying faucet endpoint: ${endpoint}`)
          
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })

          console.log(`Faucet response status: ${response.status}`)
          
          if (response.ok) {
            const result = await response.json()
            console.log('Faucet success:', result)
            
            // Refresh balance after successful funding
            await refreshBalance()
            
            return {
              success: true,
              data: result,
              message: `Successfully funded ${amount} Octas to ${targetAddress}`
            }
          } else {
            const errorText = await response.text()
            console.log(`Faucet failed with status ${response.status}:`, errorText)
            lastError = errorText
          }
        } catch (error) {
          console.log(`Faucet endpoint error:`, error.message)
          lastError = error.message
        }
      }
      
      // If all endpoints failed, try GET method as fallback
      try {
        console.log('Trying GET method as fallback...')
        const response = await fetch(`https://aptos.dev/faucet/?address=${targetAddress}&amount=${amount}`)
        
        if (response.ok) {
          const result = await response.text()
          console.log('GET faucet response:', result.substring(0, 200))
          
          // Refresh balance after successful funding
          await refreshBalance()
          
          return {
            success: true,
            data: result,
            message: `Faucet request sent to ${targetAddress}`
          }
        }
      } catch (error) {
        console.log('GET faucet failed:', error.message)
      }
      
      return {
        success: false,
        error: lastError || 'All faucet endpoints failed'
      }
      
    } catch (error) {
      console.error('Failed to fund account:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }, [walletState.address, walletState.network, refreshBalance])

  return {
    ...walletState,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    sendTransaction,
    getAccountResources,
    getTokenBalance,
    fundAccountWithFaucet,
    checkPetraWallet
  }
}