import React, { useState, useMemo } from 'react';
import { Users, ArrowLeft, UserPlus, History, User as UserIcon, Phone, TrendingUp, Wallet, Calendar, ShoppingBag, MessageSquare, Banknote, BarChart3, CheckCircle, Trash2 } from 'lucide-react';

// --- FIREBASE IMPORTLARI QO'SHILDI ---
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

const Customers = ({ customers = [], setCustomers, sales = [], setPage }) => {
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null); 
  
  // Tarix turi uchun state (kunlik, oylik, yillik)
  const [historyType, setHistoryType] = useState('daily');

  // --- FIREBASE'GA QO'SHISH ULANGAN FUNKSIYA ---
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;
    const isExist = customers.find(c => c.name.toLowerCase() === newCustomerName.trim().toLowerCase());
    if (isExist) return alert("Bu ismli mijoz bazada bor!");
    
    const newCustomer = { id: Date.now(), name: newCustomerName.trim(), phone: newCustomerPhone.trim() };
    const yangiMijozlar = [...customers, newCustomer];
    
    setCustomers(yangiMijozlar); // Ekranda ko'rsatish
    setNewCustomerName(''); 
    setNewCustomerPhone('');

    // Bulutga (Firebase) yozish
    if (auth.currentUser) {
      try {
        const docRef = doc(db, "stores", auth.currentUser.uid);
        await setDoc(docRef, { customers: yangiMijozlar }, { merge: true });
      } catch (error) {
        console.error("Mijozni bulutga saqlashda xato:", error);
      }
    }
  };

  // --- FIREBASE'DAN O'CHIRISH ULANGAN FUNKSIYA ---
  const handleDeleteCustomer = async (id, name, e) => {
    e.stopPropagation(); // Profilga kirib ketmasligi uchun
    const confirmDelete = window.confirm(`"${name}" ismli mijozni o'chirmoqchimisiz?`);
    if (confirmDelete) {
      const qolganMijozlar = customers.filter(c => c.id !== id);
      setCustomers(qolganMijozlar); // Ekranda o'chirish

      // Bulutdan ham o'chirish
      if (auth.currentUser) {
        try {
          const docRef = doc(db, "stores", auth.currentUser.uid);
          await setDoc(docRef, { customers: qolganMijozlar }, { merge: true });
        } catch (error) {
          console.error("Mijozni bulutdan o'chirishda xato:", error);
        }
      }
    }
  };

  // --- MANTIQ: Dollar birligini aniqlash (Dona/$ yoki kv uchun) ---
  const isUsdUnit = (unit) => {
    if (!unit) return false;
    return unit.toLowerCase() === 'kv' || unit.includes('$');
  };

  const isUsdProduct = (productName, unit) => {
    if (isUsdUnit(unit)) return true;
    if (typeof productName === 'string' && (productName.includes('$') || productName.includes(' kv '))) return true;
    return false;
  };
  // ---------------------------------------------------------------

  const getCustomerStats = (customerName) => {
    const mySales = sales.filter(s => s.customer === customerName);
    
    let totalBoughtSom = 0;
    let totalBoughtUsd = 0;
    let totalDebtSom = 0;
    let totalDebtUsd = 0;

    mySales.forEach(s => {
      const isKv = isUsdProduct(s.productName, s.unit);
      const sum = Number(s.totalSum) || 0;
      const remainingDebt = s.isDebt ? (sum - (Number(s.paidAmount) || 0)) : 0;

      if (isKv) {
        totalBoughtUsd += sum;
        totalDebtUsd += remainingDebt;
      } else {
        totalBoughtSom += sum;
        totalDebtSom += remainingDebt;
      }
    });

    return { 
      totalBoughtSom, 
      totalBoughtUsd, 
      totalDebtSom, 
      totalDebtUsd, 
      hasDebt: totalDebtSom > 0 || totalDebtUsd > 0,
      history: mySales.slice().sort((a, b) => b.id - a.id) // Eng yangilari tepada turishi uchun
    };
  };

  // KUNLIK, OYLIK, YILLIK HISOBOT UCHUN USEMEMO
  const aggregatedHistory = useMemo(() => {
    if (!selectedCustomer) return [];
    const stats = getCustomerStats(selectedCustomer.name);
    const map = {};
    
    const getKeyAndLabel = (timestamp) => {
      const t = new Date(timestamp);
      if (historyType === 'daily') return { key: t.toLocaleDateString('uz-UZ'), label: t.toLocaleDateString('uz-UZ') + " dagi" };
      if (historyType === 'monthly') {
        const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
        return { key: `${months[t.getMonth()]} ${t.getFullYear()}`, label: `${months[t.getMonth()]} ${t.getFullYear()} dagi` };
      }
      return { key: t.getFullYear().toString(), label: `${t.getFullYear()} yildagi` };
    };

    stats.history.forEach(s => {
      const { key, label } = getKeyAndLabel(s.id);
      if (!map[key]) map[key] = { label, boughtSom: 0, boughtUsd: 0, debtSom: 0, debtUsd: 0, timestamp: s.id };
      
      const isKv = isUsdProduct(s.productName, s.unit);
      const sum = Number(s.totalSum) || 0;
      const remainingDebt = s.isDebt ? (sum - (Number(s.paidAmount) || 0)) : 0;

      if (isKv) {
        map[key].boughtUsd += sum;
        map[key].debtUsd += remainingDebt;
      } else {
        map[key].boughtSom += sum;
        map[key].debtSom += remainingDebt;
      }
    });

    return Object.values(map).sort((a, b) => b.timestamp - a.timestamp);
  }, [selectedCustomer, sales, historyType]);

  if (selectedCustomer) {
    const stats = getCustomerStats(selectedCustomer.name);
    const totalPaidSom = stats.totalBoughtSom - stats.totalDebtSom;
    const totalPaidUsd = stats.totalBoughtUsd - stats.totalDebtUsd;

    return (
      <div className="fade-in app-container" style={{ paddingBottom: '40px' }}>
        <button onClick={() => setSelectedCustomer(null)} className="btn btn-danger" style={{ marginBottom: '25px', width: 'auto' }}>
          <ArrowLeft size={18} /> Orqaga
        </button>

        {/* PROFIL SHAPKASI */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '30px', marginBottom: '25px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', color: '#1e3a8a' }}>
            {selectedCustomer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={{ margin: 0 }}>{selectedCustomer.name}</h1>
            <p style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Phone size={14} /> {selectedCustomer.phone || "Telefon yo'q"}
            </p>
          </div>
        </div>

        {/* STATISTIKA KARTALARI (3 TA QISMDAN IBORAT) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          {/* JAMI XARID QILGAN SUMMASI */}
          <div className="card" style={{ background: '#f8fafc', borderTop: '4px solid #3b82f6' }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#64748b' }}>JAMI XARIDLAR</p>
            {stats.totalBoughtSom > 0 && <h2 style={{ fontSize: '24px', margin: '5px 0 0 0', color: '#1e3a8a' }}>{stats.totalBoughtSom.toLocaleString()} so'm</h2>}
            {stats.totalBoughtUsd > 0 && <h2 style={{ fontSize: '24px', margin: '5px 0 0 0', color: '#2563eb' }}>{stats.totalBoughtUsd.toLocaleString()} $</h2>}
            {stats.totalBoughtSom === 0 && stats.totalBoughtUsd === 0 && <h2 style={{ fontSize: '24px', margin: '5px 0 0 0', color: '#1e3a8a' }}>0 so'm</h2>}
          </div>

          {/* QARZ MIQDORI */}
          <div className="card" style={{ background: stats.hasDebt ? '#fff5f5' : '#f0fdf4', borderTop: `4px solid ${stats.hasDebt ? '#ef4444' : '#10b981'}` }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#6b7280' }}>QARZ MIQDORI</p>
            {stats.totalDebtSom > 0 && <h2 style={{ fontSize: '24px', margin: '5px 0 0 0', color: '#ef4444' }}>{stats.totalDebtSom.toLocaleString()} so'm</h2>}
            {stats.totalDebtUsd > 0 && <h2 style={{ fontSize: '24px', margin: '5px 0 0 0', color: '#dc2626' }}>{stats.totalDebtUsd.toLocaleString()} $</h2>}
            {!stats.hasDebt && <h2 style={{ fontSize: '24px', margin: '5px 0 0 0', color: '#10b981' }}>0 so'm</h2>}
          </div>

          {/* TO'LANGAN (SOF) SUMMA (JAMI - QARZ) */}
          <div className="card" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', color: 'white', border: 'none' }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', opacity: 0.8 }}>TO'LANGAN SUMMA</p>
            {totalPaidSom > 0 && <h2 style={{ fontSize: '24px', margin: '5px 0 0 0', color: '#ffffff' }}>{totalPaidSom.toLocaleString()} so'm</h2>}
            {totalPaidUsd > 0 && <h2 style={{ fontSize: '24px', margin: '5px 0 0 0', color: '#bfdbfe' }}>{totalPaidUsd.toLocaleString()} $</h2>}
            {totalPaidSom === 0 && totalPaidUsd === 0 && <h2 style={{ fontSize: '24px', margin: '5px 0 0 0', color: '#ffffff' }}>0 so'm</h2>}
          </div>
        </div>

        {/* QISQA TARIX (KUNLIK, OYLIK, YILLIK) */}
        <div className="card" style={{ padding: '20px', marginBottom: '30px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={20} color="#1e3a8a" /> Umumiy xaridlar statistikasi
          </h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button className="btn" style={{ padding: '8px', flex: 1, backgroundColor: historyType === 'daily' ? '#1e3a8a' : '#e5e7eb', color: historyType === 'daily' ? 'white' : '#1f2937' }} onClick={() => setHistoryType('daily')}>Kunlik</button>
            <button className="btn" style={{ padding: '8px', flex: 1, backgroundColor: historyType === 'monthly' ? '#1e3a8a' : '#e5e7eb', color: historyType === 'monthly' ? 'white' : '#1f2937' }} onClick={() => setHistoryType('monthly')}>Oylik</button>
            <button className="btn" style={{ padding: '8px', flex: 1, backgroundColor: historyType === 'yearly' ? '#1e3a8a' : '#e5e7eb', color: historyType === 'yearly' ? 'white' : '#1f2937' }} onClick={() => setHistoryType('yearly')}>Yillik</button>
          </div>
          
          {aggregatedHistory.length === 0 ? <p style={{ textAlign: 'center', color: '#6b7280' }}>Hozircha ma'lumot yo'q.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {aggregatedHistory.map((item, index) => {
                const paidSom = item.boughtSom - item.debtSom;
                const paidUsd = item.boughtUsd - item.debtUsd;
                return (
                  <div key={index} style={{ padding: '15px', background: 'white', borderRadius: '8px', border: '1px solid #d1d5db', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontWeight: 'bold', color: '#1f2937', borderBottom: '1px solid #f3f4f6', paddingBottom: '5px' }}>{item.label}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ color: '#3b82f6', fontSize: '14px', fontWeight: 'bold' }}>
                        Jami oldi: {item.boughtSom > 0 ? `${item.boughtSom.toLocaleString()} so'm ` : ''} 
                        {item.boughtUsd > 0 ? `${item.boughtUsd.toLocaleString()} $` : ''}
                      </div>
                      <div style={{ color: '#ef4444', fontSize: '14px', fontWeight: 'bold' }}>
                        Qarz: {item.debtSom > 0 ? `${item.debtSom.toLocaleString()} so'm ` : ''}
                        {item.debtUsd > 0 ? `${item.debtUsd.toLocaleString()} $` : ''}
                        {item.debtSom === 0 && item.debtUsd === 0 && 'Yo\'q'}
                      </div>
                      <div style={{ color: '#10b981', fontSize: '14px', fontWeight: 'bold' }}>
                        To'ladi: {paidSom > 0 || paidUsd === 0 ? `${paidSom.toLocaleString()} so'm ` : ''}
                        {paidUsd > 0 ? `${paidUsd.toLocaleString()} $` : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* BATAFSIL TARIX RO'YXATI */}
        <div className="card">
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History size={20} color="#4b5563" /> Batafsil xaridlar tarixi
          </h3>
          {stats.history.length === 0 && <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>Hali xaridlar yo'q</p>}
          {stats.history.map(s => {
            const isKv = isUsdProduct(s.productName, s.unit);
            const remaining = s.totalSum - (s.paidAmount || 0);
            return (
              <div key={s.id} style={{ padding: '15px', borderRadius: '12px', background: '#f8fafc', borderLeft: `5px solid ${s.isDebt ? '#ef4444' : '#10b981'}`, marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 'bold', whiteSpace: 'pre-line', lineHeight: '1.5' }}>{s.productName}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>
                    {new Date(s.id).toLocaleDateString('uz-UZ')} {new Date(s.id).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: '120px' }}>
                  <div style={{ fontWeight: '800', color: '#1e3a8a', fontSize: '16px' }}>
                    {s.totalSum.toLocaleString()} {isKv ? '$' : "so'm"}
                  </div>
                  {s.isDebt ? (
                    <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', fontWeight: 'bold' }}>
                      Qarz qoldi: {remaining.toLocaleString()} {isKv ? '$' : "so'm"}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                      <CheckCircle size={14} /> To'langan
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // MIJOZLAR RO'YXATI (ASOSIY OYNA)
  return (
    <div className="fade-in app-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '800' }}>Mijozlar Bazasi</h1>
        <button onClick={() => setPage('dashboard')} className="btn btn-danger" style={{ width: 'auto' }}>Dashboard</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
        <div className="card" style={{ alignSelf: 'start', borderTop: '5px solid #3b82f6' }}>
          <h3 style={{ marginTop: 0 }}><UserPlus size={22} color="#3b82f6" /> Yangi mijoz</h3>
          <form onSubmit={handleAddCustomer}>
            <input className="form-control" placeholder="Mijoz ismi" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} required />
            <input className="form-control" placeholder="Telefon" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} />
            <button className="btn btn-primary" style={{ width: '100%' }}>Saqlash</button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Mijozlar ro'yxati</h3>
          {customers.length === 0 && <p style={{ color: '#9ca3af', textAlign: 'center' }}>Mijozlar yo'q</p>}
          {customers.map(c => {
            const stat = getCustomerStats(c.name);
            return (
              <div key={c.id} onClick={() => setSelectedCustomer(c)} className="menu-card" style={{ padding: '15px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', border: '1px solid #f1f5f9', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ background: '#eff6ff', color: '#2563eb', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <b>{c.name}</b>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>
                      {stat.totalBoughtSom > 0 && <span>{stat.totalBoughtSom.toLocaleString()} so'm</span>}
                      {stat.totalBoughtSom > 0 && stat.totalBoughtUsd > 0 && <span style={{color: '#9ca3af', margin: '0 4px'}}>|</span>}
                      {stat.totalBoughtUsd > 0 && <span>{stat.totalBoughtUsd.toLocaleString()} $</span>}
                      {stat.totalBoughtSom === 0 && stat.totalBoughtUsd === 0 && <span>0 so'm</span>}
                    </div>
                    {stat.hasDebt && (
                      <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold' }}>
                        Qarz: 
                        {stat.totalDebtSom > 0 && <span> {stat.totalDebtSom.toLocaleString()} so'm</span>}
                        {stat.totalDebtSom > 0 && stat.totalDebtUsd > 0 && <span style={{color: '#fca5a5', margin: '0 3px'}}>+</span>}
                        {stat.totalDebtUsd > 0 && <span> {stat.totalDebtUsd.toLocaleString()} $</span>}
                      </div>
                    )}
                  </div>

                  {/* O'CHIRISH TUGMASI */}
                  <button 
                    onClick={(e) => handleDeleteCustomer(c.id, c.name, e)} 
                    style={{ background: '#fee2e2', border: 'none', color: '#ef4444', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Mijozni o'chirish"
                  >
                    <Trash2 size={18} />
                  </button>

                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Customers;