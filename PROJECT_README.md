# Deadman's Wallet - Full Stack Implementation

A comprehensive implementation of Deadman's Wallet using Next.js frontend and Move smart contracts on Aptos blockchain.

## 🎯 Project Overview

Deadman's Wallet is a decentralized application that allows users to lock crypto assets with predefined conditions. If the user becomes inactive for a specified period, the assets are automatically transferred to a designated heir.

### Key Features
- **Asset Locking**: Securely lock crypto assets with custom conditions
- **Heir Designation**: Assign heirs who receive assets upon inactivity
- **Heartbeat System**: Regular activity checks to prove user presence
- **Automatic Transfer**: Seamless asset transfer when inactivity limit is reached
- **No Third Parties**: Fully decentralized execution
- **Aptos Integration**: Built on Aptos blockchain using Move smart contracts

## 🏗️ Architecture

### Frontend (Next.js)
- **Landing Page**: Professional showcase with feature highlights
- **dApp Interface**: Full-featured wallet management interface
- **Real-time Updates**: Live heartbeat and inactivity monitoring
- **Responsive Design**: Works seamlessly on desktop and mobile

### Backend (Move Smart Contracts)
- **Asset Management**: Secure locking and transfer of assets
- **Time Tracking**: Precise inactivity monitoring
- **Access Control**: Secure authorization mechanisms
- **Event System**: Off-chain monitoring capabilities

### Integration Layer
- **TypeScript SDK**: Seamless frontend-blockchain communication
- **Error Handling**: Comprehensive error management
- **Transaction Monitoring**: Real-time transaction status updates

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Aptos CLI (for blockchain deployment)
- Modern web browser

### Frontend Setup

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd deadman-wallet
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Access the application**
   - Landing Page: `http://localhost:3000`
   - dApp Interface: `http://localhost:3000/app`

### Blockchain Setup

1. **Install Aptos CLI**
   ```bash
   curl -fsSL https://aptos.dev/scripts/install.sh | bash
   ```

2. **Initialize Aptos CLI**
   ```bash
   aptos init
   ```

3. **Fund testnet account**
   Visit [Aptos Faucet](https://aptos.dev/faucet/) to fund your account

4. **Deploy smart contract**
   ```bash
   cd move
   aptos move compile --named-addresses deadman_wallet=YOUR_ACCOUNT_ADDRESS
   aptos move publish --named-addresses deadman_wallet=YOUR_ACCOUNT_ADDRESS
   ```

## 📱 Application Usage

### 1. Landing Page
- **Hero Section**: Product introduction with call-to-action
- **Features**: Detailed explanation of core functionality
- **Navigation**: Easy access to dApp interface

### 2. Wallet Connection
- **Multiple Options**: Connect Petra, MetaMask, or Custom Wallet
- **Custom Address**: Input your own wallet address
- **Validation**: Proper address format validation
- **Status Display**: Real-time connection status

### 3. Asset Locking
- **Amount Input**: Specify asset amount to lock
- **Token Selection**: Choose from supported tokens (ETH, USDC)
- **Heir Assignment**: Set beneficiary wallet address
- **Inactivity Limit**: Define time period before transfer
- **Form Validation**: Comprehensive input validation

### 4. Heartbeat System
- **Send Heartbeat**: Prove user activity
- **Timestamp Tracking**: Real-time activity monitoring
- **Status Updates**: Live heartbeat status display

### 5. Inactivity Simulation
- **Test Functionality**: Simulate user inactivity
- **Automatic Transfer**: Test asset transfer mechanism
- **Visual Feedback**: Clear status indicators

### 6. Action Log
- **Real-time Logging**: All actions logged with timestamps
- **Transaction History**: Complete audit trail
- **Status Updates**: Live status changes

## 🔧 Smart Contract Details

### Core Functions

#### `init_wallet(user: &signer, default_heir: address, default_inactivity_limit: u64)`
- Initializes user wallet configuration
- Sets default heir and inactivity period
- Validates input parameters

#### `lock_assets<CoinType>(user: &signer, amount: u64, heir: address, inactivity_limit_days: u64)`
- Locks specified amount of coins
- Transfers assets to contract escrow
- Sets heir and inactivity conditions

#### `send_heartbeat(user: &signer)`
- Updates last activity timestamp
- Proves user is still active
- Prevents automatic asset transfer

#### `check_and_transfer<CoinType>(caller: &signer, owner: address)`
- Checks if inactivity limit is reached
- Transfers assets to heir if conditions met
- Can be called by anyone (permissionless)

#### `cancel_locked_assets<CoinType>(user: &signer)`
- Cancels locked assets
- Returns assets to owner
- Emergency recovery function

### Security Features
- **Access Control**: Only owners can manage their assets
- **Input Validation**: All parameters validated before processing
- **Escrow Security**: Assets held securely in contract
- **Emergency Stop**: Deactivation capability for emergencies

## 🌐 Network Configuration

### Testnet (Default)
- **Node URL**: `https://fullnode.testnet.aptoslabs.com`
- **Faucet**: `https://aptos.dev/faucet/`
- **Explorer**: `https://testnet.aptoscan.com/`

### Mainnet
- **Node URL**: `https://fullnode.mainnet.aptoslabs.com`
- **Explorer**: `https://aptoscan.com/`

## 📊 Project Structure

```
deadman-wallet/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── app/
│   │   │   └── page.tsx          # dApp interface
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css           # Global styles
│   ├── components/
│   │   └── ui/                   # shadcn/ui components
│   ├── hooks/
│   │   ├── use-toast.ts          # Toast notifications
│   │   └── use-mobile.ts         # Mobile detection
│   └── lib/
│       ├── aptos-integration.ts  # Aptos blockchain integration
│       ├── db.ts                 # Database utilities
│       ├── socket.ts             # WebSocket utilities
│       └── utils.ts              # Utility functions
├── move/
│   ├── deadman_wallet.move       # Move smart contract
│   └── README.md                 # Contract documentation
├── public/
│   ├── logo.svg                  # Application logo
│   └── robots.txt                # SEO configuration
├── package.json                  # Dependencies and scripts
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── README.md                    # This file
```

## 🛠️ Development Commands

### Frontend Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npm run type-check
```

### Smart Contract Development
```bash
# Compile contract
cd move
aptos move compile --named-addresses deadman_wallet=YOUR_ADDRESS

# Run tests
aptos move test

# Deploy contract
aptos move publish --named-addresses deadman_wallet=YOUR_ADDRESS

# Interact with contract
aptos move run --function-id YOUR_ADDRESS::deadman_wallet::FUNCTION_NAME
```

## 🔒 Security Considerations

### Smart Contract Security
- **Access Control**: Proper authorization mechanisms
- **Input Validation**: Comprehensive parameter validation
- **Reentrancy Protection**: Prevention of reentrancy attacks
- **Overflow Protection**: Safe arithmetic operations
- **Emergency Stop**: Circuit breaker pattern implementation

### Frontend Security
- **Input Sanitization**: Proper input validation and sanitization
- **HTTPS**: Secure communication protocols
- **Environment Variables**: Secure configuration management
- **Dependencies**: Regular security updates

### Operational Security
- **Private Key Management**: Secure key storage and handling
- **Transaction Monitoring**: Real-time transaction monitoring
- **Rate Limiting**: Prevention of abuse
- **Audit Trail**: Complete transaction logging

## 🧪 Testing Strategy

### Frontend Testing
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: End-to-end workflow testing
- **User Acceptance Testing**: Real-world scenario validation

### Smart Contract Testing
- **Unit Tests**: Individual function testing
- **Integration Tests**: Contract interaction testing
- **Security Tests**: Vulnerability assessment
- **Performance Tests**: Gas optimization analysis

### Network Testing
- **Testnet**: Comprehensive testnet validation
- **Mainnet Simulation**: Production environment simulation
- **Load Testing**: High-volume transaction testing

## 📈 Performance Optimization

### Frontend Optimization
- **Code Splitting**: Dynamic imports for better loading
- **Image Optimization**: Optimized image assets
- **Caching**: Efficient caching strategies
- **Bundle Size**: Optimized bundle sizes

### Smart Contract Optimization
- **Gas Efficiency**: Optimized gas usage
- **Storage Optimization**: Efficient storage patterns
- **Computation**: Optimized computational logic

## 🚀 Deployment

### Frontend Deployment
```bash
# Build for production
npm run build

# Deploy to Vercel (recommended)
vercel

# Or deploy to Netlify
netlify deploy
```

### Smart Contract Deployment
```bash
# Deploy to testnet
cd move
aptos move publish --named-addresses deadman_wallet=YOUR_ADDRESS

# Deploy to mainnet
aptos move publish --named-addresses deadman_wallet=YOUR_ADDRESS --profile mainnet
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Aptos team for the excellent blockchain platform
- Next.js team for the amazing framework
- shadcn/ui for the beautiful component library
- Open source community for inspiration and tools

## 📞 Support

For support and questions:
- GitHub Issues: Create an issue for bug reports or feature requests
- Documentation: Check the `/move` directory for smart contract details
- Community: Join our community discussions

---

**Note**: This is a hackathon project designed for demonstration purposes. While it includes security best practices, always conduct thorough security audits before deploying to production environments.