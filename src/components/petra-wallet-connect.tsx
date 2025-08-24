'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { usePetraWallet } from '@/hooks/usePetraWallet'
import { detectWallets, testWalletConnection, hasPetraWallet } from '@/utils/wallet-detection'
import { Wallet, AlertCircle, RefreshCw, Copy, ExternalLink, Settings, Droplets } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface PetraWalletConnectProps {
  className?: string
}

export function PetraWalletConnect({ className }: PetraWalletConnectProps) {
  const {
    address,
    isConnected,
    balance,
    network,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    checkPetraWallet,
    fundAccountWithFaucet
  } = usePetraWallet()

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isFunding, setIsFunding] = useState(false)
  const [faucetAddress, setFaucetAddress] = useState('')
  const [showFaucetInput, setShowFaucetInput] = useState(false)
  const [walletDetection, setWalletDetection] = useState<any>(null)
  const [showDetection, setShowDetection] = useState(false)

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatBalance = (bal: string) => {
    const balanceNum = parseFloat(bal) / 100000000 // Convert from octas to APT
    return `${balanceNum.toFixed(4)} APT`
  }

  const getNetworkName = (net: string | null) => {
    switch (net) {
      case 'mainnet':
        return 'Aptos Mainnet'
      case 'testnet':
        return 'Aptos Testnet'
      case 'devnet':
        return 'Aptos Devnet'
      default:
        return net || 'Unknown Network'
    }
  }

  const handleCopyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address)
        toast.success('Address copied to clipboard')
      } catch (err) {
        toast.error('Failed to copy address')
      }
    }
  }

  const handleRefreshBalance = async () => {
    setIsRefreshing(true)
    try {
      await refreshBalance()
      toast.success('Balance refreshed')
    } catch (err) {
      toast.error('Failed to refresh balance')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleViewOnExplorer = () => {
    if (address) {
      const url = `https://explorer.aptoslabs.com/account/${address}?network=testnet`
      window.open(url, '_blank')
    }
  }

  const handleFundWithFaucet = async (targetAddress?: string) => {
    setIsFunding(true)
    try {
      const result = await fundAccountWithFaucet(targetAddress)
      if (result.success) {
        toast.success(result.message || 'Faucet funding successful!')
        if (targetAddress) {
          setFaucetAddress('')
          setShowFaucetInput(false)
        }
      } else {
        toast.error(result.error || 'Faucet funding failed')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fund with faucet')
    } finally {
      setIsFunding(false)
    }
  }

  const [hasPetra, setHasPetra] = useState(false)
  const [isCheckingWallet, setIsCheckingWallet] = useState(true)

  // Check for Petra wallet only on client side
  useEffect(() => {
    const checkWallet = () => {
      console.log('PetraWalletConnect: Checking for Petra wallet...')
      setIsCheckingWallet(true)
      
      // Multiple attempts to detect wallet with increasing delays
      const attempts = [
        { delay: 0, name: 'immediate' },
        { delay: 500, name: '500ms' },
        { delay: 1000, name: '1s' },
        { delay: 2000, name: '2s' },
        { delay: 3000, name: '3s' }
      ]
      
      attempts.forEach(({ delay, name }) => {
        setTimeout(() => {
          console.log(`PetraWalletConnect: Checking wallet at ${name}...`)
          const walletDetected = hasPetraWallet()
          console.log(`PetraWalletConnect: Wallet detected at ${name}:`, walletDetected)
          
          if (walletDetected) {
            setHasPetra(true)
            setIsCheckingWallet(false)
            console.log('PetraWalletConnect: Wallet found, stopping further checks')
          } else if (delay === 3000) {
            // Last attempt
            setHasPetra(false)
            setIsCheckingWallet(false)
            console.log('PetraWalletConnect: No wallet found after all attempts')
          }
        }, delay)
      })
    }
    
    checkWallet()
    
    // Set up a listener for wallet injection events
    const handleWalletInjected = () => {
      console.log('PetraWalletConnect: Wallet injection event detected')
      const walletDetected = hasPetraWallet()
      if (walletDetected) {
        setHasPetra(true)
        setIsCheckingWallet(false)
      }
    }
    
    // Listen for custom events that might indicate wallet injection
    window.addEventListener('petra#initialized', handleWalletInjected)
    window.addEventListener('eip6963:providerInfo', handleWalletInjected)
    
    return () => {
      window.removeEventListener('petra#initialized', handleWalletInjected)
      window.removeEventListener('eip6963:providerInfo', handleWalletInjected)
    }
  }, [])

  // Debug info
  console.log('PetraWalletConnect render state:', {
    isConnected,
    address,
    balance,
    network,
    isConnecting,
    error,
    hasPetra,
    isCheckingWallet,
    windowAptos: typeof window !== 'undefined' ? !!window.aptos : 'window not defined',
    windowPetra: typeof window !== 'undefined' ? !!window.petra : 'window not defined',
    windowEthereum: typeof window !== 'undefined' ? !!window.ethereum : 'window not defined'
  })

  const handleTestConnection = async () => {
    console.log('Testing Petra connection...')
    try {
      const detection = detectWallets()
      console.log('Wallet detection result:', detection)
      setWalletDetection(detection)
      setShowDetection(true)
      
      console.log('window.aptos:', window.aptos)
      console.log('window.petra:', window.petra)
      console.log('window.ethereum:', window.ethereum)
      
      if (window.ethereum && window.ethereum.providers) {
        console.log('Ethereum providers:', window.ethereum.providers)
        const petraProvider = window.ethereum.providers.find(
          (provider: any) => provider.isPetra || provider.name?.toLowerCase().includes('petra')
        )
        console.log('Petra provider found:', petraProvider)
      }
    } catch (err) {
      console.error('Test connection failed:', err)
    }
  }

  // Show loading state while checking for wallet
  if (isCheckingWallet) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Connection
          </CardTitle>
          <CardDescription>
            Checking for wallet availability...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="h-12 w-12 text-primary animate-spin" />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Please wait while we check for your wallet...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!hasPetra) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Connection
          </CardTitle>
          <CardDescription>
            Connect your wallet to use Deadman's Wallet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <AlertCircle className="h-12 w-12 text-yellow-500" />
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Petra wallet is not installed. Please install Petra wallet to connect your wallet.
              </p>
              <Button asChild>
                <a
                  href="https://petra.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Install Petra Wallet
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isConnected) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Connection
          </CardTitle>
          <CardDescription>
            Connect your wallet to use Deadman's Wallet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <Wallet className="h-12 w-12 text-primary" />
            <Button 
              onClick={connectWallet} 
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect Petra Wallet'
              )}
            </Button>
            <Button 
              variant="outline"
              onClick={handleTestConnection}
              className="w-full"
            >
              Test Connection
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                console.log('Manual wallet detection...')
                const detected = hasPetraWallet()
                setHasPetra(detected)
                console.log('Manual detection result:', detected)
                toast.info(`Manual detection: ${detected ? 'Petra found' : 'Petra not found'}`)
              }}
              className="w-full"
            >
              Re-detect Wallet
            </Button>
            {error && (
              <div className="text-sm text-red-500 text-center">
                Error: {error}
              </div>
            )}
            
            {showDetection && walletDetection && (
              <div className="mt-4 p-3 bg-[#2a2a2a] rounded-lg text-xs">
                <div className="font-medium mb-2">Wallet Detection Results:</div>
                <div className="space-y-1">
                  <div>Is Browser: {walletDetection.isBrowser ? 'Yes' : 'No'}</div>
                  <div>Wallets Found: {walletDetection.wallets.length}</div>
                  {walletDetection.wallets.map((wallet: any, index: number) => (
                    <div key={index} className="ml-2">
                      <div className="font-medium">{wallet.name}</div>
                      <div className="text-muted-foreground">Interface: {wallet.interface}</div>
                      <div className="text-muted-foreground">Methods: {wallet.methods?.join(', ')}</div>
                    </div>
                  ))}
                  {walletDetection.windowProperties.length > 0 && (
                    <div>
                      <div className="font-medium">Window Properties:</div>
                      <div className="text-muted-foreground">{walletDetection.windowProperties.join(', ')}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
  
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Wallet Connected
        </CardTitle>
        <CardDescription>
          Your wallet is connected to Deadman's Wallet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-sm text-red-500 text-center">
            Error: {error}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Address:</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {formatAddress(address!)}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyAddress}
              className="h-8 w-8 p-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewOnExplorer}
              className="h-8 w-8 p-0"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Balance:</span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {formatBalance(balance)}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshBalance}
              disabled={isRefreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Network:</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {getNetworkName(network)}
            </Badge>
          </div>
        </div>

        {/* Faucet Section - Only show on testnet */}
        {network === 'testnet' && (
          <div className="space-y-3 pt-3 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                <Droplets className="h-4 w-4 text-blue-500" />
                Testnet Faucet:
              </span>
            </div>
            
            {!showFaucetInput ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFundWithFaucet()}
                  disabled={isFunding}
                  className="flex-1"
                >
                  {isFunding ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Funding...
                    </>
                  ) : (
                    <>
                      <Droplets className="mr-2 h-4 w-4" />
                      Fund My Account
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFaucetInput(true)}
                  className="flex-1"
                >
                  Fund Other Account
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="Enter address to fund (0x...)"
                  value={faucetAddress}
                  onChange={(e) => setFaucetAddress(e.target.value)}
                  className="text-xs"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFundWithFaucet(faucetAddress)}
                    disabled={isFunding || !faucetAddress}
                    className="flex-1"
                  >
                    {isFunding ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Funding...
                      </>
                    ) : (
                      <>
                        <Droplets className="mr-2 h-4 w-4" />
                        Send Funds
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowFaucetInput(false)
                      setFaucetAddress('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <Button 
          variant="outline" 
          onClick={disconnectWallet}
          className="w-full"
        >
          Disconnect Wallet
        </Button>
      </CardContent>
    </Card>
  )
}