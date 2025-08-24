import { ethers, formatEther, parseEther, formatUnits, Contract } from 'ethers'

// ERC-20 Token ABI (minimal for balance and transfer)
export const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
]

// Deadman's Wallet Contract ABI (example)
export const DEADMAN_WALLET_ABI = [
  'function lockAssets(address token, uint256 amount, uint256 duration) returns (bool)',
  'function unlockAssets(bytes32 lockId) returns (bool)',
  'function getLockInfo(bytes32 lockId) view returns (address token, uint256 amount, uint256 duration, uint256 startTime, bool unlocked)',
  'function getUserLocks(address user) view returns (bytes32[])',
  'event AssetsLocked(bytes32 indexed lockId, address indexed user, address token, uint256 amount, uint256 duration)',
  'event AssetsUnlocked(bytes32 indexed lockId, address indexed user)',
]

// Token contract addresses (example - replace with actual addresses)
export const TOKEN_ADDRESSES = {
  FASTCOIN: '0x1234567890123456789012345678901234567890', // Replace with actual FastCoin address
  USDC: '0xA0b86a33E6417aAb7b6DbCBbe9FD4E89c0778a4B', // Mainnet USDC
  ETH: '0x0000000000000000000000000000000000000000', // Native ETH
}

// Network configurations
export const NETWORKS = {
  1: {
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    blockExplorer: 'https://etherscan.io',
  },
  11155111: {
    name: 'Sepolia Testnet',
    symbol: 'ETH',
    blockExplorer: 'https://sepolia.etherscan.io',
  },
  // Add more networks as needed
}

// Utility functions
export const formatAddress = (address: string, length = 6): string => {
  if (!address) return ''
  return `${address.slice(0, length)}...${address.slice(-length)}`
}

export const formatBalance = (balance: string, decimals = 18): string => {
  try {
    const balanceBN = parseEther(balance)
    return formatEther(balanceBN)
  } catch (error) {
    console.error('Error formatting balance:', error)
    return '0'
  }
}

export const getTokenBalance = async (
  tokenAddress: string,
  userAddress: string,
  provider: any
): Promise<string> => {
  try {
    if (tokenAddress === TOKEN_ADDRESSES.ETH) {
      const balance = await provider.getBalance(userAddress)
      return formatEther(balance)
    }

    const contract = new Contract(tokenAddress, ERC20_ABI, provider)
    const balance = await contract.balanceOf(userAddress)
    const decimals = await contract.decimals()
    return formatUnits(balance, decimals)
  } catch (error) {
    console.error('Error getting token balance:', error)
    return '0'
  }
}

export const estimateGasFee = async (
  transaction: any,
  provider: any
): Promise<{ gasLimit: string; gasPrice: string; totalFee: string }> => {
  try {
    const gasLimit = await provider.estimateGas(transaction)
    const gasPrice = await provider.getGasPrice()
    const totalFee = gasLimit * gasPrice
    
    return {
      gasLimit: gasLimit.toString(),
      gasPrice: formatUnits(gasPrice, 'gwei'),
      totalFee: formatEther(totalFee),
    }
  } catch (error) {
    console.error('Error estimating gas fee:', error)
    throw error
  }
}

export const waitForTransaction = async (
  txHash: string,
  provider: any
): Promise<any> => {
  try {
    return await provider.waitForTransaction(txHash, 1) // 1 confirmation
  } catch (error) {
    console.error('Error waiting for transaction:', error)
    throw error
  }
}

export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask
}

export const addTokenToMetaMask = async (
  tokenAddress: string,
  tokenSymbol: string,
  tokenDecimals: number,
  tokenImage?: string
): Promise<void> => {
  try {
    if (!isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed')
    }

    await window.ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: tokenAddress,
          symbol: tokenSymbol,
          decimals: tokenDecimals,
          image: tokenImage,
        },
      },
    })
  } catch (error) {
    console.error('Error adding token to MetaMask:', error)
    throw error
  }
}

// Transaction helpers
export const createLockTransaction = async (
  tokenAddress: string,
  amount: string,
  duration: number, // in seconds
  walletAddress: string,
  signer: any
): Promise<any> => {
  try {
    // This is a placeholder - replace with actual contract address
    const contractAddress = '0xDeadManWalletContractAddress'
    const contract = new Contract(contractAddress, DEADMAN_WALLET_ABI, signer)
    
    const amountBN = parseEther(amount)
    
    return await contract.lockAssets(tokenAddress, amountBN, duration)
  } catch (error) {
    console.error('Error creating lock transaction:', error)
    throw error
  }
}

export const createUnlockTransaction = async (
  lockId: string,
  signer: any
): Promise<any> => {
  try {
    // This is a placeholder - replace with actual contract address
    const contractAddress = '0xDeadManWalletContractAddress'
    const contract = new Contract(contractAddress, DEADMAN_WALLET_ABI, signer)
    
    const lockIdBytes32 = ethers.encodeBytes32String(lockId)
    
    return await contract.unlockAssets(lockIdBytes32)
  } catch (error) {
    console.error('Error creating unlock transaction:', error)
    throw error
  }
}