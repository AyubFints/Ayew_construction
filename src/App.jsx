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

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [page, setPage] = useState('dashboard');

  const [storeName, setStoreName] = useState(() => { const saved = localStorage.getItem('app_storeName'); return saved ? saved : "Qurilish mollari do'koni"; });
  const [products, setProducts] = useState(() => { const saved = localStorage.getItem('app_products'); return saved ? JSON.parse(saved) : []; });
  const [sales, setSales] = useState(() => { const saved = localStorage.getItem('app_sales'); return saved ? JSON.parse(saved) : []; });
  const [returns, setReturns] = useState(() => { const saved = localStorage.getItem('app_returns'); return saved ? JSON.parse(saved) : []; });

  useEffect(() => { localStorage.setItem('app_storeName', storeName); }, [storeName]);
  useEffect(() => { localStorage.setItem('app_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('app_sales', JSON.stringify(sales)); }, [sales]);
  useEffect(() => { localStorage.setItem('app_returns', JSON.stringify(returns)); }, [returns]);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (loggedIn === 'true') setIsAuth(true);
  }, []);

  const handleLogout = () => { localStorage.removeItem('isLoggedIn'); setIsAuth(false); setPage('dashboard'); };

  const renderPage = () => {
    switch (page) {
      case 'dashboard': 
        // MANA SHU YERDA PRODUCTS QO'SHILDI
        return <Dashboard storeName={storeName} products={products} setPage={setPage} onLogout={handleLogout} />;
      case 'products': 
        return <Products products={products} setProducts={setProducts} setPage={setPage} />;
      case 'sell': 
        return <Sell products={products} setProducts={setProducts} sales={sales} setSales={setSales} returns={returns} setPage={setPage} />;
      case 'return': 
        return <Return products={products} setProducts={setProducts} returns={returns} setReturns={setReturns} setPage={setPage} />;
      case 'todaysales': 
        return <TodaySales sales={sales} setSales={setSales} returns={returns} setPage={setPage} />;
      case 'debts': 
        return <Debts sales={sales} setSales={setSales} setPage={setPage} />;
      case 'settings': 
        return <Settings storeName={storeName} setStoreName={setStoreName} setProducts={setProducts} setSales={setSales} setReturns={setReturns} setPage={setPage} />;
      default: 
        return <Dashboard storeName={storeName} products={products} setPage={setPage} onLogout={handleLogout} />;
    }
  };

  return <div className="app-container">{!isAuth ? <Login onLogin={() => setIsAuth(true)} /> : renderPage()}</div>;
}

export default App;