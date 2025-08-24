## DEADMAN'S WALLET

DeadMan’s Wallet is a trustless, decentralized inheritance solution built on the Aptos blockchain using Move smart contracts.
Every year, millions of dollars in crypto are lost forever due to forgotten keys or inaccessible wallets. Traditional inheritance solutions rely on banks, custodians, lawyers, or centralized exchanges — defeating the Web3 ethos of decentralization.
DeadMan’s Wallet solves this by enabling users to securely pass on their crypto assets to their heirs without any third-party intervention. The system acts as a Deadman’s Switch, ensuring assets are automatically transferred if the owner becomes inactive for a set period.

### 🚰 Key Features

- **🔗 Petra Wallet Integration** - Connect to Aptos blockchain using Petra wallet
- **💰 Token Balances** - Display APT, USDC, and TestCoin balances
- **🚰 Testnet Faucet** - Request test APT tokens from the Aptos testnet faucet
- **🔒 Asset Locking** - Lock tokens with customizable inactivity periods
- **💓 Heartbeat System** - Send regular transactions to prove activity
- **📋 Transaction History** - Track all locked assets and transactions
- **🎯 Demo Mode** - Fast inactivity periods (minutes instead of days) for testing

### 🚰 Faucet Functionality

The integrated faucet allows users to:
- Request test APT tokens (0.1 to 10 APT per request)
- Send tokens to any valid Aptos address
- Auto-fill connected wallet address
- View transaction status and hashes

## ✨ Technology Stack
1. Smart Contract (Move, Aptos Testnet)
Stores user funds securely.
Tracks inactivity timer via heartbeat transactions.
Automatically releases funds to heir upon timeout.
2. Frontend (React + Wallet Adapter)
User-friendly dApp interface.
Allows deposits, heir setup, heartbeat reset, and heir claiming.
3. Backend (Optional Watchdog)
Monitors deadlines.
Can trigger smart contract calls when inactivity is detected.
Flow:
User deposits crypto, sets heir address + inactivity deadline.
User sends periodic heartbeat transactions.
If deadline passes without heartbeat → funds auto-transfer to heir.

### 🎯 Core Framework
- **⚡ Next.js 15** - The React framework for production with App Router
- **📘 TypeScript 5** - Type-safe JavaScript for better developer experience
- **🎨 Tailwind CSS 4** - Utility-first CSS framework for rapid UI development

### 🔗 Blockchain & Web3
- **🔗 Aptos SDK** - Official Aptos blockchain SDK for TypeScript
- **💎 Petra Wallet** - Aptos wallet integration
- **🌐 Web3 Utilities** - Blockchain interaction helpers

### 🧩 UI Components & Styling
- **🧩 shadcn/ui** - High-quality, accessible components built on Radix UI
- **🎯 Lucide React** - Beautiful & consistent icon library
- **🌈 Framer Motion** - Production-ready motion library for React
- **🎨 Next Themes** - Perfect dark mode in 2 lines of code

### 📋 Forms & Validation
- **🎣 React Hook Form** - Performant forms with easy validation
- **✅ Zod** - TypeScript-first schema validation

### 🔄 State Management & Data Fetching
- **🐻 Zustand** - Simple, scalable state management
- **🔄 TanStack Query** - Powerful data synchronization for React
- **🌐 Axios** - Promise-based HTTP client

### 🗄️ Database & Backend
- **🗄️ Prisma** - Next-generation Node.js and TypeScript ORM
- **🔐 NextAuth.js** - Complete open-source authentication solution

### 🎨 Advanced UI Features
- **📊 TanStack Table** - Headless UI for building tables and datagrids
- **🖱️ DND Kit** - Modern drag and drop toolkit for React
- **📊 Recharts** - Redefined chart library built with React and D3
- **🖼️ Sharp** - High performance image processing

### 🌍 Internationalization & Utilities
- **🌍 Next Intl** - Internationalization library for Next.js
- **📅 Date-fns** - Modern JavaScript date utility library
- **🪝 ReactUse** - Collection of essential React hooks for modern development


## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to see your application running.

🚀 Future Scope

👪 Multi-Heir Support → Split assets among multiple heirs.

🛑 Emergency Override → Pause/cancel transfer if the user forgets a heartbeat.

🔐 Encrypted Messages → Leave secret notes or instructions for heirs.

📉 Checkpoints & Gradual Release → Partial asset distribution across multiple inactivity periods.

🌐 Cross-Chain Support → Extend beyond Aptos (Ethereum, Polygon, Solana, etc.).

🛠️ Installation & Setup
Prerequisites

Node.js & npm

Aptos CLI & Testnet wallet

React (for frontend dApp)

Clone Repo
git clone https://github.com/your-username/deadmans-wallet.git
cd deadmans-wallet

Install Dependencies
npm install

Start Development Server
npm run dev

Deploy Move Contract
aptos init
aptos account create
aptos move compile
aptos move publish --profile default

📜 License

This project is licensed under the MIT License – see the LICENSE
 file for details.

🤝 Contributing

We welcome contributions! To get started:

Fork the repo

Create a feature branch (git checkout -b feature-name)

Commit your changes (git commit -m "Add feature XYZ")

Push to branch (git push origin feature-name)

Open a Pull Request
