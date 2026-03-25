import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Search, User, Calendar, CheckCircle, Banknote } from 'lucide-react';

const Debts = ({ sales, setSales, setPage }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [repayAmounts, setRepayAmounts] = useState({});

  const debtSales = sales.filter(s => s.isDebt === true);

  const filteredDebts = debtSales.filter(s => 
    s.customer?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 1. Valyutani aniqlash funksiyasi (Dona $ va Kv $ larni ham o'z ichiga oladi)
  const getIsDollar = (sale) => {
    const unit = sale.unit?.toLowerCase() || '';
    return sale.currency === '$' || unit.includes('$') || unit.includes('dona($)') || unit.includes('kv($)');
  };

  // 2. Umumiy qarzlar statistikasi (Valyuta bo'yicha ajratilgan)
  const totalDebtSumSom = debtSales
    .filter(s => !getIsDollar(s))
    .reduce((acc, s) => acc + (s.totalSum - (s.paidAmount || 0)), 0);

  const totalDebtSumDollar = debtSales
    .filter(s => getIsDollar(s))
    .reduce((acc, s) => acc + (s.totalSum - (s.paidAmount || 0)), 0);

  const handleRepay = (sale, isFull) => {
    const remainingDebt = sale.totalSum - (sale.paidAmount || 0);
    const isDollar = getIsDollar(sale);
    const currencyStr = isDollar ? '$' : "so'm";
    
    // "Hammasini to'lash" bo'lsa qolgan 100$ ni oladi, bo'lmasa yozilgan qismni
    const amount = isFull ? remainingDebt : parseFloat(repayAmounts[sale.id]);

    if (isNaN(amount) || amount <= 0) return alert("Summani to'g'ri kiriting!");
    if (amount > remainingDebt) return alert(`Xato! Qoldiq qarz: ${remainingDebt.toLocaleString()} ${currencyStr}`);

    if (window.confirm(`${sale.customer}dan ${amount.toLocaleString()} ${currencyStr} qabul qilasizmi?`)) {
      const newPaidAmount = (sale.paidAmount || 0) + amount;
      const isFullyPaid = Math.abs(newPaidAmount - sale.totalSum) < 0.01; // Aniq hisob-kitob uchun
      
      setSales(sales.map(s => {
        if (s.id === sale.id) {
          return { 
            ...s, 
            paidAmount: newPaidAmount, 
            isDebt: !isFullyPaid, 
            wasDebt: true,
            // DIQQAT: Kassaga faqat shu `amount` (ya'ni 100$) borishi uchun ushbu maydon muhim:
            lastPaymentAmount: amount, 
            lastPaymentDate: Date.now(),
            paymentHistory: [...(s.paymentHistory || []), { amount: amount, date: Date.now() }]
          };
        }
        return s;
      }));

      setRepayAmounts({ ...repayAmounts, [sale.id]: '' });
    }
  };

  return (
    <div className="fade-in app-container" style={{ paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <button onClick={() => setPage('dashboard')} className="btn btn-danger" style={{ width: 'auto', padding: '10px 20px', backgroundColor: '#e5e7eb', color: '#1f2937', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ArrowLeft size={18} /> Ortga qaytish
        </button>
        <h2 style={{ fontSize: '24px', color: '#1e3a8a', margin: 0, display: 'flex', gap: '10px', alignItems: 'center' }}>
          Qarz Daftari <BookOpen size={28} />
        </h2>
      </div>

      <div className="card fade-in" style={{ padding: '30px', backgroundColor: '#ef4444', color: '#ffffff', marginBottom: '30px', textAlign: 'center', border: 'none' }}>
        <p style={{ margin: 0, fontSize: '16px', color: '#fee2e2', textTransform: 'uppercase', fontWeight: 'bold' }}>Umumiy Qarzlar</p>
        <h2 style={{ margin: '10px 0 0 0', fontSize: '32px' }}>
          {totalDebtSumSom > 0 && <div>{totalDebtSumSom.toLocaleString()} so'm</div>}
          {totalDebtSumDollar > 0 && <div>{totalDebtSumDollar.toLocaleString()} $</div>}
        </h2>
      </div>

      <div className="card" style={{ marginBottom: '30px', borderTop: '4px solid #ef4444' }}>
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <Search size={18} color="#6b7280" style={{ position: 'absolute', left: '12px', top: '14px' }} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Mijoz ismi..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {filteredDebts.map(sale => {
            const remaining = sale.totalSum - (sale.paidAmount || 0);
            const isDollar = getIsDollar(sale);
            const currencyStr = isDollar ? '$' : "so'm";

            return (
              <div key={sale.id} className="fade-in" style={{ padding: '20px', backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderLeft: '5px solid #ef4444', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={18} color="#1e3a8a" />
                      <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{sale.customer}</span>
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '13px' }}>
                      Sana: {new Date(sale.id).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Qolgan qarz:</div>
                    <div style={{ fontWeight: 'bold', color: '#ef4444', fontSize: '24px' }}>
                      {remaining.toLocaleString()} {currencyStr}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '15px' }}>
                  <div style={{ position: 'relative', marginBottom: '10px' }}>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="Summani kiriting..." 
                      value={repayAmounts[sale.id] || ''}
                      onChange={(e) => setRepayAmounts({...repayAmounts, [sale.id]: e.target.value})}
                      style={{ paddingLeft: '15px', height: '45px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleRepay(sale, false)} className="btn" style={{ backgroundColor: '#f59e0b', color: 'white', flex: 1 }}>
                      Qismini to'lash
                    </button>
                    <button onClick={() => handleRepay(sale, true)} className="btn" style={{ backgroundColor: '#10b981', color: 'white', flex: 1 }}>
                      Hammasini to'lash
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Debts;