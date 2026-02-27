import React from 'react';

const TodaySales = ({ sales, setSales, returns, setPage }) => {
  const todayStr = new Date().toLocaleDateString('uz-UZ');
  const totalIncome = sales.filter(s => s.isReceived && new Date(s.receivedAt || s.id).toLocaleDateString('uz-UZ') === todayStr).reduce((acc, curr) => acc + curr.totalSum, 0);
  const totalExpense = returns.filter(r => new Date(r.id).toLocaleDateString('uz-UZ') === todayStr).reduce((acc, curr) => acc + curr.returnSum, 0);
  const netCash = totalIncome - totalExpense;

  const handleReceive = (id) => setSales(sales.map(s => s.id === id ? { ...s, isReceived: true, receivedAt: Date.now() } : s));
  const handleToDebt = (id) => setSales(sales.map(s => s.id === id ? { ...s, isDebt: true } : s));

  const pendingSales = sales.filter(s => !s.isReceived && !s.isDebt);
  const paidSales = sales.filter(s => s.isReceived && new Date(s.receivedAt || s.id).toLocaleDateString('uz-UZ') === todayStr);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <button onClick={() => setPage('dashboard')} className="btn" style={{ width: 'auto', padding: '10px 20px', backgroundColor: '#e5e7eb', color: '#1f2937' }}>⬅️ Ortga qaytish</button>
        <h2 style={{ fontSize: '24px', color: '#1e3a8a', margin: 0 }}>Bugungi Kassa</h2>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: '1 1 250px', padding: '25px', backgroundColor: '#ffffff', borderTop: '4px solid #1e3a8a' }}>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: 'bold' }}>KIRIM</p>
          <h2 style={{ margin: '10px 0 0 0', color: '#1e3a8a', fontSize: '28px' }}>{totalIncome.toLocaleString()} so'm</h2>
        </div>
        <div className="card" style={{ flex: '1 1 250px', padding: '25px', backgroundColor: '#ffffff', borderTop: '4px solid #4b5563' }}>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: 'bold' }}>CHIQIM</p>
          <h2 style={{ margin: '10px 0 0 0', color: '#4b5563', fontSize: '28px' }}>{totalExpense.toLocaleString()} so'm</h2>
        </div>
        <div className="card" style={{ flex: '1 1 250px', padding: '25px', backgroundColor: '#1e3a8a', color: 'white', border: 'none' }}>
          <p style={{ margin: 0, color: '#d1d5db', fontSize: '14px', fontWeight: 'bold' }}>SOF KASSA</p>
          <h2 style={{ margin: '10px 0 0 0', color: '#ffffff', fontSize: '28px' }}>{netCash.toLocaleString()} so'm</h2>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: '1 1 400px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>Kutilayotgan to'lovlar</h3>
          {pendingSales.length === 0 ? <p style={{ color: '#9ca3af' }}>Bo'sh.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {pendingSales.map(s => (
                <div key={s.id} style={{ padding: '15px', backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#1e3a8a' }}><span>{s.customer}</span><span>{s.totalSum.toLocaleString()} so'm</span></div>
                  <div style={{ color: '#4b5563', margin: '10px 0', fontSize: '14px' }}>{s.productName}</div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleReceive(s.id)} className="btn btn-primary" style={{ padding: '10px', fontSize: '14px' }}>Puli olindi</button>
                    <button onClick={() => handleToDebt(s.id)} className="btn btn-danger" style={{ padding: '10px', fontSize: '14px' }}>Qarzga</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ flex: '1 1 400px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>Tasdiqlangan savdolar</h3>
          {paidSales.length === 0 ? <p style={{ color: '#9ca3af' }}>Bo'sh.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {paidSales.map(s => (
                <div key={s.id} style={{ padding: '15px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderLeft: '4px solid #1e3a8a', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#111827' }}><span>{s.customer}</span><span>{s.totalSum.toLocaleString()} so'm</span></div>
                  <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '5px' }}>{s.productName}</div>
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