import React, { useState, useMemo } from 'react';
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, Landmark, CheckCircle, FileText, Clock, Tag, XCircle, Banknote, ChevronRight } from 'lucide-react';

// --- FIREBASE IMPORTLARI ---
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

const TodaySales = ({ products, setProducts, sales, setSales, returns, setPage }) => {
  const [partialAmounts, setPartialAmounts] = useState({});
  const [historyType, setHistoryType] = useState('daily'); 
  const [selectedHistory, setSelectedHistory] = useState(null); 
  
  const todayStr = new Date().toLocaleDateString('uz-UZ');
  const isUsdProduct = (productName) => typeof productName === 'string' && productName.includes('$');

  let totalIncomeSom = 0;
  let totalIncomeUsd = 0;
  let todayNewDebtsSom = 0;
  let todayNewDebtsUsd = 0;
  const todaysPayments = [];

  sales.forEach(sale => {
    const isUsd = isUsdProduct(sale.productName);

    // Bugungi yangi qarzlar
    if (new Date(sale.id).toLocaleDateString('uz-UZ') === todayStr && sale.isDebt) {
      const remainingDebt = sale.totalSum - (sale.paidAmount || 0);
      if (isUsd) todayNewDebtsUsd += remainingDebt;
      else todayNewDebtsSom += remainingDebt;
    }

    // Bugungi kirimlar
    if (sale.paymentHistory && sale.paymentHistory.length > 0) {
      sale.paymentHistory.forEach(payment => {
        if (new Date(payment.date).toLocaleDateString('uz-UZ') === todayStr) {
          if (isUsd) totalIncomeUsd += payment.amount;
          else totalIncomeSom += payment.amount;
          
          todaysPayments.push({
            id: payment.date,
            saleId: sale.id,
            customer: sale.customer,
            amountPaid: payment.amount,
            date: payment.date,
            productName: sale.productName,
            totalSum: sale.totalSum,
            isDebt: sale.isDebt,
            // Faqatgina savdo qarz bo'lsa va bu birinchi to'lov bo'lmasa qarz to'lovi deyiladi
            isDebtPayment: sale.isDebt && payment.date !== sale.id 
          });
        }
      });
    } else if (sale.isReceived && new Date(sale.receivedAt || sale.id).toLocaleDateString('uz-UZ') === todayStr) {
      if (isUsd) totalIncomeUsd += sale.totalSum;
      else totalIncomeSom += sale.totalSum;

      todaysPayments.push({
        id: sale.id,
        saleId: sale.id,
        customer: sale.customer,
        amountPaid: sale.totalSum,
        date: sale.receivedAt || sale.id,
        productName: sale.productName,
        totalSum: sale.totalSum,
        isDebt: false,
        isDebtPayment: false
      });
    }
  });

  todaysPayments.sort((a, b) => b.date - a.date);

  let totalExpenseSom = 0;
  let totalExpenseUsd = 0;
  returns.filter(r => new Date(r.id).toLocaleDateString('uz-UZ') === todayStr).forEach(r => {
    if (isUsdProduct(r.productName)) totalExpenseUsd += (r.returnSum || 0);
    else totalExpenseSom += (r.returnSum || 0);
  });

  const netCashSom = totalIncomeSom - totalExpenseSom;
  const netCashUsd = totalIncomeUsd - totalExpenseUsd;

  // --- FIREBASE'GA ULANGAN "TO'LIQ OLINDI" FUNKSIYASI ---
  const handleReceive = async (id, customer) => {
    if (window.confirm(`${customer} hamma pulni to'liq to'ladimi?`)) {
      const now = Date.now();
      const yangiSales = sales.map(s => s.id === id ? { 
        ...s, 
        isReceived: true, 
        paidAmount: s.totalSum, 
        isDebt: false, 
        receivedAt: now, 
        paymentHistory: [{ amount: s.totalSum, date: now }] 
      } : s);

      setSales(yangiSales); // Ekranni yangilash

      // Bulutga yozish
      if (auth.currentUser) {
        try {
          const docRef = doc(db, "stores", auth.currentUser.uid);
          await setDoc(docRef, { sales: yangiSales }, { merge: true });
        } catch (error) {
          console.error("Kassani bulutga saqlashda xato:", error);
        }
      }
    }
  };

  // --- FIREBASE'GA ULANGAN "QISMAN TO'LASH" FUNKSIYASI ---
  const handlePartialPayment = async (sale) => {
    const inputAmount = parseFloat(partialAmounts[sale.id]);
    const currency = isUsdProduct(sale.productName) ? '$' : "so'm";
    if (isNaN(inputAmount) || inputAmount <= 0) return alert("Summani to'g'ri kiriting!");
    if (inputAmount >= sale.totalSum) return handleReceive(sale.id, sale.customer);

    const remaining = sale.totalSum - inputAmount;
    const now = Date.now();
    if (window.confirm(`${sale.customer}dan ${inputAmount.toLocaleString()} ${currency} olindi.\nQolgan ${remaining.toLocaleString()} ${currency} qarzga yozilsinmi?`)) {
      const yangiSales = sales.map(s => s.id === sale.id ? { 
        ...s, 
        isReceived: true, 
        paidAmount: inputAmount, 
        isDebt: true, 
        receivedAt: now, 
        paymentHistory: [{ amount: inputAmount, date: now }]
      } : s);

      setSales(yangiSales); // Ekranni yangilash
      setPartialAmounts({ ...partialAmounts, [sale.id]: '' });

      // Bulutga yozish
      if (auth.currentUser) {
        try {
          const docRef = doc(db, "stores", auth.currentUser.uid);
          await setDoc(docRef, { sales: yangiSales }, { merge: true });
        } catch (error) {
          console.error("Qism to'lovni bulutga saqlashda xato:", error);
        }
      }
    }
  };

  // --- FIREBASE'GA ULANGAN "QARZGA Yozish" FUNKSIYASI ---
  const handleToDebt = async (id) => {
    if (window.confirm("Hamma pulni qarzga yozamizmi?")) {
      const yangiSales = sales.map(s => s.id === id ? { ...s, isDebt: true, paidAmount: 0 } : s);
      setSales(yangiSales); // Ekranni yangilash

      // Bulutga yozish
      if (auth.currentUser) {
        try {
          const docRef = doc(db, "stores", auth.currentUser.uid);
          await setDoc(docRef, { sales: yangiSales }, { merge: true });
        } catch (error) {
          console.error("Qarzni bulutga saqlashda xato:", error);
        }
      }
    }
  };

  // --- FIREBASE'GA ULANGAN "BEKOR QILISH" FUNKSIYASI ---
  const handleCancelSale = async (saleToCancel) => {
    if (window.confirm(`ROSTDAN HAM BEKOR QILASIZMI?\nMijoz: ${saleToCancel.customer}`)) {
      let updatedProducts = [...products];
      if (saleToCancel.cartItems) {
        saleToCancel.cartItems.forEach(item => {
          updatedProducts = updatedProducts.map(p => p.id === item.product.id ? { ...p, quantity: p.quantity + item.qty } : p);
        });
      }
      
      const yangiSales = sales.filter(s => s.id !== saleToCancel.id);
      
      setProducts(updatedProducts); // Omborni tiklash ekranda
      setSales(yangiSales); // Savdoni o'chirish ekranda

      // Bulutga yozish (Ombor va Savdolarni birdaniga yangilash)
      if (auth.currentUser) {
        try {
          const docRef = doc(db, "stores", auth.currentUser.uid);
          await setDoc(docRef, { 
            products: updatedProducts, 
            sales: yangiSales 
          }, { merge: true });
        } catch (error) {
          console.error("Bekor qilishni bulutga saqlashda xato:", error);
        }
      }
    }
  };

  const aggregatedHistory = useMemo(() => {
    const map = {};
    sales.forEach(sale => {
      if (!sale.paymentHistory) return;
      sale.paymentHistory.forEach(payment => {
        const t = new Date(payment.date);
        let key, label;
        if (historyType === 'daily') {
          key = t.toLocaleDateString('uz-UZ');
          label = key;
        } else if (historyType === 'monthly') {
          const months = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
          key = `${t.getFullYear()}-${t.getMonth()}`;
          label = `${months[t.getMonth()]} ${t.getFullYear()}`;
        } else {
          key = t.getFullYear().toString();
          label = `${key}-yil`;
        }

        if (!map[key]) map[key] = { label, key, som: 0, usd: 0, timestamp: payment.date, transactions: [] };
        
        const isUsd = isUsdProduct(sale.productName);
        if (isUsd) map[key].usd += payment.amount;
        else map[key].som += payment.amount;

        map[key].transactions.push({
          saleId: sale.id,
          customer: sale.customer,
          productName: sale.productName,
          amount: payment.amount,
          date: payment.date,
          isUsd: isUsd,
          isDebtPayment: sale.isDebt && payment.date !== sale.id 
        });
      });
    });
    Object.values(map).forEach(group => group.transactions.sort((a, b) => b.date - a.date));
    return Object.values(map).sort((a, b) => b.timestamp - a.timestamp);
  }, [sales, historyType]);

  const pendingSales = sales.filter(s => !s.isReceived && !s.isDebt);

  return (
    <div className="fade-in app-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <button onClick={() => setPage('dashboard')} className="btn btn-danger" style={{ width: 'auto' }}><ArrowLeft size={18} /> Ortga</button>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e3a8a', margin: 0, display: 'flex', gap: '10px', alignItems: 'center' }}>Bugungi Kassa <Wallet size={28} /></h2>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="card" style={{ borderTop: '6px solid #10b981' }}>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>JAMI KIRIM</p>
          <h2 style={{ color: '#10b981', margin: '5px 0' }}>
            {totalIncomeSom > 0 || totalIncomeUsd === 0 ? `+${totalIncomeSom.toLocaleString()} so'm` : ''}
            {totalIncomeSom > 0 && totalIncomeUsd > 0 && <br/>}
            {totalIncomeUsd > 0 ? `+${totalIncomeUsd.toLocaleString()} $` : ''}
          </h2>
        </div>
        <div className="card" style={{ borderTop: '6px solid #4b5563' }}>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>JAMI CHIQIM</p>
          <h2 style={{ color: '#4b5563', margin: '5px 0' }}>
            {totalExpenseSom > 0 || totalExpenseUsd === 0 ? `-${totalExpenseSom.toLocaleString()} so'm` : ''}
            {totalExpenseSom > 0 && totalExpenseUsd > 0 && <br/>}
            {totalExpenseUsd > 0 ? `-${totalExpenseUsd.toLocaleString()} $` : ''}
          </h2>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', color: 'white', border: 'none' }}>
          <p style={{ margin: 0, opacity: 0.8, fontSize: '13px', fontWeight: 'bold' }}>SOF KASSA</p>
          <h2 style={{ margin: '5px 0' }}>
            {netCashSom !== 0 || netCashUsd === 0 ? `${netCashSom.toLocaleString()} so'm` : ''}
            {netCashSom !== 0 && netCashUsd !== 0 && <br/>}
            {netCashUsd !== 0 ? `${netCashUsd.toLocaleString()} $` : ''}
          </h2>
        </div>
        <div className="card" style={{ borderTop: '6px solid #ef4444' }}>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>BUGUNGI QARZLAR</p>
          <h2 style={{ color: '#ef4444', margin: '5px 0' }}>
            {todayNewDebtsSom > 0 || todayNewDebtsUsd === 0 ? `${todayNewDebtsSom.toLocaleString()} so'm` : ''}
            {todayNewDebtsSom > 0 && todayNewDebtsUsd > 0 && <br/>}
            {todayNewDebtsUsd > 0 ? `${todayNewDebtsUsd.toLocaleString()} $` : ''}
          </h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
        {/* Pending Sales */}
        <div className="card" style={{ borderTop: '4px solid #4b5563' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px' }}><Clock size={20} color="#4b5563" /> Kutilayotgan to'lovlar</h3>
          {pendingSales.length === 0 ? <p style={{ color: '#6b7280', textAlign: 'center' }}>Kutilayotganlar yo'q.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {pendingSales.map(sale => {
                const currency = isUsdProduct(sale.productName) ? '$' : "so'm";
                return (
                  <div key={sale.id} className="card fade-in" style={{ padding: '15px', background: 'white', border: '1px solid #d1d5db' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontWeight: '800', color: '#1e3a8a' }}>{sale.customer}</span>
                      <span style={{ fontWeight: '800' }}>{sale.totalSum.toLocaleString()} {currency}</span>
                    </div>
                    <div style={{ color: '#4b5563', fontSize: '14px', marginBottom: '15px', whiteSpace: 'pre-line' }}>{sale.productName}</div>
                    <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px', marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Mijoz qancha pul berdi?</label>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                        <input 
                          type="number" className="form-control" placeholder={`Summa`} 
                          value={partialAmounts[sale.id] || ''} onChange={(e) => setPartialAmounts({...partialAmounts, [sale.id]: e.target.value})}
                          style={{ marginBottom: 0 }}
                        />
                        <button onClick={() => handlePartialPayment(sale)} className="btn btn-primary" style={{ width: 'auto' }}>To'lash</button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => handleReceive(sale.id, sale.customer)} className="btn btn-primary" style={{ flex: 1, background: '#10b981' }}>To'liq olindi</button>
                      <button onClick={() => handleToDebt(sale.id)} className="btn" style={{ flex: 1, background: '#f59e0b', color: 'white' }}>Qarzga</button>
                    </div>
                    <button onClick={() => handleCancelSale(sale)} className="btn btn-danger" style={{ width: '100%', marginTop: '10px' }}><XCircle size={18} /> Bekor qilish</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payments Received Today */}
        <div className="card" style={{ borderTop: '4px solid #1e3a8a' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px' }}><CheckCircle size={20} color="#1e3a8a" /> Bugun kassaga tushgan pullar</h3>
          {todaysPayments.length === 0 ? <p style={{ color: '#6b7280', textAlign: 'center' }}>Hali pul tushmadi.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {todaysPayments.map((payment) => {
                const curr = isUsdProduct(payment.productName) ? '$' : "so'm";
                return (
                  <div key={payment.id} className="fade-in" style={{ padding: '15px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderLeft: '4px solid #1e3a8a', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: '1' }}>
                        <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Olingan summa</div>
                        <div style={{ fontWeight: 'bold', color: '#10b981', fontSize: '18px' }}>+{payment.amountPaid.toLocaleString()} {curr}</div>
                      </div>
                      <div style={{ flex: '1', textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Mijoz</div>
                        <div style={{ fontWeight: 'bold', color: '#1e3a8a' }}>{payment.customer}</div>
                        {payment.isDebtPayment && <span style={{ fontSize: '10px', backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>Qarzdan to'lov</span>}
                      </div>
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '10px', whiteSpace: 'pre-line' }}>{payment.productName}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '10px', borderTop: '1px solid #fafafa', paddingTop: '8px' }}>
                      Vaqti: {new Date(payment.date).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* History Section */}
      <div className="card" style={{ marginTop: '30px', borderTop: '4px solid #1e3a8a' }}>
        {!selectedHistory ? (
          <>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Kassa Tarixi</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              {['daily', 'monthly', 'yearly'].map(type => (
                <button key={type} className="btn" style={{ padding: '8px', flex: 1, backgroundColor: historyType === type ? '#1e3a8a' : '#e5e7eb', color: historyType === type ? 'white' : '#1f2937' }} onClick={() => {setHistoryType(type); setSelectedHistory(null);}}>
                  {type === 'daily' ? 'Kunlik' : type === 'monthly' ? 'Oylik' : 'Yillik'}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {aggregatedHistory.length === 0 ? <p style={{ color: '#6b7280', textAlign: 'center' }}>Ma'lumot yo'q</p> : aggregatedHistory.map((item, index) => (
                <div key={index} onClick={() => setSelectedHistory(item)} className="fade-in" style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #d1d5db', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <div style={{ fontWeight: 'bold', color: '#1f2937' }}>{item.label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ textAlign: 'right' }}>
                      {item.som > 0 && <div style={{ color: '#10b981', fontWeight: 'bold' }}>{item.som.toLocaleString()} so'm</div>}
                      {item.usd > 0 && <div style={{ color: '#2563eb', fontWeight: 'bold' }}>{item.usd.toLocaleString()} $</div>}
                    </div>
                    <ChevronRight size={20} color="#9ca3af" />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e5e7eb' }}>
              <button onClick={() => setSelectedHistory(null)} className="btn btn-danger" style={{ width: 'auto', padding: '8px 12px' }}><ArrowLeft size={16} /> Ortga</button>
              <h3 style={{ margin: 0, color: '#1e3a8a' }}>{selectedHistory.label} tafsilotlari</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedHistory.transactions.map((tr, idx) => (
                <div key={idx} style={{ padding: '15px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderLeft: '4px solid #10b981', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <strong style={{ color: '#1e3a8a' }}>{tr.customer}</strong>
                    <strong style={{ color: tr.isUsd ? '#2563eb' : '#10b981' }}>+{tr.amount.toLocaleString()} {tr.isUsd ? '$' : "so'm"}</strong>
                  </div>
                  <div style={{ color: '#4b5563', fontSize: '13px', whiteSpace: 'pre-line' }}>{tr.productName}</div>
                  
                  {/* YANGI O'ZGARISH: Sana ham chiqadigan bo'ldi */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9ca3af', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #f3f4f6' }}>
                    <span>Sana va vaqt: {new Date(tr.date).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    {tr.isDebtPayment && <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>Qarz to'lovi</span>}
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodaySales;