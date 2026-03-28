import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Search, User, CheckCircle, ChevronDown, ChevronUp, Clock, History } from 'lucide-react';

const Debts = ({ sales, setSales, setPage, customers = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [repayAmounts, setRepayAmounts] = useState({});
  const [expandedCustomer, setExpandedCustomer] = useState(null);

  // --- DOLLAR YOKI SO'MLIGINI ANIQLASH (Customers.jsx bilan bir xil) ---
  const isUsdUnit = (unit) => {
    if (!unit) return false;
    return unit.toLowerCase() === 'kv' || unit.includes('$');
  };

  const isUsdProduct = (productName, unit) => {
    if (isUsdUnit(unit)) return true;
    if (typeof productName === 'string' && (productName.includes('$') || productName.includes(' kv '))) return true;
    return false;
  };

  const debtSales = sales.filter(s => s.isDebt === true);

  // Qidiruv mantiqi
  const filteredDebts = debtSales.filter(s => 
    s.customer?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRepay = (sale, isFull) => {
    const isKv = isUsdProduct(sale.productName, sale.unit);
    const remainingDebt = sale.totalSum - (sale.paidAmount || 0);
    const currencyStr = isKv ? '$' : "so'm";
    
    const amount = isFull ? remainingDebt : parseFloat(repayAmounts[sale.id]);

    if (isNaN(amount) || amount <= 0) return alert("Summani to'g'ri kiriting!");
    if (amount > remainingDebt) return alert(`Xato! Qoldiq qarz: ${remainingDebt.toLocaleString()} ${currencyStr}`);

    if (window.confirm(`${sale.customer}dan ${amount.toLocaleString()} ${currencyStr} qabul qilasizmi?`)) {
      const now = Date.now(); 
      const newPaidAmount = (sale.paidAmount || 0) + amount;
      const isFullyPaid = Math.abs(newPaidAmount - sale.totalSum) < 0.01;
      
      setSales(sales.map(s => {
        if (s.id === sale.id) {
          return { 
            ...s, 
            paidAmount: newPaidAmount, 
            isDebt: !isFullyPaid, 
            wasDebt: true,
            lastPaymentAmount: amount, 
            lastPaymentDate: now, 
            paymentHistory: [...(s.paymentHistory || []), { amount: amount, date: now }]
          };
        }
        return s;
      }));

      setRepayAmounts({ ...repayAmounts, [sale.id]: '' });
    }
  };

  const totalDebtSumSom = debtSales.reduce((acc, s) => !isUsdProduct(s.productName, s.unit) ? acc + (s.totalSum - (s.paidAmount || 0)) : acc, 0);
  const totalDebtSumDollar = debtSales.reduce((acc, s) => isUsdProduct(s.productName, s.unit) ? acc + (s.totalSum - (s.paidAmount || 0)) : acc, 0);

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
          {totalDebtSumSom === 0 && totalDebtSumDollar === 0 && <div>0 so'm</div>}
        </h2>
      </div>

      <div className="card" style={{ marginBottom: '30px', borderTop: '4px solid #ef4444' }}>
        
        {/* QIDIRUV */}
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

        {/* 1. TEPADAGI AKTIV QARZLAR (RASMDAGI DIZAYN) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '40px' }}>
          {filteredDebts.map(sale => {
            const isKv = isUsdProduct(sale.productName, sale.unit);
            const remaining = sale.totalSum - (sale.paidAmount || 0);
            return (
              <div key={sale.id} className="fade-in" style={{ padding: '20px', backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderLeft: '5px solid #ef4444', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={18} color="#1e3a8a" />
                      <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{sale.customer}</span>
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '13px' }}>Sana: {new Date(sale.id).toLocaleDateString()}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Qolgan qarz:</div>
                    <div style={{ fontWeight: 'bold', color: '#ef4444', fontSize: '24px' }}>
                      {remaining.toLocaleString()} {isKv ? '$' : "so'm"}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '15px' }}>
                  <input type="number" className="form-control" placeholder="Summani kiriting..." value={repayAmounts[sale.id] || ''} onChange={(e) => setRepayAmounts({...repayAmounts, [sale.id]: e.target.value})} style={{ marginBottom: '10px' }} />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleRepay(sale, false)} className="btn" style={{ backgroundColor: '#f59e0b', color: 'white', flex: 1 }}>Qismini to'lash</button>
                    <button onClick={() => handleRepay(sale, true)} className="btn" style={{ backgroundColor: '#10b981', color: 'white', flex: 1 }}>Hammasini to'lash</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. PASTDAGI BARCHA MIJOZLAR (YANGI QO'SHILGAN) */}
        <div style={{ borderTop: '2px dashed #d1d5db', paddingTop: '20px' }}>
          <h3 style={{ fontSize: '18px', color: '#4b5563', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
             Mijozlar ro'yxati va tarixi
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredCustomers.map(customer => {
              const customerHistory = sales.filter(s => 
                s.customer?.toLowerCase() === customer.name?.toLowerCase() && (s.isDebt || s.wasDebt)
              );
              
              const sortedHistory = [...customerHistory].sort((a, b) => Number(b.isDebt || 0) - Number(a.isDebt || 0));

              return (
                <div key={customer.id || customer.name} style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                  <div 
                    onClick={() => setExpandedCustomer(expandedCustomer === customer.name ? null : customer.name)}
                    style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ background: '#eff6ff', color: '#2563eb', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      {customer.name}
                    </div>
                    {expandedCustomer === customer.name ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>

                  {expandedCustomer === customer.name && (
                    <div style={{ padding: '15px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
                      {sortedHistory.length === 0 ? (
                        <div style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center' }}>Ma'lumot topilmadi.</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {sortedHistory.map(h => {
                            const isKv = isUsdProduct(h.productName, h.unit);
                            return (
                              <div key={h.id} style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', backgroundColor: '#fff', borderLeft: h.isDebt ? '4px solid #ef4444' : '4px solid #10b981' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{h.productName}</div>
                                <div style={{ fontSize: '12px', color: '#6b7280' }}>Sana: {new Date(h.id).toLocaleDateString()}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                                  <span style={{ fontSize: '13px' }}>Jami: {h.totalSum.toLocaleString()} {isKv ? '$' : "so'm"}</span>
                                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: h.isDebt ? '#ef4444' : '#10b981' }}>
                                    {h.isDebt ? `Qolgan: ${(h.totalSum - (h.paidAmount || 0)).toLocaleString()}` : 'To\'langan'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Debts;