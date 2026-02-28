import React from 'react';
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, Landmark, CheckCircle, FileText, Clock } from 'lucide-react';

const TodaySales = ({ sales, setSales, returns, setPage }) => {

  const todayStr = new Date().toLocaleDateString('uz-UZ');
  
  const totalIncome = sales
    .filter(s => s.isReceived && new Date(s.receivedAt || s.id).toLocaleDateString('uz-UZ') === todayStr)
    .reduce((acc, curr) => acc + curr.totalSum, 0);
    
  const totalExpense = returns.filter(r => new Date(r.id).toLocaleDateString('uz-UZ') === todayStr).reduce((acc, curr) => acc + curr.returnSum, 0);
  const netCash = totalIncome - totalExpense;

  const handleReceive = (id, customer, sum) => {
    if (window.confirm(`${customer} to'lov qildimi?`)) {
      setSales(sales.map(s => s.id === id ? { ...s, isReceived: true, receivedAt: Date.now() } : s));
    }
  };

  const handleToDebt = (id) => {
    setSales(sales.map(s => s.id === id ? { ...s, isDebt: true } : s));
  };

  const pendingSales = sales.filter(s => !s.isReceived && !s.isDebt);
  const paidSales = sales.filter(s => s.isReceived && new Date(s.receivedAt || s.id).toLocaleDateString('uz-UZ') === todayStr);

  return (
    <div className="fade-in">
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
                  <div style={{ color: '#4b5563', marginBottom: '15px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={16} /> {sale.productName}</div>
                  <div style={{ borderTop: '1px dashed #d1d5db', paddingTop: '15px', display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleReceive(sale.id, sale.customer, sale.totalSum)} className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>Puli olindi</button>
                    <button onClick={() => handleToDebt(sale.id)} className="btn btn-danger" style={{ flex: 1, padding: '12px' }}>Qarzga yozish</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ flex: '1 1 400px', borderTop: '4px solid #1e3a8a' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e3a8a', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={20} color="#1e3a8a" /> Tasdiqlangan savdolar</h3>
          {paidSales.length === 0 ? <p style={{ color: '#6b7280', textAlign: 'center' }}>Hali pul tushmadi.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {paidSales.map(sale => (
                <div key={sale.id} className="fade-in" style={{ padding: '15px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderLeft: '4px solid #1e3a8a', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 'bold', color: '#111827' }}>{sale.customer}</span>
                      {/* QARZDAN TUSHGANI HAQIDA BELGI */}
                      {sale.wasDebt && (
                        <span style={{ fontSize: '12px', backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '12px', border: '1px solid #fde68a', fontWeight: 'bold' }}>
                          Qarzdan tushdi
                        </span>
                      )}
                    </div>
                    <span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>+{sale.totalSum.toLocaleString()} so'm</span>
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '5px' }}><FileText size={14} /> {sale.productName}</div>
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