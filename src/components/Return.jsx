import React, { useState, useMemo } from 'react';

const Return = ({ products, setProducts, returns, setReturns, setPage }) => {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [returnQty, setReturnQty] = useState('');
  const [error, setError] = useState('');

  const [showHistory, setShowHistory] = useState(false);
  const [historyType, setHistoryType] = useState('daily');

  // --- BUGUNGI STATISTIKA (FAQAT CHIQIM) ---
  const todayStr = new Date().toLocaleDateString('uz-UZ');
  
  const todayExpense = returns
    .filter(r => new Date(r.id).toLocaleDateString('uz-UZ') === todayStr)
    .reduce((acc, r) => acc + r.returnSum, 0);

  // --- TARIH VA HISOBOTLAR ---
  const aggregatedHistory = useMemo(() => {
    const map = {};
    const getKeyAndLabel = (timestamp) => {
      const d = new Date(timestamp);
      if (historyType === 'daily') return { key: d.toLocaleDateString('uz-UZ'), label: d.toLocaleDateString('uz-UZ') + " dagi" };
      if (historyType === 'monthly') {
        const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
        return { key: `${d.getFullYear()}-${d.getMonth()}`, label: `${months[d.getMonth()]} ${d.getFullYear()} dagi` };
      }
      return { key: d.getFullYear().toString(), label: `${d.getFullYear()} yildagi` };
    };

    returns.forEach(r => {
      const { key, label } = getKeyAndLabel(r.id);
      if (!map[key]) map[key] = { label, expense: 0, timestamp: r.id };
      map[key].expense += r.returnSum;
    });

    return Object.values(map).sort((a, b) => b.timestamp - a.timestamp);
  }, [returns, historyType]);

  const selectedProduct = products.find(p => p.id.toString() === selectedProductId);

  // --- QAYTARISH FUNKSIYASI ---
  const handleReturn = (e) => {
    e.preventDefault();
    setError('');
    
    if (!selectedProduct) return setError("Iltimos, avval tovarni tanlang!");
    
    const qty = parseFloat(returnQty);
    if (qty <= 0 || isNaN(qty)) return setError("Miqdor to'g'ri emas!");

    const returnSum = qty * selectedProduct.price;

    const updatedProducts = products.map(p => 
      p.id === selectedProduct.id ? { ...p, quantity: p.quantity + qty } : p
    );
    setProducts(updatedProducts);

    const newReturn = {
      id: Date.now(),
      productName: selectedProduct.name,
      unit: selectedProduct.unit,
      quantity: qty,
      returnSum
    };
    
    setReturns([...returns, newReturn]);
    setReturnQty(''); 
    setSelectedProductId('');
    
    alert(`↩️ Qaytarib olindi!\n\nChiqim (Mijozga berilgan pul): ${returnSum.toLocaleString()} so'm`);
  };

  return (
    <div className="fade-in">
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => setPage('dashboard')} className="btn" style={{ width: 'auto', padding: '10px 20px', backgroundColor: '#e5e7eb', color: '#1f2937' }}>
          ⬅️ Ortga qaytish
        </button>
        <h2 style={{ fontSize: '24px', color: '#1e3a8a', margin: 0 }}>Qaytish (Vozvrat) ↩️</h2>
      </div>

      {/* CHIQIM QUTISI (To'q kulrang) */}
      <div className="card fade-in" style={{ padding: '30px', backgroundColor: '#374151', color: '#ffffff', marginBottom: '30px', textAlign: 'center', border: 'none' }}>
        <p style={{ margin: 0, fontSize: '16px', color: '#d1d5db', textTransform: 'uppercase' }}>Bugungi Jami Chiqim</p>
        <h2 style={{ margin: '10px 0 0 0', fontSize: '36px' }}>-{todayExpense.toLocaleString()} <span style={{fontSize: '20px'}}>so'm</span></h2>
      </div>

      <button onClick={() => setShowHistory(!showHistory)} className="btn btn-danger" style={{ marginBottom: '30px' }}>
        {showHistory ? "Tarixni yopish 🔼" : "📉 Chiqimlar tarixi 🔽"}
      </button>

      {/* TARIX OYNASI */}
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
                  <div style={{ color: '#4b5563', fontSize: '18px', fontWeight: 'bold' }}>Chiqim: -{item.expense.toLocaleString()} so'm</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QAYTARISH FORMASI */}
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto', borderTop: '4px solid #4b5563' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', color: '#1f2937' }}>
          Mijozdan tovarni qaytarib olish
        </h3>
        
        <form onSubmit={handleReturn}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Qaytgan tovarni tanlang</label>
            <select className="form-control" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} required>
              <option value="">Tavarni tanlang</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          
          {selectedProduct && (
            <div className="fade-in" style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Qancha qaytdi? ({selectedProduct.unit})</label>
              <input type="number" className="form-control" placeholder="Miqdor" value={returnQty} onChange={(e) => { setReturnQty(e.target.value); setError(''); }} required min="0.1" step="any" />
            </div>
          )}

          {error && <div style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '15px' }}>{error}</div>}
          
          {selectedProduct && returnQty && !error && parseFloat(returnQty) > 0 && (
             <div className="fade-in" style={{ padding: '15px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', marginBottom: '20px' }}>
               <h4 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>Qaytarish hisobi (Chiqim):</h4>
               
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: '#4b5563', marginBottom: '5px' }}>
                 <span>1 {selectedProduct.unit} narxi:</span>
                 <span>{selectedProduct.price.toLocaleString()} so'm</span>
               </div>
               
               <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px', color: '#111827', borderTop: '1px dashed #d1d5db', paddingTop: '10px', marginTop: '10px' }}>
                 <span>Kassadan beriladigan pul:</span>
                 <span>{(parseFloat(returnQty) * selectedProduct.price).toLocaleString()} so'm</span>
               </div>
             </div>
          )}

          <button type="submit" className="btn btn-danger" style={{ fontSize: '18px', padding: '16px' }} disabled={products.length === 0}>
            Qaytarib olish va Chiqim qilish
          </button>
        </form>
      </div>
      
    </div>
  );
};

export default Return;