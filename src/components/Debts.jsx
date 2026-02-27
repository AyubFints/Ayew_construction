import React from 'react';

const Debts = ({ sales, setSales, setPage }) => {
  const debtsList = sales.filter(s => s.isDebt && !s.isReceived);
  const handleReceiveDebt = (id) => setSales(sales.map(s => s.id === id ? { ...s, isReceived: true, isDebt: false, receivedAt: Date.now() } : s));
  const totalDebtSum = debtsList.reduce((acc, curr) => acc + curr.totalSum, 0);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => setPage('dashboard')} className="btn" style={{ width: 'auto', padding: '10px 20px', backgroundColor: '#e5e7eb', color: '#1f2937' }}>⬅️ Ortga qaytish</button>
        <h2 style={{ fontSize: '24px', color: '#1e3a8a', margin: 0 }}>Qarz Daftari</h2>
      </div>

      <div className="card fade-in" style={{ padding: '30px', backgroundColor: '#374151', color: '#ffffff', marginBottom: '30px', textAlign: 'center', border: 'none' }}>
        <p style={{ margin: 0, fontSize: '16px', color: '#d1d5db', textTransform: 'uppercase' }}>Jami qarzdorlik</p>
        <h2 style={{ margin: '10px 0 0 0', fontSize: '36px' }}>{totalDebtSum.toLocaleString()} so'm</h2>
      </div>

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>Nasiya ro'yxati</h3>
        {debtsList.length === 0 ? <p style={{ color: '#9ca3af', textAlign: 'center' }}>Qarzlar yo'q.</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {debtsList.map(debt => (
              <div key={debt.id} style={{ padding: '15px', backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ flex: '1 1 250px' }}>
                  <div style={{ fontWeight: 'bold', color: '#111827', fontSize: '18px', marginBottom: '5px' }}>{debt.customer}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Sana: {new Date(debt.id).toLocaleDateString('uz-UZ')}</div>
                  <div style={{ color: '#4b5563', fontSize: '14px' }}>{debt.productName}</div>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e3a8a' }}>{debt.totalSum.toLocaleString()} so'm</div>
                <button onClick={() => handleReceiveDebt(debt.id)} className="btn btn-primary" style={{ width: 'auto', padding: '10px 20px' }}>Puli olindi</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default Debts;