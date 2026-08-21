import React, { useState, useEffect } from 'react';
import './App.css'; 
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Sell from './components/Sell';
import Return from './components/Return';
import TodaySales from './components/TodaySales';
import Debts from './components/Debts';
import Settings from './components/Settings';
import Customers from './components/Customers'; 
import Arenda from './components/Arenda'; 
import Profit from './components/Profit'; 

// Aqlli yordamchi
import SmartAssistant from './components/SmartAssistant'; 

// Sun va Moon ikonkalari qo'shildi
import { Home, Package, ShoppingCart, RotateCcw, Wallet, BookOpen, Users, Lock, MessageCircle, Landmark, TrendingUp, Sun, Moon } from 'lucide-react'; 

import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, setDoc, onSnapshot, collection } from 'firebase/firestore';

const MasterGate = ({ onUnlock }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login.trim().toLowerCase() === 'ayew_qur' && password.trim().toLowerCase() === 'ayev_ax') {
      onUnlock();
    } else {
      setError("Login yoki parol xato! Nima yozganingizni ko'zdan kechiring.");
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f4f8', padding: '20px' }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '40px 30px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ background: '#e0e7ff', padding: '20px', borderRadius: '50%', color: '#1e3a8a' }}><Lock size={40} /></div>
        </div>
        <h2 style={{ margin: '0 0 10px 0', color: '#1e3a8a' }}>Maxfiy Ruxsat</h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>Dasturdan foydalanish uchun maxsus login va parolni kiriting.</p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}><input className="form-control" placeholder="Dastur Loginini kiriting" value={login} onChange={e => {setLogin(e.target.value); setError('');}} required /></div>
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <input className="form-control" type={showPass ? "text" : "password"} placeholder="Dastur Parolini kiriting" value={password} onChange={e => {setPassword(e.target.value); setError('');}} required style={{ paddingRight: '70px' }} />
            <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#1e3a8a', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>{showPass ? "Yashirish" : "Ko'rish"}</button>
          </div>
          {error && <p style={{ color: '#ef4444', fontSize: '13px', margin: '0 0 15px 0', fontWeight: 'bold' }}>{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '15px', fontSize: '16px', marginBottom: '25px' }}>Tasdiqlash va Kirish</button>
        </form>
        <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#475569' }}>Dasturga kirish uchun maxfiy login va parolni bilmasangiz, admin bilan bog'laning:</p>
          <a href="https://t.me/xaamiitov" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#0088cc', fontWeight: 'bold', textDecoration: 'none' }}><MessageCircle size={18} /> @xaamiitov</a>
        </div>
      </div>
    </div>
  );
};

function App() {
  const cachedAuth = localStorage.getItem('app_isAuth') === 'true';
  const cachedMaster = localStorage.getItem('app_master_unlocked') === 'true';

  const [isMasterUnlocked, setIsMasterUnlocked] = useState(cachedMaster || cachedAuth);
  const [isAuth, setIsAuth] = useState(cachedAuth);
  const [page, setPage] = useState('dashboard');

  // QORONG'U REJIM STATE (Xotiradan o'qiydi)
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('app_theme') === 'dark');

  // INTERNET YO'Q PAYTIDA KUTTIRMASLIK UCHUN LOCALSTORAGE DAN DARHOL O'QIB OLAMIZ
  const [storeName, setStoreName] = useState(() => localStorage.getItem('app_storeName') || "Qurilish mollari do'koni");
  const [categories, setCategories] = useState(() => JSON.parse(localStorage.getItem('app_categories') || '["Umumiy"]'));
  
  const [products, setProducts] = useState(() => JSON.parse(localStorage.getItem('app_products') || '[]'));
  const [sales, setSales] = useState(() => JSON.parse(localStorage.getItem('app_sales') || '[]'));
  const [returns, setReturns] = useState(() => JSON.parse(localStorage.getItem('app_returns') || '[]'));
  const [customers, setCustomers] = useState(() => JSON.parse(localStorage.getItem('app_customers') || '[]'));
  const [arenda, setArenda] = useState(() => JSON.parse(localStorage.getItem('app_arenda') || '[]'));

  // REJIM O'ZGARISHINI KUZATUVCHI EFFECT
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('app_theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('app_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && hash !== page) setPage(hash);
    const handlePopState = () => setPage(window.location.hash.replace('#', '') || 'dashboard');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (window.location.hash !== `#${page}`) window.history.pushState(null, '', `#${page}`);
  }, [page]);

  useEffect(() => {
    let unsubs = []; 

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        localStorage.setItem('app_isAuth', 'true');
        localStorage.setItem('app_master_unlocked', 'true'); 
        setIsMasterUnlocked(true);
        setIsAuth(true);

        const storeUid = currentUser.uid;
        
        // INSTAGRAM KABI ISHLASHI UCHUN: { includeMetadataChanges: true } QO'SHILDI
        const mainSub = onSnapshot(doc(db, "stores", storeUid), { includeMetadataChanges: true }, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if(data.categories) setCategories(data.categories);
            if(data.storeName) setStoreName(data.storeName);
          } else {
            setDoc(doc(db, "stores", storeUid), { storeName, categories }).catch(e=>console.log(e));
          }
        });
        unsubs.push(mainSub);

        const cols = [
          { name: "products", setter: setProducts },
          { name: "sales", setter: setSales },
          { name: "returns", setter: setReturns },
          { name: "customers", setter: setCustomers },
          { name: "arenda", setter: setArenda }
        ];

        cols.forEach(({ name, setter }) => {
          // { includeMetadataChanges: true } - Oflayn rejim uchun eng muhim qism
          const sub = onSnapshot(collection(db, "stores", storeUid, name), { includeMetadataChanges: true }, (snapshot) => {
            const dataArr = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setter(dataArr);
            localStorage.setItem(`app_${name}`, JSON.stringify(dataArr));
          }, (error) => {
             console.log(`Error in ${name}:`, error);
          });
          unsubs.push(sub);
        });

      } else {
        setIsAuth(false);
        localStorage.setItem('app_isAuth', 'false');
      }
    });

    return () => {
      unsubscribeAuth();
      unsubs.forEach(unsub => unsub()); 
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('app_categories', JSON.stringify(categories));
    localStorage.setItem('app_storeName', storeName);
  }, [categories, storeName]);

  const handleLogout = async () => {
    if(window.confirm("Tizimdan chiqasizmi?")) {
      await signOut(auth);
      ['app_products', 'app_sales', 'app_returns', 'app_categories', 'app_customers', 'app_arenda', 'app_storeName'].forEach(k => localStorage.removeItem(k));
      setProducts([]); setSales([]); setReturns([]); setCustomers([]); setArenda([]);
      setCategories(["Umumiy"]); setStoreName("Qurilish mollari do'koni");
      localStorage.setItem('app_isAuth', 'false');
      setIsAuth(false); 
      setPage('dashboard'); 
    }
  };

  const renderBottomNav = () => {
    if (!isAuth || page === 'dashboard' || page === 'settings') return null;
    const navItems = [
      { id: 'dashboard', icon: <Home size={22} />, label: 'Asosiy' },
      { id: 'products', icon: <Package size={22} />, label: 'Ombor' },
      { id: 'sell', icon: <ShoppingCart size={22} />, label: 'Sotuv' },
      { id: 'todaysales', icon: <Wallet size={22} />, label: 'Kassa' },
      { id: 'customers', icon: <Users size={22} />, label: 'Mijozlar' }, 
      { id: 'debts', icon: <BookOpen size={22} />, label: 'Qarz' },
      { id: 'profit', icon: <TrendingUp size={22} />, label: 'Foyda' }, 
    ];
    return (
      <div className="bottom-nav-container" style={{
        position: 'fixed', bottom: '15px', left: '50%', transform: 'translateX(-50%)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)',
        boxShadow: '0 10px 30px rgba(30, 58, 138, 0.2)', borderRadius: '30px',
        display: 'flex', gap: '15px', padding: '12px 25px', zIndex: 1000, border: '1px solid #e0e7ff',
        overflowX: 'auto', maxWidth: '95vw' 
      }}>
        {navItems.filter(item => item.id !== page).map(item => (
          <div key={item.id} onClick={() => setPage(item.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', minWidth: '46px' }}>
            <div className="bottom-nav-item-bg" style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e3a8a' }}>{item.icon}</div>
            <span className="bottom-nav-item-text" style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a' }}>{item.label}</span>
          </div>
        ))}
      </div>
    );
  };

  // QORONG'U/YORUG' REJIM TUGMASI 
  const renderThemeToggle = () => {
    if (!isAuth) return null;
    return (
      <div 
        onClick={() => setIsDarkMode(!isDarkMode)}
        style={{
          position: 'fixed', top: '20px', left: '20px', zIndex: 9999,
          width: '50px', height: '50px', borderRadius: '50%',
          backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
          color: isDarkMode ? '#facc15' : '#1e3a8a',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
          transition: 'all 0.3s ease', border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0'
        }}
        title="Rejimni o'zgartirish"
      >
        {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
      </div>
    );
  };

  if (!isMasterUnlocked) return <MasterGate onUnlock={() => { setIsMasterUnlocked(true); localStorage.setItem('app_master_unlocked', 'true'); }} />;

  return (
    <div className="app-container" style={{ paddingBottom: page !== 'dashboard' && page !== 'settings' ? '110px' : '20px' }}>
      
      {/* Tungi/Kunduzgi rejim tugmasini chaqiramiz */}
      {renderThemeToggle()}

      {!isAuth ? <Login /> : (
        <>
          <SmartAssistant 
             page={page} 
             setPage={setPage} 
             sales={sales} 
             products={products} 
             customers={customers} 
          />

          {page === 'dashboard' && <Dashboard storeName={storeName} products={products} setPage={setPage} onLogout={handleLogout} />}
          {page === 'products' && <Products products={products} setProducts={setProducts} categories={categories} setCategories={setCategories} setPage={setPage} />}
          {page === 'sell' && <Sell products={products} setProducts={setProducts} sales={sales} setSales={setSales} returns={returns} setPage={setPage} customers={customers} />}
          {page === 'return' && <Return products={products} setProducts={setProducts} returns={returns} setReturns={setReturns} setPage={setPage} customers={customers} />}
          {page === 'todaysales' && <TodaySales products={products} setProducts={setProducts} sales={sales} setSales={setSales} returns={returns} setPage={setPage} customers={customers} />}
          {page === 'customers' && <Customers customers={customers} setCustomers={setCustomers} sales={sales} setSales={setSales} returns={returns} setReturns={setReturns} setPage={setPage} />}
          {page === 'debts' && <Debts sales={sales} setSales={setSales} setPage={setPage} customers={customers} />}
          {page === 'settings' && <Settings storeName={storeName} setStoreName={setStoreName} setProducts={setProducts} setSales={setSales} setReturns={setReturns} setPage={setPage} />}
          {page === 'arenda' && <Arenda arenda={arenda} setArenda={setArenda} setPage={setPage} />}
          {page === 'profit' && <Profit sales={sales} setPage={setPage} />}
        </>
      )}
      {renderBottomNav()}
    </div>
  );
}

export default App;