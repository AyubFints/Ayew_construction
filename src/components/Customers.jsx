import React, { useState } from 'react';
import { Users, ArrowLeft, UserPlus, History, User as UserIcon, Phone, TrendingUp, Wallet, Calendar, ShoppingBag, MessageSquare, Banknote } from 'lucide-react';

const Customers = ({ customers = [], setCustomers, sales = [], setPage }) => {
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null); 

  const handleAddCustomer = (e) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;
    const isExist = customers.find(c => c.name.toLowerCase() === newCustomerName.trim().toLowerCase());
    if (isExist) return alert("Bu ismli mijoz bazada bor!");
    setCustomers([...customers, { id: Date.now(), name: newCustomerName.trim(), phone: newCustomerPhone.trim() }]);
    setNewCustomerName(''); setNewCustomerPhone('');
  };

  const getCustomerStats = (customerName) => {
    const mySales = sales.filter(s => s.customer === customerName);
    const totalBought = mySales.reduce((acc, s) => acc + (s.totalSum || 0), 0);
    
    // QARZ HISOBLASH: (Jami summa - to'langan qismi) faqat qarz deb belgilangan savdolardan
    const totalDebt = mySales.reduce((acc, s) => {
      if (s.isDebt) {
        return acc + (s.totalSum - (s.paidAmount || 0));
      }
      return acc;
    }, 0);

    return { totalBought, totalDebt, history: mySales.slice().reverse() };
  };

  if (selectedCustomer) {
    const stats = getCustomerStats(selectedCustomer.name);
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
            <p style={{ color: '#6b7280' }}><Phone size={14} /> {selectedCustomer.phone || "Telefon yo'q"}</p>
          </div>
        </div>

        {/* STATISTIKA KARTALARI */}
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', color: 'white', border: 'none' }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', opacity: 0.8 }}>JAMI XARIDLAR</p>
            <h2 style={{ fontSize: '32px' }}>{stats.totalBought.toLocaleString()} so'm</h2>
          </div>
          <div className="card" style={{ background: stats.totalDebt > 0 ? '#fff5f5' : '#f0fdf4', border: `1px solid ${stats.totalDebt > 0 ? '#feb2b2' : '#bbf7d0'}` }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#6b7280' }}>QARZ MIQDORI</p>
            <h2 style={{ fontSize: '32px', color: stats.totalDebt > 0 ? '#ef4444' : '#10b981' }}>{stats.totalDebt.toLocaleString()} so'm</h2>
          </div>
        </div>

        {/* TARIX RO'YXATI */}
        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Savdolar va Qarzlar tarixi</h3>
          {stats.history.map(s => {
            const remaining = s.totalSum - (s.paidAmount || 0);
            return (
              <div key={s.id} style={{ padding: '15px', borderRadius: '12px', background: '#f8fafc', borderLeft: `5px solid ${s.isDebt ? '#ef4444' : '#10b981'}`, marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{s.productName}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{new Date(s.id).toLocaleDateString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '800' }}>{s.totalSum.toLocaleString()} so'm</div>
                  {s.isDebt && <div style={{ fontSize: '11px', color: '#ef4444' }}>Qarz: {remaining.toLocaleString()}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

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
          {customers.map(c => {
            const stat = getCustomerStats(c.name);
            return (
              <div key={c.id} onClick={() => setSelectedCustomer(c)} className="menu-card" style={{ padding: '15px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', marginBottom: '10px', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ background: '#eff6ff', color: '#2563eb', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{c.name.charAt(0)}</div>
                  <b>{c.name}</b>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', color: '#10b981' }}>Xarid: {stat.totalBought.toLocaleString()}</div>
                  {stat.totalDebt > 0 && <div style={{ fontSize: '13px', color: '#ef4444' }}>Qarz: {stat.totalDebt.toLocaleString()}</div>}
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