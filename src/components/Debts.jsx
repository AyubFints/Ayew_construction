import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Search, User, Calendar, CheckCircle } from 'lucide-react';

const Debts = ({ sales, setSales, setPage }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Faqat qarz bo'lgan savdolarni ajratib olish
  const debtSales = sales.filter(s => s.isDebt === true);

  const filteredDebts = debtSales.filter(s => 
    s.customer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Jami qarzni hisoblash
  const totalDebtSum = debtSales.reduce((acc, s) => acc + (s.totalSum - (s.paidAmount || 0)), 0);

  // QARZNI BITTA TUGMA BILAN TO'LIQ YOPISH
  const handleRepay = (sale) => {
    const remainingDebt = sale.totalSum - (sale.paidAmount || 0);

    if (window.confirm(`${sale.customer} haqiqatan ham qolgan ${remainingDebt.toLocaleString()} so'm qarzni to'liq to'ladimi?`)) {
      setSales(sales.map(s => {
        if (s.id === sale.id) {
          return { 
            ...s, 
            paidAmount: s.totalSum, // Pul to'liq to'landi deb belgilanadi
            isDebt: false, // Qarz ro'yxatidan o'chadi
            wasDebt: true, // Tarix uchun (qarzdan yopilganini bilish uchun)
            // Bugungi kassaga (TodaySales) tushishi uchun tarixga yozamiz:
            paymentHistory: [...(s.paymentHistory || []), { amount: remainingDebt, date: Date.now() }]
          };
        }
        return s;
      }));

      alert("✅ Qarz to'liq uzildi va bugungi kassaga tushum bo'lib qo'shildi!");
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
            <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>Hozircha hech qanday qarz yo'q. Ishlar ajoyib!</p>
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

                  {/* SHU YER O'ZGARDI: Faqat bitta yashil tugma qoldi */}
                  <div style={{ marginTop: '20px', borderTop: '1px dashed #d1d5db', paddingTop: '15px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => handleRepay(sale)} 
                      className="btn" 
                      style={{ 
                        backgroundColor: '#10b981', color: 'white', border: 'none', 
                        height: '45px', padding: '0 25px', display: 'flex', alignItems: 'center', gap: '8px',
                        fontSize: '15px', fontWeight: 'bold', borderRadius: '10px', cursor: 'pointer'
                      }}
                    >
                      <CheckCircle size={20} /> To'liq to'lash
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