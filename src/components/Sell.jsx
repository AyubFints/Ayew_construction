import React, { useState, useMemo } from 'react';
import { ShoppingCart, ArrowLeft, BarChart3, User, PlusCircle, Trash2, CheckCircle, ClipboardList, CalendarDays, Filter } from 'lucide-react';

const Sell = ({ products, setProducts, sales, setSales, returns = [], setPage }) => {
  const [customer, setCustomer] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [sellQty, setSellQty] = useState('');
  const [cart, setCart] = useState([]); 
  const [error, setError] = useState('');
  
  const [showHistory, setShowHistory] = useState(false);
  const [historyType, setHistoryType] = useState('daily');
  
  const d = new Date();
  const currentDayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const currentMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const currentYearStr = `${d.getFullYear()}`;

  const [detailFilter, setDetailFilter] = useState('daily');
  const [detailDate, setDetailDate] = useState(currentDayStr);

  const handleDetailFilterChange = (type) => {
    setDetailFilter(type);
    if (type === 'daily') setDetailDate(currentDayStr);
    else if (type === 'monthly') setDetailDate(currentMonthStr);
    else setDetailDate(currentYearStr);
  };

  const todayStr = d.toLocaleDateString('uz-UZ');
  
  const todayIncome = sales
    .filter(s => s.isReceived && new Date(s.receivedAt || s.id).toLocaleDateString('uz-UZ') === todayStr)
    .reduce((acc, s) => acc + s.totalSum, 0);
    
  const todayExpense = returns
    .filter(r => new Date(r.id).toLocaleDateString('uz-UZ') === todayStr)
    .reduce((acc, r) => acc + r.returnSum, 0);
    
  const todayNetProfit = todayIncome - todayExpense;

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
      if (s.isReceived) { 
        const timeToUse = s.receivedAt || s.id; 
        const { key, label } = getKeyAndLabel(timeToUse);
        if (!map[key]) map[key] = { label, income: 0, expense: 0, timestamp: timeToUse };
        map[key].income += s.totalSum;
      }
    });

    returns.forEach(r => {
      const { key, label } = getKeyAndLabel(r.id);
      if (!map[key]) map[key] = { label, income: 0, expense: 0, timestamp: r.id };
      map[key].expense += r.returnSum;
    });

    return Object.values(map).sort((a, b) => b.timestamp - a.timestamp);
  }, [sales, returns, historyType]);

  const tableData = useMemo(() => {
    return sales.filter(s => {
      if (!s.isReceived) return false;
      const t = new Date(s.receivedAt || s.id);
      const y = t.getFullYear();
      const m = String(t.getMonth() + 1).padStart(2, '0');
      const dayStr = String(t.getDate()).padStart(2, '0');
      
      if (detailFilter === 'daily') return `${y}-${m}-${dayStr}` === detailDate;
      if (detailFilter === 'monthly') return `${y}-${m}` === detailDate;
      return `${y}` === detailDate;
    }).sort((a, b) => b.id - a.id);
  }, [sales, detailFilter, detailDate]);

  const tableTotalSum = tableData.reduce((acc, curr) => acc + curr.totalSum, 0);
  const selectedProduct = products.find(p => p.id.toString() === selectedProductId);

  const handleAddToCart = (e) => {
    e.preventDefault();
    setError('');
    if (!selectedProduct) return setError("Iltimos, avval tovarni tanlang!");
    const qty = parseFloat(sellQty);
    if (qty <= 0 || isNaN(qty)) return setError("Miqdorni to'g'ri kiriting!");
    const alreadyInCart = cart.filter(item => item.product.id === selectedProduct.id).reduce((sum, item) => sum + item.qty, 0);
    if (qty + alreadyInCart > selectedProduct.quantity) return setError(`Omborda yetarli emas! Qoldiq: ${selectedProduct.quantity} ${selectedProduct.unit}`);

    setCart([...cart, { id: Date.now(), product: selectedProduct, qty: qty, total: qty * selectedProduct.price }]);
    setSelectedProductId(''); setSellQty('');
  };

  const handleRemoveFromCart = (cartItemId) => setCart(cart.filter(item => item.id !== cartItemId));

  const handleFinalSell = () => {
    if (!customer) return setError("Mijoz ismini kiriting!");
    if (cart.length === 0) return setError("Savat bo'sh! Tovar qo'shing.");

    let updatedProducts = [...products];
    cart.forEach(cartItem => { updatedProducts = updatedProducts.map(p => p.id === cartItem.product.id ? { ...p, quantity: p.quantity - cartItem.qty } : p); });
    setProducts(updatedProducts);

    const overallTotal = cart.reduce((sum, item) => sum + item.total, 0);
    const combinedNames = cart.map(item => `${item.product.name} (${item.qty} ${item.product.unit})`).join(', ');

    setSales([...sales, { id: Date.now(), productName: combinedNames, unit: 'xil tovar', quantity: cart.length, customer, totalSum: overallTotal, isReceived: false }]);
    setCart([]); setCustomer(''); setError('');
    alert(`✅ Savdo yakunlandi! Jami summa: ${overallTotal.toLocaleString()} so'm\n(Kassada tasdiqlanmaguncha tarixda ko'rinmaydi)`);
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => setPage('dashboard')} className="btn" style={{ width: 'auto', padding: '10px 20px', backgroundColor: '#e5e7eb', color: '#1f2937', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ArrowLeft size={18} /> Ortga qaytish
        </button>
        <h2 style={{ fontSize: '24px', color: '#1e3a8a', margin: 0, display: 'flex', gap: '10px', alignItems: 'center' }}>Sotish bo'limi <ShoppingCart size={28} /></h2>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: '1 1 250px', padding: '25px', backgroundColor: '#ffffff', borderTop: '4px solid #1e3a8a' }}><p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: 'bold' }}>KIRIM</p><h2 style={{ margin: '10px 0 0 0', color: '#1e3a8a', fontSize: '28px' }}>{todayIncome.toLocaleString()} so'm</h2></div>
        <div className="card" style={{ flex: '1 1 250px', padding: '25px', backgroundColor: '#ffffff', borderTop: '4px solid #4b5563' }}><p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: 'bold' }}>CHIQIM</p><h2 style={{ margin: '10px 0 0 0', color: '#4b5563', fontSize: '28px' }}>{todayExpense.toLocaleString()} so'm</h2></div>
        <div className="card" style={{ flex: '1 1 250px', padding: '25px', backgroundColor: '#1e3a8a', color: 'white', border: 'none' }}><p style={{ margin: 0, color: '#d1d5db', fontSize: '14px', fontWeight: 'bold' }}>SOF FOYDA</p><h2 style={{ margin: '10px 0 0 0', color: '#ffffff', fontSize: '28px' }}>{todayNetProfit.toLocaleString()} so'm</h2></div>
      </div>

      <button onClick={() => setShowHistory(!showHistory)} className="btn btn-danger" style={{ marginBottom: '30px', display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {aggregatedHistory.map((item, index) => (
                <div key={index} style={{ padding: '15px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 'bold', width: '100%', marginBottom: '8px', color: '#1f2937' }}>{item.label}</div>
                  <div style={{ color: '#1e3a8a', fontSize: '14px', fontWeight: 'bold' }}>Kirim: +{item.income.toLocaleString()}</div>
                  <div style={{ color: '#4b5563', fontSize: '14px', fontWeight: 'bold' }}>Chiqim: -{item.expense.toLocaleString()}</div>
                  <div style={{ color: '#111827', fontSize: '14px', fontWeight: 'bold' }}>Foyda: {(item.income - item.expense).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ maxWidth: '700px', margin: '0 auto', borderTop: '4px solid #1e3a8a' }}>
        <div style={{ marginBottom: '25px', paddingBottom: '20px', borderBottom: '2px dashed #e5e7eb' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 'bold', color: '#111827', fontSize: '16px' }}><User size={20} color="#1e3a8a" /> Mijoz ismi</label>
          <input type="text" className="form-control" placeholder="Mijoz ismini yozing" value={customer} onChange={(e) => setCustomer(e.target.value)} style={{ backgroundColor: '#f3f4f6' }} />
        </div>

        <form onSubmit={handleAddToCart}>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '15px' }}>
            <div style={{ flex: '2 1 200px' }}><label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Tovarni tanlang</label><select className="form-control" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} style={{ marginBottom: 0 }}><option value="">-- Tanlang --</option>{products.map(p => <option key={p.id} value={p.id}>{p.name} (Qoldi: {p.quantity} {p.unit})</option>)}</select></div>
            {selectedProduct && <div className="fade-in" style={{ flex: '1 1 100px' }}><label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Hajmi</label><input type="number" className="form-control" placeholder="Miqdor" value={sellQty} onChange={(e) => { setSellQty(e.target.value); setError(''); }} min="0.1" step="any" style={{ marginBottom: 0 }} /></div>}
            <button type="submit" className="btn btn-danger" style={{ flex: '1 1 150px', height: '50px', display: 'flex', gap: '8px', justifyContent: 'center' }} disabled={products.length === 0}><PlusCircle size={20} /> Savatga</button>
          </div>
        </form>

        {error && <div style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '15px' }}>{error}</div>}

        {cart.length > 0 && (
          <div className="fade-in" style={{ marginTop: '30px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#1f2937', borderBottom: '1px solid #d1d5db', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}><ShoppingCart size={20} color="#1e3a8a" /> Savatdagi tovarlar</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {cart.map((item, index) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '10px 15px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                  <div style={{ flex: 1 }}><p style={{ margin: 0, fontWeight: 'bold', color: '#111827' }}>{index + 1}. {item.product.name}</p><p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#6b7280' }}>{item.qty} {item.product.unit} x {item.product.price.toLocaleString()} so'm</p></div>
                  <div style={{ fontWeight: 'bold', color: '#1e3a8a', marginRight: '15px' }}>{item.total.toLocaleString()} so'm</div>
                  <button onClick={() => handleRemoveFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px' }}>✖</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e5e7eb', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}><span style={{ fontSize: '16px', fontWeight: 'bold', color: '#374151' }}>Umumiy Summa:</span><span style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e3a8a' }}>{cart.reduce((sum, item) => sum + item.total, 0).toLocaleString()} so'm</span></div>
            <button onClick={handleFinalSell} className="btn btn-primary" style={{ fontSize: '18px', padding: '16px', display: 'flex', gap: '8px', justifyContent: 'center' }}><CheckCircle size={22} /> Tasdiqlash va Sotish</button>
          </div>
        )}
      </div>

      <div className="card" style={{ maxWidth: '100%', marginTop: '40px', borderTop: '4px solid #4b5563' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}><ClipboardList size={22} color="#4b5563" /> Batafsil savdolar jadvali</h3>

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
            <div style={{ backgroundColor: '#f3f4f6', padding: '15px', borderRadius: '8px 8px 0 0', border: '1px solid #e5e7eb', borderBottom: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}><CalendarDays size={18} /> Sana: {detailDate}</span>
              <span style={{ fontWeight: 'bold', color: '#111827', fontSize: '16px' }}>Shu kundagi jami tushum: {tableTotalSum.toLocaleString()} so'm</span>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '14px', borderBottom: '2px solid #e5e7eb', color: '#4b5563', backgroundColor: '#f9fafb' }}>Sana/Vaqt</th>
                    <th style={{ textAlign: 'left', padding: '14px', borderBottom: '2px solid #e5e7eb', color: '#4b5563', backgroundColor: '#f9fafb' }}>Xaridor (Mijoz)</th>
                    <th style={{ textAlign: 'left', padding: '14px', borderBottom: '2px solid #e5e7eb', color: '#4b5563', backgroundColor: '#f9fafb' }}>Olingan tovarlar</th>
                    <th style={{ textAlign: 'right', padding: '14px', borderBottom: '2px solid #e5e7eb', color: '#4b5563', backgroundColor: '#f9fafb' }}>Summa</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '14px', color: '#6b7280', fontSize: '14px' }}>
                        {new Date(item.receivedAt || item.id).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '14px', color: '#111827', fontWeight: '500' }}>
                        {item.customer}
                        {/* QARZDAN TUSHGAN LIGINI KO'RSATUVCHI BELGI */}
                        {item.wasDebt && (
                           <div style={{ marginTop: '4px', fontSize: '12px', color: '#b45309', fontWeight: 'bold' }}>
                             (Qarzdan to'landi)
                           </div>
                        )}
                      </td>
                      <td style={{ padding: '14px', color: '#4b5563', lineHeight: '1.5', fontSize: '14px' }}>{item.productName}</td>
                      <td style={{ padding: '14px', color: '#1e3a8a', fontWeight: 'bold', textAlign: 'right' }}>
                        {item.totalSum.toLocaleString()}
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