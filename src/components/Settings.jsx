import React, { useState } from 'react';
import { Settings as SettingsIcon, ArrowLeft, Store, Trash2, ShieldAlert, HelpCircle, Phone, Send, RefreshCcw } from 'lucide-react';

// Firebase importlari (getDoc qo'shildi)
import { auth, db } from '../firebase';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc, collection, getDocs, deleteDoc, getDoc, setDoc } from 'firebase/firestore';

const Settings = ({ storeName, setStoreName, setProducts, setSales, setReturns, setPage }) => {
  const [newName, setNewName] = useState(localStorage.getItem('smartStoreName') || storeName || "Smart Do'kon");
  const [newPhone, setNewPhone] = useState(localStorage.getItem('smartStorePhone') || "");
  
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);

  const handleSaveName = async (e) => {
    e.preventDefault();
    setStoreName(newName);
    localStorage.setItem('smartStoreName', newName);
    localStorage.setItem('smartStorePhone', newPhone);
    
    if (auth.currentUser) {
      try {
        const storeRef = doc(db, "stores", auth.currentUser.uid);
        await updateDoc(storeRef, { storeName: newName });
      } catch (error) {
        console.error("Nomni saqlashda xato", error);
      }
    }
    alert("Chek va do'kon sozlamalari muvaffaqiyatli saqlandi!");
  };

  // ===============================================
  // YANGI: ESKI BAZANI YANGI TIZIMGA KO'CHIRISH
  // ===============================================
  const handleMigrateOldData = async () => {
    if (!window.confirm("Eski ma'lumotlarni yangi tizimga ko'chiramizmi? Buni faqat bir marta qilish yetarli!")) return;
    
    setIsMigrating(true);
    try {
      if (auth.currentUser) {
        const storeUid = auth.currentUser.uid;
        const docRef = doc(db, "stores", storeUid);
        
        // Eski hujjatni o'qiymiz
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const oldData = docSnap.data();
          let count = 0;

          // 1. Mijozlarni ko'chirish
          if (oldData.customers && oldData.customers.length > 0) {
            for (let c of oldData.customers) {
              await setDoc(doc(db, "stores", storeUid, "customers", c.id.toString()), c);
              count++;
            }
          }
          // 2. Tovarlarni ko'chirish
          if (oldData.products && oldData.products.length > 0) {
            for (let p of oldData.products) {
              await setDoc(doc(db, "stores", storeUid, "products", p.id.toString()), p);
              count++;
            }
          }
          // 3. Savdolarni ko'chirish
          if (oldData.sales && oldData.sales.length > 0) {
            for (let s of oldData.sales) {
              await setDoc(doc(db, "stores", storeUid, "sales", s.id.toString()), s);
              count++;
            }
          }
          // 4. Vozvratlarni ko'chirish
          if (oldData.returns && oldData.returns.length > 0) {
            for (let r of oldData.returns) {
              await setDoc(doc(db, "stores", storeUid, "returns", r.id.toString()), r);
              count++;
            }
          }
          // 5. Arenda va chiqimlarni ko'chirish
          if (oldData.arenda && oldData.arenda.length > 0) {
            for (let a of oldData.arenda) {
              await setDoc(doc(db, "stores", storeUid, "arenda", a.id.toString()), a);
              count++;
            }
          }

          alert(`Ajoyib! Jami ${count} ta eski ma'lumot muvaffaqiyatli yangi tizimga ko'chirildi. Iltimos, o'zgarishlar ko'rinishi uchun sahifani yangilang (F5) yoki dasturga qaytadan kiring!`);
        } else {
          alert("Eski ma'lumotlar topilmadi.");
        }
      }
    } catch (error) {
      console.error("Ko'chirishda xato:", error);
      alert("Xatolik yuz berdi: " + error.message);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleClearData = async () => {
    if (window.confirm("DIQQAT! Barcha tovarlar, sotuvlar, mijozlar va qarzlar o'chib ketadi. Buni orqaga qaytarib bo'lmaydi! Rozimisiz?")) {
      const pass = window.prompt("Tasdiqlash uchun parolingizni yoki maxfiy kodni kiriting:");
      if (pass) {
        setProducts([]);
        setSales([]);
        setReturns([]);
        
        if (auth.currentUser) {
          const storeUid = auth.currentUser.uid;
          const collectionsToClear = ['products', 'sales', 'returns', 'customers', 'arenda'];
          
          try {
            collectionsToClear.forEach(async (colName) => {
              const querySnapshot = await getDocs(collection(db, "stores", storeUid, colName));
              querySnapshot.forEach((document) => {
                deleteDoc(doc(db, "stores", storeUid, colName, document.id));
              });
            });
            alert("Barcha ma'lumotlar muvaffaqiyatli tozalandi!");
          } catch (error) {
            console.error("O'chirishda xatolik:", error);
            alert("Ba'zi ma'lumotlarni o'chirishda xatolik yuz berdi.");
          }
        } else {
          alert("Barcha ma'lumotlar tozalandi!");
        }
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
    <div className="fade-in" style={{ paddingBottom: '80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <button onClick={() => setPage('dashboard')} className="btn" style={{ width: 'auto', padding: '10px 20px', backgroundColor: '#e5e7eb', color: '#1f2937', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ArrowLeft size={18} /> Ortga
        </button>
        <h2 style={{ fontSize: '24px', color: '#1e3a8a', margin: 0, display: 'flex', gap: '10px', alignItems: 'center' }}>
          Sozlamalar <SettingsIcon size={28} />
        </h2>
      </div>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        
        {/* ESKI BAZANI TIKLASH (MIGRATSIYA) TUGMASI */}
        <div className="card fade-in" style={{ flex: '1 1 100%', borderTop: '4px solid #f59e0b', backgroundColor: '#fffbeb' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#d97706', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCcw size={22} /> Eski Bazani Tiklash (Migratsiya)
          </h3>
          <p style={{ color: '#92400e', fontSize: '14px', marginBottom: '15px', lineHeight: '1.5' }}>
            Agar dastur yangilangandan keyin eski tovarlaringiz yoki mijozlaringiz ko'rinmay qolgan bo'lsa, ushbu tugmani <b>bir marta</b> bosing. Barcha ma'lumotlaringiz yangi tizimga avtomatik ko'chirib o'tkaziladi.
          </p>
          <button 
            onClick={handleMigrateOldData} 
            disabled={isMigrating}
            className="btn" 
            style={{ width: 'auto', padding: '12px 24px', backgroundColor: '#f59e0b', color: 'white', border: 'none', fontWeight: 'bold' }}
          >
            {isMigrating ? "Kuting, ko'chirilmoqda..." : "Eski ma'lumotlarni ko'chirib o'tkazish"}
          </button>
        </div>

        <div className="card fade-in" style={{ flex: '1 1 300px', borderTop: '4px solid #1e3a8a' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
            <Store size={22} /> Chek va Do'kon sozlamalari
          </h3>
          <form onSubmit={handleSaveName} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151', fontSize: '13px' }}>Do'kon nomi (Chek tepasida chiqadi):</label>
              <input type="text" className="form-control" value={newName} onChange={(e) => setNewName(e.target.value)} required style={{ marginBottom: 0 }} />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#374151', fontSize: '13px' }}>Telefon raqam (Chek pastida chiqadi):</label>
              <input type="text" className="form-control" placeholder="Masalan: +998 90 123 45 67" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} style={{ marginBottom: 0 }} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '5px' }}>Saqlash</button>
          </form>
        </div>

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

        <div className="card fade-in" style={{ flex: '1 1 300px', borderTop: '4px solid #0ea5e9' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
            <HelpCircle size={22} /> Yordam va Aloqa
          </h3>
          <p style={{ color: '#4b5563', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
            Agar dasturdan foydalanishda qandaydir savollar tug'ilsa yoki nimadir tushunarsiz bo'lsa, bemalol biz bilan bog'lanishingiz mumkin. Biz doim yordam berishga tayyormiz!
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <a href="tel:+998772781808" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#1f2937', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', transition: '0.2s', cursor: 'pointer' }}>
              <Phone size={20} color="#10b981" /> 
              <div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Telefon orqali:</div>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>+998 77 278 18 08</div>
              </div>
            </a>
            
            <a href="https://t.me/xaamiitov" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#1f2937', padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd', transition: '0.2s', cursor: 'pointer' }}>
              <Send size={20} color="#0284c7" /> 
              <div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Telegram orqali:</div>
                <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#0284c7' }}>@xaamiitov</div>
              </div>
            </a>
          </div>
        </div>

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