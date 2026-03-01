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

// Firebase importlari
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [page, setPage] = useState('dashboard');
  const [dataLoaded, setDataLoaded] = useState(false); 

  // Dastur state'lari
  const [storeName, setStoreName] = useState("Qurilish mollari do'koni");
  const [categories, setCategories] = useState(["Umumiy"]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [returns, setReturns] = useState([]);

  // --- 1. BAZADAN MA'LUMOTNI TORTISH VA KO'CHIRISH (MIGRATSIYA) ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setIsAuth(true);
        const docRef = doc(db, "stores", currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          // Agar internetda (Firebase) ma'lumot bo'lsa, o'shani yuklaymiz
          const data = docSnap.data();
          setProducts(data.products || []);
          setSales(data.sales || []);
          setReturns(data.returns || []);
          setCategories(data.categories || ["Umumiy"]);
          setStoreName(data.storeName || "Qurilish mollari do'koni");
          console.log("Ma'lumotlar Firebase'dan yuklandi.");
        } else {
          // --- AGAR YANGI AKKAUNT BO'LSA, ESKI LOCALSTORAGE'DAN QIDIRAMIZ ---
          console.log("Yangi akkaunt! Eski ma'lumotlar ko'chirilmoqda...");
          
          const oldProducts = JSON.parse(localStorage.getItem('app_products') || '[]');
          const oldSales = JSON.parse(localStorage.getItem('app_sales') || '[]');
          const oldReturns = JSON.parse(localStorage.getItem('app_returns') || '[]');
          const oldCategories = JSON.parse(localStorage.getItem('app_categories') || '["Umumiy"]');
          const oldName = localStorage.getItem('app_storeName') || "Qurilish mollari do'koni";

          // Topilgan hamma narsani Firebase'ga birinchi marta yozib qo'yamiz
          await setDoc(docRef, {
            products: oldProducts,
            sales: oldSales,
            returns: oldReturns,
            categories: oldCategories,
            storeName: oldName
          });

          // State'larni yangilaymiz
          setProducts(oldProducts);
          setSales(oldSales);
          setReturns(oldReturns);
          setCategories(oldCategories);
          setStoreName(oldName);
        }
        setDataLoaded(true);
      } else {
        setIsAuth(false);
        setDataLoaded(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- 2. HAR QANDAY O'ZGARISHNI INTERNETGA (FIREBASE) SAQLASH ---
  useEffect(() => {
    if (isAuth && dataLoaded && auth.currentUser) {
      const docRef = doc(db, "stores", auth.currentUser.uid);
      setDoc(docRef, {
        products,
        sales,
        returns,
        categories,
        storeName
      }).catch(err => console.error("Firebase'ga saqlashda xato:", err));
    }
  }, [products, sales, returns, categories, storeName, isAuth, dataLoaded]);

  const handleLogout = async () => {
    if(window.confirm("Tizimdan chiqasizmi?")) {
      await signOut(auth);
      setIsAuth(false); 
      setPage('dashboard'); 
    }
  };

  const renderPage = () => {
    if (!dataLoaded) {
      return (
        <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', height:'100vh', gap: '20px'}}>
          <div className="spinner"></div> {/* Agar CSS da spinner bo'lsa */}
          <p style={{fontSize:'20px', color:'#1e3a8a', fontWeight:'bold'}}>Ombor yuklanmoqda...</p>
        </div>
      );
    }
    
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

  return <div className="app-container">{!isAuth ? <Login /> : renderPage()}</div>;
}

export default App;