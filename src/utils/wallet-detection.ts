export const detectWallets = () => {
  if (typeof window === 'undefined') {
    return {
      isBrowser: false,
      wallets: []
    }
  }

  console.log('Detecting wallets...')
  console.log('window object keys:', Object.keys(window).filter(key => 
    key.toLowerCase().includes('petra') || 
    key.toLowerCase().includes('aptos') ||
    key.toLowerCase().includes('ethereum')
  ))

  const wallets = []
  
  // Check for Petra wallet interfaces
  if (window.aptos) {
    console.log('Found window.aptos:', window.aptos)
    wallets.push({
      name: 'Petra (window.aptos)',
      interface: 'aptos',
      available: true,
      methods: Object.keys(window.aptos)
    })
  }
  
  if (window.petra) {
    console.log('Found window.petra:', window.petra)
    wallets.push({
      name: 'Petra (window.petra)',
      interface: 'petra',
      available: true,
      methods: Object.keys(window.petra)
    })
  }
  
  // Check for Ethereum interface
  if (window.ethereum) {
    console.log('Found window.ethereum:', window.ethereum)
    const ethWallets = []
    
    // Check if ethereum is Petra
    if (window.ethereum.isPetra) {
      ethWallets.push({
        name: 'Petra (ethereum.isPetra)',
        interface: 'ethereum-petra',
        available: true,
        methods: Object.keys(window.ethereum)
      })
    }
    
    // Check providers array
    if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
      console.log('Ethereum providers:', window.ethereum.providers)
      window.ethereum.providers.forEach((provider, index) => {
        const providerName = provider.isPetra ? 'Petra' : 
                           provider.name || 
                           `Provider ${index}`
        ethWallets.push({
          name: `${providerName} (ethereum.providers[${index}])`,
          interface: 'ethereum-provider',
          available: true,
          methods: Object.keys(provider),
          isPetra: provider.isPetra,
          providerName: provider.name
        })
      })
    }
    
    if (ethWallets.length === 0) {
      ethWallets.push({
        name: 'Ethereum (window.ethereum)',
        interface: 'ethereum',
        available: true,
        methods: Object.keys(window.ethereum)
      })
    }
    
    wallets.push(...ethWallets)
  }
  
  console.log('Detected wallets:', wallets)
  
  return {
    isBrowser: true,
    wallets,
    windowProperties: Object.keys(window).filter(key => 
      key.toLowerCase().includes('petra') || 
      key.toLowerCase().includes('aptos') ||
      key.toLowerCase().includes('ethereum')
    )
  }
}

export const testWalletConnection = async (walletInterface: string) => {
  if (typeof window === 'undefined') {
    return { error: 'Not in browser environment' }
  }

  try {
    switch (walletInterface) {
      case 'aptos':
        if (window.aptos) {
          const result = await window.aptos.connect()
          return { success: true, result }
        }
        break
      
      case 'petra':
        if (window.petra) {
          const result = await window.petra.connect()
          return { success: true, result }
        }
        break
      
      case 'ethereum':
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
          return { success: true, result: { address: accounts[0] } }
        }
        break
      
      default:
        return { error: 'Unknown wallet interface' }
    }
    
    return { error: 'Wallet interface not available' }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Add a simple check function that can be called safely
export const hasPetraWallet = () => {
  if (typeof window === 'undefined') {
    console.log('hasPetraWallet: window is undefined')
    return false
  }
  
  console.log('hasPetraWallet: checking window objects...')
  console.log('window.aptos:', !!window.aptos)
  console.log('window.petra:', !!window.petra)
  console.log('window.ethereum:', !!window.ethereum)
  
  if (window.ethereum) {
    console.log('window.ethereum.isPetra:', !!window.ethereum.isPetra)
    console.log('window.ethereum.providers:', !!window.ethereum.providers)
    if (window.ethereum.providers) {
      const petraProvider = window.ethereum.providers.find((p: any) => 
        p.isPetra || p.name?.toLowerCase().includes('petra')
      )
      console.log('Found petra in providers:', !!petraProvider)
    }
  }
  
  const hasWallet = !!(window.aptos || window.petra || 
           (window.ethereum && window.ethereum.isPetra) ||
           (window.ethereum && window.ethereum.providers && 
            window.ethereum.providers.some((p: any) => p.isPetra || p.name?.toLowerCase().includes('petra'))))
  
  console.log('hasPetraWallet result:', hasWallet)
  return hasWallet
}