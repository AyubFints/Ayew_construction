import React from 'react';
import { ShoppingCart, RotateCcw, Package, Wallet, BookOpen, LogOut, Settings as SettingsIcon, AlertTriangle, Users, Landmark, Calendar } from 'lucide-react';

const Dashboard = ({ storeName, products = [], setPage, onLogout }) => {
  
  // Kam qolgan tovarlarni aniqlash
  const lowStockProducts = products.filter(p => p.quantity <= 10);

  // --- BUGUNGI SANANI HISOBLASH VA O'ZBEKCHAGA O'GIRISH ---
  const bugun = new Date();
  const kunlar = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
  const oylar = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
  
  const haftaKuni = kunlar[bugun.getDay()];
  const kun = String(bugun.getDate()).padStart(2, '0');
  const oy = oylar[bugun.getMonth()];
  const yil = bugun.getFullYear();
  
  // Natija: "13 May 2026, Chorshanba" ko'rinishida bo'ladi
  const sanaMatni = `${kun} ${oy} ${yil}-yil, ${haftaKuni}`;

  return (
    <div className="fade-in">
      
      <style>
        {`
          @media (max-width: 768px) {
            .dashboard-grid {
              display: grid !important;
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 12px !important;
            }
            .menu-card {
              padding: 15px 10px !important;
            }
            .menu-icon svg {
              width: 32px !important;
              height: 32px !important;
            }
            .menu-title {
              font-size: 13px !important;
            }
          }
        `}
      </style>

      {/* --- TEPADAGI QISM (Sana, Sarlavha va Chiqish tugmasi) --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          {/* SANA SHU YERGA QO'SHILDI */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px', backgroundColor: '#ecfdf5', padding: '5px 12px', borderRadius: '20px', width: 'fit-content' }}>
            <Calendar size={16} /> {sanaMatni}
          </div>
          <h1 style={{ fontSize: '28px', color: '#111827', margin: 0 }}>Boshqaruv Paneli</h1>
          <p style={{ color: '#4b5563', margin: '5px 0 0 0', fontWeight: '500' }}>{storeName}</p>
        </div>
        <button onClick={onLogout} className="btn btn-danger fade-in" style={{ width: 'auto', padding: '10px 20px', display: 'flex', gap: '8px', alignItems: 'center', marginTop: '5px' }}>
          <LogOut size={18} /> Dasturdan chiqish
        </button>
      </div>

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
        <div className="menu-card fade-in" style={{ animationDelay: '0.05s' }} onClick={() => setPage('sell')}>
          <div className="menu-icon"><ShoppingCart size={40} color="#1e3a8a" strokeWidth={1.5} /></div>
          <div className="menu-title">Sotish bo'limi</div>
        </div>
        
        <div className="menu-card fade-in" style={{ animationDelay: '0.1s' }} onClick={() => setPage('return')}>
          <div className="menu-icon"><RotateCcw size={40} color="#1e3a8a" strokeWidth={1.5} /></div>
          <div className="menu-title">Qaytish (Vozvrat)</div>
        </div>
        
        <div className="menu-card fade-in" style={{ animationDelay: '0.15s' }} onClick={() => setPage('products')}>
          <div className="menu-icon"><Package size={40} color="#1e3a8a" strokeWidth={1.5} /></div>
          <div className="menu-title">Tovarlar ombori</div>
        </div>
        
        <div className="menu-card fade-in" style={{ animationDelay: '0.2s' }} onClick={() => setPage('todaysales')}>
          <div className="menu-icon"><Wallet size={40} color="#1e3a8a" strokeWidth={1.5} /></div>
          <div className="menu-title">Bugungi kassa</div>
        </div>

        <div className="menu-card fade-in" style={{ animationDelay: '0.25s', borderBottom: '4px solid #1e3a8a' }} onClick={() => setPage('customers')}>
          <div className="menu-icon"><Users size={40} color="#1e3a8a" strokeWidth={1.5} /></div>
          <div className="menu-title" style={{ fontWeight: 'bold' }}>Mijozlar bazasi</div>
        </div>
        
        <div className="menu-card fade-in" style={{ animationDelay: '0.3s' }} onClick={() => setPage('debts')}>
          <div className="menu-icon"><BookOpen size={40} color="#1e3a8a" strokeWidth={1.5} /></div>
          <div className="menu-title">Qarz Daftari</div>
        </div>

        <div className="menu-card fade-in" style={{ animationDelay: '0.35s' }} onClick={() => setPage('arenda')}>
          <div className="menu-icon"><Landmark size={40} color="#1e3a8a" strokeWidth={1.5} /></div>
          <div className="menu-title">Arenda va Chiqimlar</div>
        </div>

        <div className="menu-card fade-in" style={{ animationDelay: '0.4s', backgroundColor: '#f9fafb' }} onClick={() => setPage('settings')}>
          <div className="menu-icon"><SettingsIcon size={40} color="#4b5563" strokeWidth={1.5} /></div>
          <div className="menu-title" style={{ color: '#4b5563' }}>Sozlamalar</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;