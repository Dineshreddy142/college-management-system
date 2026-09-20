import React, { useState } from 'react';
import {
  Wallet,
  Utensils,
  CreditCard,
  PlusCircle,
  Clock,
  QrCode,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  TrendingUp,
  Search,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Coffee,
  Trash2,
  Receipt
} from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  category: 'Breakfast' | 'Main Course' | 'Beverages' | 'Snacks';
  price: number;
  calories: number;
  prepTime: string;
  image: string;
  rating: number;
  isVeg: boolean;
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface Transaction {
  id: string;
  title: string;
  type: 'debit' | 'credit';
  amount: number;
  timestamp: string;
  token?: string;
  status: 'Completed' | 'Pending Pick-up';
}

const CANTEEN_MENU: MenuItem[] = [
  {
    id: 'm1',
    name: 'Special Hyderabadi Veg Biryani',
    category: 'Main Course',
    price: 130,
    calories: 450,
    prepTime: '12 mins',
    image: '🍲',
    rating: 4.8,
    isVeg: true
  },
  {
    id: 'm2',
    name: 'Paneer Butter Masala + 2 Butter Naan',
    category: 'Main Course',
    price: 150,
    calories: 580,
    prepTime: '15 mins',
    image: '🥘',
    rating: 4.9,
    isVeg: true
  },
  {
    id: 'm3',
    name: 'Cold Coffee with Ice Cream',
    category: 'Beverages',
    price: 60,
    calories: 210,
    prepTime: '5 mins',
    image: '🥤',
    rating: 4.7,
    isVeg: true
  },
  {
    id: 'm4',
    name: 'Crispy Cheese Dosa',
    category: 'Breakfast',
    price: 75,
    calories: 320,
    prepTime: '8 mins',
    image: '🥞',
    rating: 4.6,
    isVeg: true
  },
  {
    id: 'm5',
    name: 'Grilled Club Sandwich',
    category: 'Snacks',
    price: 80,
    calories: 290,
    prepTime: '7 mins',
    image: '🥪',
    rating: 4.5,
    isVeg: true
  },
  {
    id: 'm6',
    name: 'Fresh Mango Smoothie',
    category: 'Beverages',
    price: 55,
    calories: 160,
    prepTime: '4 mins',
    image: '🧃',
    rating: 4.8,
    isVeg: true
  }
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-101',
    title: 'Canteen Token #CN-8842 (Biryani + Coffee)',
    type: 'debit',
    amount: 190,
    timestamp: 'Today, 01:15 PM',
    token: 'CN-8842',
    status: 'Pending Pick-up'
  },
  {
    id: 'tx-100',
    title: 'UPI Top-up (GPay / PhonePe)',
    type: 'credit',
    amount: 1000,
    timestamp: 'Yesterday, 09:30 AM',
    status: 'Completed'
  },
  {
    id: 'tx-099',
    title: 'Library Printout & Photocopy Charge',
    type: 'debit',
    amount: 25,
    timestamp: '18 Sep, 04:20 PM',
    status: 'Completed'
  }
];

export const CampusWalletCanteen: React.FC = () => {
  const [walletBalance, setWalletBalance] = useState<number>(1450);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pickupTimeSlot, setPickupTimeSlot] = useState<string>('01:15 PM (Lunch Break)');
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState<number>(500);
  const [activeTokenModal, setActiveTokenModal] = useState<Transaction | null>(INITIAL_TRANSACTIONS[0]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    triggerToast(`🛒 Added ${item.name} to pre-order cart`);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (walletBalance < cartTotal) {
      triggerToast('⚠️ Insufficient Wallet Balance! Please top-up your card.');
      setShowTopupModal(true);
      return;
    }

    const tokenNum = `CN-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      title: `Canteen Pre-order Token (${cart.map(c => c.name).join(', ')})`,
      type: 'debit',
      amount: cartTotal,
      timestamp: 'Just now',
      token: tokenNum,
      status: 'Pending Pick-up'
    };

    setWalletBalance(prev => prev - cartTotal);
    setTransactions(prev => [newTx, ...prev]);
    setCart([]);
    setActiveTokenModal(newTx);
    triggerToast(`🎉 Pre-order successful! Token ${tokenNum} generated.`);
  };

  const handleTopupSubmit = () => {
    if (topupAmount <= 0) return;
    setWalletBalance(prev => prev + topupAmount);
    const topupTx: Transaction = {
      id: `tx-${Date.now()}`,
      title: 'UPI Wallet Top-up',
      type: 'credit',
      amount: topupAmount,
      timestamp: 'Just now',
      status: 'Completed'
    };
    setTransactions(prev => [topupTx, ...prev]);
    setShowTopupModal(false);
    triggerToast(`💳 Successfully added ₹${topupAmount} to Campus Wallet!`);
  };

  const filteredMenu =
    activeCategory === 'All'
      ? CANTEEN_MENU
      : CANTEEN_MENU.filter(m => m.category === activeCategory);

  return (
    <div className="p-6 bg-slate-900 text-slate-100 min-h-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-400 animate-bounce">
          <Sparkles className="w-5 h-5 text-yellow-300" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 p-8 mb-8 border border-emerald-700/50 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Innovation Module 5
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Campus Cashless Wallet & Express Canteen Pre-Order
            </h1>
            <p className="text-slate-300 mt-2 max-w-2xl text-sm leading-relaxed">
              Zero line wait times. Pre-order meals with auto-scheduled pick-up slots & seamless digital campus wallet payments.
            </p>
          </div>

          {/* Wallet Balance Card */}
          <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-5 shadow-xl flex items-center gap-5">
            <div>
              <span className="text-[11px] text-emerald-400 uppercase tracking-wider font-bold">NFC Wallet Balance</span>
              <p className="text-3xl font-black text-white mt-0.5">₹{walletBalance.toLocaleString()}</p>
            </div>
            <button
              onClick={() => setShowTopupModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 transition"
            >
              <PlusCircle className="w-4 h-4" /> Top-Up
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 8 Cols: Canteen Express Store */}
        <div className="lg:col-span-8 space-y-6">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {['All', 'Main Course', 'Breakfast', 'Beverages', 'Snacks'].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                  activeCategory === cat
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-950/50'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu Item Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredMenu.map(item => (
              <div
                key={item.id}
                className="bg-slate-800/60 border border-slate-700/80 hover:border-emerald-500/50 rounded-2xl p-5 shadow-xl transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition">
                      {item.image}
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-950 text-emerald-300 font-bold border border-emerald-800">
                      ★ {item.rating}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base">{item.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span>🔥 {item.calories} kcal</span>
                    <span>•</span>
                    <span>⏱️ {item.prepTime}</span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-700/60 flex items-center justify-between">
                  <span className="text-lg font-black text-emerald-400">₹{item.price}</span>
                  <button
                    onClick={() => addToCart(item)}
                    className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-emerald-600 text-slate-100 hover:text-white font-bold text-xs transition flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" /> Add to Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 4 Cols: Order Cart & Instant Token Generator */}
        <div className="lg:col-span-4 space-y-6">
          {/* Cart & Time Slot Selector */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-2xl sticky top-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" /> Express Cart
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                {cart.reduce((a, c) => a + c.quantity, 0)} Items
              </span>
            </h2>

            {cart.length === 0 ? (
              <div className="py-10 text-center text-slate-400 border border-dashed border-slate-700 rounded-xl">
                <Utensils className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="text-xs">Your express cart is empty.</p>
                <p className="text-[11px] text-slate-500 mt-1">Select canteen dishes to generate pick-up token.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                  {cart.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-700 text-xs">
                      <div>
                        <p className="font-bold text-white">{c.name}</p>
                        <p className="text-slate-400 text-[11px]">Qty: {c.quantity} × ₹{c.price}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-emerald-400">₹{c.price * c.quantity}</span>
                        <button onClick={() => removeFromCart(c.id)} className="text-red-400 hover:text-red-300">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pickup Slot Selection */}
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-semibold">Select Pick-up Time Slot</label>
                  <select
                    value={pickupTimeSlot}
                    onChange={e => setPickupTimeSlot(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option>01:15 PM (Lunch Break)</option>
                    <option>01:30 PM (Post Class)</option>
                    <option>03:45 PM (Evening Break)</option>
                  </select>
                </div>

                {/* Checkout Summary */}
                <div className="pt-3 border-t border-slate-700 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span>₹{cartTotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Tax & Service</span>
                    <span className="text-emerald-400">FREE</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-700">
                    <span>Total Debit</span>
                    <span className="text-emerald-400">₹{cartTotal}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-950/80 flex items-center justify-center gap-2 transition"
                >
                  <QrCode className="w-5 h-5" /> Pay ₹{cartTotal} & Generate Token
                </button>
              </div>
            )}
          </div>

          {/* Active Pick-up Token Modal/Card */}
          {activeTokenModal && (
            <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border border-emerald-500/60 rounded-2xl p-6 shadow-2xl text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-3 border border-emerald-500/40">
                <CheckCircle2 className="w-3.5 h-3.5" /> Express Counter Pick-up Ready
              </div>
              <h3 className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Kitchen Pickup Token</h3>
              <p className="text-4xl font-black text-white font-mono my-2 tracking-widest text-emerald-400">
                {activeTokenModal.token}
              </p>
              <p className="text-xs text-slate-300">{activeTokenModal.title}</p>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Status: <strong className="text-amber-400">{activeTokenModal.status}</strong></span>
                <span>Slot: <strong>01:15 PM</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TOP-UP MODAL */}
      {showTopupModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowTopupModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg"
            >
              ✕
            </button>
            <h2 className="text-xl font-extrabold text-white mb-2 flex items-center gap-2">
              <Wallet className="w-6 h-6 text-emerald-400" /> Top-Up Campus NFC Card
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Select or enter amount to add to your instant digital campus balance.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {[200, 500, 1000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setTopupAmount(amt)}
                  className={`py-2 rounded-xl text-xs font-bold border ${
                    topupAmount === amt
                      ? 'bg-emerald-600 border-emerald-400 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  + ₹{amt}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="text-xs text-slate-400 block mb-1">Custom Amount (₹)</label>
              <input
                type="number"
                value={topupAmount}
                onChange={e => setTopupAmount(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={handleTopupSubmit}
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg flex items-center justify-center gap-2 transition"
            >
              <CreditCard className="w-4 h-4" /> Pay via UPI / Netbanking
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
