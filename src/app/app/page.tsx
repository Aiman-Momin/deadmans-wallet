'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PetraWalletConnect } from '@/components/petra-wallet-connect'
import Faucet from '@/components/Faucet'
import { usePetraWallet } from '@/hooks/usePetraWallet'
import { toast } from 'sonner'
import { 
  Wallet, 
  Lock, 
  Activity, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Activity as Heartbeat,
  ArrowUpRight,
  Copy,
  RefreshCw,
  Settings
} from 'lucide-react'

interface LockedAsset {
  id: string
  amount: string
  token: string
  heir: string
  inactivityLimit: number
  timestamp: Date
  status: 'locked' | 'unlocked'
  transactionHash?: string
  blockNumber?: number
}

interface ActionLog {
  time: string
  action: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
}

export default function AppPage() {
  const { 
    isConnected, 
    address, 
    balance, 
    network,
    error,
    connectWallet, 
    disconnectWallet,
    refreshBalance,
    sendTransaction,
    getTokenBalance
  } = usePetraWallet()
  
  const [provider, setProvider] = useState<any>(null)
  const [signer, setSigner] = useState<any>(null)
  
  const [lockedAssets, setLockedAssets] = useState<LockedAsset[]>([])
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([])
  const [formData, setFormData] = useState({
    amount: '',
    token: 'APT',
    heir: '',
    inactivityLimit: '5' // Changed from '7' days to '5' minutes
  })
  const [formErrors, setFormErrors] = useState({
    amount: '',
    heir: '',
    inactivityLimit: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSendingHeartbeat, setIsSendingHeartbeat] = useState(false)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [balances, setBalances] = useState({
    APT: '0',
    USDC: '0',
    TestCoin: '0'
  })

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Initialize
  useEffect(() => {
    addToActionLog('System', 'Deadman\'s Wallet initialized', 'info')
    
    // Debug log
    console.log('AppPage initial state:', {
      isConnected,
      address,
      network,
      error
    })
    
    // Online/offline detection
    const handleOnline = () => {
      setIsOnline(true)
      setGlobalError(null)
      addToActionLog('Connection', 'Back online', 'success')
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      setGlobalError('No internet connection. Please check your network.')
      addToActionLog('Connection', 'Offline - please check internet connection', 'error')
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Debug logging for wallet state changes
  useEffect(() => {
    console.log('Wallet state changed:', {
      isConnected,
      address,
      network,
      error
    })
  }, [isConnected, address, network, error])

  // Load data when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      initializeWallet()
    }
  }, [isConnected, address])

  const initializeWallet = async () => {
    if (!address) return
    
    try {
      await loadWalletData()
    } catch (error) {
      console.error('Failed to initialize wallet:', error)
      addToActionLog('Error', 'Failed to initialize wallet', 'error')
    }
  }

  const loadWalletData = async () => {
    if (!address) return
    
    setIsLoadingBalance(true)
    try {
      await updateBalances()
      addToActionLog('Wallet', `Connected: ${address.slice(0, 6)}...${address.slice(-4)}`, 'success')
    } catch (error) {
      console.error('Failed to load wallet data:', error)
      addToActionLog('Error', 'Failed to load wallet data', 'error')
    } finally {
      setIsLoadingBalance(false)
    }
  }

  const addToActionLog = (action: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry: ActionLog = {
      time: timestamp,
      action,
      message,
      type
    }
    
    setActionLogs(prev => [...prev.slice(-19), logEntry]) // Keep last 20 logs
  }

  const updateBalances = async () => {
    if (!address) return
    
    try {
      console.log('updateBalances called with:')
      console.log('address:', address)
      console.log('raw balance from hook:', balance)
      console.log('type of balance:', typeof balance)
      
      // Update APT balance from the main balance
      let aptBalance = 0
      if (balance && balance !== '0') {
        // Balance should be in octas, convert to APT
        const balanceNum = typeof balance === 'string' ? BigInt(balance) : balance
        aptBalance = Number(balanceNum) / 100000000
        console.log('Converted raw balance to APT:', aptBalance)
      }
      console.log('calculated aptBalance:', aptBalance)
      
      // Token addresses for Aptos testnet
      const USDC_ADDRESS = '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa' // Example USDC address
      const TESTCOIN_ADDRESS = '0x12345678901234567890123456789012345678901234567890' // Example TestCoin
      
      // Get USDC balance
      let usdcBalance = '0'
      try {
        if (getTokenBalance) {
          usdcBalance = await getTokenBalance(USDC_ADDRESS)
        }
      } catch (error) {
        console.log('USDC balance fetch failed, using 0')
      }
      
      // Get TestCoin balance
      let testcoinBalance = '0'
      try {
        if (getTokenBalance) {
          testcoinBalance = await getTokenBalance(TESTCOIN_ADDRESS)
        }
      } catch (error) {
        console.log('TestCoin balance fetch failed, using 0')
      }
      
      const newBalances = {
        APT: aptBalance.toString(),
        USDC: usdcBalance,
        TestCoin: testcoinBalance
      }
      
      console.log('setting balances to:', newBalances)
      console.log('APT balance as number:', aptBalance)
      console.log('Will show validation error if amount >', aptBalance)
      
      setBalances(newBalances)
      
      addToActionLog('Balance', `Updated: ${aptBalance.toFixed(6)} APT, ${usdcBalance} USDC, ${testcoinBalance} TEST`, 'success')
    } catch (error) {
      console.error('Failed to update balances:', error)
      addToActionLog('Error', 'Failed to update balances', 'error')
    }
  }

  const validateAmount = (amount: string) => {
    console.log('validateAmount called with:')
    console.log('  amount:', amount)
    console.log('  formData.token:', formData.token)
    console.log('  current balances:', balances)
    console.log('  balances.APT:', balances.APT, 'type:', typeof balances.APT)
    
    if (!amount || parseFloat(amount) <= 0) {
      console.log('  Invalid amount: must be > 0')
      return 'Please enter a valid amount'
    }
    
    const amountNum = parseFloat(amount)
    console.log('  amountNum:', amountNum)
    
    if (formData.token === 'APT') {
      const aptBalance = parseFloat(balances.APT)
      console.log('  APT balance check:')
      console.log('    amountNum:', amountNum)
      console.log('    aptBalance:', aptBalance)
      console.log('    amountNum > aptBalance:', amountNum > aptBalance)
      
      if (amountNum > aptBalance) {
        const errorMsg = `Insufficient APT balance. You have ${aptBalance.toFixed(6)} APT but tried to transfer ${amountNum} APT.`
        console.log('  Returning error:', errorMsg)
        return errorMsg
      }
      console.log('  APT balance validation passed')
    }
    
    if (formData.token === 'USDC' && parseFloat(amount) > parseFloat(balances.USDC)) {
      return 'Insufficient USDC balance'
    }
    if (formData.token === 'TestCoin' && parseFloat(amount) > parseFloat(balances.TestCoin)) {
      return 'Insufficient TestCoin balance'
    }
    
    console.log('  Amount validation passed')
    return ''
  }

  const validateHeir = (heir: string) => {
    if (!heir) {
      return 'Please enter an heir wallet address'
    }
    // Basic Aptos address validation (0x followed by hex string)
    if (!heir.startsWith('0x') || heir.length !== 66) {
      return 'Invalid Aptos wallet address format'
    }
    if (heir.toLowerCase() === address?.toLowerCase()) {
      return 'Heir address cannot be the same as your wallet address'
    }
    return ''
  }

  const validateInactivityLimit = (limit: string) => {
    if (!limit || parseInt(limit) < 1) {
      return 'Please enter a valid inactivity limit (minimum 1 minute)'
    }
    if (parseInt(limit) > 1440) { // Max 24 hours (1440 minutes)
      return 'Inactivity limit cannot exceed 24 hours (1440 minutes)'
    }
    return ''
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData({...formData, [field]: value})
    
    // Real-time validation
    let error = ''
    switch (field) {
      case 'amount':
        error = validateAmount(value)
        break
      case 'heir':
        error = validateHeir(value)
        break
      case 'inactivityLimit':
        error = validateInactivityLimit(value)
        break
    }
    
    setFormErrors({...formErrors, [field]: error})
  }

  const lockAssets = async () => {
    if (!isConnected) {
      addToActionLog('Error', 'Please connect your wallet first', 'error')
      return
    }

    // Validate all fields
    const amountError = validateAmount(formData.amount)
    const heirError = validateHeir(formData.heir)
    const limitError = validateInactivityLimit(formData.inactivityLimit)
    
    setFormErrors({
      amount: amountError,
      heir: heirError,
      inactivityLimit: limitError
    })
    
    if (amountError || heirError || limitError) {
      addToActionLog('Validation Error', 'Please fix the form errors before proceeding', 'error')
      return
    }

    setIsSubmitting(true)
    
    try {
      addToActionLog('Processing', `Locking ${formData.amount} ${formData.token}...`, 'info')
      
      // Convert amount to octas if APT
      const amountInOctas = formData.token === 'APT' 
        ? BigInt(parseFloat(formData.amount) * 100000000)
        : BigInt(parseFloat(formData.amount) * 1000000) // Assume 6 decimals for other tokens
      
      console.log('Sending transaction:')
      console.log('formData.amount:', formData.amount)
      console.log('formData.token:', formData.token)
      console.log('amountInOctas:', amountInOctas.toString())
      console.log('formData.heir:', formData.heir)
      
      // Send transaction with the original amount (let the hook handle conversion)
      const tx = await sendTransaction(formData.heir, formData.amount)
      
      console.log('Transaction response:', tx)
      
      addToActionLog('Transaction', `Hash: ${tx.hash.substring(0, 20)}...`, 'info')
      
      if (tx.status === 'success') {
        const lockedAsset: LockedAsset = {
          id: tx.hash,
          amount: formData.amount,
          token: formData.token,
          heir: formData.heir,
          inactivityLimit: parseInt(formData.inactivityLimit),
          timestamp: new Date(),
          status: 'locked',
          transactionHash: tx.hash,
          blockNumber: tx.blockNumber
        }
        
        setLockedAssets(prev => [...prev, lockedAsset])
        
        addToActionLog('Success', `Locked ${formData.amount} ${formData.token} for heir ${formData.heir.slice(0, 6)}...${formData.heir.slice(-4)}`, 'success')
        addToActionLog('Transaction', `Mined in block ${tx.blockNumber}`, 'success')
        
        // Reset form
        setFormData({
          amount: '',
          token: 'APT',
          heir: '',
          inactivityLimit: '5' // Reset to 5 minutes
        })
        setFormErrors({
          amount: '',
          heir: '',
          inactivityLimit: ''
        })
        
        // Update balance
        await updateBalances()
        
        toast.success(`Successfully locked ${formData.amount} ${formData.token}`)
      } else {
        throw new Error('Transaction failed')
      }
      
    } catch (error: any) {
      console.error('Failed to lock assets:', error)
      const errorMessage = error.message || 'Failed to lock assets'
      addToActionLog('Error', errorMessage, 'error')
      
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const sendHeartbeat = async () => {
    if (!isConnected || lockedAssets.length === 0) {
      addToActionLog('Error', 'No assets locked. Please lock assets first.', 'error')
      return
    }

    setIsSendingHeartbeat(true)
    
    try {
      addToActionLog('Processing', 'Sending heartbeat...', 'info')
      
      // Create a simple transaction as heartbeat (send 0 APT to self)
      const tx = await sendTransaction(address!, '0')
      
      addToActionLog('Transaction', `Heartbeat hash: ${tx.hash.substring(0, 20)}...`, 'info')
      
      if (tx.status === 'success') {
        addToActionLog('Success', `Heartbeat sent at ${new Date().toLocaleTimeString()}`, 'success')
        addToActionLog('Transaction', `Heartbeat mined in block ${tx.blockNumber}`, 'success')
        
        toast.success("Heartbeat transaction confirmed")
      } else {
        throw new Error('Heartbeat transaction failed')
      }
      
    } catch (error: any) {
      console.error('Failed to send heartbeat:', error)
      const errorMessage = error.message || 'Failed to send heartbeat'
      addToActionLog('Error', errorMessage, 'error')
      
      toast.error(errorMessage)
    } finally {
      setIsSendingHeartbeat(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Address copied to clipboard")
    } catch (error) {
      toast.error("Failed to copy to clipboard")
    }
  }

  const getActionIcon = (type?: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <Activity className="h-4 w-4 text-blue-500" />
    }
  }

  const getActionColor = (type?: string) => {
    switch (type) {
      case 'error':
        return 'text-red-500'
      case 'success':
        return 'text-green-500'
      case 'warning':
        return 'text-yellow-500'
      default:
        return 'text-blue-500'
    }
  }

  return (
    <div className="min-h-screen bg-[#121212] text-[#e0e0e0]">
      {/* Header */}
      <header className="bg-[#1e1e1e] p-4 fixed w-full top-0 z-50 shadow-lg">
        <nav className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-xl font-bold text-[#1f80e0]">Deadman's Wallet</div>
          <div className="flex items-center gap-4">
            {isConnected && (
              <Badge variant="outline" className="text-green-500 border-green-500">
                Connected
              </Badge>
            )}
            <Link href="/" className="text-[#b0b0b0] hover:text-[#1f80e0] transition-colors">
              Home
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="pt-20 px-4 pb-8 max-w-6xl mx-auto">
        {/* Global Error Alert */}
        {globalError && (
          <Alert className="mb-6 border-red-500 bg-red-900/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-300">
              {globalError}
            </AlertDescription>
          </Alert>
        )}

        {/* Wallet Error Alert */}
        {error && (
          <Alert className="mb-6 border-yellow-500 bg-yellow-900/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-yellow-300">
              Wallet Error: {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Network Status */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-muted-foreground">
            {isOnline ? 'Online' : 'Offline'}
          </span>
          {network && (
            <Badge variant="outline" className="ml-2">
              {network === 'mainnet' ? 'Aptos Mainnet' : 
               network === 'testnet' ? 'Aptos Testnet' : 
               network === 'devnet' ? 'Aptos Devnet' : 
               `Network: ${network}`}
            </Badge>
          )}
          <Badge variant={isConnected ? "default" : "secondary"} className="ml-2">
            {isConnected ? 'Wallet Connected' : 'Wallet Disconnected'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Wallet Connection and Asset Locking */}
          <div className="lg:col-span-2 space-y-6">
            {/* Wallet Connection */}
            <PetraWalletConnect />

            {/* Token Balances */}
            {!isConnected ? (
              <Card className="bg-[#1e1e1e] border-[#2a2a2a]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-[#1f80e0]" />
                    Token Balances
                  </CardTitle>
                  <CardDescription>
                    Your current token balances
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-4 py-8">
                    <Wallet className="h-12 w-12 text-[#1f80e0]" />
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        Connect your wallet to view your token balances.
                      </p>
                      <Button onClick={connectWallet} className="w-full">
                        Connect Wallet to View Balances
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-[#1e1e1e] border-[#2a2a2a]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-[#1f80e0]" />
                    Token Balances
                  </CardTitle>
                  <CardDescription>
                    Your current token balances
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">A</span>
                        </div>
                        <div>
                          <div className="font-medium">Aptos (APT)</div>
                          <div className="text-sm text-muted-foreground">
                            Native token
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{parseFloat(balances.APT).toFixed(6)} APT</div>
                        <div className="text-sm text-muted-foreground">
                          ≈ ${(parseFloat(balances.APT) * 7.5).toFixed(2)}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={updateBalances}
                          disabled={isLoadingBalance}
                          className="mt-1 h-6 text-xs"
                        >
                          <RefreshCw className={`h-3 w-3 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                          Refresh
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">USDC</span>
                        </div>
                        <div>
                          <div className="font-medium">USD Coin (USDC)</div>
                          <div className="text-sm text-muted-foreground">
                            Stablecoin
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{parseFloat(balances.USDC).toFixed(2)} USDC</div>
                        <div className="text-sm text-muted-foreground">
                          ≈ ${parseFloat(balances.USDC).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">TEST</span>
                        </div>
                        <div>
                          <div className="font-medium">Test Token (TEST)</div>
                          <div className="text-sm text-muted-foreground">
                            Demo token
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{parseFloat(balances.TestCoin).toFixed(2)} TEST</div>
                        <div className="text-sm text-muted-foreground">
                          ≈ ${(parseFloat(balances.TestCoin) * 0.01).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Asset Locking */}
            {!isConnected ? (
              <Card className="bg-[#1e1e1e] border-[#2a2a2a]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-[#1f80e0]" />
                    Lock Assets
                  </CardTitle>
                  <CardDescription>
                    Lock your crypto assets that will be transferred to your heir if you become inactive
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-4 py-8">
                    <Lock className="h-12 w-12 text-[#1f80e0]" />
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        Connect your wallet to access the asset locking functionality and set up your heir.
                      </p>
                      <Button onClick={connectWallet} className="w-full">
                        Connect Wallet to Continue
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-[#1e1e1e] border-[#2a2a2a]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-[#1f80e0]" />
                    Lock Assets
                  </CardTitle>
                  <CardDescription>
                    Lock your crypto assets that will be transferred to your heir if you become inactive (demo: works in minutes!)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.000001"
                        placeholder="0.000000"
                        value={formData.amount}
                        onChange={(e) => handleInputChange('amount', e.target.value)}
                        className={formErrors.amount ? 'border-red-500' : ''}
                      />
                      {formErrors.amount && (
                        <p className="text-red-500 text-sm">{formErrors.amount}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="token">Token</Label>
                      <Select value={formData.token} onValueChange={(value) => handleInputChange('token', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="APT">APT</SelectItem>
                          <SelectItem value="USDC">USDC</SelectItem>
                          <SelectItem value="TestCoin">TestCoin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="heir">Heir Wallet Address</Label>
                    <Input
                      id="heir"
                      placeholder="0x..."
                      value={formData.heir}
                      onChange={(e) => handleInputChange('heir', e.target.value)}
                      className={formErrors.heir ? 'border-red-500' : ''}
                    />
                    {formErrors.heir && (
                      <p className="text-red-500 text-sm">{formErrors.heir}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="inactivityLimit">Inactivity Limit (minutes)</Label>
                    <Input
                      id="inactivityLimit"
                      type="number"
                      min="1"
                      max="1440"
                      value={formData.inactivityLimit}
                      onChange={(e) => handleInputChange('inactivityLimit', e.target.value)}
                      className={formErrors.inactivityLimit ? 'border-red-500' : ''}
                    />
                    <p className="text-xs text-muted-foreground">
                      Assets will be released after this many minutes of inactivity
                    </p>
                    {formErrors.inactivityLimit && (
                      <p className="text-red-500 text-sm">{formErrors.inactivityLimit}</p>
                    )}
                  </div>
                  
                  {/* Quick Demo Options */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-[#1f80e0]">Quick Demo Options:</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleInputChange('inactivityLimit', '1')}
                        className="text-xs"
                      >
                        1 min
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleInputChange('inactivityLimit', '5')}
                        className="text-xs"
                      >
                        5 min
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleInputChange('inactivityLimit', '10')}
                        className="text-xs"
                      >
                        10 min
                      </Button>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={lockAssets} 
                    disabled={isSubmitting}
                    className="w-full bg-[#1f80e0] hover:bg-[#1765b3]"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Locking Assets...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Lock Assets
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Locked Assets */}
            {isConnected && lockedAssets.length > 0 && (
              <Card className="bg-[#1e1e1e] border-[#2a2a2a]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-[#1f80e0]" />
                    Locked Assets
                  </CardTitle>
                  <CardDescription>
                    Your currently locked assets and their status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {lockedAssets.map((asset) => (
                      <div key={asset.id} className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#1f80e0] rounded-full flex items-center justify-center">
                            <Lock className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium">{asset.amount} {asset.token}</div>
                            <div className="text-sm text-muted-foreground">
                              Heir: {formatAddress(asset.heir)}
                            </div>
                            {asset.transactionHash && (
                              <div className="text-xs text-blue-400 mt-1">
                                <a 
                                  href={`https://explorer.aptoslabs.com/txn/${asset.transactionHash}?network=testnet`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline"
                                >
                                  View on Etherscan
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={asset.status === 'locked' ? 'default' : 'secondary'}>
                            {asset.status}
                          </Badge>
                          <div className="text-sm text-muted-foreground mt-1">
                            {asset.inactivityLimit} min
                          </div>
                          {asset.blockNumber && (
                            <div className="text-xs text-muted-foreground">
                              Block: {asset.blockNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transaction History */}
            {isConnected && (
              <Card className="bg-[#1e1e1e] border-[#2a2a2a]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowUpRight className="h-5 w-5 text-[#1f80e0]" />
                    Recent Transactions
                  </CardTitle>
                  <CardDescription>
                    Your recent blockchain transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {lockedAssets.length > 0 ? (
                      lockedAssets.map((asset) => (
                        <div key={`tx-${asset.id}`} className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                              <ArrowUpRight className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-medium">Asset Locked</div>
                              <div className="text-sm text-muted-foreground">
                                {asset.amount} {asset.token} → {formatAddress(asset.heir)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">
                              {asset.timestamp.toLocaleDateString()}
                            </div>
                            {asset.transactionHash && (
                              <a 
                                href={`https://explorer.aptoslabs.com/txn/${asset.transactionHash}?network=testnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-400 hover:underline"
                              >
                                View
                              </a>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        No transactions yet
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Heartbeat and Action Log */}
          <div className="space-y-6">
            {/* Heartbeat Control */}
            {!isConnected ? (
              <Card className="bg-[#1e1e1e] border-[#2a2a2a]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heartbeat className="h-5 w-5 text-red-500" />
                    Heartbeat Control
                  </CardTitle>
                  <CardDescription>
                    Send regular heartbeats to prove you're active
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-4 py-8">
                    <Heartbeat className="h-12 w-12 text-red-500" />
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        Connect your wallet to access heartbeat controls and prove you're active.
                      </p>
                      <Button onClick={connectWallet} className="w-full">
                        Connect Wallet to Send Heartbeats
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-[#1e1e1e] border-[#2a2a2a]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heartbeat className="h-5 w-5 text-red-500" />
                    Heartbeat Control
                  </CardTitle>
                  <CardDescription>
                    Send regular heartbeats to prove you're active (demo: send every few minutes!)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500 mb-2">
                      {lockedAssets.length > 0 ? 'Active' : 'No Assets Locked'}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {lockedAssets.length} locked asset{lockedAssets.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  
                  <Button 
                    onClick={sendHeartbeat} 
                    disabled={isSendingHeartbeat || lockedAssets.length === 0}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    {isSendingHeartbeat ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Heartbeat className="h-4 w-4 mr-2" />
                        Send Heartbeat
                      </>
                    )}
                  </Button>
                  
                  {lockedAssets.length > 0 && (
                    <div className="text-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Send heartbeat regularly to prevent asset transfer
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Faucet */}
            <Faucet />

            {/* Action Log */}
            <Card className="bg-[#1e1e1e] border-[#2a2a2a]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#1f80e0]" />
                  Action Log
                </CardTitle>
                <CardDescription>
                  Recent activities and system events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {actionLogs.map((log, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 rounded hover:bg-[#2a2a2a]">
                      {getActionIcon(log.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${getActionColor(log.type)}`}>
                            {log.action}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {log.time}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {log.message}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {actionLogs.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      No actions yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}