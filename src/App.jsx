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

// Ikonkalar menyu uchun
import { Home, Package, ShoppingCart, RotateCcw, Wallet, BookOpen, Settings as SettingsIcon } from 'lucide-react';

// Firebase importlari
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

  // --- 1. BAZADAN MA'LUMOTNI TORTISH ---
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

  // --- 2. FIREBASE'GA SAQLASH ---
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

  // --- 3. SUZIB YURUVCHI PASTKI MENYU ---
  const renderBottomNav = () => {
    // Agar Asosiy oynada (dashboard) bo'lsak yoki tizimga kirmagan bo'lsak, menyu chiqmaydi
    if (!isAuth || !dataLoaded || page === 'dashboard' || page === 'settings') return null;

    // Barcha bo'limlar ro'yxati
    const navItems = [
      { id: 'dashboard', icon: <Home size={22} />, label: 'Asosiy' },
      { id: 'products', icon: <Package size={22} />, label: 'Ombor' },
      { id: 'sell', icon: <ShoppingCart size={22} />, label: 'Sotuv' },
      { id: 'todaysales', icon: <Wallet size={22} />, label: 'Kassa' },
      { id: 'debts', icon: <BookOpen size={22} />, label: 'Qarz' },
    ];

    // Siz aytgandek, HOZIRGI ochiq bo'limni ro'yxatdan olib tashlaymiz
    const visibleNavs = navItems.filter(item => item.id !== page);

    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 10px 30px rgba(30, 58, 138, 0.2)',
        borderRadius: '50px',
        display: 'flex',
        gap: '12px',
        padding: '12px 20px',
        zIndex: 1000,
        border: '1px solid #e0e7ff'
      }}>
        {visibleNavs.map(item => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            title={item.label}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: '#f1f5f9',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1e3a8a',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e3a8a'; e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#1e3a8a'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {item.icon}
          </button>
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

  // paddingBottom qo'shdikki, pastki menyu yozuvlarni to'sib qo'ymasin
  return (
    <div className="app-container" style={{ paddingBottom: page !== 'dashboard' && page !== 'settings' ? '90px' : '20px' }}>
      {!isAuth ? <Login /> : renderPage()}
      {renderBottomNav()}
    </div>
  );
}

export default App;