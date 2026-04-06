import React, { useState, useMemo } from 'react';
import { RotateCcw, ArrowLeft, BarChart3, User, PlusCircle, CheckCircle, ClipboardList, CalendarDays, Filter, PackageMinus, Search, X, TrendingDown, Landmark } from 'lucide-react';

// --- FIREBASE IMPORTLARI QO'SHILDI ---
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

const Return = ({ products, setProducts, returns, setReturns, setPage, customers = [] }) => {
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

  // --- YANGI: Dollar birligini aniqlash (Dona/$ yoki kv uchun) ---
  const isUsdUnit = (unit) => {
    if (!unit) return false;
    return unit.toLowerCase() === 'kv' || unit.includes('$');
  };

  const isUsdProduct = (productName, unit) => {
    if (isUsdUnit(unit)) return true;
    if (typeof productName === 'string' && (productName.includes(' kv ') || productName.includes('$'))) return true;
    return false;
  };
  // ---------------------------------------------------------------

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

  const tableData = useMemo(() => {
    return returns.filter(r => isMatchDate(r.id)).sort((a, b) => b.id - a.id);
  }, [returns, detailFilter, detailDate]);

  // Jami chiqimni $ va so'mga ajratib hisoblash
  const periodExpense = useMemo(() => {
    let som = 0;
    let usd = 0;
    tableData.forEach(r => {
      // Yangi formatdagi obyektdan o'qiymiz
      if (r.returnSumSom !== undefined || r.returnSumUsd !== undefined) {
        som += (Number(r.returnSumSom) || 0);
        usd += (Number(r.returnSumUsd) || 0);
      } else {
        // Eski saqlangan ma'lumotlar uchun (yangi mantiq bilan tekshiramiz)
        if (isUsdProduct(r.productName, r.unit)) usd += (Number(r.returnSum) || 0);
        else som += (Number(r.returnSum) || 0);
      }
    });
    return { som, usd };
  }, [tableData]);

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
      if (!map[key]) map[key] = { label, expenseSom: 0, expenseUsd: 0, timestamp: r.id };
      
      // Yangi format yoki eski formatga qarab ishlaymiz
      if (r.returnSumSom !== undefined || r.returnSumUsd !== undefined) {
        map[key].expenseSom += (Number(r.returnSumSom) || 0);
        map[key].expenseUsd += (Number(r.returnSumUsd) || 0);
      } else {
        if (isUsdProduct(r.productName, r.unit)) {
          map[key].expenseUsd += (Number(r.returnSum) || 0);
        } else {
          map[key].expenseSom += (Number(r.returnSum) || 0);
        }
      }
    });

    return Object.values(map).sort((a, b) => b.timestamp - a.timestamp);
  }, [returns, historyType]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedProduct = products.find(p => p.id.toString() === selectedProductId);

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

  // --- FIREBASE'GA ULANGAN VOZVRAT FUNKSIYASI ---
  const handleFinalReturn = async () => {
    if (!customer) return setError("Mijozni tanlang!");
    if (cart.length === 0) return setError("Savat bo'sh! Tovar qo'shing.");

    let updatedProducts = [...products];
    cart.forEach(cartItem => {
      updatedProducts = updatedProducts.map(p => p.id === cartItem.product.id ? { ...p, quantity: p.quantity + cartItem.qty } : p);
    });

    // Summalarni alohida hisoblaymiz (Yangi mantiq bilan)
    const totalSom = cart.filter(item => !isUsdUnit(item.product.unit)).reduce((sum, item) => sum + item.total, 0);
    const totalUsd = cart.filter(item => isUsdUnit(item.product.unit)).reduce((sum, item) => sum + item.total, 0);

    // Hamma tovarlarni bitta matnga aylantiramiz
    const combinedProductNames = cart.map(item => 
      `• ${item.product.name} — ${item.qty} ${item.product.unit} (1 ${item.product.unit} = ${item.product.price.toLocaleString()} ${isUsdUnit(item.product.unit) ? '$' : "so'm"})`
    ).join('\n');

    // Bitta umumiy obyekt qilib saqlaymiz
    const newReturnData = {
      id: Date.now(),
      productName: combinedProductNames,
      customer: customer,
      returnSumSom: totalSom,
      returnSumUsd: totalUsd,
      // Eski format ishlamay qolmasligi uchun zaxira maydon:
      unit: cart.length === 1 ? cart[0].product.unit : 'mixed', 
      returnSum: totalSom > 0 ? totalSom : totalUsd 
    };

    const yangiReturns = [...returns, newReturnData];

    setProducts(updatedProducts); // Ekranda mahsulotlarni ko'paytirish
    setReturns(yangiReturns); // Ekranda qaytish tarixini yangilash
    setCart([]); 
    setCustomer(''); 
    setError('');

    // Bulutga (Firebase) yozish (Ikkala ma'lumotni ham bitta urinishda yuboramiz)
    if (auth.currentUser) {
      try {
        const docRef = doc(db, "stores", auth.currentUser.uid);
        await setDoc(docRef, { 
          products: updatedProducts,
          returns: yangiReturns
        }, { merge: true });
      } catch (error) {
        console.error("Vozvratni bulutga saqlashda xato:", error);
      }
    }
    
    let alertMsg = '↩️ Qaytish bajarildi!\nJami chiqim:\n';
    if (totalSom > 0) alertMsg += `- ${totalSom.toLocaleString()} so'm\n`;
    if (totalUsd > 0) alertMsg += `- ${totalUsd.toLocaleString()} $`;
    alert(alertMsg);
  };

  return (
    <div className="fade-in app-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <button onClick={() => setPage('dashboard')} className="btn btn-danger" style={{ width: 'auto' }}>
          <ArrowLeft size={18} /> Orqaga
        </button>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e3a8a', margin: 0, display: 'flex', gap: '10px', alignItems: 'center' }}>
          Qaytish bo'limi <RotateCcw size={28} />
        </h2>
      </div>

      {/* --- DINAMIK TEPADAGI BLOKLAR --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="card" style={{ borderTop: '6px solid #4b5563', position: 'relative', overflow: 'hidden' }}>
          <TrendingDown size={60} style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.05 }} color="#4b5563" />
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>Jami Chiqim (Vozvrat)</p>
          <h2 style={{ margin: '10px 0 0 0', color: '#4b5563', fontSize: '24px', fontWeight: '800' }}>
            {periodExpense.som > 0 && <div>-{periodExpense.som.toLocaleString()} <span style={{fontSize: '14px'}}>so'm</span></div>}
            {periodExpense.usd > 0 && <div>-{periodExpense.usd.toLocaleString()} <span style={{fontSize: '14px'}}>$</span></div>}
            {periodExpense.som === 0 && periodExpense.usd === 0 && "0 so'm"}
          </h2>
        </div>
        
        <div className="card" style={{ background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)', color: 'white', border: 'none', position: 'relative' }}>
          <Landmark size={60} style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.1 }} color="#ffffff" />
          <p style={{ margin: 0, opacity: 0.8, fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>Tanlangan Sana</p>
          <h2 style={{ margin: '10px 0 0 0', fontSize: '24px', fontWeight: '800' }}>{detailDate}</h2>
        </div>
      </div>

      <button onClick={() => setShowHistory(!showHistory)} className="btn" style={{ marginBottom: '30px', display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', backgroundColor: '#4b5563', color: 'white' }}>
        <BarChart3 size={20} /> {showHistory ? "Qisqa tarixni yopish 🔼" : "Qisqa tarixga kirish 🔽"}
      </button>

      {showHistory && (
        <div className="fade-in card" style={{ padding: '20px', marginBottom: '30px', backgroundColor: '#f9fafb' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button className="btn" style={{ padding: '8px', flex: 1, backgroundColor: historyType === 'daily' ? '#4b5563' : '#e5e7eb', color: historyType === 'daily' ? 'white' : '#1f2937' }} onClick={() => setHistoryType('daily')}>Kunlik</button>
            <button className="btn" style={{ padding: '8px', flex: 1, backgroundColor: historyType === 'monthly' ? '#4b5563' : '#e5e7eb', color: historyType === 'monthly' ? 'white' : '#1f2937' }} onClick={() => setHistoryType('monthly')}>Oylik</button>
            <button className="btn" style={{ padding: '8px', flex: 1, backgroundColor: historyType === 'yearly' ? '#4b5563' : '#e5e7eb', color: historyType === 'yearly' ? 'white' : '#1f2937' }} onClick={() => setHistoryType('yearly')}>Yillik</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {aggregatedHistory.map((item, index) => (
              <div key={index} style={{ padding: '15px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 'bold', color: '#1f2937' }}>{item.label}</div>
                <div style={{ color: '#ef4444', fontSize: '16px', fontWeight: 'bold', textAlign: 'right' }}>
                  {item.expenseSom > 0 && <div>-{item.expenseSom.toLocaleString()} so'm</div>}
                  {item.expenseUsd > 0 && <div>-{item.expenseUsd.toLocaleString()} $</div>}
                  {item.expenseSom === 0 && item.expenseUsd === 0 && "0 so'm"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
        
        {/* --- QAYTARISH FORMASI --- */}
        <div className="card" style={{ borderTop: '5px solid #4b5563' }}>
          <div style={{ marginBottom: '25px', paddingBottom: '20px', borderBottom: '2px dashed #e5e7eb' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 'bold', color: '#111827' }}>
              <User size={20} color="#4b5563" /> Mijozni tanlang
            </label>
            <select 
              className="form-control" 
              value={customer} 
              onChange={(e) => setCustomer(e.target.value)}
              style={{ backgroundColor: '#f3f4f6', cursor: 'pointer' }}
            >
              <option value="">-- Mijozlar ro'yxati --</option>
              <option value="Chakana xaridor">Chakana xaridor (Oddiy qaytish)</option>
              {customers.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <form onSubmit={handleAddToCart}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={18} color="#6b7280" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                <input className="form-control" style={{ paddingLeft: '38px' }} placeholder="Tovarni qidiring..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              <select className="form-control" value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}>
                <option value="">-- Tovarni tanlang --</option>
                <option value="">-- Tanlang --</option>
                {filteredProducts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.quantity} {p.unit})</option>)}
              </select>
              {selectedProduct && (
                <input type="number" className="form-control" placeholder={`Qancha qaytdi? (${selectedProduct.unit})`} value={returnQty} onChange={e => setReturnQty(e.target.value)} />
              )}
              <button type="submit" className="btn" style={{ background: '#4b5563', color: 'white', width: '100%' }}>
                <PlusCircle size={20} /> Savatga qo'shish
              </button>
            </div>
          </form>

          {error && <div style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginTop: '15px' }}>{error}</div>}

          {cart.length > 0 && (
            <div className="fade-in" style={{ marginTop: '30px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><PackageMinus size={20} color="#4b5563" /> Qaytarish savatchasi</h4>
              {cart.map((item, index) => {
                const isUsd = isUsdUnit(item.product.unit);
                return (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', marginBottom: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 'bold' }}>{index + 1}. {item.product.name}</p>
                      <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                        {item.qty} {item.product.unit} x {item.product.price.toLocaleString()} {isUsd ? '$' : "so'm"}
                      </p>
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#ef4444', marginRight: '15px' }}>
                      {item.total.toLocaleString()} {isUsd ? '$' : "so'm"}
                    </div>
                    <button onClick={() => handleRemoveFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✖</button>
                  </div>
                );
              })}
              
              <div style={{ backgroundColor: '#e5e7eb', padding: '15px', borderRadius: '10px', marginTop: '20px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Jami Chiqim:</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#ef4444' }}>
                  {cart.filter(i => !isUsdUnit(i.product.unit)).length > 0 && (
                    <div>-{cart.filter(i => !isUsdUnit(i.product.unit)).reduce((s, i) => s + i.total, 0).toLocaleString()} so'm</div>
                  )}
                  {cart.filter(i => isUsdUnit(i.product.unit)).length > 0 && (
                    <div>-{cart.filter(i => isUsdUnit(i.product.unit)).reduce((s, i) => s + i.total, 0).toLocaleString()} $</div>
                  )}
                </div>
              </div>
              <button onClick={handleFinalReturn} className="btn" style={{ width: '100%', marginTop: '15px', background: '#374151', color: 'white' }}>Tasdiqlash</button>
            </div>
          )}
        </div>

        {/* --- TARIX RO'YXATI --- */}
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ClipboardList size={22} color="#4b5563" /> Oxirgi qaytishlar
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tableData.length === 0 ? <p style={{textAlign: 'center', color: '#94a3b8'}}>Ma'lumot yo'q</p> : 
              tableData.map(r => {
                return (
                  <div key={r.id} style={{ padding: '15px', borderRadius: '15px', background: '#f8fafc', borderLeft: '5px solid #4b5563', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{r.customer}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(r.id).toLocaleTimeString()}</div>
                      <div style={{ fontSize: '13px', color: '#475569', marginTop: '8px', whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                        {r.productName}
                      </div>
                    </div>
                    <div style={{ fontWeight: '800', color: '#ef4444', fontSize: '16px', textAlign: 'right', minWidth: '100px' }}>
                      {/* Yangi formatdagi summalarni ko'rsatish */}
                      {r.returnSumSom > 0 && <div>-{r.returnSumSom.toLocaleString()} so'm</div>}
                      {r.returnSumUsd > 0 && <div>-{r.returnSumUsd.toLocaleString()} $</div>}
                      
                      {/* Eski qo'shilgan eski format ma'lumotlar uchun (yangi logic bilan) */}
                      {r.returnSumSom === undefined && r.returnSumUsd === undefined && r.returnSum !== undefined && (
                        <div>-{r.returnSum.toLocaleString()} {isUsdProduct(r.productName, r.unit) ? '$' : "so'm"}</div>
                      )}
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>

      </div>
    </div>
  );
};

export default Return;