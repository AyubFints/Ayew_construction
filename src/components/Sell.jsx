import React, { useState, useMemo } from 'react';
import { ShoppingCart, ArrowLeft, BarChart3, User, PlusCircle, CheckCircle, ClipboardList, CalendarDays, Filter, Search, X, PackageOpen, Tag, DollarSign, Wallet } from 'lucide-react';

import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

const Sell = ({ products, setProducts, sales, setSales, returns = [], setPage, customers = [] }) => {
  const [customer, setCustomer] = useState('');
  
  const [sellMode, setSellMode] = useState('inventory'); 
  
  const [categoryQuery, setCategoryQuery] = useState(''); 
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  
  const [priceMode, setPriceMode] = useState('original'); 
  const [inventoryCustomPrice, setInventoryCustomPrice] = useState('');

  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customCostPrice, setCustomCostPrice] = useState(''); 
  const [customCurrency, setCustomCurrency] = useState('som'); 

  const [sellQty, setSellQty] = useState('');
  const [sellUnit, setSellUnit] = useState('dona'); 
  
  const [cart, setCart] = useState([]); 
  const [error, setError] = useState('');
  
  const [showHistory, setShowHistory] = useState(false);
  const [historyType, setHistoryType] = useState('daily');

  const [successModal, setSuccessModal] = useState({ show: false, som: 0, usd: 0 });
  
  const d = new Date();
  const currentDayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const currentMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const currentYearStr = `${d.getFullYear()}`;

  const [detailFilter, setDetailFilter] = useState('daily');
  const [detailDate, setDetailDate] = useState(currentDayStr);

  const isUsdUnit = (unit) => {
    if (!unit) return false;
    const lowerUnit = unit.toLowerCase();
    return lowerUnit.includes('$') || lowerUnit === 'kv';
  };

  const handleDetailFilterChange = (type) => {
    setDetailFilter(type);
    if (type === 'daily') setDetailDate(currentDayStr);
    else if (type === 'monthly') setDetailDate(currentMonthStr);
    else setDetailDate(currentYearStr);
  };

  const isMatchDate = (timestamp) => {
    if (!timestamp) return false;
    const t = new Date(timestamp);
    if (isNaN(t.getTime())) return false; 

    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, '0');
    const dayStr = String(t.getDate()).padStart(2, '0');
    
    if (detailFilter === 'daily') return `${y}-${m}-${dayStr}` === detailDate;
    if (detailFilter === 'monthly') return `${y}-${m}` === detailDate;
    return `${y}` === detailDate;
  };

  const isUsdProduct = (productName) => {
    if (typeof productName !== 'string') return false;
    const lowerName = productName.toLowerCase();
    return lowerName.includes('$') || lowerName.includes(' kv ');
  };

  const tableData = useMemo(() => {
    return sales.filter(s => isMatchDate(s.id)).sort((a, b) => b.id - a.id);
  }, [sales, detailFilter, detailDate]);

  let periodIncomeSom = 0;
  let periodIncomeUsd = 0;
  tableData.forEach(curr => {
    const amount = Number(curr.totalSum) || Number(curr.total) || 0;
    let isUsd = false;
    if (curr.cartItems && curr.cartItems.length > 0) {
        isUsd = isUsdUnit(curr.cartItems[0].product.unit);
    } else {
        isUsd = isUsdProduct(curr.productName);
    }

    if (isUsd) periodIncomeUsd += amount;
    else periodIncomeSom += amount;
  });
  
  let periodExpenseSom = 0;
  let periodExpenseUsd = 0;
  returns.filter(r => isMatchDate(r.id)).forEach(curr => {
    const amount = Number(curr.returnSum) || Number(curr.totalSum) || Number(curr.total) || Number(curr.price) || 0;
    if (isUsdProduct(curr.productName)) periodExpenseUsd += amount;
    else periodExpenseSom += amount;
  });

  const periodNetProfitSom = periodIncomeSom - periodExpenseSom;
  const periodNetProfitUsd = periodIncomeUsd - periodExpenseUsd;

  const aggregatedHistory = useMemo(() => {
    const map = {};
    const getKeyAndLabel = (timestamp) => {
      const t = new Date(timestamp);
      if (historyType === 'daily') return { key: t.toLocaleDateString('uz-UZ'), label: t.toLocaleDateString('uz-UZ') + " dagi" };
      if (historyType === 'monthly') {
        const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
        return { key: `${months[t.getMonth()]} ${t.getFullYear()}`, label: `${months[t.getMonth()]} ${t.getFullYear()} dagi` };
      }
      return { key: t.getFullYear().toString(), label: `${t.getFullYear()} yildagi` };
    };

    sales.forEach(s => {
      const timeToUse = s.id; 
      const { key, label } = getKeyAndLabel(timeToUse);
      if (!map[key]) map[key] = { label, incomeSom: 0, incomeUsd: 0, expenseSom: 0, expenseUsd: 0, timestamp: timeToUse };
      
      const amount = Number(s.totalSum) || Number(s.total) || 0;
      let isUsd = false;
      if (s.cartItems && s.cartItems.length > 0) {
          isUsd = isUsdUnit(s.cartItems[0].product.unit);
      } else {
          isUsd = isUsdProduct(s.productName);
      }

      if (isUsd) map[key].incomeUsd += amount;
      else map[key].incomeSom += amount;
    });

    returns.forEach(r => {
      const { key, label } = getKeyAndLabel(r.id);
      if (!map[key]) map[key] = { label, incomeSom: 0, incomeUsd: 0, expenseSom: 0, expenseUsd: 0, timestamp: r.id };
      
      const amount = Number(r.returnSum) || Number(r.totalSum) || 0;
      if (isUsdProduct(r.productName)) map[key].expenseUsd += amount;
      else map[key].expenseSom += amount;
    });

    return Object.values(map).sort((a, b) => b.timestamp - a.timestamp);
  }, [sales, returns, historyType]);
  
  const filteredProducts = products.filter(p => {
    const matchName = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = categoryQuery 
      ? (p.category && p.category.toLowerCase().includes(categoryQuery.toLowerCase())) 
      : true;
    return matchName && matchCategory;
  });

  const selectedProduct = products.find(p => p.id.toString() === selectedProductId);

  const handleClearSelection = () => {
    setCategoryQuery(''); 
    setSearchQuery('');
    setSelectedProductId('');
    setSellQty('');
    setSellUnit('dona'); 
    setError('');
    setCustomName('');
    setCustomPrice('');
    setCustomCostPrice('');
    setPriceMode('original');
    setInventoryCustomPrice('');
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    setError('');

    if (sellMode === 'inventory') {
      if (!selectedProduct) return setError("Iltimos, avval tovarni tanlang!");
      const qty = parseFloat(sellQty);
      if (qty <= 0 || isNaN(qty)) return setError("Miqdorni to'g'ri kiriting!");
      
      let finalPrice = selectedProduct.price;
      if (priceMode === 'custom') {
         finalPrice = parseFloat(inventoryCustomPrice);
         if (isNaN(finalPrice) || finalPrice <= 0) return setError("Yangi narxni to'g'ri kiriting!");
      }

      const alreadyInCart = cart.filter(item => !item.isCustom && item.product.id === selectedProduct.id).reduce((sum, item) => sum + item.qty, 0);
      if (qty + alreadyInCart > selectedProduct.quantity) return setError(`Omborda yetarli emas! Qoldiq: ${selectedProduct.quantity} ${selectedProduct.unit}`);

      setCart([...cart, { 
        id: Date.now(), 
        isCustom: false, 
        product: { ...selectedProduct, price: finalPrice }, 
        qty: qty, 
        total: qty * finalPrice 
      }]);
      handleClearSelection();
    } 
    else {
      if (!customName.trim()) return setError("Tovar nomini kiriting!");
      const price = parseFloat(customPrice);
      if (price <= 0 || isNaN(price)) return setError("Narxni to'g'ri kiriting!");
      const costP = parseFloat(customCostPrice) || 0; 
      const qty = parseFloat(sellQty);
      if (qty <= 0 || isNaN(qty)) return setError("Miqdorni to'g'ri kiriting!");

      const isUsd = customCurrency === 'usd';
      const finalUnit = isUsd ? (sellUnit.includes('$') ? sellUnit : (sellUnit === 'kv' ? 'kv' : `${sellUnit}/$`)) : sellUnit;
      const name = isUsd ? `${customName} $ (Erkin)` : `${customName} (Erkin)`;

      const newCustomProduct = {
        id: `custom_${Date.now()}`,
        name: name,
        price: price,
        costPrice: costP, 
        unit: finalUnit,
        quantity: '∞' 
      };

      setCart([...cart, { 
        id: Date.now(), 
        isCustom: true, 
        product: newCustomProduct, 
        qty: qty, 
        total: qty * price 
      }]);
      handleClearSelection();
    }
  };

  const handleRemoveFromCart = (cartItemId) => setCart(cart.filter(item => item.id !== cartItemId));

  const handleFinalSell = () => {
    if (!customer) return setError("Mijozni tanlang!");
    if (cart.length === 0) return setError("Savat bo'sh! Tovar qo'shing.");

    let updatedProducts = [...products];
    cart.forEach(cartItem => { 
      if (!cartItem.isCustom) {
        updatedProducts = updatedProducts.map(p => 
          p.id === cartItem.product.id ? { ...p, quantity: p.quantity - cartItem.qty } : p
        ); 
      }
    });

    const cartSom = cart.filter(i => !isUsdUnit(i.product.unit));
    const cartUsd = cart.filter(i => isUsdUnit(i.product.unit));

    const newSales = [];
    const now = Date.now();

    if (cartSom.length > 0) {
      const overallSom = cartSom.reduce((sum, item) => sum + item.total, 0);
      const namesSom = cartSom.map(item => `• ${item.product.name} — ${item.qty} ${item.product.unit} (1 ${item.product.unit} = ${item.product.price.toLocaleString()} so'm)`).join('\n');
      newSales.push({ 
        id: now, 
        productName: namesSom, 
        unit: 'xil tovar', 
        quantity: cartSom.length, 
        customer, 
        totalSum: overallSom, 
        isReceived: false, 
        cartItems: cartSom 
      });
    }

    if (cartUsd.length > 0) {
      const overallUsd = cartUsd.reduce((sum, item) => sum + item.total, 0);
      const namesUsd = cartUsd.map(item => `• ${item.product.name} — ${item.qty} ${item.product.unit} (1 ${item.product.unit} = ${item.product.price.toLocaleString()} $)`).join('\n');
      newSales.push({ 
        id: now + 1, 
        productName: namesUsd, 
        unit: 'xil tovar ($)', 
        quantity: cartUsd.length, 
        customer, 
        totalSum: overallUsd, 
        isReceived: false, 
        cartItems: cartUsd 
      });
    }

    const yangiSales = [...sales, ...newSales];

    setProducts(updatedProducts);
    setSales(yangiSales);

    const overallSomAlert = cartSom.reduce((sum, item) => sum + item.total, 0);
    const overallUsdAlert = cartUsd.reduce((sum, item) => sum + item.total, 0);
    
    setCart([]); setCustomer(''); setError('');
    setSuccessModal({ show: true, som: overallSomAlert, usd: overallUsdAlert });

    if (auth.currentUser) {
      const docRef = doc(db, "stores", auth.currentUser.uid);
      setDoc(docRef, { 
        products: updatedProducts,
        sales: yangiSales
      }, { merge: true }).catch(error => {
        console.error("Savdoni bulutga saqlashda xato:", error);
      });
    }
  };

  const cartTotalSom = cart.filter(i => !isUsdUnit(i.product.unit)).reduce((sum, item) => sum + item.total, 0);
  const cartTotalUsd = cart.filter(i => isUsdUnit(i.product.unit)).reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="fade-in app-container">
      
      {/* --- TO'Q KO'K MAVZUDAGI MODAL OYNA --- */}
      {successModal.show && (
        <div className="fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(17, 24, 39, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: '400px', backgroundColor: 'white', borderRadius: '24px', padding: '30px', textAlign: 'center', borderTop: '8px solid #1e3a8a', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
              <CheckCircle size={70} color="#1e3a8a" />
            </div>
            <h2 style={{ color: '#111827', margin: '0 0 10px 0', fontSize: '26px' }}>Savdo yakunlandi!</h2>
            <p style={{ color: '#6b7280', margin: '0 0 20px 0', fontSize: '15px' }}>Tovarlar ro'yxatdan chiqarildi.</p>

            <div style={{ backgroundColor: '#eff6ff', padding: '20px', borderRadius: '16px', marginBottom: '20px', border: '1px solid #bfdbfe' }}>
              <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: 'bold', textTransform: 'uppercase' }}>Jami to'lanishi kerak:</span>
              {successModal.som > 0 && <h3 style={{ margin: '5px 0 0 0', color: '#1e3a8a', fontSize: '24px' }}>{successModal.som.toLocaleString()} so'm</h3>}
              {successModal.usd > 0 && <h3 style={{ margin: '5px 0 0 0', color: '#1e3a8a', fontSize: '24px' }}>{successModal.usd.toLocaleString()} $</h3>}
              {successModal.som === 0 && successModal.usd === 0 && <h3 style={{ margin: '5px 0 0 0', color: '#1e3a8a', fontSize: '24px' }}>0 so'm</h3>}
            </div>

            <p style={{ fontSize: '13px', color: '#ef4444', fontWeight: 'bold', marginBottom: '25px', backgroundColor: '#fef2f2', padding: '10px', borderRadius: '8px' }}>
              ⚠️ Pulni hali qabul qilmadingiz! Qabul qilish uchun Kassa bo'limiga o'ting.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setSuccessModal({ show: false, som: 0, usd: 0 })} 
                className="btn" 
                style={{ flex: 1, backgroundColor: '#f3f4f6', color: '#4b5563', fontSize: '15px', fontWeight: 'bold', padding: '12px' }}
              >
                Yopish
              </button>
              <button 
                onClick={() => { setSuccessModal({ show: false, som: 0, usd: 0 }); setPage('todaysales'); }} 
                className="btn btn-primary" 
                style={{ flex: 1.5, backgroundColor: '#1e3a8a', display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', fontSize: '15px', padding: '12px', color: 'white', border: 'none' }}
              >
                <Wallet size={18} /> Kassaga o'tish
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ------------------------------------------------ */}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => setPage('dashboard')} className="btn btn-danger" style={{ width: 'auto' }}>
          <ArrowLeft size={18} /> Orqaga
        </button>
        <h2 style={{ fontSize: '24px', color: '#1e3a8a', margin: 0, display: 'flex', gap: '10px', alignItems: 'center' }}>Sotish bo'limi <ShoppingCart size={28} /></h2>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: '1 1 250px', padding: '25px', backgroundColor: '#ffffff', borderTop: '4px solid #1e3a8a', position: 'relative' }}>
          <span style={{ position: 'absolute', top: '15px', right: '15px', fontSize: '12px', backgroundColor: '#e0e7ff', color: '#3730a3', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>{detailDate}</span>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: 'bold' }}>SOTILGAN TOVARLAR SUMMASI</p>
          <h2 style={{ margin: '10px 0 0 0', color: '#1e3a8a', fontSize: '24px' }}>
            {periodIncomeSom > 0 || periodIncomeUsd === 0 ? `${periodIncomeSom.toLocaleString()} so'm` : ''}
            {periodIncomeSom > 0 && periodIncomeUsd > 0 && <br/>}
            {periodIncomeUsd > 0 ? `${periodIncomeUsd.toLocaleString()} $` : ''}
          </h2>
        </div>
        <div className="card" style={{ flex: '1 1 250px', padding: '25px', backgroundColor: '#ffffff', borderTop: '4px solid #4b5563', position: 'relative' }}>
          <span style={{ position: 'absolute', top: '15px', right: '15px', fontSize: '12px', backgroundColor: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>{detailDate}</span>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: 'bold' }}>QAYTGAN TOVARLAR SUMMASI</p>
          <h2 style={{ margin: '10px 0 0 0', color: '#4b5563', fontSize: '24px' }}>
            {periodExpenseSom > 0 || periodExpenseUsd === 0 ? `${periodExpenseSom.toLocaleString()} so'm` : ''}
            {periodExpenseSom > 0 && periodExpenseUsd > 0 && <br/>}
            {periodExpenseUsd > 0 ? `${periodExpenseUsd.toLocaleString()} $` : ''}
          </h2>
        </div>
        <div className="card" style={{ flex: '1 1 250px', padding: '25px', backgroundColor: '#1e3a8a', color: 'white', border: 'none', position: 'relative' }}>
          <span style={{ position: 'absolute', top: '15px', right: '15px', fontSize: '12px', backgroundColor: '#3b82f6', color: '#ffffff', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>{detailDate}</span>
          <p style={{ margin: 0, color: '#d1d5db', fontSize: '14px', fontWeight: 'bold' }}>SOF SAVDO</p>
          <h2 style={{ margin: '10px 0 0 0', color: '#ffffff', fontSize: '24px' }}>
            {periodNetProfitSom !== 0 || periodNetProfitUsd === 0 ? `${periodNetProfitSom.toLocaleString()} so'm` : ''}
            {periodNetProfitSom !== 0 && periodNetProfitUsd !== 0 && <br/>}
            {periodNetProfitUsd !== 0 ? `${periodNetProfitUsd.toLocaleString()} $` : ''}
          </h2>
        </div>
      </div>

      <button onClick={() => setShowHistory(!showHistory)} className="btn btn-primary" style={{ marginBottom: '30px', display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
        <BarChart3 size={20} /> {showHistory ? "Qisqa tarixni yopish 🔼" : "Qisqa tarixga kirish 🔽"}
      </button>

      {showHistory && (
        <div className="fade-in card" style={{ padding: '20px', marginBottom: '30px', backgroundColor: '#f9fafb' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button className="btn" style={{ padding: '8px', flex: 1, backgroundColor: historyType === 'daily' ? '#1e3a8a' : '#e5e7eb', color: historyType === 'daily' ? 'white' : '#1f2937' }} onClick={() => setHistoryType('daily')}>Kunlik</button>
            <button className="btn" style={{ padding: '8px', flex: 1, backgroundColor: historyType === 'monthly' ? '#1e3a8a' : '#e5e7eb', color: historyType === 'monthly' ? 'white' : '#1f2937' }} onClick={() => setHistoryType('monthly')}>Oylik</button>
            <button className="btn" style={{ padding: '8px', flex: 1, backgroundColor: historyType === 'yearly' ? '#1e3a8a' : '#e5e7eb', color: historyType === 'yearly' ? 'white' : '#1f2937' }} onClick={() => setHistoryType('yearly')}>Yillik</button>
          </div>
          {aggregatedHistory.length === 0 ? <p style={{ textAlign: 'center', color: '#6b7280' }}>Hozircha ma'lumot yo'q.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {aggregatedHistory.map((item, index) => {
                const netSom = item.incomeSom - item.expenseSom;
                const netUsd = item.incomeUsd - item.expenseUsd;
                return (
                  <div key={index} style={{ padding: '15px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontWeight: 'bold', color: '#1f2937', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>{item.label}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ color: '#10b981', fontSize: '14px', fontWeight: 'bold' }}>
                        Sotuv: {item.incomeSom > 0 ? `+${item.incomeSom.toLocaleString()} so'm ` : ''} 
                        {item.incomeUsd > 0 ? `+${item.incomeUsd.toLocaleString()} $` : ''}
                      </div>
                      <div style={{ color: '#ef4444', fontSize: '14px', fontWeight: 'bold' }}>
                        Vozvrat: {item.expenseSom > 0 ? `-${item.expenseSom.toLocaleString()} so'm ` : ''}
                        {item.expenseUsd > 0 ? `-${item.expenseUsd.toLocaleString()} $` : ''}
                      </div>
                      <div style={{ color: '#1e3a8a', fontSize: '14px', fontWeight: 'bold' }}>
                        Sof: {netSom !== 0 || netUsd === 0 ? `${netSom.toLocaleString()} so'm ` : ''}
                        {netUsd !== 0 ? `${netUsd.toLocaleString()} $` : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ maxWidth: '700px', margin: '0 auto', borderTop: '4px solid #1e3a8a' }}>
        <div style={{ marginBottom: '25px', paddingBottom: '20px', borderBottom: '2px dashed #e5e7eb' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 'bold', color: '#111827', fontSize: '16px' }}>
            <User size={20} color="#1e3a8a" /> Mijozni tanlang
          </label>
          <select 
            className="form-control" 
            value={customer} 
            onChange={(e) => setCustomer(e.target.value)} 
            style={{ backgroundColor: '#f3f4f6', cursor: 'pointer' }}
          >
            <option value="">-- Mijozlar ro'yxatidan tanlang --</option>
            <option value="Chakana xaridor">Chakana xaridor (Oddiy savdo)</option>
            {customers.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <form onSubmit={handleAddToCart}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '15px' }}>
            
            <div style={{ display: 'flex', gap: '10px', backgroundColor: '#f3f4f6', padding: '5px', borderRadius: '12px' }}>
              <button 
                type="button"
                className="btn" 
                style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: sellMode === 'inventory' ? '#1e3a8a' : 'transparent', color: sellMode === 'inventory' ? 'white' : '#4b5563', border: 'none', boxShadow: sellMode === 'inventory' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none' }}
                onClick={() => setSellMode('inventory')}
              >
                <PackageOpen size={18} /> Ombordan tanlash
              </button>
              <button 
                type="button"
                className="btn" 
                style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: sellMode === 'custom' ? '#10b981' : 'transparent', color: sellMode === 'custom' ? 'white' : '#4b5563', border: 'none', boxShadow: sellMode === 'custom' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none' }}
                onClick={() => setSellMode('custom')}
              >
                <Tag size={18} /> Erkin savdo
              </button>
            </div>

            <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              
              {sellMode === 'inventory' ? (
                <>
                  <label style={{ fontWeight: '600', display: 'block', marginBottom: '10px', color: '#374151' }}>Tovarni qidirish va tanlash</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ position: 'relative' }}>
                      <Filter size={18} color="#6b7280" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                      <input 
                        type="text" className="form-control" placeholder="Bo'limi bo'yicha qidirish..." 
                        value={categoryQuery} onChange={(e) => setCategoryQuery(e.target.value)} 
                        style={{ marginBottom: 0, paddingLeft: '38px', backgroundColor: '#ffffff', width: '100%' }} 
                      />
                    </div>
                    <div style={{ position: 'relative' }}>
                      <Search size={18} color="#6b7280" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                      <input 
                        type="text" className="form-control" placeholder="Nomi bo'yicha qidirish..." 
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
                        style={{ marginBottom: 0, paddingLeft: '38px', backgroundColor: '#ffffff', width: '100%' }} 
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <select 
                        className="form-control" 
                        value={selectedProductId} 
                        onChange={(e) => {
                          setSelectedProductId(e.target.value);
                          setPriceMode('original'); 
                          setInventoryCustomPrice('');
                        }} 
                        style={{ marginBottom: 0, flex: 1 }}
                      >
                        <option value="">-- Ro'yxatdan tanlang --</option>
                        <option value="" disabled style={{color: 'gray'}}>Mavjud tovarlar</option>
                        {filteredProducts.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (Qoldi: {p.quantity} {p.unit})</option>
                        ))}
                      </select>
                      {(selectedProductId || searchQuery || categoryQuery) && (
                        <button type="button" onClick={handleClearSelection} className="btn btn-danger" style={{ width: '46px', height: '46px', padding: '0', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                          <X size={20} />
                        </button>
                      )}
                    </div>
                    
                    {selectedProduct && (
                      <div className="fade-in" style={{ marginTop: '10px', backgroundColor: '#eff6ff', padding: '15px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                           <span style={{ fontSize: '14px', color: '#1e40af', fontWeight: 'bold' }}>Sotish narxini belgilash:</span>
                           <span style={{ fontSize: '14px', color: '#475569' }}>
                             Asl narx: <b>{selectedProduct.price.toLocaleString()}</b> {isUsdUnit(selectedProduct.unit) ? '$' : "so'm"}
                           </span>
                         </div>
                         <div style={{ display: 'flex', gap: '10px' }}>
                           <button 
                             type="button" 
                             onClick={() => { setPriceMode('original'); setError(''); }} 
                             className="btn" 
                             style={{ flex: 1, backgroundColor: priceMode === 'original' ? '#1e3a8a' : 'white', color: priceMode === 'original' ? 'white' : '#334155', border: '1px solid #cbd5e1', padding: '10px' }}
                           >
                             O'zini narxida
                           </button>
                           <button 
                             type="button" 
                             onClick={() => { setPriceMode('custom'); setError(''); }} 
                             className="btn" 
                             style={{ flex: 1, backgroundColor: priceMode === 'custom' ? '#1e3a8a' : 'white', color: priceMode === 'custom' ? 'white' : '#334155', border: '1px solid #cbd5e1', padding: '10px' }}
                           >
                             Boshqa narx
                           </button>
                         </div>
                         {priceMode === 'custom' && (
                             <div className="fade-in" style={{ marginTop: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <DollarSign size={20} color="#64748b" />
                                <input 
                                  type="number" 
                                  className="form-control" 
                                  placeholder="Yangi narxni kiriting..." 
                                  value={inventoryCustomPrice} 
                                  onChange={e => { setInventoryCustomPrice(e.target.value); setError(''); }} 
                                  style={{ marginBottom: 0, flex: 1 }} 
                                />
                                <span style={{ fontWeight: 'bold', color: '#475569' }}>
                                  {isUsdUnit(selectedProduct.unit) ? '$' : "so'm"}
                                </span>
                             </div>
                         )}
                      </div>
                    )}

                  </div>
                </>
              ) : (
                <div className="fade-in">
                  <label style={{ fontWeight: '600', display: 'block', marginBottom: '10px', color: '#10b981' }}>Tavar ma'lumotlarini qo'lda kiriting</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input 
                      type="text" className="form-control" placeholder="Tavar nomi (Masalan: Bolt, Sement...)" 
                      value={customName} onChange={(e) => { setCustomName(e.target.value); setError(''); }} 
                      style={{ marginBottom: 0, backgroundColor: '#ffffff', width: '100%' }} 
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input 
                        type="number" className="form-control" placeholder="Tan narxi (Ixtiyoriy)" 
                        value={customCostPrice} onChange={(e) => { setCustomCostPrice(e.target.value); setError(''); }} 
                        style={{ marginBottom: 0, flex: 1 }} min="0" step="any"
                      />
                      <input 
                        type="number" className="form-control" placeholder="Sotilish narxi" 
                        value={customPrice} onChange={(e) => { setCustomPrice(e.target.value); setError(''); }} 
                        style={{ marginBottom: 0, flex: 1 }} min="0" step="any"
                      />
                      <select 
                        className="form-control" 
                        value={customCurrency} onChange={(e) => setCustomCurrency(e.target.value)} 
                        style={{ marginBottom: 0, flex: 1, backgroundColor: '#f3f4f6' }}
                      >
                        <option value="som">so'm</option>
                        <option value="usd">USD ($)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch', flexWrap: 'wrap' }}>
              {((sellMode === 'inventory' && selectedProduct) || sellMode === 'custom') && (
                <div className="fade-in" style={{ flex: '1 1 200px', display: 'flex', gap: '8px' }}>
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder={`Miqdor`} 
                    value={sellQty} 
                    onChange={(e) => { setSellQty(e.target.value); setError(''); }} 
                    min="0.1" step="any" 
                    style={{ marginBottom: 0, height: '46px', flex: '2' }} 
                  />
                  
                  {sellMode === 'custom' && (
                      <select 
                        className="form-control"
                        value={sellUnit}
                        onChange={(e) => setSellUnit(e.target.value)}
                        style={{ marginBottom: 0, height: '46px', flex: '1.2', backgroundColor: '#f3f4f6', padding: '0 8px' }}
                      >
                        <option value="dona">dona</option>
                        <option value="kv">kv</option>
                        <option value="metr">metr</option>
                        <option value="pachka">pachka</option>
                        <option value="kg">kg</option>
                        <option value="qop">qop</option>
                        <option value="komplekt">komplekt</option>
                      </select>
                  )}

                  {sellMode === 'inventory' && selectedProduct && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 15px', backgroundColor: '#e2e8f0', borderRadius: '8px', color: '#475569', fontWeight: 'bold' }}>
                          {selectedProduct.unit.replace('$', '').trim() || 'birlik'}
                      </div>
                  )}

                </div>
              )}
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ flex: ((sellMode === 'inventory' && selectedProduct) || sellMode === 'custom') ? '1 1 150px' : '100%', height: '46px', backgroundColor: sellMode === 'custom' ? '#10b981' : '#1e3a8a' }} 
                disabled={sellMode === 'inventory' && !selectedProduct && products.length > 0}
              >
                <PlusCircle size={20} /> Savatga qo'shish
              </button>
            </div>
          </div>
        </form>

        {error && <div style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '15px' }}>{error}</div>}

        {cart.length > 0 && (
          <div className="fade-in" style={{ marginTop: '30px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#1f2937', borderBottom: '1px solid #d1d5db', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}><ShoppingCart size={20} color="#1e3a8a" /> Savatdagi tovarlar</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {cart.map((item, index) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '10px 15px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 'bold', color: '#111827' }}>
                      {index + 1}. {item.product.name}
                      {item.isCustom && <span style={{ marginLeft: '8px', fontSize: '11px', backgroundColor: '#d1fae5', color: '#065f46', padding: '2px 6px', borderRadius: '4px' }}>Erkin savdo</span>}
                    </p>
                    <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                      {item.qty} {item.product.unit} x {item.product.price.toLocaleString()} {isUsdUnit(item.product.unit) ? '$' : "so'm"}
                    </p>
                  </div>
                  <div style={{ fontWeight: 'bold', color: isUsdUnit(item.product.unit) ? '#10b981' : '#1e3a8a', marginRight: '15px' }}>
                    {item.total.toLocaleString()} {isUsdUnit(item.product.unit) ? '$' : "so'm"}
                  </div>
                  <button onClick={() => handleRemoveFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px' }}>✖</button>
                </div>
              ))}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e5e7eb', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#374151' }}>Umumiy Summa:</span>
              <div style={{ textAlign: 'right' }}>
                {cartTotalSom > 0 && <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e3a8a' }}>{cartTotalSom.toLocaleString()} so'm</div>}
                {cartTotalUsd > 0 && <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>{cartTotalUsd.toLocaleString()} $</div>}
              </div>
            </div>

            <button 
              onClick={handleFinalSell} 
              className="btn btn-primary" 
              style={{ fontSize: '18px', padding: '16px', display: 'flex', gap: '8px', justifyContent: 'center', width: '100%', backgroundColor: '#1e3a8a', color: 'white', border: 'none', borderRadius: '8px' }}
            >
              <CheckCircle size={22} /> Tasdiqlash va Sotish
            </button>
          </div>
        )}
      </div>

      <div className="card" style={{ maxWidth: '100%', marginTop: '40px', borderTop: '4px solid #4b5563' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ClipboardList size={22} color="#4b5563" /> Batafsil savdolar jadvali
        </h3>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '10px', flex: '1 1 300px' }}>
            <button className="btn" style={{ padding: '8px', flex: 1, backgroundColor: detailFilter === 'daily' ? '#1e3a8a' : '#e5e7eb', color: detailFilter === 'daily' ? 'white' : '#1f2937' }} onClick={() => handleDetailFilterChange('daily')}>Kunlik</button>
            <button className="btn" style={{ padding: '8px', flex: 1, backgroundColor: detailFilter === 'monthly' ? '#1e3a8a' : '#e5e7eb', color: detailFilter === 'monthly' ? 'white' : '#1f2937' }} onClick={() => handleDetailFilterChange('monthly')}>Oylik</button>
            <button className="btn" style={{ padding: '8px', flex: 1, backgroundColor: detailFilter === 'yearly' ? '#1e3a8a' : '#e5e7eb', color: detailFilter === 'yearly' ? 'white' : '#1f2937' }} onClick={() => handleDetailFilterChange('yearly')}>Yillik</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f9fafb', padding: '5px 15px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
            <Filter size={18} color="#4b5563" /><span style={{ fontWeight: '500', color: '#374151' }}>Sanani tanlang:</span>
            {detailFilter === 'daily' && <input type="date" value={detailDate} onChange={(e) => setDetailDate(e.target.value)} className="form-control" style={{ width: 'auto', marginBottom: 0, padding: '8px', height: '40px' }} />}
            {detailFilter === 'monthly' && <input type="month" value={detailDate} onChange={(e) => setDetailDate(e.target.value)} className="form-control" style={{ width: 'auto', marginBottom: 0, padding: '8px', height: '40px' }} />}
            {detailFilter === 'yearly' && <input type="number" min="2020" max="2050" value={detailDate} onChange={(e) => setDetailDate(e.target.value)} className="form-control" style={{ width: 'auto', marginBottom: 0, padding: '8px', height: '40px' }} />}
          </div>
        </div>

        {tableData.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px dashed #d1d5db' }}>Tanlangan sana (<b>{detailDate}</b>) uchun hech qanday ma'lumot yo'q.</p>
        ) : (
          <div className="fade-in">
            <div style={{ backgroundColor: '#f3f4f6', padding: '15px', borderRadius: '8px 8px 0 0', border: '1px solid #e5e7eb', borderBottom: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 'bold', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}><CalendarDays size={18} /> Sana: {detailDate}</span>
              <span style={{ fontWeight: 'bold', color: '#111827', fontSize: '16px' }}>
                Jami tushum: {periodIncomeSom > 0 || periodIncomeUsd === 0 ? `${periodIncomeSom.toLocaleString()} so'm ` : ''}
                {periodIncomeUsd > 0 ? `va ${periodIncomeUsd.toLocaleString()} $` : ''}
              </span>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '14px', borderBottom: '2px solid #e5e7eb', color: '#4b5563', backgroundColor: '#f9fafb' }}>Xaridor (Mijoz)</th>
                    <th style={{ textAlign: 'left', padding: '14px', borderBottom: '2px solid #e5e7eb', color: '#4b5563', backgroundColor: '#f9fafb' }}>Jami Summa</th>
                    <th style={{ textAlign: 'left', padding: '14px', borderBottom: '2px solid #e5e7eb', color: '#4b5563', backgroundColor: '#f9fafb' }}>Olingan tovarlar</th>
                    <th style={{ textAlign: 'right', padding: '14px', borderBottom: '2px solid #e5e7eb', color: '#4b5563', backgroundColor: '#f9fafb' }}>Sana/Vaqt</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '14px', color: '#1e3a8a', fontWeight: 'bold' }}>
                        {item.customer}
                        {!item.isReceived && !item.isDebt && (
                           <div style={{ marginTop: '4px', fontSize: '11px', color: '#f59e0b', fontWeight: 'bold' }}>
                             (Kassada kutilmoqda)
                           </div>
                        )}
                        {item.wasDebt && (
                           <div style={{ marginTop: '4px', fontSize: '11px', color: '#b45309', fontWeight: 'bold' }}>
                             (Qarzdan to'landi)
                           </div>
                        )}
                      </td>

                      <td style={{ padding: '14px', color: isUsdProduct(item.productName) ? '#10b981' : '#1e3a8a', fontWeight: 'bold', fontSize: '16px' }}>
                        +{(Number(item.totalSum) || Number(item.total) || 0).toLocaleString()} {isUsdProduct(item.productName) ? '$' : "so'm"}
                      </td>

                      <td style={{ padding: '14px', color: '#4b5563', lineHeight: '1.6', fontSize: '14px', whiteSpace: 'pre-line' }}>{item.productName}</td>
                      
                      <td style={{ padding: '14px', color: '#6b7280', fontSize: '14px', textAlign: 'right' }}>
                        {new Date(item.id).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sell;