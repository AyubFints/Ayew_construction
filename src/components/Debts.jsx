import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Search, User, CheckCircle, ChevronDown, ChevronUp, Clock, History, Calendar, DollarSign, MessageCircle } from 'lucide-react';

import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

const Debts = ({ sales, setSales, setPage, customers = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [repayAmounts, setRepayAmounts] = useState({});
  const [expandedCustomer, setExpandedCustomer] = useState(null);

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

  const filteredDebts = debtSales.filter(s => 
    s.customer?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRepay = async (sale, isFull) => {
    const isKv = isUsdProduct(sale.productName, sale.unit);
    const remainingDebt = sale.totalSum - (sale.paidAmount || 0);
    const currencyStr = isKv ? '$' : "so'm";
    
    const amount = isFull ? remainingDebt : parseFloat(repayAmounts[sale.id]);

    if (isNaN(amount) || amount <= 0) return alert("Summani to'g'ri kiriting!");
    if (amount > remainingDebt + 0.01) return alert(`Xato! Qoldiq qarz: ${remainingDebt.toLocaleString()} ${currencyStr}`);

    if (window.confirm(`${sale.customer}dan ${amount.toLocaleString()} ${currencyStr} qabul qilasizmi?`)) {
      const now = Date.now(); 
      const newPaidAmount = (sale.paidAmount || 0) + amount;
      const isFullyPaid = Math.abs(newPaidAmount - sale.totalSum) < 0.1;
      
      const newPaymentEntry = {
        id: Date.now(),
        amount: amount,
        date: now
      };

      const yangiSales = sales.map(s => {
        if (s.id === sale.id) {
          return { 
            ...s, 
            paidAmount: newPaidAmount, 
            isDebt: !isFullyPaid, 
            wasDebt: true,
            lastPaymentDate: now, 
            paymentHistory: [...(s.paymentHistory || []), newPaymentEntry]
          };
        }
        return s;
      });

      setSales(yangiSales); 
      setRepayAmounts({ ...repayAmounts, [sale.id]: '' });

      if (auth.currentUser) {
        try {
          const docRef = doc(db, "stores", auth.currentUser.uid);
          await setDoc(docRef, { sales: yangiSales }, { merge: true });
        } catch (error) {
          console.error("To'lovni bulutga saqlashda xato:", error);
        }
      }
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

      <div className="card fade-in" style={{ padding: '30px', backgroundColor: '#ef4444', color: '#ffffff', marginBottom: '30px', textAlign: 'center', border: 'none', borderRadius: '15px' }}>
        <p style={{ margin: 0, fontSize: '16px', color: '#fee2e2', textTransform: 'uppercase', fontWeight: 'bold' }}>Umumiy Qarzlar</p>
        <h2 style={{ margin: '10px 0 0 0', fontSize: '32px' }}>
          {totalDebtSumSom > 0 && <div>{totalDebtSumSom.toLocaleString()} so'm</div>}
          {totalDebtSumDollar > 0 && <div>{totalDebtSumDollar.toLocaleString()} $</div>}
          {totalDebtSumSom === 0 && totalDebtSumDollar === 0 && <div>0 so'm</div>}
        </h2>
      </div>

      <div className="card" style={{ marginBottom: '30px', borderTop: '4px solid #ef4444' }}>
        
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <Search size={18} color="#6b7280" style={{ position: 'absolute', left: '12px', top: '14px' }} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Mijoz ismi bo'yicha qidiruv..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
        </div>

        {/* 1. AKTIV QARZLAR RO'YXATI */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '40px' }}>
          {filteredDebts.map(sale => {
            const isKv = isUsdProduct(sale.productName, sale.unit);
            const currency = isKv ? '$' : "so'm";
            const remaining = sale.totalSum - (sale.paidAmount || 0);

            // YANGI: Raqamni Mijozlar bazasidan qidirish (avvalgidek sale ichidan, yo'q bo'lsa bazadan)
            const foundCustomer = customers.find(c => c.name === sale.customer);
            const phone = sale.customerPhone || (foundCustomer ? foundCustomer.phone : '');

            let daysLeftText = null;
            let isUrgent = false;

            if (sale.debtDeadline) {
              const daysLeft = Math.ceil((sale.debtDeadline - Date.now()) / (1000 * 60 * 60 * 24));
              isUrgent = daysLeft <= 3;
              if (daysLeft > 0) {
                daysLeftText = `${daysLeft} kun qoldi`;
              } else if (daysLeft === 0) {
                daysLeftText = "Bugun to'lash muddati!";
              } else {
                daysLeftText = `${Math.abs(daysLeft)} kun o'tib ketdi!`;
                isUrgent = true;
              }
            }

            return (
              <div key={sale.id} className="fade-in" style={{ padding: '20px', backgroundColor: '#fff', border: '1px solid #d1d5db', borderLeft: isUrgent ? '5px solid #dc2626' : '5px solid #ef4444', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={18} color="#1e3a8a" />
                      <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{sale.customer}</span>
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px', whiteSpace: 'pre-line' }}>{sale.productName}</div>
                    <div style={{ color: '#9ca3af', fontSize: '12px' }}>Sana: {new Date(sale.id).toLocaleDateString()}</div>
                    
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      {sale.debtDeadline && (
                        <span style={{ 
                          backgroundColor: isUrgent ? '#fee2e2' : '#d1fae5', 
                          color: isUrgent ? '#dc2626' : '#059669', 
                          padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' 
                        }}>
                          <Clock size={14} /> {daysLeftText}
                        </span>
                      )}
                      
                      {/* O'ZGARDI: SMS tugmasi raqam bo'lsa har doim chiqadi! */}
                      {phone && (
                        <a 
                          href={`sms:${phone}?body=${encodeURIComponent(`Assalomu alaykum, ${sale.customer}. Do'kondan olingan tovarlar bo'yicha qoldiq qarz: ${remaining.toLocaleString()} ${currency}. Iltimos to'lovni amalga oshiring.`)}`} 
                          className="btn" 
                          style={{ backgroundColor: '#2563eb', color: 'white', padding: '6px 12px', fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', width: 'auto', border: 'none', borderRadius: '8px' }}
                        >
                          <MessageCircle size={14} /> Eslatma yuborish
                        </a>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Qolgan qarz:</div>
                    <div style={{ fontWeight: 'bold', color: '#ef4444', fontSize: '22px' }}>
                      {remaining.toLocaleString()} {currency}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #f3f4f6' }}>
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="To'lov summasi..." 
                    value={repayAmounts[sale.id] || ''} 
                    onChange={(e) => setRepayAmounts({...repayAmounts, [sale.id]: e.target.value})} 
                    style={{ marginBottom: '10px' }} 
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleRepay(sale, false)} className="btn" style={{ backgroundColor: '#f59e0b', color: 'white', flex: 1, fontSize: '14px' }}>Qism to'lov</button>
                    <button onClick={() => handleRepay(sale, true)} className="btn" style={{ backgroundColor: '#10b981', color: 'white', flex: 1, fontSize: '14px' }}>To'liq yopish</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. MIJOZLAR TARIXI VA TO'LOVLAR DETALIZATSIYASI */}
        <div style={{ borderTop: '2px dashed #d1d5db', paddingTop: '20px' }}>
          <h3 style={{ fontSize: '18px', color: '#1e3a8a', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <History size={20} /> Mijozlar qarzi va to'lovlar tarixi
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredCustomers.map(customer => {
              const customerHistory = sales.filter(s => 
                s.customer?.toLowerCase() === customer.name?.toLowerCase() && (s.isDebt || s.wasDebt)
              );
              
              if (customerHistory.length === 0) return null;

              return (
                <div key={customer.id || customer.name} style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div 
                    onClick={() => setExpandedCustomer(expandedCustomer === customer.name ? null : customer.name)}
                    style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: expandedCustomer === customer.name ? '#f8fafc' : '#fff' }}
                  >
                    <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ background: '#1e3a8a', color: '#fff', width: '35px', height: '35px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize: '16px' }}>{customer.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                       {expandedCustomer === customer.name ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>

                  {expandedCustomer === customer.name && (
                    <div style={{ padding: '15px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {customerHistory.sort((a,b) => b.id - a.id).map(h => {
                          const isKv = isUsdProduct(h.productName, h.unit);
                          const currency = isKv ? '$' : "so'm";
                          const rem = h.totalSum - (h.paidAmount || 0);

                          return (
                            <div key={h.id} style={{ padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', backgroundColor: '#fff' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px', marginBottom: '8px' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{h.productName}</span>
                                <span style={{ fontSize: '12px', color: '#6b7280' }}>{new Date(h.id).toLocaleDateString()}</span>
                              </div>

                              <div style={{ marginBottom: '10px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#4b5563', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                   <Clock size={12} /> To'lovlar xronologiyasi:
                                </div>
                                {h.paymentHistory && h.paymentHistory.length > 0 ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '10px', borderLeft: '2px solid #e5e7eb' }}>
                                    {h.paymentHistory.map((pay, idx) => (
                                      <div key={pay.id} style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#6b7280' }}>{idx + 1}. {new Date(pay.date).toLocaleDateString()} {new Date(pay.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        <span style={{ color: '#059669', fontWeight: '500' }}>+{pay.amount.toLocaleString()} {currency}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>Hali to'lov qilinmagan (faqat qarz)</div>
                                )}
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #e5e7eb' }}>
                                <div style={{ fontSize: '13px' }}>Jami: <b>{h.totalSum.toLocaleString()}</b></div>
                                <div style={{ fontSize: '13px', color: h.isDebt ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                                  {h.isDebt ? `Qolgan: ${rem.toLocaleString()} ${currency}` : '✅ To\'liq to\'langan'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {filteredDebts.length === 0 && searchQuery && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
           Mijoz topilmadi...
        </div>
      )}
    </div>
  );
};

export default Debts;