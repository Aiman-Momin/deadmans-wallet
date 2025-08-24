'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useWallet } from '@/hooks/useWallet'
import { Wallet, AlertCircle, RefreshCw, Copy, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface WalletConnectProps {
  className?: string
}

export function WalletConnect({ className }: WalletConnectProps) {
  const {
    address,
    isConnected,
    balance,
    chainId,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    checkMetaMask
  } = useWallet()

  const [isRefreshing, setIsRefreshing] = useState(false)

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatBalance = (bal: string) => {
    return `${parseFloat(bal).toFixed(4)} ETH`
  }

  const getChainName = (chainId: number) => {
    switch (chainId) {
      case 1:
        return 'Ethereum Mainnet'
      case 11155111:
        return 'Sepolia Testnet'
      case 5:
        return 'Goerli Testnet'
      case 137:
        return 'Polygon Mainnet'
      case 80001:
        return 'Mumbai Testnet'
      default:
        return `Chain ID: ${chainId}`
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

  const handleViewOnEtherscan = () => {
    if (address) {
      const url = `https://etherscan.io/address/${address}`
      window.open(url, '_blank')
    }
  }

  if (!checkMetaMask()) {
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
                MetaMask is not installed. Please install MetaMask to connect your wallet.
              </p>
              <Button asChild>
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Install MetaMask
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
                'Connect MetaMask'
              )}
            </Button>
            {error && (
              <div className="text-sm text-red-500 text-center">
                {error}
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
              onClick={handleViewOnEtherscan}
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
          <Badge variant="outline">
            {getChainName(chainId!)}
          </Badge>
        </div>

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