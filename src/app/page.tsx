'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-[#e0e0e0]">
      {/* Header */}
      <header className="bg-[#1e1e1e] p-4 fixed w-full top-0 z-50 shadow-lg">
        <nav className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-xl font-bold text-[#1f80e0]">Deadman's Wallet</div>
          <div className="hidden md:flex gap-8 items-center">
            <a href="#features" className="hover:text-[#1f80e0] transition-colors">Features</a>
            <a href="#about" className="hover:text-[#1f80e0] transition-colors">About</a>
            <Link href="/app" className="bg-[#1f80e0] text-white px-6 py-2 rounded-lg hover:bg-[#1765b3] transition-all hover:transform hover:translate-y-[-2px] hover:shadow-lg">
              Launch dApp
            </Link>
          </div>
          <button 
            className="md:hidden text-2xl"
            onClick={toggleMobileMenu}
          >
            <i className="fas fa-bars"></i>
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-between px-4 pt-20 pb-8 max-w-6xl mx-auto">
        <div className="flex-1 max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-[#1f80e0] to-[#4a90e2] bg-clip-text text-transparent">
            Deadman's Wallet
          </h1>
          <p className="text-2xl md:text-3xl mb-8 text-[#b0b0b0]">
            When you ghost, we post (your assets to someone else)
          </p>
          <Link href="/app" className="bg-[#1f80e0] text-white px-8 py-3 rounded-lg text-lg hover:bg-[#1765b3] transition-all hover:transform hover:translate-y-[-2px] hover:shadow-lg inline-block">
            Launch dApp
          </Link>
        </div>
        <div className="flex-1 flex justify-center items-center">
          <div className="relative w-64 h-64 md:w-80 md:h-80">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-[#1f80e0] rounded-2xl flex items-center justify-center text-4xl text-white animate-float">
                <i className="fas fa-wallet"></i>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 border-2 border-[#1f80e0] rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-[#1a1a1a]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[#1f80e0]">
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: 'fas fa-lock', title: 'Asset Locking', desc: 'Securely lock your crypto assets with predefined conditions' },
              { icon: 'fas fa-user-friends', title: 'Heir Setup', desc: 'Designate heirs who will receive your assets in case of inactivity' },
              { icon: 'fas fa-heartbeat', title: 'Heartbeat Check', desc: 'Regularly prove you\'re active with simple heartbeat transactions' },
              { icon: 'fas fa-clock', title: 'Inactivity Timer', desc: 'Customizable inactivity periods before asset transfer' },
              { icon: 'fas fa-exchange-alt', title: 'Automatic Transfer', desc: 'Seamless transfer of assets to heirs when conditions are met' },
              { icon: 'fas fa-shield-alt', title: 'No Third Party', desc: 'Decentralized execution with no intermediaries involved' }
            ].map((feature, index) => (
              <div key={index} className="bg-[#1e1e1e] p-6 rounded-xl text-center border border-[#2a2a2a] hover:border-[#1f80e0] hover:transform hover:translate-y-[-5px] hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-[#1f80e0] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl text-white">
                  <i className={feature.icon}></i>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-[#e0e0e0]">{feature.title}</h3>
                <p className="text-[#b0b0b0] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1e1e1e] py-8 mt-16 border-t border-[#2a2a2a]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-xl font-bold text-[#1f80e0]">Deadman's Wallet</div>
            <div className="flex gap-6">
              <a href="#about" className="text-[#b0b0b0] hover:text-[#1f80e0] transition-colors">About</a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-[#b0b0b0] hover:text-[#1f80e0] transition-colors">GitHub</a>
              <a href="#privacy" className="text-[#b0b0b0] hover:text-[#1f80e0] transition-colors">Privacy</a>
            </div>
            <div className="text-[#808080] text-sm">
              © 2023 Deadman's Wallet. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Font Awesome for icons */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}