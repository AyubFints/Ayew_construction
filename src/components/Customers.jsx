import React, { useState, useMemo } from 'react';
import { Users, ArrowLeft, UserPlus, History, User as UserIcon, Phone, TrendingUp, Wallet, Calendar, ShoppingBag, MessageSquare, Banknote, BarChart3, CheckCircle, Trash2, PackageMinus, Landmark } from 'lucide-react';

import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

const Customers = ({ customers = [], setCustomers, sales = [], returns = [], setPage }) => {
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null); 
  
  const [historyType, setHistoryType] = useState('daily');

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;
    const isExist = customers.find(c => c.name.toLowerCase() === newCustomerName.trim().toLowerCase());
    if (isExist) return alert("Bu ismli mijoz bazada bor!");
    
    const newCustomer = { id: Date.now(), name: newCustomerName.trim(), phone: newCustomerPhone.trim() };
    const yangiMijozlar = [...customers, newCustomer];
    
    setCustomers(yangiMijozlar);
    setNewCustomerName(''); 
    setNewCustomerPhone('');

    if (auth.currentUser) {
      try {
        const docRef = doc(db, "stores", auth.currentUser.uid);
        await setDoc(docRef, { customers: yangiMijozlar }, { merge: true });
      } catch (error) {
        console.error("Mijozni bulutga saqlashda xato:", error);
      }
    }
  };

  const handleDeleteCustomer = async (id, name, e) => {
    e.stopPropagation(); 
    const confirmDelete = window.confirm(`"${name}" ismli mijozni o'chirmoqchimisiz?`);
    if (confirmDelete) {
      const qolganMijozlar = customers.filter(c => c.id !== id);
      setCustomers(qolganMijozlar);

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

  const isUsdUnit = (unit) => {
    if (!unit) return false;
    return unit.toLowerCase() === 'kv' || unit.includes('$');
  };

  const isUsdProduct = (productName, unit) => {
    if (isUsdUnit(unit)) return true;
    if (typeof productName === 'string' && (productName.includes('$') || productName.includes(' kv '))) return true;
    return false;
  };

  // --- MIJOZNING BARCHA HISOB-KITOB MANTIG'I ---
  const getCustomerStats = (customerName) => {
    const mySales = sales.filter(s => s.customer === customerName);
    const myReturns = returns.filter(r => r.customer === customerName);
    
    let totalBoughtSom = 0;
    let totalBoughtUsd = 0;
    
    let totalDebtSom = 0;
    let totalDebtUsd = 0;

    let totalReturnedSom = 0;
    let totalReturnedUsd = 0;

    // Xaridlar va Qarzni hisoblash
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

    // Vozvratni hisoblash
    myReturns.forEach(r => {
      if (r.returnSumSom !== undefined || r.returnSumUsd !== undefined) {
        totalReturnedSom += (Number(r.returnSumSom) || 0);
        totalReturnedUsd += (Number(r.returnSumUsd) || 0);
      } else {
        if (isUsdProduct(r.productName, r.unit)) totalReturnedUsd += (Number(r.returnSum) || 0);
        else totalReturnedSom += (Number(r.returnSum) || 0);
      }
    });

    // Sof To'langan pul (Faktik olib kelingan naqd pul)
    const actualPaidSom = totalBoughtSom - totalReturnedSom - totalDebtSom;
    const actualPaidUsd = totalBoughtUsd - totalReturnedUsd - totalDebtUsd;

    // YANGI: Xaridlar va Vozvratlarni bitta tarixga birlashtiramiz!
    const combinedHistory = [
      ...mySales.map(s => ({ ...s, itemType: 'sale' })),
      ...myReturns.map(r => ({ ...r, itemType: 'return' }))
    ].sort((a, b) => b.id - a.id); // Eng yangisi tepada turadi

    return { 
      totalBoughtSom, 
      totalBoughtUsd, 
      
      totalDebtSom, 
      totalDebtUsd, 
      
      totalReturnedSom,
      totalReturnedUsd,

      actualPaidSom,
      actualPaidUsd,

      hasDebt: totalDebtSom > 0 || totalDebtUsd > 0,
      history: combinedHistory 
    };
  };

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

    stats.history.forEach(item => {
      const { key, label } = getKeyAndLabel(item.id);
      if (!map[key]) map[key] = { label, boughtSom: 0, boughtUsd: 0, debtSom: 0, debtUsd: 0, timestamp: item.id };
      
      if (item.itemType === 'sale') {
        const isKv = isUsdProduct(item.productName, item.unit);
        const sum = Number(item.totalSum) || 0;
        const remainingDebt = item.isDebt ? (sum - (Number(item.paidAmount) || 0)) : 0;

        if (isKv) {
          map[key].boughtUsd += sum;
          map[key].debtUsd += remainingDebt;
        } else {
          map[key].boughtSom += sum;
          map[key].debtSom += remainingDebt;
        }
      }
    });

    return Object.values(map).sort((a, b) => b.timestamp - a.timestamp);
  }, [selectedCustomer, sales, returns, historyType]);

  if (selectedCustomer) {
    const stats = getCustomerStats(selectedCustomer.name);

    return (
      <div className="fade-in app-container" style={{ paddingBottom: '40px' }}>
        <button onClick={() => setSelectedCustomer(null)} className="btn btn-danger" style={{ marginBottom: '25px', width: 'auto' }}>
          <ArrowLeft size={18} /> Orqaga
        </button>

        {/* PROFIL SHAPKASI */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '30px', marginBottom: '25px', borderTop: '4px solid #1e3a8a' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', color: '#1e3a8a' }}>
            {selectedCustomer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={{ margin: 0 }}>{selectedCustomer.name}</h1>
            <p style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}>
              <Phone size={14} /> {selectedCustomer.phone || "Telefon kiritilmagan"}
            </p>
          </div>
        </div>

        {/* --- MIJOZ STATISTIKASI --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          
          <div className="card" style={{ background: '#f8fafc', borderTop: '4px solid #3b82f6', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', marginBottom: '10px' }}>
              <ShoppingBag size={18} /> <span style={{ fontSize: '13px', fontWeight: 'bold' }}>JAMI XARIDLAR</span>
            </div>
            {stats.totalBoughtSom > 0 && <h2 style={{ fontSize: '20px', margin: '5px 0 0 0', color: '#1e3a8a' }}>{stats.totalBoughtSom.toLocaleString()} so'm</h2>}
            {stats.totalBoughtUsd > 0 && <h2 style={{ fontSize: '20px', margin: '5px 0 0 0', color: '#2563eb' }}>{stats.totalBoughtUsd.toLocaleString()} $</h2>}
            {stats.totalBoughtSom === 0 && stats.totalBoughtUsd === 0 && <h2 style={{ fontSize: '20px', margin: '5px 0 0 0', color: '#1e3a8a' }}>0 so'm</h2>}
          </div>

          <div className="card" style={{ background: '#fdf8f6', borderTop: '4px solid #f59e0b', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', marginBottom: '10px' }}>
              <PackageMinus size={18} /> <span style={{ fontSize: '13px', fontWeight: 'bold' }}>VOZVRAT QILGAN</span>
            </div>
            {stats.totalReturnedSom > 0 && <h2 style={{ fontSize: '20px', margin: '5px 0 0 0', color: '#b45309' }}>-{stats.totalReturnedSom.toLocaleString()} so'm</h2>}
            {stats.totalReturnedUsd > 0 && <h2 style={{ fontSize: '20px', margin: '5px 0 0 0', color: '#d97706' }}>-{stats.totalReturnedUsd.toLocaleString()} $</h2>}
            {stats.totalReturnedSom === 0 && stats.totalReturnedUsd === 0 && <h2 style={{ fontSize: '20px', margin: '5px 0 0 0', color: '#d97706' }}>0 so'm</h2>}
          </div>

          <div className="card" style={{ background: stats.hasDebt ? '#fff5f5' : '#f0fdf4', borderTop: `4px solid ${stats.hasDebt ? '#ef4444' : '#10b981'}`, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', marginBottom: '10px' }}>
              <History size={18} /> <span style={{ fontSize: '13px', fontWeight: 'bold' }}>QARZ MIQDORI</span>
            </div>
            {stats.totalDebtSom > 0 && <h2 style={{ fontSize: '20px', margin: '5px 0 0 0', color: '#ef4444' }}>-{stats.totalDebtSom.toLocaleString()} so'm</h2>}
            {stats.totalDebtUsd > 0 && <h2 style={{ fontSize: '20px', margin: '5px 0 0 0', color: '#dc2626' }}>-{stats.totalDebtUsd.toLocaleString()} $</h2>}
            {!stats.hasDebt && <h2 style={{ fontSize: '20px', margin: '5px 0 0 0', color: '#10b981' }}>0 so'm</h2>}
          </div>

          <div className="card" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', color: 'white', border: 'none', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.8, marginBottom: '10px' }}>
              <Landmark size={18} /> <span style={{ fontSize: '13px', fontWeight: 'bold' }}>SOF TO'LAGAN PULLAR</span>
            </div>
            {stats.actualPaidSom > 0 && <h2 style={{ fontSize: '24px', margin: '5px 0 0 0', color: '#ffffff' }}>{stats.actualPaidSom.toLocaleString()} so'm</h2>}
            {stats.actualPaidUsd > 0 && <h2 style={{ fontSize: '24px', margin: '5px 0 0 0', color: '#bfdbfe' }}>{stats.actualPaidUsd.toLocaleString()} $</h2>}
            {stats.actualPaidSom <= 0 && stats.actualPaidUsd <= 0 && <h2 style={{ fontSize: '24px', margin: '5px 0 0 0', color: '#ffffff' }}>0 so'm</h2>}
          </div>
        </div>

        {/* BATAFSIL TARIX RO'YXATI (SOTILGAN VA VOZVRAT BIZGA BIRGA) */}
        <div className="card">
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History size={20} color="#4b5563" /> Barcha harakatlar tarixi
          </h3>
          {stats.history.length === 0 && <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>Hali xaridlar yo'q</p>}
          
          {stats.history.map(item => {
            
            // AGAR BU SOTIB OLINGAN BO'LSA
            if (item.itemType === 'sale') {
              const isKv = isUsdProduct(item.productName, item.unit);
              const remaining = item.totalSum - (item.paidAmount || 0);
              
              return (
                <div key={`sale-${item.id}`} style={{ padding: '15px', borderRadius: '12px', background: '#f8fafc', borderLeft: `5px solid ${item.isDebt ? '#ef4444' : '#10b981'}`, marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', whiteSpace: 'pre-line', lineHeight: '1.5' }}>{item.productName}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>
                      🛒 Sotib olingan: {new Date(item.id).toLocaleDateString('uz-UZ')} soat {new Date(item.id).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '120px' }}>
                    <div style={{ fontWeight: '800', color: '#1e3a8a', fontSize: '16px' }}>
                      {item.totalSum.toLocaleString()} {isKv ? '$' : "so'm"}
                    </div>
                    {item.isDebt ? (
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
            } 
            
            // AGAR BU VOZVRAT BO'LSA (SARG'ISH RANGDA CHIQADI)
            else if (item.itemType === 'return') {
              const rSom = item.returnSumSom !== undefined ? item.returnSumSom : (!isUsdProduct(item.productName, item.unit) ? (item.returnSum || 0) : 0);
              const rUsd = item.returnSumUsd !== undefined ? item.returnSumUsd : (isUsdProduct(item.productName, item.unit) ? (item.returnSum || 0) : 0);
              
              return (
                <div key={`return-${item.id}`} style={{ padding: '15px', borderRadius: '12px', background: '#fffbeb', borderLeft: '5px solid #f59e0b', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', whiteSpace: 'pre-line', lineHeight: '1.5', color: '#b45309' }}>{item.productName}</div>
                    <div style={{ fontSize: '12px', color: '#b45309', marginTop: '5px', fontWeight: 'bold' }}>
                      ↩️ Vozvrat qilgan: {new Date(item.id).toLocaleDateString('uz-UZ')} soat {new Date(item.id).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '120px' }}>
                    <div style={{ fontWeight: '800', color: '#d97706', fontSize: '16px' }}>
                      {rSom > 0 && `-${rSom.toLocaleString()} so'm`}
                      {rUsd > 0 && `-${rUsd.toLocaleString()} $`}
                    </div>
                    <div style={{ fontSize: '12px', color: '#b45309', marginTop: '4px', fontWeight: 'bold' }}>
                      Do'konga qaytgan
                    </div>
                  </div>
                </div>
              );
            }
          })}
        </div>
      </div>
    );
  }

  // MIJOZLAR RO'YXATI (ASOSIY OYNA)
  return (
    <div className="fade-in app-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}><Users size={28} /> Mijozlar Bazasi</h1>
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