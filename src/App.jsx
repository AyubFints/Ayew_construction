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

import { Home, Package, ShoppingCart, RotateCcw, Wallet, BookOpen } from 'lucide-react';

import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function App() {
  // 1. DASTUR OCHILISHI BILAN TELEFON XOTIRASINI O'QISH (Kutib turmaslik uchun)
  const cachedAuth = localStorage.getItem('app_isAuth') === 'true';
  const [isAuth, setIsAuth] = useState(cachedAuth);
  const [dataLoaded, setDataLoaded] = useState(cachedAuth); // Agar xotirada bo'lsa, darhol ochiladi
  const [page, setPage] = useState('dashboard');

  const [storeName, setStoreName] = useState(() => localStorage.getItem('app_storeName') || "Qurilish mollari do'koni");
  const [categories, setCategories] = useState(() => JSON.parse(localStorage.getItem('app_categories') || '["Umumiy"]'));
  const [products, setProducts] = useState(() => JSON.parse(localStorage.getItem('app_products') || '[]'));
  const [sales, setSales] = useState(() => JSON.parse(localStorage.getItem('app_sales') || '[]'));
  const [returns, setReturns] = useState(() => JSON.parse(localStorage.getItem('app_returns') || '[]'));

  // TELEFONNING "ORTGA" TUGMASI
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

  // 2. ORQA FONDA INTERNET (FIREBASE) BILAN SINXRONIZATSIYA
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        localStorage.setItem('app_isAuth', 'true'); // Tizimga kirganini eslab qolish
        if (!isAuth) setIsAuth(true);

        try {
          const docRef = doc(db, "stores", currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            // Yangi ma'lumot kelsa bildirmasdan yangilaymiz
            setProducts(data.products || []);
            setSales(data.sales || []);
            setReturns(data.returns || []);
            setCategories(data.categories || ["Umumiy"]);
            setStoreName(data.storeName || "Qurilish mollari do'koni");
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

  // 3. MA'LUMOTNI DARHOL XOTIRAGA VA SEKIN INTERNETGA SAQLASH
  useEffect(() => {
    if (dataLoaded) {
      // A) Oflayn ishlash uchun srazi telefonga saqlaymiz (Internet kerak emas)
      localStorage.setItem('app_products', JSON.stringify(products));
      localStorage.setItem('app_sales', JSON.stringify(sales));
      localStorage.setItem('app_returns', JSON.stringify(returns));
      localStorage.setItem('app_categories', JSON.stringify(categories));
      localStorage.setItem('app_storeName', storeName);

      // B) Internet bor bo'lsa, orqa fonda serverga saqlaymiz
      if (isAuth && auth.currentUser) {
        const docRef = doc(db, "stores", auth.currentUser.uid);
        setDoc(docRef, { products, sales, returns, categories, storeName })
          .catch(err => console.log("Hozircha oflayn. Internet kelganda yuboriladi.")); // Xatolik ekranni qotirmaydi
      }
    }
  }, [products, sales, returns, categories, storeName, isAuth, dataLoaded]);

  const handleLogout = async () => {
    if(window.confirm("Tizimdan chiqasizmi?")) {
      await signOut(auth);
      localStorage.setItem('app_isAuth', 'false'); // Chiqib ketganda xotirani tozalash
      setIsAuth(false); 
      setPage('dashboard'); 
    }
  };

  const renderBottomNav = () => {
    if (!isAuth || !dataLoaded || page === 'dashboard' || page === 'settings') return null;

    const navItems = [
      { id: 'dashboard', icon: <Home size={22} />, label: 'Asosiy' },
      { id: 'products', icon: <Package size={22} />, label: 'Ombor' },
      { id: 'sell', icon: <ShoppingCart size={22} />, label: 'Sotuv' },
      { id: 'todaysales', icon: <Wallet size={22} />, label: 'Kassa' },
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
            onMouseEnter={(e) => { 
              e.currentTarget.children[0].style.backgroundColor = '#1e3a8a'; 
              e.currentTarget.children[0].style.color = '#ffffff'; 
              e.currentTarget.children[0].style.transform = 'translateY(-3px)'; 
            }}
            onMouseLeave={(e) => { 
              e.currentTarget.children[0].style.backgroundColor = '#f1f5f9'; 
              e.currentTarget.children[0].style.color = '#1e3a8a'; 
              e.currentTarget.children[0].style.transform = 'translateY(0)'; 
            }}
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
      case 'sell': return <Sell products={products} setProducts={setProducts} sales={sales} setSales={setSales} returns={returns} setPage={setPage} />;
      case 'return': return <Return products={products} setProducts={setProducts} returns={returns} setReturns={setReturns} setPage={setPage} />;
      case 'todaysales': return <TodaySales products={products} setProducts={setProducts} sales={sales} setSales={setSales} returns={returns} setPage={setPage} />;
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