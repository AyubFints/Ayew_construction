import React, { useState } from 'react';
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, Landmark, CheckCircle, FileText, Clock, Tag, XCircle, Banknote } from 'lucide-react';

const TodaySales = ({ products, setProducts, sales, setSales, returns, setPage }) => {
  const [partialAmounts, setPartialAmounts] = useState({});
  const todayStr = new Date().toLocaleDateString('uz-UZ');
  
  // 1. KASSANING YANGI MANTIQI: Bugun tushgan barcha to'lovlarni (qarz va naqd) hisoblash
  let totalIncome = 0;
  const todaysPayments = []; // Bugun tushgan pullar ro'yxati

  sales.forEach(sale => {
    if (sale.paymentHistory) {
      // Agar yangi tizim orqali to'langan bo'lsa (to'lovlar tarixi bor bo'lsa)
      sale.paymentHistory.forEach(payment => {
        if (new Date(payment.date).toLocaleDateString('uz-UZ') === todayStr) {
          totalIncome += payment.amount;
          todaysPayments.push({
            ...sale,
            paymentAmountToday: payment.amount, // Aynan bugun bergan puli
            paymentDate: payment.date
          });
        }
      });
    } else {
      // Eski ma'lumotlar uchun himoya
      if ((sale.isReceived || sale.paidAmount > 0) && new Date(sale.receivedAt || sale.id).toLocaleDateString('uz-UZ') === todayStr) {
        const amt = sale.paidAmount || sale.totalSum;
        totalIncome += amt;
        todaysPayments.push({
          ...sale,
          paymentAmountToday: amt,
          paymentDate: sale.receivedAt || sale.id
        });
      }
    }
  });

  // Tushumlarni vaqti bo'yicha ketma-ket joylash (yangilari tepada)
  todaysPayments.sort((a, b) => b.paymentDate - a.paymentDate);

  const totalExpense = returns.filter(r => new Date(r.id).toLocaleDateString('uz-UZ') === todayStr).reduce((acc, curr) => acc + (curr.returnSum || 0), 0);
  const netCash = totalIncome - totalExpense;

  // TO'LIQ TO'LOV QABUL QILISH
  const handleReceive = (id, customer, sum) => {
    if (window.confirm(`${customer} hamma pulni to'liq to'ladimi?`)) {
      setSales(sales.map(s => s.id === id ? { 
        ...s, 
        isReceived: true, 
        paidAmount: s.totalSum, 
        isDebt: false, 
        receivedAt: Date.now(),
        paymentHistory: [...(s.paymentHistory || []), { amount: s.totalSum, date: Date.now() }] // Tarixga yozish
      } : s));
    }
  };

  // QISMAN TO'LOV QABUL QILISH
  const handlePartialPayment = (sale) => {
    const inputAmount = parseFloat(partialAmounts[sale.id]);
    
    if (isNaN(inputAmount) || inputAmount <= 0) return alert("Summani to'g'ri kiriting!");
    
    if (inputAmount >= sale.totalSum) {
      return handleReceive(sale.id, sale.customer, sale.totalSum);
    }

    const remaining = sale.totalSum - inputAmount;
    if (window.confirm(`${sale.customer}dan ${inputAmount.toLocaleString()} so'm olindi.\nQolgan ${remaining.toLocaleString()} so'm qarzga yozilsinmi?`)) {
      setSales(sales.map(s => s.id === sale.id ? { 
        ...s, 
        isReceived: true, 
        paidAmount: inputAmount, 
        isDebt: true, 
        receivedAt: Date.now(),
        paymentHistory: [...(s.paymentHistory || []), { amount: inputAmount, date: Date.now() }] // Tarixga yozish
      } : s));
      setPartialAmounts({ ...partialAmounts, [sale.id]: '' });
    }
  };

  const handleToDebt = (id) => {
    if (window.confirm("Hamma pulni qarzga yozamizmi?")) {
      setSales(sales.map(s => s.id === id ? { ...s, isDebt: true, paidAmount: 0 } : s));
    }
  };

  const handleCancelSale = (saleToCancel) => {
    if (window.confirm(`ROSTDAN HAM BEKOR QILASIZMI?\n\nMijoz: ${saleToCancel.customer || "Noma'lum"}\nTasdiqlasangiz, barcha tovarlar omborga qaytadi va savdo o'chib ketadi.`)) {
      if (saleToCancel.cartItems) {
        let updatedProducts = [...products];
        saleToCancel.cartItems.forEach(cartItem => {
          updatedProducts = updatedProducts.map(p => 
            p.id === cartItem.product.id ? { ...p, quantity: p.quantity + cartItem.qty } : p
          );
        });
        setProducts(updatedProducts);
      }
      setSales(sales.filter(s => s.id !== saleToCancel.id));
    }
  };

  const pendingSales = sales.filter(s => !s.isReceived && !s.isDebt);

  return (
    <div className="fade-in app-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <button onClick={() => setPage('dashboard')} className="btn" style={{ width: 'auto', padding: '10px 20px', backgroundColor: '#e5e7eb', color: '#1f2937', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ArrowLeft size={18} /> Ortga qaytish
        </button>
        <h2 style={{ fontSize: '24px', color: '#1e3a8a', margin: 0, display: 'flex', gap: '10px', alignItems: 'center' }}>
          Bugungi Kassa <Wallet size={28} />
        </h2>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', flexWrap: 'wrap' }}>
        <div className="card fade-in" style={{ flex: '1 1 250px', padding: '25px', backgroundColor: '#ffffff', borderTop: '4px solid #1e3a8a' }}>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: 'bold', display: 'flex', gap: '8px', alignItems: 'center' }}><TrendingUp size={18} color="#1e3a8a" /> KIRIM</p>
          <h2 style={{ margin: '10px 0 0 0', color: '#1e3a8a', fontSize: '28px' }}>+{totalIncome.toLocaleString()} so'm</h2>
        </div>
        <div className="card fade-in" style={{ flex: '1 1 250px', padding: '25px', backgroundColor: '#ffffff', borderTop: '4px solid #4b5563' }}>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: 'bold', display: 'flex', gap: '8px', alignItems: 'center' }}><TrendingDown size={18} color="#4b5563" /> CHIQIM</p>
          <h2 style={{ margin: '10px 0 0 0', color: '#4b5563', fontSize: '28px' }}>-{totalExpense.toLocaleString()} so'm</h2>
        </div>
        <div className="card fade-in" style={{ flex: '1 1 250px', padding: '25px', backgroundColor: '#1e3a8a', color: 'white', border: 'none' }}>
          <p style={{ margin: 0, color: '#d1d5db', fontSize: '14px', fontWeight: 'bold', display: 'flex', gap: '8px', alignItems: 'center' }}><Landmark size={18} color="#d1d5db" /> SOF KASSA</p>
          <h2 style={{ margin: '10px 0 0 0', color: '#ffffff', fontSize: '28px' }}>{netCash.toLocaleString()} so'm</h2>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        {/* KUTILAYOTGAN TO'LOVLAR */}
        <div className="card" style={{ flex: '1 1 400px', borderTop: '4px solid #4b5563' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={20} color="#4b5563" /> Kutilayotgan to'lovlar</h3>
          {pendingSales.length === 0 ? <p style={{ color: '#6b7280', textAlign: 'center' }}>Kutilayotganlar yo'q.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {pendingSales.map(sale => (
                <div key={sale.id} className="fade-in" style={{ padding: '15px', backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '18px' }}>{sale.customer}</span>
                    <span style={{ fontWeight: 'bold', color: '#111827', fontSize: '18px' }}>{sale.totalSum.toLocaleString()} so'm</span>
                  </div>
                  
                  <div style={{ color: '#4b5563', marginBottom: '15px', fontSize: '14px', display: 'flex', alignItems: 'flex-start', gap: '6px', whiteSpace: 'pre-line' }}>
                    <FileText size={16} style={{ marginTop: '2px', flexShrink: 0 }} /> 
                    <div>{sale.productName}</div>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}>
                      Mijoz bergan summa:
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <Banknote size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#6b7280' }} />
                        <input 
                          type="number" className="form-control" placeholder="Summa..." 
                          value={partialAmounts[sale.id] || ''}
                          onChange={(e) => setPartialAmounts({...partialAmounts, [sale.id]: e.target.value})}
                          style={{ marginBottom: 0, paddingLeft: '32px', height: '40px' }}
                        />
                      </div>
                      <button onClick={() => handlePartialPayment(sale)} className="btn btn-primary" style={{ padding: '0 15px', height: '40px', width: 'auto' }}>
                        To'lash
                      </button>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px dashed #d1d5db', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => handleReceive(sale.id, sale.customer, sale.totalSum)} className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>Puli to'liq olindi</button>
                      <button onClick={() => handleToDebt(sale.id)} className="btn" style={{ flex: 1, padding: '12px', backgroundColor: '#f59e0b', color: 'white', border: 'none' }}>Qarzga yozish</button>
                    </div>
                    <button onClick={() => handleCancelSale(sale)} className="btn" style={{ width: '100%', padding: '12px', display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', backgroundColor: '#ef4444', color: 'white', border: 'none' }}>
                      <XCircle size={18} /> Sotuvni bekor qilish (Qaytarish)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BUGUNGI KASSAGA TUSHGAN PULLAR RO'YXATI */}
        <div className="card" style={{ flex: '1 1 400px', borderTop: '4px solid #1e3a8a' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e3a8a', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={20} color="#1e3a8a" /> Bugun kassaga tushgan pullar
          </h3>
          {todaysPayments.length === 0 ? <p style={{ color: '#6b7280', textAlign: 'center' }}>Hali pul tushmadi.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {todaysPayments.map((payment, idx) => (
                <div key={payment.id + idx} className="fade-in" style={{ padding: '15px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderLeft: '4px solid #1e3a8a', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    
                    <div style={{ flex: '1' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bugun to'langan</div>
                      <div style={{ fontWeight: 'bold', color: '#10b981', fontSize: '18px' }}>+{payment.paymentAmountToday.toLocaleString()} so'm</div>
                    </div>

                    <div style={{ flex: '1', textAlign: 'center', borderLeft: '1px solid #eee', borderRight: '1px solid #eee' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                        <Tag size={12} /> Jami savdo
                      </div>
                      <div style={{ fontWeight: '600', color: '#4b5563' }}>
                        {payment.totalSum.toLocaleString()} so'm
                      </div>
                    </div>

                    <div style={{ flex: '1', textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Mijoz</div>
                      <div style={{ fontWeight: 'bold', color: '#1e3a8a' }}>{payment.customer}</div>
                      {/* Qarzdan to'laganini ko'rsatish */}
                      {payment.paymentAmountToday < payment.totalSum && (
                        <span style={{ fontSize: '10px', backgroundColor: '#fef3c7', color: '#b45309', padding: '1px 6px', borderRadius: '10px', border: '1px solid #fde68a', fontWeight: 'bold', marginLeft: '5px' }}>
                          Qarz to'lovi
                        </span>
                      )}
                    </div>

                  </div>

                  <div style={{ color: '#94a3b8', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', borderTop: '1px solid #fafafa', paddingTop: '5px', whiteSpace: 'pre-line' }}>
                    <FileText size={14} style={{flexShrink: 0}} /> <div>{payment.productName}</div>
                  </div>
                  
                  <div style={{ marginTop: '8px', fontSize: '11px', color: '#6b7280', display: 'flex', justifyContent: 'flex-end' }}>
                    Vaqti: {new Date(payment.paymentDate).toLocaleTimeString()}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodaySales;