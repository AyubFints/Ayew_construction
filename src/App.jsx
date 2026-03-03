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

import { Home, Package, ShoppingCart, RotateCcw, Wallet, BookOpen, Users, Lock } from 'lucide-react'; 

import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// --- MAXFIY DARVOZA (MASTER GATE) KOMPONENTI ---
const MasterGate = ({ onUnlock }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false); // Parolni ko'rish uchun

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Hamma harflarni kichik qilib tekshiramiz (katta-kichikligiga qaramaydi)
    const checkLogin = login.trim().toLowerCase();
    const checkPass = password.trim().toLowerCase();

    // Loginda "w", parolda "v" borligiga e'tibor bering
    if (checkLogin === 'ayew_qur' && checkPass === 'ayev_ax') {
      onUnlock();
    } else {
      setError("Login yoki parol xato! Nima yozganingizni ko'zdan kechiring.");
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f4f8', padding: '20px' }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '40px 30px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ background: '#e0e7ff', padding: '20px', borderRadius: '50%', color: '#1e3a8a' }}>
            <Lock size={40} />
          </div>
        </div>
        <h2 style={{ margin: '0 0 10px 0', color: '#1e3a8a' }}>Maxfiy Ruxsat</h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '30px' }}>Dasturdan foydalanish uchun maxsus login va parolni kiriting.</p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <input 
              className="form-control" 
              placeholder="Maxfiy Login (ayew_qur)" 
              value={login} 
              onChange={e => {setLogin(e.target.value); setError('');}} 
              required 
              style={{ marginBottom: 0 }}
            />
          </div>
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <input 
              className="form-control" 
              type={showPass ? "text" : "password"} 
              placeholder="Maxfiy Parol (ayev_ax)" 
              value={password} 
              onChange={e => {setPassword(e.target.value); setError('');}} 
              required 
              style={{ marginBottom: 0, paddingRight: '70px' }}
            />
            <button 
              type="button" 
              onClick={() => setShowPass(!showPass)} 
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#1e3a8a', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
            >
              {showPass ? "Yashirish" : "Ko'rish"}
            </button>
          </div>
          
          {error && <p style={{ color: '#ef4444', fontSize: '13px', margin: '0 0 15px 0', fontWeight: 'bold' }}>{error}</p>}
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '15px', fontSize: '16px' }}>
            Tasdiqlash va Kirish
          </button>
        </form>
      </div>
    </div>
  );
};
// ---------------------------------------------------------

function App() {
  // Avvaldan ishlatib yurganlarni aniqlash
  const cachedAuth = localStorage.getItem('app_isAuth') === 'true';
  const cachedMaster = localStorage.getItem('app_master_unlocked') === 'true';

  // ASOSIY MANTIQ: Agar oldin auth qilingan bo'lsa, avtomat master darvoza ham ochiq bo'ladi
  const [isMasterUnlocked, setIsMasterUnlocked] = useState(cachedMaster || cachedAuth);

  const [isAuth, setIsAuth] = useState(cachedAuth);
  const [dataLoaded, setDataLoaded] = useState(cachedAuth); 
  const [page, setPage] = useState('dashboard');

  const [storeName, setStoreName] = useState(() => localStorage.getItem('app_storeName') || "Qurilish mollari do'koni");
  const [categories, setCategories] = useState(() => JSON.parse(localStorage.getItem('app_categories') || '["Umumiy"]'));
  const [products, setProducts] = useState(() => JSON.parse(localStorage.getItem('app_products') || '[]'));
  const [sales, setSales] = useState(() => JSON.parse(localStorage.getItem('app_sales') || '[]'));
  const [returns, setReturns] = useState(() => JSON.parse(localStorage.getItem('app_returns') || '[]'));
  const [customers, setCustomers] = useState(() => JSON.parse(localStorage.getItem('app_customers') || '[]'));

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && hash !== page) setPage(hash);
    
    const handlePopState = () => {
      const currentHash = window.location.hash.replace('#', '');
      setPage(currentHash || 'dashboard');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (window.location.hash !== `#${page}`) {
      window.history.pushState(null, '', `#${page}`);
    }
  }, [page]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        localStorage.setItem('app_isAuth', 'true');
        
        // Tizimga muvaffaqiyatli kirgandan keyin, ehtiyot shart master darvozani ochiq deb yozib qo'yamiz
        localStorage.setItem('app_master_unlocked', 'true'); 
        setIsMasterUnlocked(true);

        if (!isAuth) setIsAuth(true);

        try {
          const docRef = doc(db, "stores", currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setProducts(data.products || []);
            setSales(data.sales || []);
            setReturns(data.returns || []);
            setCategories(data.categories || ["Umumiy"]);
            setStoreName(data.storeName || "Qurilish mollari do'koni");
            setCustomers(data.customers || []); 
          }
        } catch (error) {
          console.log("Internet sekin. Oflayn rejimda ishlash davom etmoqda...");
        }
        setDataLoaded(true);
      } else {
        setIsAuth(false);
        setDataLoaded(false);
        localStorage.setItem('app_isAuth', 'false');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (dataLoaded) {
      localStorage.setItem('app_products', JSON.stringify(products));
      localStorage.setItem('app_sales', JSON.stringify(sales));
      localStorage.setItem('app_returns', JSON.stringify(returns));
      localStorage.setItem('app_categories', JSON.stringify(categories));
      localStorage.setItem('app_customers', JSON.stringify(customers));
      localStorage.setItem('app_storeName', storeName);

      if (isAuth && auth.currentUser) {
        const docRef = doc(db, "stores", auth.currentUser.uid);
        setDoc(docRef, { products, sales, returns, categories, storeName, customers })
          .catch(err => console.log("Hozircha oflayn. Internet kelganda yuboriladi."));
      }
    }
  }, [products, sales, returns, categories, storeName, customers, isAuth, dataLoaded]);

  const handleLogout = async () => {
    if(window.confirm("Tizimdan chiqasizmi?")) {
      await signOut(auth);
      localStorage.setItem('app_isAuth', 'false');
      // Diqqat: Dasturdan chiqqanda Master Gateni yopmaymiz, chunki u qurilma uchun bir marta ochilishi kerak.
      setIsAuth(false); 
      setPage('dashboard'); 
    }
  };

  // --- MAXFIY DARVOZANI TEKSHIRISH ---
  if (!isMasterUnlocked) {
    return <MasterGate onUnlock={() => {
      setIsMasterUnlocked(true);
      localStorage.setItem('app_master_unlocked', 'true');
    }} />;
  }

  const renderBottomNav = () => {
    if (!isAuth || !dataLoaded || page === 'dashboard' || page === 'settings') return null;

    const navItems = [
      { id: 'dashboard', icon: <Home size={22} />, label: 'Asosiy' },
      { id: 'products', icon: <Package size={22} />, label: 'Ombor' },
      { id: 'sell', icon: <ShoppingCart size={22} />, label: 'Sotuv' },
      { id: 'todaysales', icon: <Wallet size={22} />, label: 'Kassa' },
      { id: 'customers', icon: <Users size={22} />, label: 'Mijozlar' }, 
      { id: 'debts', icon: <BookOpen size={22} />, label: 'Qarz' },
    ];

    const visibleNavs = navItems.filter(item => item.id !== page);

    return (
      <div style={{
        position: 'fixed', bottom: '15px', left: '50%', transform: 'translateX(-50%)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)',
        boxShadow: '0 10px 30px rgba(30, 58, 138, 0.2)', borderRadius: '30px',
        display: 'flex', gap: '15px', padding: '12px 25px', zIndex: 1000, border: '1px solid #e0e7ff'
      }}>
        {visibleNavs.map(item => (
          <div
            key={item.id} 
            onClick={() => setPage(item.id)} 
            title={item.label}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
          >
            <div style={{
              width: '46px', height: '46px', borderRadius: '50%', backgroundColor: '#f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#1e3a8a', transition: 'all 0.3s ease', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
            }}>
              {item.icon}
            </div>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e3a8a' }}>{item.label}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderPage = () => {
    if (!dataLoaded) return <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', fontSize:'20px', color:'#1e3a8a'}}>Yuklanmoqda...</div>;
    
    switch (page) {
      case 'dashboard': return <Dashboard storeName={storeName} products={products} setPage={setPage} onLogout={handleLogout} />;
      case 'products': return <Products products={products} setProducts={setProducts} categories={categories} setCategories={setCategories} setPage={setPage} />;
      case 'sell': return <Sell products={products} setProducts={setProducts} sales={sales} setSales={setSales} returns={returns} setPage={setPage} customers={customers} />;
      case 'return': return <Return products={products} setProducts={setProducts} returns={returns} setReturns={setReturns} setPage={setPage} customers={customers} />;
      case 'todaysales': return <TodaySales products={products} setProducts={setProducts} sales={sales} setSales={setSales} returns={returns} setPage={setPage} />;
      case 'customers': return <Customers customers={customers} setCustomers={setCustomers} sales={sales} setPage={setPage} />;
      case 'debts': return <Debts sales={sales} setSales={setSales} setPage={setPage} />;
      case 'settings': return <Settings storeName={storeName} setStoreName={setStoreName} setProducts={setProducts} setSales={setSales} setReturns={setReturns} setPage={setPage} />;
      default: return <Dashboard storeName={storeName} products={products} setPage={setPage} onLogout={handleLogout} />;
    }
  };

  return (
    <div className="app-container" style={{ paddingBottom: page !== 'dashboard' && page !== 'settings' ? '110px' : '20px' }}>
      {!isAuth ? <Login /> : renderPage()}
      {renderBottomNav()}
    </div>
  );
}

export default App;