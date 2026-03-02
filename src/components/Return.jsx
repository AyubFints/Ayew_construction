import React, { useState, useMemo } from 'react';
import { RotateCcw, ArrowLeft, BarChart3, User, PlusCircle, CheckCircle, ClipboardList, CalendarDays, Filter, PackageMinus, Search, X } from 'lucide-react';

const Return = ({ products, setProducts, returns, setReturns, setPage }) => {
  const [customer, setCustomer] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [returnQty, setReturnQty] = useState('');
  
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

  // --- ZIRHLI MANTIQ: Sanani xatosiz tekshirish ---
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

  // Jadval ma'lumotlari
  const tableData = useMemo(() => {
    return returns.filter(r => isMatchDate(r.id)).sort((a, b) => b.id - a.id);
  }, [returns, detailFilter, detailDate]);

  // --- DINAMIK HISOBLASH (Faqat tanlangan sana uchun ishlaydi) ---
  const periodExpense = tableData.reduce((acc, curr) => acc + (Number(curr.returnSum) || Number(curr.totalSum) || 0), 0);
  const tableTotalExpense = periodExpense;

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

    returns.forEach(r => {
      const { key, label } = getKeyAndLabel(r.id);
      if (!map[key]) map[key] = { label, expense: 0, timestamp: r.id };
      map[key].expense += (Number(r.returnSum) || Number(r.totalSum) || 0);
    });

    return Object.values(map).sort((a, b) => b.timestamp - a.timestamp);
  }, [returns, historyType]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedProduct = products.find(p => p.id.toString() === selectedProductId);

  // Tanlovni bekor qilish (Tozalash)
  const handleClearSelection = () => {
    setSearchQuery('');
    setSelectedProductId('');
    setReturnQty('');
    setError('');
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    setError('');
    
    if (!selectedProduct) return setError("Iltimos, avval tovarni tanlang!");
    
    const qty = parseFloat(returnQty);
    if (qty <= 0 || isNaN(qty)) return setError("Miqdor to'g'ri emas!");

    const itemTotal = qty * selectedProduct.price;

    setCart([...cart, { id: Date.now(), product: selectedProduct, qty: qty, total: itemTotal }]);
    handleClearSelection();
  };

  const handleRemoveFromCart = (cartItemId) => setCart(cart.filter(item => item.id !== cartItemId));

  const handleFinalReturn = () => {
    if (cart.length === 0) return setError("Savat bo'sh! Qaytarilayotgan tovarni qo'shing.");

    let updatedProducts = [...products];
    cart.forEach(cartItem => {
      updatedProducts = updatedProducts.map(p => 
        p.id === cartItem.product.id ? { ...p, quantity: p.quantity + cartItem.qty } : p
      );
    });
    setProducts(updatedProducts);

    const overallTotal = cart.reduce((sum, item) => sum + item.total, 0);
    
    // YANGLANGAN FORMAT: Har bir mahsulot yangi qatorda va narxi bilan
    const combinedNames = cart.map(item => `• ${item.product.name} — ${item.qty} ${item.product.unit} (1 ${item.product.unit} = ${item.product.price.toLocaleString()} so'm)`).join('\n');

    const newReturn = {
      id: Date.now(),
      productName: combinedNames,
      unit: 'xil tovar',
      quantity: cart.length,
      customer: customer || "Noma'lum",
      returnSum: overallTotal
    };

    setReturns([...returns, newReturn]);
    setCart([]); setCustomer(''); setError('');
    alert(`↩️ Qaytish muvaffaqiyatli amalga oshirildi!\n\nMahsulotlar omborga qaytdi.\nChiqim (Kassadan beriladigan pul): ${overallTotal.toLocaleString()} so'm`);
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => setPage('dashboard')} className="btn" style={{ width: 'auto', padding: '10px 20px', backgroundColor: '#e5e7eb', color: '#1f2937', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ArrowLeft size={18} /> Ortga qaytish
        </button>
        <h2 style={{ fontSize: '24px', color: '#1e3a8a', margin: 0, display: 'flex', gap: '10px', alignItems: 'center' }}>
          Qaytish bo'limi <RotateCcw size={28} />
        </h2>
      </div>

      {/* --- DINAMIK TEPADAGI BLOK (Sanaga qarab o'zgaradi) --- */}
      <div className="card fade-in" style={{ padding: '30px', backgroundColor: '#374151', color: '#ffffff', marginBottom: '30px', textAlign: 'center', border: 'none', position: 'relative' }}>
        <span style={{ position: 'absolute', top: '15px', right: '15px', fontSize: '12px', backgroundColor: '#4b5563', color: '#e5e7eb', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>{detailDate}</span>
        <p style={{ margin: 0, fontSize: '16px', color: '#d1d5db', textTransform: 'uppercase', display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
           Tanlangan kundagi Jami Chiqim
        </p>
        <h2 style={{ margin: '10px 0 0 0', fontSize: '36px' }}>-{periodExpense.toLocaleString()} <span style={{fontSize: '20px'}}>so'm</span></h2>
      </div>

      <button onClick={() => setShowHistory(!showHistory)} className="btn btn-danger" style={{ marginBottom: '30px', display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', backgroundColor: '#4b5563', border: 'none' }}>
        <BarChart3 size={20} /> {showHistory ? "Qisqa tarixni yopish 🔼" : "Qisqa tarixga kirish 🔽"}
      </button>

      {showHistory && (
        <div className="fade-in card" style={{ padding: '20px', marginBottom: '30px', backgroundColor: '#f9fafb' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button className="btn" style={{ padding: '8px', flex: 1, backgroundColor: historyType === 'daily' ? '#4b5563' : '#e5e7eb', color: historyType === 'daily' ? 'white' : '#1f2937' }} onClick={() => setHistoryType('daily')}>Kunlik</button>
            <button className="btn" style={{ padding: '8px', flex: 1, backgroundColor: historyType === 'monthly' ? '#4b5563' : '#e5e7eb', color: historyType === 'monthly' ? 'white' : '#1f2937' }} onClick={() => setHistoryType('monthly')}>Oylik</button>
            <button className="btn" style={{ padding: '8px', flex: 1, backgroundColor: historyType === 'yearly' ? '#4b5563' : '#e5e7eb', color: historyType === 'yearly' ? 'white' : '#1f2937' }} onClick={() => setHistoryType('yearly')}>Yillik</button>
          </div>

          {aggregatedHistory.length === 0 ? <p style={{ textAlign: 'center', color: '#6b7280' }}>Ma'lumot yo'q.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {aggregatedHistory.map((item, index) => (
                <div key={index} style={{ padding: '15px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '16px' }}>{item.label}</div>
                  <div style={{ color: '#ef4444', fontSize: '18px', fontWeight: 'bold' }}>Chiqim: -{item.expense.toLocaleString()} so'm</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- QAYTARISH FORMASI MOBILGA MOSLASHGAN HOLATDA --- */}
      <div className="card" style={{ maxWidth: '700px', margin: '0 auto', borderTop: '4px solid #4b5563' }}>
        
        <div style={{ marginBottom: '25px', paddingBottom: '20px', borderBottom: '2px dashed #e5e7eb' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 'bold', color: '#111827', fontSize: '16px' }}>
            <User size={20} color="#4b5563" /> Mijoz ismi (Ixtiyoriy)
          </label>
          <input type="text" className="form-control" placeholder="Mijoz ismini yozing" value={customer} onChange={(e) => setCustomer(e.target.value)} style={{ backgroundColor: '#f3f4f6' }} />
        </div>

        <form onSubmit={handleAddToCart}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '15px' }}>
            
            {/* MOBILGA MOS QIDIRUV BLOKI */}
            <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <label style={{ fontWeight: '600', display: 'block', marginBottom: '10px', color: '#374151' }}>Qaytgan tovarni qidirish va tanlash</label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={18} color="#6b7280" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Nomi bo'yicha qidirish..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    style={{ marginBottom: 0, paddingLeft: '38px', backgroundColor: '#ffffff', width: '100%' }} 
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <select className="form-control" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} style={{ marginBottom: 0, flex: 1 }}>
                    <option value="">-- Ro'yxatdan tanlang --</option>
                    {filteredProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>

                  {/* TOZALASH (X) TUGMASI */}
                  {(selectedProductId || searchQuery) && (
                    <button 
                      type="button" 
                      onClick={handleClearSelection} 
                      className="btn btn-danger" 
                      style={{ width: '46px', height: '46px', padding: '0', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, backgroundColor: '#ef4444' }}
                      title="Tanlovni bekor qilish"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* MIQDOR VA RO'YXATGA QO'SHISH YONMA-YON */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
              {selectedProduct && (
                <div className="fade-in" style={{ flex: '1' }}>
                  <input type="number" className="form-control" placeholder={`Qancha qaytdi? (${selectedProduct.unit})`} value={returnQty} onChange={(e) => { setReturnQty(e.target.value); setError(''); }} min="0.1" step="any" style={{ marginBottom: 0, height: '46px' }} />
                </div>
              )}
              
              <button type="submit" className="btn btn-primary" style={{ flex: selectedProduct ? '1' : '100%', height: '46px', display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', backgroundColor: '#4b5563', border: 'none' }} disabled={!selectedProduct && products.length > 0}>
                <PlusCircle size={20} /> Ro'yxatga qo'shish
              </button>
            </div>

          </div>
        </form>

        {error && <div style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '15px' }}>{error}</div>}

        {/* QAYTARISH SAVATCHASI */}
        {cart.length > 0 && (
          <div className="fade-in" style={{ marginTop: '30px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#1f2937', borderBottom: '1px solid #d1d5db', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PackageMinus size={20} color="#4b5563" /> Qaytarilayotgan tovarlar
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {cart.map((item, index) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '10px 15px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 'bold', color: '#111827' }}>{index + 1}. {item.product.name}</p>
                    <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#6b7280' }}>{item.qty} {item.product.unit} x {item.product.price.toLocaleString()} so'm</p>
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#4b5563', marginRight: '15px' }}>
                    {item.total.toLocaleString()} so'm
                  </div>
                  <button onClick={() => handleRemoveFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px' }}>✖</button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e5e7eb', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#374151' }}>Umumiy Chiqim:</span>
              <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#ef4444' }}>
                -{cart.reduce((sum, item) => sum + item.total, 0).toLocaleString()} so'm
              </span>
            </div>

            <button onClick={handleFinalReturn} className="btn" style={{ fontSize: '18px', padding: '16px', display: 'flex', gap: '8px', justifyContent: 'center', backgroundColor: '#374151', color: 'white', border: 'none' }}>
              <CheckCircle size={22} /> Tasdiqlash va Chiqim qilish
            </button>
          </div>
        )}
      </div>

      {/* --- BATAFSIL JADVAL (O'ZGARISH: Ustunlar tartibi almashdi) --- */}
      <div className="card" style={{ maxWidth: '100%', marginTop: '40px', borderTop: '4px solid #4b5563' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ClipboardList size={22} color="#4b5563" /> Batafsil chiqimlar jadvali
        </h3>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '10px', flex: '1 1 300px' }}>
            <button className="btn" style={{ padding: '8px', flex: 1, backgroundColor: detailFilter === 'daily' ? '#4b5563' : '#e5e7eb', color: detailFilter === 'daily' ? 'white' : '#1f2937' }} onClick={() => handleDetailFilterChange('daily')}>Kunlik</button>
            <button className="btn" style={{ padding: '8px', flex: 1, backgroundColor: detailFilter === 'monthly' ? '#4b5563' : '#e5e7eb', color: detailFilter === 'monthly' ? 'white' : '#1f2937' }} onClick={() => handleDetailFilterChange('monthly')}>Oylik</button>
            <button className="btn" style={{ padding: '8px', flex: 1, backgroundColor: detailFilter === 'yearly' ? '#4b5563' : '#e5e7eb', color: detailFilter === 'yearly' ? 'white' : '#1f2937' }} onClick={() => handleDetailFilterChange('yearly')}>Yillik</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f9fafb', padding: '5px 15px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
            <Filter size={18} color="#4b5563" /><span style={{ fontWeight: '500', color: '#374151' }}>Sanani tanlang:</span>
            {detailFilter === 'daily' && <input type="date" value={detailDate} onChange={(e) => setDetailDate(e.target.value)} className="form-control" style={{ width: 'auto', marginBottom: 0, padding: '8px', height: '40px' }} />}
            {detailFilter === 'monthly' && <input type="month" value={detailDate} onChange={(e) => setDetailDate(e.target.value)} className="form-control" style={{ width: 'auto', marginBottom: 0, padding: '8px', height: '40px' }} />}
            {detailFilter === 'yearly' && <input type="number" min="2020" max="2050" value={detailDate} onChange={(e) => setDetailDate(e.target.value)} className="form-control" style={{ width: 'auto', marginBottom: 0, padding: '8px', height: '40px' }} />}
          </div>
        </div>

        {tableData.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px dashed #d1d5db' }}>Tanlangan sana (<b>{detailDate}</b>) uchun hech qanday chiqim yo'q.</p>
        ) : (
          <div className="fade-in">
            <div style={{ backgroundColor: '#f3f4f6', padding: '15px', borderRadius: '8px 8px 0 0', border: '1px solid #e5e7eb', borderBottom: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '8px' }}><CalendarDays size={18} /> Sana: {detailDate}</span>
              <span style={{ fontWeight: 'bold', color: '#111827', fontSize: '16px' }}>Shu kundagi jami chiqim: -{tableTotalExpense.toLocaleString()} so'm</span>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '14px', borderBottom: '2px solid #e5e7eb', color: '#4b5563', backgroundColor: '#f9fafb' }}>Sana/Vaqt</th>
                    <th style={{ textAlign: 'left', padding: '14px', borderBottom: '2px solid #e5e7eb', color: '#4b5563', backgroundColor: '#f9fafb' }}>Jami Summa</th>
                    <th style={{ textAlign: 'left', padding: '14px', borderBottom: '2px solid #e5e7eb', color: '#4b5563', backgroundColor: '#f9fafb' }}>Qaytarilgan tovarlar</th>
                    <th style={{ textAlign: 'right', padding: '14px', borderBottom: '2px solid #e5e7eb', color: '#4b5563', backgroundColor: '#f9fafb' }}>Xaridor (Mijoz)</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '14px', color: '#6b7280', fontSize: '14px' }}>
                        {new Date(item.id).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '14px', color: '#ef4444', fontWeight: 'bold', fontSize: '16px' }}>
                        -{(Number(item.returnSum) || Number(item.totalSum) || 0).toLocaleString()} so'm
                      </td>
                      <td style={{ padding: '14px', color: '#4b5563', lineHeight: '1.6', fontSize: '14px', whiteSpace: 'pre-line' }}>{item.productName}</td>
                      <td style={{ padding: '14px', color: '#111827', fontWeight: 'bold', textAlign: 'right' }}>
                        {item.customer}
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

export default Return;