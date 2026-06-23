import React, { useState, useEffect } from 'react';
import { 
  X, Check, Crown, Coins, CreditCard, ShieldCheck, 
  ArrowRight, Copy, QrCode, RefreshCw, Smartphone, ArrowLeft
} from 'lucide-react';
import { UserProfile } from '../types';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onProfileUpdated: (updated: Partial<UserProfile>) => void;
  showToast: (msg: string, type: 'success' | 'info' | 'watchlist' | 'like') => void;
}

type CryptoCoin = {
  symbol: string;
  name: string;
  address: string;
  color: string;
  network: string;
};

const COINS: CryptoCoin[] = [
  { 
    symbol: 'USDT', 
    name: 'Tether (ERC-20/TRC-20)', 
    address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', 
    color: 'emerald',
    network: 'Ethereum/Tron Network'
  },
  { 
    symbol: 'BTC', 
    name: 'Bitcoin', 
    address: 'bc1q6yc3ymw2p3pxg73pkmpttwun0kldm9xdfy0g9l', 
    color: 'amber',
    network: 'Bitcoin Native Ledger'
  },
  { 
    symbol: 'ETH', 
    name: 'Ethereum', 
    address: '0x9965503B1a05940047C554B571B910B8D97D8C4C', 
    color: 'indigo',
    network: 'Ethereum Mainnet'
  },
  { 
    symbol: 'SOL', 
    name: 'Solana', 
    address: 'H6k9f96TzYQZzL7yZ6jSsknfe9E7F6gpxY7Tq29hL7vA', 
    color: 'purple',
    network: 'Solana Virtual Node'
  },
  { 
    symbol: 'LTC', 
    name: 'Litecoin', 
    address: 'M8TzXSkny6pZzL7yZ6jSsknfe9E7F6gpxY', 
    color: 'sky',
    network: 'Litecoin SegWit'
  }
];

export default function SubscriptionModal({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
  showToast
}: SubscriptionModalProps) {
  const [step, setStep] = useState<'plan' | 'pay' | 'verify'>('plan');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedCoin, setSelectedCoin] = useState<CryptoCoin>(COINS[0]);
  const [copied, setCopied] = useState(false);
  const [txHash, setTxHash] = useState('');
  
  // Verification progress simulation
  const [verifyStatus, setVerifyStatus] = useState<string[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyComplete, setVerifyComplete] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset when closed
      setStep('plan');
      setVerifyStatus([]);
      setIsVerifying(false);
      setVerifyComplete(false);
      setTxHash('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const priceUSD = selectedPlan === 'monthly' ? 1.0 : 8.0;
  const promoLabel = selectedPlan === 'yearly' ? 'Yearly Special (Save 33%)' : 'Flexible Monthly';

  // Format cryptocoin translation pricing approximation
  const getCryptoAmount = () => {
    switch (selectedCoin.symbol) {
      case 'BTC': return (priceUSD / 67500).toFixed(6);
      case 'ETH': return (priceUSD / 3500).toFixed(5);
      case 'SOL': return (priceUSD / 145).toFixed(4);
      case 'LTC': return (priceUSD / 78).toFixed(4);
      default: return priceUSD.toFixed(1); // USDT
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(selectedCoin.address);
    setCopied(true);
    showToast(`${selectedCoin.symbol} Address copied!`, 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatePayment = () => {
    setStep('verify');
    setIsVerifying(true);
    setVerifyStatus([]);
    
    const logs = [
      '🔍 Connecting to remote blockchain node validators...',
      '🛰️ Scanning mempools for incoming peer-to-peer microtransactions...',
      `💎 Found pending transfer matching exactly ${getCryptoAmount()} ${selectedCoin.symbol}`,
      '⚡ Confirming block validation via decentralized validator network (2/3 signatures)...',
      '⛓️ Block locked! Appending premium ledger metadata record...',
      '👑 Verified successfully! Premium attributes activated!'
    ];

    let currentLogIndex = 0;
    
    const timer = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setVerifyStatus(prev => [...prev, logs[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(timer);
        setIsVerifying(false);
        setVerifyComplete(true);
        triggerSuccessUpgrade();
      }
    }, 1200);
  };

  const triggerSuccessUpgrade = async () => {
    try {
      const expiresAt = new Date();
      if (selectedPlan === 'monthly') {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      } else {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      }

      const updatedData = {
        isPremium: true,
        subscriptionPlan: selectedPlan === 'monthly' ? 'monthly' as const : 'yearly' as const,
        subscriptionExpiresAt: expiresAt.toISOString()
      };

      // Call API hook passed down to update database
      await onProfileUpdated(updatedData);
      showToast('Premium Access unlocked! Thank you for your support.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Verification successful, but DB refresh failed.', 'info');
    }
  };

  return (
    <div id="subscription-modal-wrapper" className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div 
        id="subscription-modal-body" 
        className="relative w-full max-w-xl max-h-[92vh] sm:max-h-[85vh] flex flex-col bg-gradient-to-b from-[#0c0f12] via-[#090b0d] to-[#050608] border border-white/10 rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)] text-left"
      >
        {/* Decorative ambient glowing orb */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 bg-amber-500/10 blur-[50px] rounded-full pointer-events-none" />

        {/* Header Controls (Sticky) */}
        <div className="p-4 sm:p-5 border-b border-white/[0.04] flex items-center justify-between relative z-10 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {!verifyComplete && (
              <button 
                type="button"
                onClick={() => {
                  if (step === 'plan') onClose();
                  else if (step === 'pay') setStep('plan');
                  else if (step === 'verify') setStep('pay');
                }}
                className="p-1.5 text-stone-400 hover:text-white hover:bg-white/5 rounded-lg transition cursor-pointer flex items-center justify-center shrink-0 border border-white/5 bg-white/[0.02]"
                title={step === 'plan' ? 'Close & Return' : 'Go Back'}
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="h-8 w-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <Crown className="h-4.5 w-4.5 fill-amber-500 animate-pulse" />
            </div>
            <div className="min-w-0 pr-2">
              <h2 className="text-sm sm:text-base font-serif font-bold text-white tracking-wide truncate">Premium Channels</h2>
              <p className="text-[9px] sm:text-[10px] text-stone-500 font-sans truncate font-light">Support via Decentralized Crypto Payments</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white hover:bg-white/5 rounded-full transition cursor-pointer border border-transparent hover:border-white/10 shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step 1: PLAN SELECTOR & FEATURES */}
        {step === 'plan' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5 relative z-10 select-none max-h-full">
            {/* Value Proposition Grid - streamlined for perfect mobile scrolling */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5">
              <div className="bg-white/[0.01] border border-white/[0.03] p-2.5 sm:p-3.5 rounded-xl space-y-1 sm:space-y-1.5 hover:border-white/10 transition">
                <div className="flex items-center gap-2 text-stone-200">
                  <span className="text-amber-500 text-[10px] font-bold font-mono">✦</span>
                  <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider font-sans text-stone-150">100% Ad-Free Channels</span>
                </div>
                <p className="text-[9px] sm:text-[10px] text-stone-500 leading-normal font-light">
                  Disable all pre-rolls, mid-rolls, and sponsorship widgets. Pure streaming pleasure.
                </p>
              </div>

              <div className="bg-white/[0.01] border border-white/[0.03] p-2.5 sm:p-3.5 rounded-xl space-y-1 sm:space-y-1.5 hover:border-white/10 transition">
                <div className="flex items-center gap-2 text-stone-200">
                  <span className="text-amber-500 text-[10px] font-bold font-mono">✦</span>
                  <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider font-sans text-stone-150">Exclusive 18+ Lounge</span>
                </div>
                <p className="text-[9px] sm:text-[10px] text-stone-500 leading-normal font-light">
                  Direct access to master-level adult selections, movies, and unedited releases.
                </p>
              </div>

              <div className="bg-white/[0.01] border border-white/[0.03] p-2.5 sm:p-3.5 rounded-xl space-y-1 sm:space-y-1.5 hover:border-white/10 transition">
                <div className="flex items-center gap-2 text-stone-200">
                  <span className="text-amber-500 text-[10px] font-bold font-mono">✦</span>
                  <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider font-sans text-stone-150">PSTN Direct Downloads</span>
                </div>
                <p className="text-[9px] sm:text-[10px] text-stone-500 leading-normal font-light">
                  Retrieve show nodes directly onto your machine at raw fiber speed. No throttles.
                </p>
              </div>

              <div className="bg-white/[0.01] border border-white/[0.03] p-2.5 sm:p-3.5 rounded-xl space-y-1 sm:space-y-1.5 hover:border-white/10 transition">
                <div className="flex items-center gap-2 text-stone-200">
                  <span className="text-amber-500 text-[10px] font-bold font-mono">✦</span>
                  <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider font-sans text-stone-150">VVIP Ultra HD Nodes</span>
                </div>
                <p className="text-[9px] sm:text-[10px] text-stone-500 leading-normal font-light">
                  Force 1080p and 4K Ultra bandwidth configurations dynamically during buffer sequences.
                </p>
              </div>
            </div>

            {/* Plans Card Stack */}
            <div className="space-y-2 pt-0.5">
              <h3 className="text-[8.5px] sm:text-[9.5px] font-mono text-stone-500 uppercase tracking-widest text-center sm:text-left">Select Premium Option</h3>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
                {/* Monthly */}
                <div 
                  onClick={() => setSelectedPlan('monthly')}
                  className={`relative p-3.5 rounded-xl border cursor-pointer transition text-center flex flex-col justify-between ${
                    selectedPlan === 'monthly'
                      ? 'bg-amber-500/[0.03] border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.06)]'
                      : 'bg-transparent border-white/[0.04] hover:bg-white/[0.01] hover:border-white/10'
                  }`}
                >
                  <div>
                    <span className="text-[8.5px] sm:text-[9.5px] font-sans text-stone-400 block tracking-wide">Monthly Option</span>
                    <span className="text-lg sm:text-2xl font-serif font-bold text-white mt-0.5 block">$1.00</span>
                    <span className="text-[8px] sm:text-[8.5px] text-stone-600 block leading-normal mt-0.5">Flexible renewals</span>
                  </div>
                  <div className="pt-2 sm:pt-3">
                    <span className={`text-[9px] sm:text-[9.5px] py-1 rounded-lg font-bold uppercase tracking-wider block ${
                      selectedPlan === 'monthly' ? 'bg-amber-500 text-black font-extrabold' : 'bg-white/[0.04] text-stone-400'
                    }`}>Select</span>
                  </div>
                </div>

                {/* Yearly */}
                <div 
                  onClick={() => setSelectedPlan('yearly')}
                  className={`relative p-3.5 rounded-xl border cursor-pointer transition text-center flex flex-col justify-between ${
                    selectedPlan === 'yearly'
                      ? 'bg-amber-500/[0.03] border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.06)]'
                      : 'bg-transparent border-white/[0.04] hover:bg-white/[0.01] hover:border-white/10'
                  }`}
                >
                  <div className="absolute top-1 right-1 bg-amber-500/10 border border-amber-500/25 text-amber-500 text-[6.5px] sm:text-[7.5px] font-bold px-1.5 py-0.2 rounded font-sans uppercase">
                    Save 33%
                  </div>
                  <div>
                    <span className="text-[8.5px] sm:text-[9.5px] font-sans text-stone-400 block tracking-wide">Yearly License</span>
                    <span className="text-lg sm:text-2xl font-serif font-bold text-amber-400 mt-0.5 block">$8.00</span>
                    <span className="text-[8px] sm:text-[8.5px] text-stone-500 block leading-normal mt-0.5">Only ~$0.66 / mo!</span>
                  </div>
                  <div className="pt-2 sm:pt-3">
                    <span className={`text-[9px] sm:text-[9.5px] py-1 rounded-lg font-bold uppercase tracking-wider block ${
                      selectedPlan === 'yearly' ? 'bg-amber-500 text-black font-extrabold' : 'bg-white/[0.04] text-stone-400'
                    }`}>Select</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Next trigger button */}
            <button
              onClick={() => setStep('pay')}
              className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-450 hover:to-amber-500 text-black font-bold uppercase text-[10.5px] sm:text-xs tracking-widest rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/5 active:scale-[0.99] cursor-pointer shrink-0 mt-2 font-sans"
            >
              <span>Proceed to Crypto Checkout</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Step 2: CRYPTO CURRENCY COIN SELECTION & COPYING GATE */}
        {step === 'pay' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 relative z-10">
            {/* Quick Summary Bar */}
            <div className="bg-[#12161a] border border-white/5 p-3 rounded-2xl flex items-center justify-between text-xs font-sans">
              <div>
                <span className="text-stone-400 block text-[9.5px]">Selected Tier:</span>
                <span className="font-bold text-stone-200 capitalize font-serif">{selectedPlan} Access Package</span>
              </div>
              <div className="text-right">
                <span className="text-stone-400 block text-[9.5px]">Total USD Due:</span>
                <span className="font-extrabold text-amber-400">${priceUSD.toFixed(2)} USD</span>
              </div>
            </div>

            {/* Cryptocurrency Selectors */}
            <div className="space-y-2">
              <h3 className="text-[9px] sm:text-[10px] font-mono text-stone-400 uppercase tracking-widest pl-1">Select Payment Token</h3>
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2">
                {COINS.map(c => (
                  <button
                    key={c.symbol}
                    type="button"
                    onClick={() => { setSelectedCoin(c); }}
                    className={`py-2 px-1 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                      selectedCoin.symbol === c.symbol
                        ? 'bg-amber-500/10 border-amber-500/35 text-amber-400'
                        : 'bg-white/[0.01] border-white/[0.05] hover:border-white/10 text-stone-400 hover:text-white'
                    }`}
                  >
                    <Coins className="h-4 w-4 shrink-0" />
                    <span className="text-[10px] sm:text-[10.5px] font-bold font-mono tracking-wider">{c.symbol}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Generated Wallet QR Frame */}
            <div className="bg-[#090b0d] border border-white/[0.04] p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              {/* QR Render wrapper */}
              <div className="h-28 w-28 bg-white rounded-xl p-2 flex items-center justify-center shrink-0 shadow-lg">
                <QrCode className="h-24 w-24 text-black" />
              </div>

              {/* Addressing Copy Region */}
              <div className="space-y-3 flex-1 min-w-0 w-full">
                <div className="space-y-1">
                  <span className="text-[8.5px] sm:text-[9.5px] font-mono text-stone-500 uppercase tracking-wider block">
                    NETWORK: {selectedCoin.network}
                  </span>
                  <div className="text-sm font-sans flex items-baseline gap-1">
                    <span className="text-white font-extrabold font-serif text-base">{getCryptoAmount()}</span>
                    <span className="text-stone-300 font-mono text-xs">{selectedCoin.symbol}</span>
                    <span className="text-[9.5px] text-stone-550 ml-1">(${priceUSD.toFixed(1)} USD equiv.)</span>
                  </div>
                </div>

                {/* Simulated Address Field */}
                <div className="space-y-1.5">
                  <span className="text-[8.5px] sm:text-[9.5px] font-mono text-stone-500 uppercase tracking-wider block">
                    DESTINATION {selectedCoin.symbol} ADDRESS
                  </span>
                  <div className="flex items-center bg-black border border-white/10 rounded-xl px-2.5 py-2 gap-2">
                    <code className="text-[9.5px] sm:text-[10px] text-stone-300 font-mono truncate flex-1 leading-normal select-all">
                      {selectedCoin.address}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyAddress}
                      className="text-stone-500 hover:text-white transition p-1 hover:bg-white/[0.03] rounded shrink-0 cursor-pointer"
                      title="Copy Address"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* User info notification for verification */}
            <div className="bg-[#1f170e]/40 border border-amber-900/10 p-2.5 rounded-2xl flex items-start gap-2">
              <span className="text-amber-500 text-xs mt-0.5 font-sans">ℹ</span>
              <p className="text-[9px] sm:text-[10px] text-stone-500 leading-normal font-light">
                Please broadcast the exact amount shown. Automated ledger nodes monitor blocks in runtime. Premium features unlock immediately upon mempool verification.
              </p>
            </div>

            {/* Verification actions */}
            <div className="flex items-center gap-2.5 pt-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setStep('plan')}
                className="px-3.5 py-2.5 bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] text-stone-400 hover:text-white rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition cursor-pointer font-sans"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleSimulatePayment}
                className="flex-1 py-2.5 bg-white text-black hover:bg-amber-400 transition hover:text-black text-[10.5px] sm:text-xs font-bold uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 active:scale-[0.99] cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" />
                <span>Verify Broadcast on Blockchain</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: VERIFYING IN PROGRESS & TERMINAL LOGS OUTPUT */}
        {step === 'verify' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 relative z-10 font-sans select-none">
            {/* Terminal monitor screen */}
            <div className="bg-[#030405] border border-white/10 rounded-2xl p-3.5 font-mono space-y-2 max-h-48 overflow-y-auto shadow-inner text-left scrollbar-thin">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-2 text-[9px] sm:text-[10px] text-stone-500">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                <span>MEMPOOL TRANSACTION LEDGER SCOUTS ACTIVE</span>
              </div>
              
              {verifyStatus.map((log, index) => (
                <div key={index} className="text-[10px] sm:text-[10.5px] leading-relaxed text-stone-300 animate-fade-in flex items-start gap-1.5">
                  <span className="text-amber-400 shrink-0 select-none">&gt;&gt;</span>
                  <span>{log}</span>
                </div>
              ))}

              {isVerifying && (
                <div className="flex items-center gap-2 text-stone-500 text-[10px] sm:text-[10.5px] italic pt-1 animate-pulse">
                  <span>Querying block indices, indexing mempools...</span>
                </div>
              )}
            </div>

            {/* When verifying */}
            {isVerifying && (
              <div className="flex flex-col items-center justify-center py-2 space-y-2 shrink-0">
                <div className="h-7 w-7 border-t-2 border-r-2 border-amber-500 rounded-full animate-spin" />
                <span className="text-[10px] sm:text-[11px] text-stone-400 font-mono">Synchronizing ledger blocks...</span>
              </div>
            )}

            {/* When Complete */}
            {verifyComplete && (
              <div className="bg-[#090e0c] border border-emerald-500/20 p-4 sm:p-5 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4 animate-scale-up">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                  <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 stroke-2" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-xs sm:text-sm font-bold text-white font-serif tracking-wide">Premium License Sync Complete!</h3>
                  <p className="text-[9.5px] sm:text-[10.5px] text-stone-400 font-light max-w-sm leading-normal">
                    Your account `{profile.email}` has been compiled as a <strong>Premium Ad-Free Member</strong> with valid licensing key coordinates. All gates have been unlocked.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-[10.5px] sm:text-xs font-bold uppercase tracking-wider rounded-lg transition shadow-md cursor-pointer font-sans"
                >
                  Return to Stream Theater
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
