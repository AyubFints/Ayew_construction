import React from 'react';
import { ShoppingCart, RotateCcw, Package, Wallet, BookOpen, LogOut, Settings as SettingsIcon, AlertTriangle, Users, Landmark, Calendar, Store } from 'lucide-react';

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
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&display=swap');

          .smart-logo {
            font-family: 'Montserrat', sans-serif;
            font-weight: 900;
            font-size: 46px;
            margin: 0;
            background: linear-gradient(90deg, #1e3a8a 0%, #10b981 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -1.5px;
            text-transform: uppercase;
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .smart-subtitle {
            margin: 5px 0 0 60px;
            font-size: 14px;
            color: #6b7280;
            font-weight: 600;
            letter-spacing: 3px;
            text-transform: uppercase;
          }

          /* Tugayotgan tovarlar yozuvi uchun logotipdagi gradient */
          .gradient-text {
            background: linear-gradient(90deg, #1e3a8a 0%, #10b981 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

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
            .smart-logo {
              font-size: 32px;
            }
            .smart-subtitle {
              margin-left: 45px;
              font-size: 11px;
              letter-spacing: 2px;
            }
            .header-top {
              flex-direction: column;
              gap: 20px;
            }
            .logout-btn {
              width: 100% !important;
              justify-content: center;
            }
          }
        `}
      </style>

      {/* --- TEPADAGI QISM (Logotip, Sana, Sarlavha va Chiqish tugmasi) --- */}
      <div className="header-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          
          {/* --- SMART DO'KON LOGOTIPI --- */}
          <div style={{ marginBottom: '25px', paddingBottom: '20px', borderBottom: '2px dashed #e5e7eb' }}>
            <h1 className="smart-logo">
              <Store size={46} color="#1e3a8a" style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.1))' }} />
              SMART DO'KON
            </h1>
            <p className="smart-subtitle">Avtomatlashtirilgan Tizim</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px', backgroundColor: '#ecfdf5', padding: '5px 12px', borderRadius: '20px', width: 'fit-content' }}>
            <Calendar size={16} /> {sanaMatni}
          </div>
          <h2 style={{ fontSize: '24px', color: '#111827', margin: 0 }}>
            Boshqaruv Paneli <span style={{ color: '#9ca3af', fontWeight: 'normal', fontSize: '20px' }}>| {storeName}</span>
          </h2>
        </div>

        <button onClick={onLogout} className="btn btn-danger fade-in logout-btn" style={{ width: 'auto', padding: '12px 20px', display: 'flex', gap: '8px', alignItems: 'center', marginTop: '5px', borderRadius: '12px', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)' }}>
          <LogOut size={18} /> Dasturdan chiqish
        </button>
      </div>

      {/* --- ASOSIY MENYU TUGMALARI --- */}
      <div className="dashboard-grid" style={{ marginBottom: '40px' }}>
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

      {/* --- KAM QOLGAN TOVARLAR OGOHLANTIRISHI (ENG TAGIGA, YANGI DIZAYNDA OLINDI) --- */}
      {lowStockProducts.length > 0 && (
        <div className="fade-in card" style={{ padding: '25px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)', position: 'relative', overflow: 'hidden' }}>
          
          {/* Orqa fondagi tepa gradient chiziq */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '6px', background: 'linear-gradient(90deg, #1e3a8a 0%, #10b981 100%)' }}></div>
          
          <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px' }}>
            <div style={{ background: '#ecfdf5', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={24} color="#10b981" />
            </div>
            <span className="gradient-text" style={{ fontWeight: '800' }}>DIQQAT, QUYIDAGI TOVARLAR OMBORDA TUGAMOQDA!</span>
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            {lowStockProducts.map(p => (
              <div key={p.id} style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>{p.name}</span>
                <span style={{ fontWeight: 'bold', color: 'white', background: 'linear-gradient(135deg, #1e3a8a 0%, #10b981 100%)', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)' }}>
                  {p.quantity} {p.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;