import React from 'react';
import { ArrowLeft, BookOpen, Calendar, CheckCircle, UserCircle } from 'lucide-react';

const Debts = ({ sales, setSales, setPage }) => {
  const debtsList = sales.filter(s => s.isDebt && !s.isReceived);

  // Qarzni qabul qilish va unga "QARZDAN" degan tamg'a (wasDebt) urish
  const handleReceiveDebt = (id) => {
    const updatedSales = sales.map(s => 
      s.id === id ? { ...s, isReceived: true, isDebt: false, receivedAt: Date.now(), wasDebt: true } : s
    );
    setSales(updatedSales);
  };

  const totalDebtSum = debtsList.reduce((acc, curr) => acc + curr.totalSum, 0);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => setPage('dashboard')} className="btn" style={{ width: 'auto', padding: '10px 20px', backgroundColor: '#e5e7eb', color: '#1f2937', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ArrowLeft size={18} /> Ortga qaytish
        </button>
        <h2 style={{ fontSize: '24px', color: '#1e3a8a', margin: 0, display: 'flex', gap: '10px', alignItems: 'center' }}>
          Qarz Daftari <BookOpen size={28} />
        </h2>
      </div>

      <div className="card fade-in" style={{ padding: '30px', backgroundColor: '#374151', color: '#ffffff', marginBottom: '30px', textAlign: 'center', border: 'none' }}>
        <p style={{ margin: 0, fontSize: '16px', color: '#d1d5db', textTransform: 'uppercase' }}>Jami qarzdorlik</p>
        <h2 style={{ margin: '10px 0 0 0', fontSize: '36px' }}>{totalDebtSum.toLocaleString()} <span style={{fontSize: '20px'}}>so'm</span></h2>
      </div>

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto', borderTop: '4px solid #1e3a8a' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Nasiyaga olingan tovarlar ro'yxati
        </h3>

        {debtsList.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '30px' }}>Qarzlar yo'q.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {debtsList.map(debt => (
              <div key={debt.id} className="fade-in" style={{ padding: '20px', backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                
                <div style={{ flex: '1 1 250px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 'bold', color: '#111827', fontSize: '18px' }}>
                    <UserCircle size={20} color="#1e3a8a" /> {debt.customer}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} /> Berilgan sana: {new Date(debt.id).toLocaleDateString('uz-UZ')}
                  </div>
                  <div style={{ color: '#4b5563', fontSize: '14px' }}>{debt.productName}</div>
                </div>

                <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e3a8a' }}>
                  {debt.totalSum.toLocaleString()} so'm
                </div>

                <button 
                  onClick={() => handleReceiveDebt(debt.id)}
                  className="btn btn-primary" 
                  style={{ width: 'auto', padding: '12px 20px', display: 'flex', gap: '8px', alignItems: 'center' }}
                >
                  <CheckCircle size={18} /> Puli olindi
                </button>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Debts;