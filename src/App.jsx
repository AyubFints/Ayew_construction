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
  const [isAuth, setIsAuth] = useState(false);
  const [page, setPage] = useState('dashboard');
  const [dataLoaded, setDataLoaded] = useState(false); 

  const [storeName, setStoreName] = useState("Qurilish mollari do'koni");
  const [categories, setCategories] = useState(["Umumiy"]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [returns, setReturns] = useState([]);

  // TELEFONNING "ORTGA" TUGMASI UCHUN KOD
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && hash !== page) {
      setPage(hash);
    }
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

  // BAZADAN MA'LUMOTNI TORTISH
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setIsAuth(true);
        const docRef = doc(db, "stores", currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setProducts(data.products || []);
          setSales(data.sales || []);
          setReturns(data.returns || []);
          setCategories(data.categories || ["Umumiy"]);
          setStoreName(data.storeName || "Qurilish mollari do'koni");
        } else {
          const oldProducts = JSON.parse(localStorage.getItem('app_products') || '[]');
          const oldSales = JSON.parse(localStorage.getItem('app_sales') || '[]');
          const oldReturns = JSON.parse(localStorage.getItem('app_returns') || '[]');
          const oldCategories = JSON.parse(localStorage.getItem('app_categories') || '["Umumiy"]');
          const oldName = localStorage.getItem('app_storeName') || "Qurilish mollari do'koni";

          await setDoc(docRef, {
            products: oldProducts, sales: oldSales, returns: oldReturns, categories: oldCategories, storeName: oldName
          });

          setProducts(oldProducts); setSales(oldSales); setReturns(oldReturns); setCategories(oldCategories); setStoreName(oldName);
        }
        setDataLoaded(true);
      } else {
        setIsAuth(false);
        setDataLoaded(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // FIREBASE'GA SAQLASH
  useEffect(() => {
    if (isAuth && dataLoaded && auth.currentUser) {
      const docRef = doc(db, "stores", auth.currentUser.uid);
      setDoc(docRef, { products, sales, returns, categories, storeName }).catch(err => console.error("Xato:", err));
    }
  }, [products, sales, returns, categories, storeName, isAuth, dataLoaded]);

  const handleLogout = async () => {
    if(window.confirm("Tizimdan chiqasizmi?")) {
      await signOut(auth);
      setIsAuth(false); 
      setPage('dashboard'); 
    }
  };

  // SUZIB YURUVCHI PASTKI MENYU (YANGILANGAN: YOZUVLAR BILAN)
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
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer'
            }}
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
            {/* Dumaloq ikonka qismi */}
            <div style={{
              width: '46px', height: '46px', borderRadius: '50%', backgroundColor: '#f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#1e3a8a', transition: 'all 0.3s ease', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
            }}>
              {item.icon}
            </div>
            {/* Tagidagi mayda yozuv */}
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
      case 'todaysales': return <TodaySales sales={sales} setSales={setSales} returns={returns} setPage={setPage} />;
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