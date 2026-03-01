import React, { useState } from 'react';
import { Settings as SettingsIcon, ArrowLeft, Store, Trash2, ShieldAlert } from 'lucide-react';
import { auth } from '../firebase';
import { updatePassword } from 'firebase/auth';

const Settings = ({ storeName, setStoreName, setProducts, setSales, setReturns, setPage }) => {
  const [newName, setNewName] = useState(storeName);
  
  // Parol o'zgartirish uchun
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  const handleSaveName = (e) => {
    e.preventDefault();
    setStoreName(newName);
    alert("Do'kon nomi muvaffaqiyatli o'zgartirildi!");
  };

  const handleClearData = () => {
    if (window.confirm("DIQQAT! Barcha tovarlar, sotuvlar va qarzlar o'chib ketadi. Buni orqaga qaytarib bo'lmaydi! Rozimisiz?")) {
      const pass = window.prompt("Tasdiqlash uchun parolingizni yoki '1234' ni kiriting:");
      if (pass) {
        setProducts([]);
        setSales([]);
        setReturns([]);
        alert("Barcha ma'lumotlar tozalandi!");
      }
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg('');
    if (newPassword.length < 6) return setPasswordMsg("Parol kamida 6 xonali bo'lishi kerak!");
    
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        setPasswordMsg("✅ Parol muvaffaqiyatli o'zgartirildi!");
        setNewPassword('');
      }
    } catch (error) {
      console.error(error);
      setPasswordMsg("❌ Xatolik! (Xavfsizlik uchun tizimdan chiqib qayta kiring va keyin urinib ko'ring)");
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <button onClick={() => setPage('dashboard')} className="btn" style={{ width: 'auto', padding: '10px 20px', backgroundColor: '#e5e7eb', color: '#1f2937', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ArrowLeft size={18} /> Ortga qaytish
        </button>
        <h2 style={{ fontSize: '24px', color: '#1e3a8a', margin: 0, display: 'flex', gap: '10px', alignItems: 'center' }}>
          Sozlamalar <SettingsIcon size={28} />
        </h2>
      </div>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        
        {/* DO'KON NOMI */}
        <div className="card fade-in" style={{ flex: '1 1 300px', borderTop: '4px solid #1e3a8a' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
            <Store size={22} /> Do'kon nomini o'zgartirish
          </h3>
          <form onSubmit={handleSaveName}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>Yangi nom:</label>
            <input type="text" className="form-control" value={newName} onChange={(e) => setNewName(e.target.value)} required />
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Saqlash</button>
          </form>
        </div>

        {/* PAROLNI O'ZGARTIRISH */}
        <div className="card fade-in" style={{ flex: '1 1 300px', borderTop: '4px solid #10b981' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
            <ShieldAlert size={22} /> Parolni o'zgartirish
          </h3>
          <form onSubmit={handleChangePassword}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>Yangi parol yozing (kamida 6 belgi):</label>
            <input type="password" className="form-control" placeholder="Yangi parol..." value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength="6" />
            
            {passwordMsg && <p style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 'bold', color: passwordMsg.includes('✅') ? '#10b981' : '#ef4444' }}>{passwordMsg}</p>}
            
            <button type="submit" className="btn" style={{ width: '100%', backgroundColor: '#10b981', color: 'white' }}>Parolni yangilash</button>
          </form>
        </div>

        {/* BAZANI TOZALASH */}
        <div className="card fade-in" style={{ flex: '1 1 300px', borderTop: '4px solid #ef4444' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
            <Trash2 size={22} /> Xavfli hudud
          </h3>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
            Agar dastur xotirasi to'lib ketsa yoki noldan boshlamoqchi bo'lsangiz, barcha ma'lumotlarni o'chirishingiz mumkin. Bu amalni orqaga qaytarib bo'lmaydi!
          </p>
          <button onClick={handleClearData} className="btn btn-danger" style={{ width: '100%', padding: '12px' }}>
            Barcha ma'lumotlarni tozalash
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default Settings;