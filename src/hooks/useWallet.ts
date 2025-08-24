'use client'

import { useState, useCallback } from 'react'
import { ethers } from 'ethers'

interface WalletState {
  address: string | null
  isConnected: boolean
  balance: string
  chainId: number | null
}

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    balance: '0',
    chainId: null
  })

  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if MetaMask is installed
  const checkMetaMask = useCallback(() => {
    if (typeof window !== 'undefined') {
      return typeof window.ethereum !== 'undefined' && window.ethereum !== null
    }
    return false
  }, [])

  // Connect to MetaMask
  const connectWallet = useCallback(async () => {
    console.log('Starting wallet connection...')
    
    if (!checkMetaMask()) {
      console.log('MetaMask not found')
      setError('MetaMask is not installed. Please install MetaMask to continue.')
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      console.log('Requesting accounts...')
      // Request account access first
      const accounts = await window.ethereum!.request({ method: 'eth_requestAccounts' })
      console.log('Accounts received:', accounts)
      
      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }

      console.log('Creating provider...')
      // Create provider
      const provider = new ethers.BrowserProvider(window.ethereum!)
      
      console.log('Getting network...')
      // Get network
      const network = await provider.getNetwork()
      console.log('Network:', network)
      
      console.log('Getting balance...')
      // Get balance
      const balance = await provider.getBalance(accounts[0])
      const formattedBalance = ethers.formatEther(balance)
      console.log('Balance:', formattedBalance)

      setWalletState({
        address: accounts[0],
        isConnected: true,
        balance: formattedBalance,
        chainId: Number(network.chainId)
      })

      console.log('Wallet connected successfully!')

    } catch (err: any) {
      console.error('Error connecting wallet:', err)
      setError(err.message || 'Failed to connect wallet')
    } finally {
      setIsConnecting(false)
    }
  }, [checkMetaMask])

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    console.log('Disconnecting wallet...')
    setWalletState({
      address: null,
      isConnected: false,
      balance: '0',
      chainId: null
    })
    setError(null)
  }, [])

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (walletState.isConnected && walletState.address) {
      try {
        console.log('Refreshing balance...')
        const provider = new ethers.BrowserProvider(window.ethereum!)
        const balance = await provider.getBalance(walletState.address)
        const formattedBalance = ethers.formatEther(balance)
        
        setWalletState(prev => ({
          ...prev,
          balance: formattedBalance
        }))
        console.log('Balance refreshed:', formattedBalance)
      } catch (err) {
        console.error('Error refreshing balance:', err)
      }
    }
  }, [walletState.isConnected, walletState.address])

  // Send transaction
  const sendTransaction = useCallback(async (to: string, amount: string) => {
    if (!walletState.isConnected || !walletState.address) {
      throw new Error('Wallet not connected')
    }

    try {
      console.log('Sending transaction...')
      const provider = new ethers.BrowserProvider(window.ethereum!)
      const signer = await provider.getSigner()
      
      const tx = await signer.sendTransaction({
        to,
        value: ethers.parseEther(amount),
        gasLimit: 21000
      })

      console.log('Transaction sent:', tx.hash)
      const receipt = await tx.wait()
      console.log('Transaction receipt:', receipt)
      
      return {
        hash: tx.hash,
        blockNumber: receipt?.blockNumber || 0,
        gasUsed: receipt?.gasUsed?.toString() ? Number(receipt.gasUsed) : 0,
        status: receipt?.status === 1 ? 'success' : 'failed',
        timestamp: Date.now()
      }
    } catch (err) {
      console.error('Error sending transaction:', err)
      throw err
    }
  }, [walletState.isConnected, walletState.address])

  // Get provider and signer
  const getProvider = useCallback(() => {
    if (!walletState.isConnected) {
      throw new Error('Wallet not connected')
    }
    return new ethers.BrowserProvider(window.ethereum!)
  }, [walletState.isConnected])

  const getSigner = useCallback(async () => {
    const provider = getProvider()
    return await provider.getSigner()
  }, [getProvider])

  // Switch network
  const switchNetwork = useCallback(async (chainId: number) => {
    if (!walletState.isConnected) {
      throw new Error('Wallet not connected')
    }

    try {
      console.log('Switching to network:', chainId)
      
      // Define network configurations
      const networks: { [key: number]: any } = {
        1: {
          chainId: '0x1',
          chainName: 'Ethereum Mainnet',
          nativeCurrency: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: ['https://mainnet.infura.io/v5/YOUR_PROJECT_ID'],
          blockExplorerUrls: ['https://etherscan.io']
        },
        11155111: {
          chainId: '0xaa36a7',
          chainName: 'Sepolia Testnet',
          nativeCurrency: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: ['https://sepolia.infura.io/v5/YOUR_PROJECT_ID'],
          blockExplorerUrls: ['https://sepolia.etherscan.io']
        }
      }

      const networkConfig = networks[chainId]
      if (!networkConfig) {
        throw new Error(`Network with chainId ${chainId} is not supported`)
      }

      // Try to switch to the network
      try {
        await window.ethereum!.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: networkConfig.chainId }],
        })
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          await window.ethereum!.request({
            method: 'wallet_addEthereumChain',
            params: [networkConfig],
          })
        } else {
          throw switchError
        }
      }

      // Update the wallet state with new network
      const provider = new ethers.BrowserProvider(window.ethereum!)
      const network = await provider.getNetwork()
      
      setWalletState(prev => ({
        ...prev,
        chainId: Number(network.chainId)
      }))

      console.log('Network switched successfully to:', chainId)
    } catch (err: any) {
      console.error('Error switching network:', err)
      throw err
    }
  }, [walletState.isConnected])

  return {
    ...walletState,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    sendTransaction,
    switchNetwork,
    checkMetaMask
  }
}