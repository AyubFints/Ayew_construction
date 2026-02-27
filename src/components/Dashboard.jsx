import React from 'react';
import { ShoppingCart, RotateCcw, Package, Wallet, BookOpen, LogOut, Settings as SettingsIcon, AlertTriangle } from 'lucide-react';

const Dashboard = ({ storeName, products = [], setPage, onLogout }) => {
  
  // Kam qolgan tovarlarni aniqlash (10 ta yoki 10 metrdan kam qolganlari)
  const lowStockProducts = products.filter(p => p.quantity <= 10);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '28px', color: '#111827', margin: 0 }}>Boshqaruv Paneli</h1>
          <p style={{ color: '#4b5563', margin: '5px 0 0 0', fontWeight: '500' }}>{storeName}</p>
        </div>
        <button onClick={onLogout} className="btn btn-danger" style={{ width: 'auto', padding: '10px 20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <LogOut size={18} /> Dasturdan chiqish
        </button>
      </div>

      {/* KAM QOLGAN TOVARLAR OGOHLANTIRISHI (Faqat tovar tugayotganda chiqadi) */}
      {lowStockProducts.length > 0 && (
        <div className="fade-in card" style={{ padding: '25px', backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderLeft: '5px solid #1f2937', marginBottom: '40px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={24} color="#1f2937" /> Diqqat, quyidagi tovarlar omborda tugamoqda!
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
            {lowStockProducts.map(p => (
              <div key={p.id} style={{ backgroundColor: '#f9fafb', padding: '12px 15px', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600', color: '#374151', fontSize: '14px' }}>{p.name}</span>
                <span style={{ fontWeight: 'bold', color: '#1e3a8a', backgroundColor: '#e5e7eb', padding: '4px 8px', borderRadius: '6px', fontSize: '13px' }}>
                  {p.quantity} {p.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="menu-card" onClick={() => setPage('sell')}>
          <div className="menu-icon"><ShoppingCart size={40} color="#1e3a8a" strokeWidth={1.5} /></div>
          <div className="menu-title">Sotish bo'limi</div>
        </div>
        
        <div className="menu-card" onClick={() => setPage('return')}>
          <div className="menu-icon"><RotateCcw size={40} color="#1e3a8a" strokeWidth={1.5} /></div>
          <div className="menu-title">Qaytish (Vozvrat)</div>
        </div>
        
        <div className="menu-card" onClick={() => setPage('products')}>
          <div className="menu-icon"><Package size={40} color="#1e3a8a" strokeWidth={1.5} /></div>
          <div className="menu-title">Tovarlar ombori</div>
        </div>
        
        <div className="menu-card" onClick={() => setPage('todaysales')}>
          <div className="menu-icon"><Wallet size={40} color="#1e3a8a" strokeWidth={1.5} /></div>
          <div className="menu-title">Bugungi kassa</div>
        </div>
        
        <div className="menu-card" onClick={() => setPage('debts')}>
          <div className="menu-icon"><BookOpen size={40} color="#1e3a8a" strokeWidth={1.5} /></div>
          <div className="menu-title">Qarz Daftari</div>
        </div>

        <div className="menu-card" onClick={() => setPage('settings')} style={{ backgroundColor: '#f9fafb' }}>
          <div className="menu-icon"><SettingsIcon size={40} color="#4b5563" strokeWidth={1.5} /></div>
          <div className="menu-title" style={{ color: '#4b5563' }}>Sozlamalar</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;