import React, { useState } from 'react';
import { BookOpen, Search, ArrowLeft, User, Calendar, CheckCircle } from 'lucide-react';

const Debts = ({ sales, setSales, setPage }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [repayAmounts, setRepayAmounts] = useState({});

  // Faqat qarz bo'lgan savdolarni ajratib olish (isDebt: true)
  const debtSales = sales.filter(s => s.isDebt === true);

  const filteredDebts = debtSales.filter(s => 
    s.customer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Jami qarzni hisoblash (Jami summa - to'langan qismi)
  const totalDebtSum = debtSales.reduce((acc, s) => acc + (s.totalSum - (s.paidAmount || 0)), 0);

  // Qarzni qabul qilish
  const handleRepay = (sale) => {
    const amount = parseFloat(repayAmounts[sale.id]);
    const remainingDebt = sale.totalSum - (sale.paidAmount || 0);

    if (isNaN(amount) || amount <= 0) return alert("Summani to'g'ri kiriting!");
    if (amount > remainingDebt) return alert(`Xato! Mijozning qarzi faqatgina ${remainingDebt.toLocaleString()} so'm.`);

    if (window.confirm(`${sale.customer}dan ${amount.toLocaleString()} so'm qarzni qabul qilasizmi?`)) {
      const newPaidAmount = (sale.paidAmount || 0) + amount;
      
      setSales(sales.map(s => {
        if (s.id === sale.id) {
          const isFullyPaid = newPaidAmount >= s.totalSum;
          return { 
            ...s, 
            paidAmount: newPaidAmount, 
            isDebt: !isFullyPaid, // Agar to'liq to'lasa, qarzdan o'chadi
            wasDebt: true, 
            receivedAt: Date.now() // Bugungi kassaga tushadi
          };
        }
        return s;
      }));

      setRepayAmounts({ ...repayAmounts, [sale.id]: '' });
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <button onClick={() => setPage('dashboard')} className="btn" style={{ width: 'auto', padding: '10px 20px', backgroundColor: '#e5e7eb', color: '#1f2937', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ArrowLeft size={18} /> Ortga qaytish
        </button>
        <h2 style={{ fontSize: '24px', color: '#1e3a8a', margin: 0, display: 'flex', gap: '10px', alignItems: 'center' }}>
          Qarz Daftari <BookOpen size={28} />
        </h2>
      </div>

      <div className="card fade-in" style={{ padding: '30px', backgroundColor: '#ef4444', color: '#ffffff', marginBottom: '30px', textAlign: 'center', border: 'none' }}>
        <p style={{ margin: 0, fontSize: '16px', color: '#fee2e2', textTransform: 'uppercase', fontWeight: 'bold' }}>Umumiy Berilgan Qarzlar</p>
        <h2 style={{ margin: '10px 0 0 0', fontSize: '36px' }}>{totalDebtSum.toLocaleString()} so'm</h2>
      </div>

      <div className="card" style={{ marginBottom: '30px', borderTop: '4px solid #ef4444' }}>
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <Search size={18} color="#6b7280" style={{ position: 'absolute', left: '12px', top: '14px' }} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Mijoz ismi bo'yicha qidirish..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '38px', marginBottom: 0 }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {filteredDebts.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>Hozircha hech qanday qarz yo'q.</p>
          ) : (
            filteredDebts.map(sale => {
              const remaining = sale.totalSum - (sale.paidAmount || 0);
              return (
                <div key={sale.id} className="fade-in" style={{ padding: '20px', backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderLeft: '5px solid #ef4444', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    
                    <div style={{ flex: '1 1 200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                        <User size={18} color="#1e3a8a" />
                        <span style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '18px' }}>{sale.customer}</span>
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                        <Calendar size={14} /> Olingan sana: {new Date(sale.id).toLocaleDateString('uz-UZ')}
                      </div>
                      <div style={{ fontSize: '14px', color: '#4b5563', whiteSpace: 'pre-line', backgroundColor: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        {sale.productName}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flex: '1 1 150px' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Qolgan Qarz:</div>
                      <div style={{ fontWeight: 'bold', color: '#ef4444', fontSize: '24px' }}>{remaining.toLocaleString()} so'm</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '5px' }}>
                        Umumiy savdo: {sale.totalSum.toLocaleString()}
                      </div>
                    </div>

                  </div>

                  {/* YANGI: Qarzni qabul qilish qismi */}
                  <div style={{ marginTop: '20px', borderTop: '1px dashed #d1d5db', paddingTop: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="To'lanayotgan summa..." 
                      value={repayAmounts[sale.id] || ''}
                      onChange={(e) => setRepayAmounts({...repayAmounts, [sale.id]: e.target.value})}
                      style={{ marginBottom: 0, flex: 1, height: '45px' }}
                    />
                    <button 
                      onClick={() => handleRepay(sale)} 
                      className="btn" 
                      style={{ backgroundColor: '#10b981', color: 'white', border: 'none', height: '45px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <CheckCircle size={18} /> Qarzni to'lash
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Debts;