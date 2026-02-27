import React, { useState } from 'react';
import { ArrowLeft, Settings as SettingsIcon, Store, Trash2, Save, AlertTriangle } from 'lucide-react';

const Settings = ({ storeName, setStoreName, setProducts, setSales, setReturns, setPage }) => {
  const [newName, setNewName] = useState(storeName);

  // Do'kon nomini saqlash
  const handleSaveName = (e) => {
    e.preventDefault();
    setStoreName(newName);
    alert(`✅ Do'kon nomi "${newName}" ga o'zgartirildi!`);
  };

  // Barcha ma'lumotlarni tozalash (Nolga tushirish)
  const handleClearAllData = () => {
    const confirm1 = window.confirm("DIQQAT! Barcha ma'lumotlarni o'chirmoqchimisiz? Bu amalni orqaga qaytarib bo'lmaydi!");
    if (confirm1) {
      const confirm2 = window.prompt("O'chirishni tasdiqlash uchun 'OCHIRISH' deb yozing:");
      if (confirm2 === 'OCHIRISH') {
        setProducts([]);
        setSales([]);
        setReturns([]);
        alert("🗑️ Barcha ma'lumotlar muvaffaqiyatli tozalandi! Dastur nolga tushdi.");
      } else {
        alert("❌ O'chirish bekor qilindi. Noto'g'ri so'z kiritildi.");
      }
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '800px', margin: '0 auto' }}>
        
        {/* DO'KON NOMINI O'ZGARTIRISH */}
        <div className="card" style={{ borderTop: '4px solid #1e3a8a' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Store size={22} color="#1e3a8a" /> Do'kon ma'lumotlari
          </h3>
          <form onSubmit={handleSaveName} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>Dastur bosh sahifasidagi do'kon nomi</label>
              <input 
                type="text" 
                className="form-control" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                required 
                style={{ marginBottom: 0 }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ flex: '0 0 auto', width: 'auto', padding: '14px 24px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Save size={20} /> Saqlash
            </button>
          </form>
        </div>

        {/* BARCHA MA'LUMOTLARNI TOZALASH (XAVFLI HUDUD) */}
        <div className="card" style={{ borderTop: '4px solid #dc2626', backgroundColor: '#fff5f5' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#991b1b', borderBottom: '1px solid #fecaca', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={22} color="#dc2626" /> Xavfli Hudud
          </h3>
          <p style={{ color: '#7f1d1d', marginBottom: '20px', lineHeight: '1.6' }}>
            Agar quyidagi tugmani bossangiz, dasturdagi barcha ma'lumotlar: <b>Tovarlar ombori, Kassa tarixi, Qaytishlar va Qarzlar</b> butunlay o'chib ketadi. Bu amalni orqaga qaytarib bo'lmaydi. Faqatgina dasturni yangitdan boshlamoqchi bo'lsangiz ishlating!
          </p>
          <button onClick={handleClearAllData} className="btn" style={{ backgroundColor: '#dc2626', color: 'white', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', width: 'auto', padding: '14px 24px' }}>
            <Trash2 size={20} /> Barcha ma'lumotlarni tozalash (Reset)
          </button>
        </div>

      </div>
    </div>
  );
};

export default Settings;