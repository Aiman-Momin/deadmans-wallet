import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ethers, formatEther } from 'ethers'

interface Web3State {
  isConnected: boolean
  address: string | null
  balances: {
    ETH: string
    USDC: string
    FastCoin: string
  }
  chainId: number | null
  provider: any | null
  signer: any | null
  error: string | null
  isConnecting: boolean
  
  // Actions
  connect: () => Promise<void>
  disconnect: () => void
  updateBalances: () => Promise<void>
  setError: (error: string | null) => void
  setConnecting: (isConnecting: boolean) => void
}

// Helper function to get token balance
const getTokenBalance = async (tokenAddress: string, userAddress: string, provider: any): Promise<string> => {
  try {
    // ERC-20 balanceOf function signature
    const balanceOfSignature = '0x70a08231'
    const data = balanceOfSignature + '000000000000000000000000' + userAddress.slice(2).padStart(64, '0')
    
    const result = await provider.call({
      to: tokenAddress,
      data: data
    })
    
    // For USDC (6 decimals)
    if (tokenAddress === '0xA0b86a33E6417aAb7b6DbCBbe9FD4E89c0778a4B') {
      return (parseInt(result, 16) / 1e6).toString()
    }
    
    // For other tokens (18 decimals)
    return formatEther(result)
  } catch (error) {
    console.log('Token balance fetch failed:', error)
    return '0'
  }
}

export const useWeb3Store = create<Web3State>()(
  persist(
    (set, get) => ({
      isConnected: false,
      address: null,
      balances: {
        ETH: '0',
        USDC: '0',
        FastCoin: '0'
      },
      chainId: null,
      provider: null,
      signer: null,
      error: null,
      isConnecting: false,

      connect: async () => {
        try {
          set({ isConnecting: true, error: null })

          // Check if MetaMask is installed
          if (typeof window.ethereum === 'undefined') {
            throw new Error('MetaMask is not installed. Please install MetaMask to continue.')
          }

          // Request account access
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
          
          if (!accounts || accounts.length === 0) {
            throw new Error('No accounts found. Please connect your wallet.')
          }

          // Create provider and signer
          const provider = new ethers.BrowserProvider(window.ethereum)
          const signer = await provider.getSigner()
          const network = await provider.getNetwork()
          
          set({
            isConnected: true,
            address: accounts[0],
            balances: {
              ETH: '0',
              USDC: '0',
              FastCoin: '0'
            },
            chainId: network.chainId,
            provider,
            signer,
            error: null,
            isConnecting: false,
          })

          // Listen for account changes
          window.ethereum.on('accountsChanged', (accounts: string[]) => {
            if (accounts.length === 0) {
              get().disconnect()
            } else {
              set({ address: accounts[0] })
              get().updateBalances()
            }
          })

          // Listen for chain changes
          window.ethereum.on('chainChanged', (chainId: string) => {
            set({ chainId: parseInt(chainId, 16) })
            get().updateBalances()
          })

          // Update balances after connection
          get().updateBalances()

        } catch (error: any) {
          set({
            isConnected: false,
            error: error.message || 'Failed to connect wallet',
            isConnecting: false,
          })
        }
      },

      disconnect: () => {
        // Remove event listeners
        if (window.ethereum) {
          window.ethereum.removeAllListeners('accountsChanged')
          window.ethereum.removeAllListeners('chainChanged')
        }

        set({
          isConnected: false,
          address: null,
          balances: {
            ETH: '0',
            USDC: '0',
            FastCoin: '0'
          },
          chainId: null,
          provider: null,
          signer: null,
          error: null,
          isConnecting: false,
        })
      },

      updateBalances: async () => {
        const { provider, address } = get()
        if (!provider || !address) return

        try {
          // Get ETH balance
          const ethBalance = await provider.getBalance(address)
          const formattedEthBalance = formatEther(ethBalance)

          // Get USDC balance (if on mainnet)
          let usdcBalance = '0'
          let fastCoinBalance = '0'

          try {
            usdcBalance = await getTokenBalance('0xA0b86a33E6417aAb7b6DbCBbe9FD4E89c0778a4B', address, provider)
          } catch (error) {
            console.log('USDC balance fetch failed:', error)
          }

          try {
            fastCoinBalance = await getTokenBalance('0x1234567890123456789012345678901234567890', address, provider)
          } catch (error) {
            console.log('FastCoin balance fetch failed:', error)
          }

          set({
            balances: {
              ETH: formattedEthBalance,
              USDC: usdcBalance,
              FastCoin: fastCoinBalance
            }
          })
        } catch (error) {
          console.error('Failed to update balances:', error)
        }
      },

      setError: (error: string | null) => {
        set({ error })
      },

      setConnecting: (isConnecting: boolean) => {
        set({ isConnecting })
      },
    }),
    {
      name: 'web3-storage',
      partialize: (state) => ({
        isConnected: state.isConnected,
        address: state.address,
        chainId: state.chainId,
      }),
    }
  )
)