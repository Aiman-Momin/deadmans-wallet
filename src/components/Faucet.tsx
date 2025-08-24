'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePetraWallet } from '@/hooks/usePetraWallet'
import { toast } from 'sonner'
import { 
  Droplets, 
  AlertCircle, 
  CheckCircle, 
  Copy,
  RefreshCw,
  Send,
  ExternalLink
} from 'lucide-react'

interface FaucetResponse {
  success: boolean
  message?: string
  transactionHash?: string
  amount?: string
  recipient?: string
  error?: string
}

export default function Faucet() {
  const { isConnected, address, balance, refreshBalance } = usePetraWallet()
  const [recipientAddress, setRecipientAddress] = useState('')
  const [amount, setAmount] = useState('1')
  const [isLoading, setIsLoading] = useState(false)
  const [faucetResponse, setFaucetResponse] = useState<FaucetResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Address copied to clipboard")
    } catch (error) {
      toast.error("Failed to copy to clipboard")
    }
  }

  const validateAddress = (address: string) => {
    if (!address) {
      return 'Address is required'
    }
    if (!address.startsWith('0x') || address.length !== 66) {
      return 'Invalid Aptos address format'
    }
    return ''
  }

  const validateAmount = (amount: string) => {
    if (!amount) {
      return 'Amount is required'
    }
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      return 'Amount must be greater than 0'
    }
    if (amountNum > 10) {
      return 'Amount cannot exceed 10 APT'
    }
    return ''
  }

  const requestFaucet = async () => {
    const addressError = validateAddress(recipientAddress)
    const amountError = validateAmount(amount)
    
    if (addressError) {
      setError(addressError)
      return
    }
    
    if (amountError) {
      setError(amountError)
      return
    }

    setIsLoading(true)
    setError(null)
    setFaucetResponse(null)

    try {
      const response = await fetch('/api/faucet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: recipientAddress,
          amount: parseFloat(amount)
        })
      })

      const data: FaucetResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request faucet')
      }

      if (data.success === false) {
        setError(data.error || 'Faucet request failed')
        setFaucetResponse(null)
        return
      }

      setFaucetResponse(data)
      toast.success(`Successfully requested ${amount} APT from faucet!`)
      
      // Refresh balance after successful faucet request
      setTimeout(() => {
        if (refreshBalance) {
          refreshBalance()
        }
      }, 6000) // Wait 6 seconds for transaction to process
      
    } catch (error: any) {
      console.error('Faucet request failed:', error)
      setError(error.message || 'Failed to request faucet')
      toast.error('Faucet request failed')
    } finally {
      setIsLoading(false)
    }
  }

  const useMyAddress = () => {
    if (address) {
      setRecipientAddress(address)
    }
  }

  const goToOfficialFaucet = () => {
    window.open('https://aptos.dev/testnet-faucet/', '_blank')
  }

  return (
    <Card className="bg-[#1e1e1e] border-[#2a2a2a]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#1f80e0]">
          <Droplets className="h-5 w-5" />
          Aptos Testnet Faucet
        </CardTitle>
        <CardDescription className="text-[#b0b0b0]">
          Get real test APT tokens for development and testing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connected Wallet Info */}
        {isConnected && address && (
          <div className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-lg">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-500 border-green-500">
                Connected
              </Badge>
              <span className="text-sm text-[#b0b0b0]">
                {formatAddress(address)}
              </span>
              <span className="text-sm text-[#1f80e0]">
                ({parseFloat(balance || '0').toFixed(6)} APT)
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(address)}
              className="text-[#1f80e0] hover:text-[#1765b3]"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-500 bg-red-900/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-300">
              {error}
              {error.includes('Unable to connect') && (
                <div className="mt-3 space-y-2">
                  <p className="font-semibold">Try the official faucet instead:</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToOfficialFaucet}
                    className="text-blue-400 border-blue-400 hover:bg-blue-900/20"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Official Faucet
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Success Response */}
        {faucetResponse && faucetResponse.success && (
          <Alert className="border-green-500 bg-green-900/20">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-300">
              {faucetResponse.message}
              {faucetResponse.transactionHash && (
                <div className="mt-2 text-sm">
                  Transaction: {faucetResponse.transactionHash.slice(0, 20)}...
                </div>
              )}
              <div className="mt-2 text-sm text-yellow-300">
                💡 Balance will update in a few seconds. Click "Refresh Wallet Balance" if it doesn't update automatically.
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Faucet Form */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="recipient" className="text-[#e0e0e0]">
              Recipient Address
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="recipient"
                type="text"
                placeholder="0x..."
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="bg-[#2a2a2a] border-[#3a3a3a] text-[#e0e0e0] placeholder:text-[#808080]"
              />
              {isConnected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={useMyAddress}
                  className="text-[#1f80e0] border-[#1f80e0] hover:bg-[#1f80e0] hover:text-white"
                >
                  Use My Address
                </Button>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="amount" className="text-[#e0e0e0]">
              Amount (APT)
            </Label>
            <Select value={amount} onValueChange={setAmount}>
              <SelectTrigger className="bg-[#2a2a2a] border-[#3a3a3a] text-[#e0e0e0] mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2a2a2a] border-[#3a3a3a]">
                <SelectItem value="0.1">0.1 APT</SelectItem>
                <SelectItem value="0.5">0.5 APT</SelectItem>
                <SelectItem value="1">1 APT</SelectItem>
                <SelectItem value="2">2 APT</SelectItem>
                <SelectItem value="5">5 APT</SelectItem>
                <SelectItem value="10">10 APT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={requestFaucet}
            disabled={isLoading || !recipientAddress}
            className="w-full bg-[#1f80e0] hover:bg-[#1765b3] text-white"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Requesting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Request APT
              </>
            )}
          </Button>
        </div>

        {/* Manual Faucet Option */}
        <div className="pt-4 border-t border-[#2a2a2a]">
          <p className="text-sm text-[#808080] mb-2">
            If the automatic faucet doesn't work, use the official Aptos testnet faucet:
          </p>
          <Button
            variant="outline"
            onClick={goToOfficialFaucet}
            className="w-full text-[#1f80e0] border-[#1f80e0] hover:bg-[#1f80e0] hover:text-white"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Official Testnet Faucet
          </Button>
        </div>

        {/* Info */}
        <div className="text-sm text-[#808080] space-y-2">
          <p>• Maximum 10 APT per request</p>
          <p>• Real testnet tokens will be sent to your wallet</p>
          <p>• Transactions may take 10-30 seconds to process</p>
          <p>• Connect your wallet to auto-fill your address</p>
        </div>
        
        {/* Balance Refresh */}
        {isConnected && (
          <div className="pt-2 border-t border-[#2a2a2a]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshBalance && refreshBalance()}
              className="w-full text-[#1f80e0] border-[#1f80e0] hover:bg-[#1f80e0] hover:text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Wallet Balance
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}