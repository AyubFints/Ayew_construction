import React, { useState, useMemo } from 'react';
import { Users, ArrowLeft, UserPlus, History, Phone, ShoppingBag, Banknote, BarChart3, CheckCircle, Trash2, PackageMinus, Landmark, ChevronDown, ChevronUp, ShoppingCart, RotateCcw, CreditCard, RefreshCcw, Clock, Edit, Check, X } from 'lucide-react';

// YANGI: updateDoc va deleteDoc chaqirildi
import { auth, db } from '../firebase';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const Customers = ({ customers = [], setCustomers, sales = [], setSales, returns = [], setReturns, setPage }) => {
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null); 
  
  const [historyType, setHistoryType] = useState('monthly');
  const [expandedPeriod, setExpandedPeriod] = useState(null);
  const [showReturnsDetails, setShowReturnsDetails] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // ==========================================
  // YANGI: Mijozni alohida hujjat sifatida yozish
  // ==========================================
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;
    const isExist = customers.find(c => c.name.toLowerCase() === newCustomerName.trim().toLowerCase());
    if (isExist) return alert("Bu ismli mijoz bazada bor!");
    
    const newCustomer = { id: Date.now(), name: newCustomerName.trim(), phone: newCustomerPhone.trim() };
    const yangiMijozlar = [...customers, newCustomer];
    
    setCustomers(yangiMijozlar);
    setNewCustomerName(''); 
    setNewCustomerPhone('');

    if (auth.currentUser) {
      try {
        const storeUid = auth.currentUser.uid;
        // Yangi mijoz customers papkasiga o'z ID si bilan tushadi
        const customerRef = doc(db, "stores", storeUid, "customers", newCustomer.id.toString());
        await setDoc(customerRef, newCustomer);
      } catch (error) {
        console.error("Mijozni bulutga saqlashda xato:", error);
      }
    }
  };

  // ==========================================
  // YANGI: Mijozni alohida hujjatdan o'chirish
  // ==========================================
  const handleDeleteCustomer = async (id, name, e) => {
    e.stopPropagation(); 
    const confirmDelete = window.confirm(`"${name}" ismli mijozni o'chirmoqchimisiz?`);
    if (confirmDelete) {
      const qolganMijozlar = customers.filter(c => c.id !== id);
      setCustomers(qolganMijozlar);

      if (auth.currentUser) {
        try {
          const storeUid = auth.currentUser.uid;
          const customerRef = doc(db, "stores", storeUid, "customers", id.toString());
          await deleteDoc(customerRef);
        } catch (error) {
          console.error("Mijozni bulutdan o'chirishda xato:", error);
        }
      }
    }
  };

  // ==========================================
  // YANGI: Mijoz ma'lumotlarini (ism, nomini) yangilash 
  // va Kassa/Vozvratdagi ismlarini ham to'g'irlab ketish
  // ==========================================
  const handleSaveEdit = async () => {
    const trimmedName = editName.trim();
    if (!trimmedName) return alert("Ism bo'sh bo'lishi mumkin emas!");

    if (trimmedName.toLowerCase() !== selectedCustomer.name.toLowerCase()) {
       const exists = customers.find(c => c.name.toLowerCase() === trimmedName.toLowerCase());
       if (exists) return alert("Bunday ismli mijoz allaqachon mavjud!");
    }

    const updatedCustomers = customers.map(c => 
      c.id === selectedCustomer.id ? { ...c, name: trimmedName, phone: editPhone.trim() } : c
    );

    setCustomers(updatedCustomers);
    
    const updatedSelectedCustomer = { ...selectedCustomer, name: trimmedName, phone: editPhone.trim() };
    setSelectedCustomer(updatedSelectedCustomer);
    setIsEditing(false);

    if (auth.currentUser) {
      try {
        const storeUid = auth.currentUser.uid;
        
        // 1. Mijozning o'z ma'lumotlarini bazada yangilaymiz
        const customerRef = doc(db, "stores", storeUid, "customers", selectedCustomer.id.toString());
        await updateDoc(customerRef, { name: trimmedName, phone: editPhone.trim() });
        
        // 2. Agar ismi o'zgargan bo'lsa, xaridlar va vozvratlardagi eski ismini ham topib o'zgartirib qo'yamiz
        if (trimmedName !== selectedCustomer.name) {
           if (setSales) {
             const updatedSales = sales.map(s => s.customer === selectedCustomer.name ? { ...s, customer: trimmedName } : s);
             setSales(updatedSales);
             
             // Firebase dagi barcha savdolarni tekshirib yangilaydi
             sales.forEach(s => {
               if (s.customer === selectedCustomer.name) {
                 const saleRef = doc(db, "stores", storeUid, "sales", s.id.toString());
                 updateDoc(saleRef, { customer: trimmedName }).catch(e => console.log(e));
               }
             });
           }
           if (setReturns) {
             const updatedReturns = returns.map(r => r.customer === selectedCustomer.name ? { ...r, customer: trimmedName } : r);
             setReturns(updatedReturns);
             
             // Firebase dagi barcha vozvratlarni tekshirib yangilaydi
             returns.forEach(r => {
               if (r.customer === selectedCustomer.name) {
                 const returnRef = doc(db, "stores", storeUid, "returns", r.id.toString());
                 updateDoc(returnRef, { customer: trimmedName }).catch(e => console.log(e));
               }
             });
           }
        }
      } catch (error) {
        console.error("Tahrirni saqlashda xato:", error);
      }
    }
  };

  const isUsdUnit = (unit) => {
    if (!unit) return false;
    return unit.toLowerCase() === 'kv' || unit.includes('$');
  };

  const isUsdProduct = (productName, unit) => {
    if (isUsdUnit(unit)) return true;
    if (typeof productName === 'string' && (productName.includes('$') || productName.toLowerCase().includes(' kv '))) return true;
    return false;
  };

  const getCustomerStats = (customerName) => {
    const mySales = sales.filter(s => s.customer === customerName);
    const myReturns = returns.filter(r => r.customer === customerName);
    
    let totalBoughtSom = 0; let totalBoughtUsd = 0;
    let totalDebtSom = 0; let totalDebtUsd = 0;
    let totalReturnedSom = 0; let totalReturnedUsd = 0;
    let todayReturnedSom = 0; let todayReturnedUsd = 0;
    const todayStr = new Date().toLocaleDateString('uz-UZ');

    mySales.forEach(s => {
      const isKv = isUsdProduct(s.productName, s.unit);
      const sum = Number(s.totalSum) || 0;
      const remainingDebt = s.isDebt ? (sum - (Number(s.paidAmount) || 0)) : 0;

      if (isKv) { totalBoughtUsd += sum; totalDebtUsd += remainingDebt; } 
      else { totalBoughtSom += sum; totalDebtSom += remainingDebt; }
    });

    myReturns.forEach(r => {
      let rSom = 0; let rUsd = 0;
      if (r.returnSumSom !== undefined || r.returnSumUsd !== undefined) {
        rSom = (Number(r.returnSumSom) || 0); rUsd = (Number(r.returnSumUsd) || 0);
      } else {
        if (isUsdProduct(r.productName, r.unit)) rUsd = (Number(r.returnSum) || 0);
        else rSom = (Number(r.returnSum) || 0);
      }
      totalReturnedSom += rSom; totalReturnedUsd += rUsd;
      if (new Date(r.id).toLocaleDateString('uz-UZ') === todayStr) {
        todayReturnedSom += rSom; todayReturnedUsd += rUsd;
      }
    });

    const actualPaidSom = totalBoughtSom - totalReturnedSom - totalDebtSom;
    const actualPaidUsd = totalBoughtUsd - totalReturnedUsd - totalDebtUsd;

    const combinedHistory = [
      ...mySales.map(s => ({ ...s, itemType: 'sale' })),
      ...myReturns.map(r => ({ ...r, itemType: 'return' }))
    ].sort((a, b) => b.id - a.id); 

    return { 
      totalBoughtSom, totalBoughtUsd, 
      totalDebtSom, totalDebtUsd, 
      totalReturnedSom, totalReturnedUsd,
      todayReturnedSom, todayReturnedUsd,
      actualPaidSom, actualPaidUsd,
      hasDebt: totalDebtSom > 0 || totalDebtUsd > 0,
      history: combinedHistory 
    };
  };

  const aggregatedHistory = useMemo(() => {
    if (!selectedCustomer) return [];
    const stats = getCustomerStats(selectedCustomer.name);
    const map = {};
    
    const getKeyAndLabel = (timestamp) => {
      const t = new Date(timestamp);
      if (historyType === 'daily') return { key: t.toLocaleDateString('uz-UZ'), label: t.toLocaleDateString('uz-UZ') + " kungi" };
      if (historyType === 'monthly') {
        const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
        return { key: `${months[t.getMonth()]} ${t.getFullYear()}`, label: `${months[t.getMonth()]} ${t.getFullYear()}` };
      }
      return { key: t.getFullYear().toString(), label: `${t.getFullYear()} yildagi` };
    };

    stats.history.forEach(item => {
      const { key, label } = getKeyAndLabel(item.id);
      if (!map[key]) map[key] = { label, key, boughtSom: 0, boughtUsd: 0, debtSom: 0, debtUsd: 0, costSom: 0, costUsd: 0, profitSom: 0, profitUsd: 0, returnedSom: 0, returnedUsd: 0, timestamp: item.id, details: [] };
      
      if (item.itemType === 'sale') {
        const isKv = isUsdProduct(item.productName, item.unit);
        const sum = Number(item.totalSum) || 0;
        const remainingDebt = item.isDebt ? (sum - (Number(item.paidAmount) || 0)) : 0;

        if (isKv) { map[key].boughtUsd += sum; map[key].debtUsd += remainingDebt; } 
        else { map[key].boughtSom += sum; map[key].debtSom += remainingDebt; }

        let currentCostSom = 0; let currentCostUsd = 0;
        let currentProfitSom = 0; let currentProfitUsd = 0;

        if (item.cartItems && item.cartItems.length > 0) {
           item.cartItems.forEach(cartItem => {
              const isItemUsd = isUsdUnit(cartItem.product.unit);
              const itemCost = (Number(cartItem.product.costPrice) || 0) * cartItem.qty;
              const itemRevenue = Number(cartItem.total) || 0;
              const itemProfit = itemRevenue - itemCost;

              if (isItemUsd) { currentCostUsd += itemCost; currentProfitUsd += itemProfit; } 
              else { currentCostSom += itemCost; currentProfitSom += itemProfit; }
           });
        }

        map[key].costSom += currentCostSom; map[key].costUsd += currentCostUsd;
        map[key].profitSom += currentProfitSom; map[key].profitUsd += currentProfitUsd;

        map[key].details.push({ type: 'sale', name: item.productName, sum, isKv, costSom: currentCostSom, costUsd: currentCostUsd, profitSom: currentProfitSom, profitUsd: currentProfitUsd });
      } 
      else if (item.itemType === 'return') {
        const rSom = item.returnSumSom !== undefined ? item.returnSumSom : (!isUsdProduct(item.productName, item.unit) ? (item.returnSum || 0) : 0);
        const rUsd = item.returnSumUsd !== undefined ? item.returnSumUsd : (isUsdProduct(item.productName, item.unit) ? (item.returnSum || 0) : 0);
        
        map[key].returnedSom += rSom; map[key].returnedUsd += rUsd;
        map[key].details.push({ type: 'return', name: item.productName, rSom, rUsd });
      }
    });

    return Object.values(map).sort((a, b) => b.timestamp - a.timestamp);
  }, [selectedCustomer, sales, returns, historyType]);

  if (selectedCustomer) {
    const stats = getCustomerStats(selectedCustomer.name);
    const returnedItems = stats.history.filter(h => h.itemType === 'return');

    return (
      <div className="fade-in app-container" style={{ paddingBottom: '40px' }}>
        <button onClick={() => { setSelectedCustomer(null); setShowReturnsDetails(false); setIsEditing(false); }} className="btn btn-danger" style={{ marginBottom: '25px', width: 'auto' }}>
          <ArrowLeft size={18} /> Orqaga
        </button>

        <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', padding: '30px', marginBottom: '25px', borderTop: '4px solid #1e3a8a' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', color: '#1e3a8a', flexShrink: 0 }}>
            {selectedCustomer.name.charAt(0).toUpperCase()}
          </div>
          
          <div style={{ flex: 1 }}>
            {isEditing ? (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280' }}>Mijoz ismi</label>
                  <input type="text" className="form-control" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ marginBottom: 0 }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280' }}>Telefon raqami</label>
                  <input type="text" className="form-control" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} style={{ marginBottom: 0 }} />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                  <button onClick={handleSaveEdit} className="btn btn-primary" style={{ width: 'auto', padding: '8px 15px', backgroundColor: '#10b981', border: 'none', display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <Check size={16} /> Saqlash
                  </button>
                  <button onClick={() => setIsEditing(false)} className="btn btn-danger" style={{ width: 'auto', padding: '8px 15px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <X size={16} /> Bekor qilish
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                  <h1 style={{ margin: 0 }}>{selectedCustomer.name}</h1>
                  <p style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}>
                    <Phone size={14} /> {selectedCustomer.phone || "Telefon kiritilmagan"}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setEditName(selectedCustomer.name);
                    setEditPhone(selectedCustomer.phone || '');
                    setIsEditing(true);
                  }} 
                  className="btn" 
                  style={{ backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', width: 'auto', padding: '8px 16px', display: 'flex', gap: '6px', alignItems: 'center', fontSize: '14px' }}
                >
                  <Edit size={16} /> Tahrirlash
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '30px', alignItems: 'start' }}>
          
          <div className="card" style={{ background: '#f8fafc', borderTop: '4px solid #3b82f6', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', marginBottom: '10px' }}>
              <ShoppingBag size={18} /> <span style={{ fontSize: '12px', fontWeight: 'bold' }}>JAMI XARIDLAR</span>
            </div>
            {stats.totalBoughtSom > 0 && <h2 style={{ fontSize: '18px', margin: '5px 0 0 0', color: '#1e3a8a' }}>{stats.totalBoughtSom.toLocaleString()} so'm</h2>}
            {stats.totalBoughtUsd > 0 && <h2 style={{ fontSize: '18px', margin: '5px 0 0 0', color: '#2563eb' }}>{stats.totalBoughtUsd.toLocaleString()} $</h2>}
            {stats.totalBoughtSom === 0 && stats.totalBoughtUsd === 0 && <h2 style={{ fontSize: '18px', margin: '5px 0 0 0', color: '#1e3a8a' }}>0 so'm</h2>}
          </div>

          <div className="card" style={{ background: '#fdf8f6', borderTop: '4px solid #f97316', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                <PackageMinus size={18} /> <span style={{ fontSize: '12px', fontWeight: 'bold' }}>VOZVRAT (Shu kungacha)</span>
              </div>
              
              {returnedItems.length > 0 && (
                <button 
                  onClick={() => setShowReturnsDetails(!showReturnsDetails)} 
                  style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#b45309', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  Tafsilot {showReturnsDetails ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                </button>
              )}
            </div>

            {stats.totalReturnedSom > 0 && <h2 style={{ fontSize: '18px', margin: '5px 0 0 0', color: '#b45309' }}>-{stats.totalReturnedSom.toLocaleString()} so'm</h2>}
            {stats.totalReturnedUsd > 0 && <h2 style={{ fontSize: '18px', margin: '5px 0 0 0', color: '#d97706' }}>-{stats.totalReturnedUsd.toLocaleString()} $</h2>}
            {stats.totalReturnedSom === 0 && stats.totalReturnedUsd === 0 && <h2 style={{ fontSize: '18px', margin: '5px 0 0 0', color: '#d97706' }}>0 so'm</h2>}
            
            {showReturnsDetails && returnedItems.length > 0 && (
              <div className="fade-in" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #fcd34d', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#b45309', textTransform: 'uppercase', marginBottom: '4px' }}>Qaytarilgan tovarlar ro'yxati:</div>
                {returnedItems.map((ret, idx) => {
                  const rSom = ret.returnSumSom !== undefined ? ret.returnSumSom : (!isUsdProduct(ret.productName, ret.unit) ? (ret.returnSum || 0) : 0);
                  const rUsd = ret.returnSumUsd !== undefined ? ret.returnSumUsd : (isUsdProduct(ret.productName, ret.unit) ? (ret.returnSum || 0) : 0);
                  return (
                    <div key={idx} style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#fffbeb', borderRadius: '6px', border: '1px solid #fef3c7' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#92400e', whiteSpace: 'pre-line', lineHeight: '1.4' }}>{ret.productName}</div>
                        <div style={{ fontSize: '10px', color: '#b45309', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {new Date(ret.id).toLocaleDateString('uz-UZ')} / {new Date(ret.id).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div style={{ fontWeight: 'bold', color: '#d97706', textAlign: 'right', minWidth: '80px', fontSize: '13px' }}>
                        {rSom > 0 && `-${rSom.toLocaleString()} so'm`}
                        {rUsd > 0 && `-${rUsd.toLocaleString()} $`}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card fade-in" style={{ background: '#fffbeb', borderTop: '4px solid #ea580c', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#854d0e', marginBottom: '10px' }}>
              <RefreshCcw size={18} /> <span style={{ fontSize: '12px', fontWeight: 'bold' }}>BUGUN QAYTARDI</span>
            </div>
            {stats.todayReturnedSom > 0 && <h2 style={{ fontSize: '18px', margin: '5px 0 0 0', color: '#9a3412' }}>-{stats.todayReturnedSom.toLocaleString()} so'm</h2>}
            {stats.todayReturnedUsd > 0 && <h2 style={{ fontSize: '18px', margin: '5px 0 0 0', color: '#c2410c' }}>-{stats.todayReturnedUsd.toLocaleString()} $</h2>}
            {stats.todayReturnedSom === 0 && stats.todayReturnedUsd === 0 && <h2 style={{ fontSize: '18px', margin: '5px 0 0 0', color: '#c2410c' }}>0 so'm</h2>}
          </div>

          <div className="card" style={{ background: stats.hasDebt ? '#fff5f5' : '#f0fdf4', borderTop: `4px solid ${stats.hasDebt ? '#ef4444' : '#10b981'}`, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', marginBottom: '10px' }}>
              <History size={18} /> <span style={{ fontSize: '12px', fontWeight: 'bold' }}>QARZ MIQDORI</span>
            </div>
            {stats.totalDebtSom > 0 && <h2 style={{ fontSize: '18px', margin: '5px 0 0 0', color: '#ef4444' }}>-{stats.totalDebtSom.toLocaleString()} so'm</h2>}
            {stats.totalDebtUsd > 0 && <h2 style={{ fontSize: '18px', margin: '5px 0 0 0', color: '#dc2626' }}>-{stats.totalDebtUsd.toLocaleString()} $</h2>}
            {!stats.hasDebt && <h2 style={{ fontSize: '18px', margin: '5px 0 0 0', color: '#10b981' }}>0 so'm</h2>}
          </div>

          <div className="card" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', color: 'white', border: 'none', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.8, marginBottom: '10px' }}>
              <Landmark size={18} /> <span style={{ fontSize: '12px', fontWeight: 'bold' }}>SOF TO'LAGAN PULLAR</span>
            </div>
            {stats.actualPaidSom > 0 && <h2 style={{ fontSize: '20px', margin: '5px 0 0 0', color: '#ffffff' }}>{stats.actualPaidSom.toLocaleString()} so'm</h2>}
            {stats.actualPaidUsd > 0 && <h2 style={{ fontSize: '20px', margin: '5px 0 0 0', color: '#bfdbfe' }}>{stats.actualPaidUsd.toLocaleString()} $</h2>}
            {stats.actualPaidSom <= 0 && stats.actualPaidUsd <= 0 && <h2 style={{ fontSize: '20px', margin: '5px 0 0 0', color: '#ffffff' }}>0 so'm</h2>}
          </div>
        </div>

        <div className="card" style={{ padding: '20px', marginBottom: '30px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#1e3a8a' }}>
            <BarChart3 size={20} color="#1e3a8a" /> Davrlar bo'yicha hisobot
          </h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button className="btn" style={{ padding: '8px', flex: 1, backgroundColor: historyType === 'daily' ? '#1e3a8a' : '#f1f5f9', color: historyType === 'daily' ? 'white' : '#1e3a8a', border: '1px solid #1e3a8a' }} onClick={() => {setHistoryType('daily'); setExpandedPeriod(null)}}>Kunlik</button>
            <button className="btn" style={{ padding: '8px', flex: 1, backgroundColor: historyType === 'monthly' ? '#1e3a8a' : '#f1f5f9', color: historyType === 'monthly' ? 'white' : '#1e3a8a', border: '1px solid #1e3a8a' }} onClick={() => {setHistoryType('monthly'); setExpandedPeriod(null)}}>Oylik</button>
            <button className="btn" style={{ padding: '8px', flex: 1, backgroundColor: historyType === 'yearly' ? '#1e3a8a' : '#f1f5f9', color: historyType === 'yearly' ? 'white' : '#1e3a8a', border: '1px solid #1e3a8a' }} onClick={() => {setHistoryType('yearly'); setExpandedPeriod(null)}}>Yillik</button>
          </div>
          
          {aggregatedHistory.length === 0 ? <p style={{ textAlign: 'center', color: '#64748b' }}>Hozircha ma'lumot yo'q.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {aggregatedHistory.map((item, index) => {
                return (
                  <div key={index} className="fade-in" style={{ padding: '15px', background: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', borderLeft: '5px solid #1e3a8a', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    
                    <div 
                      onClick={() => setExpandedPeriod(expandedPeriod === item.key ? null : item.key)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    >
                      <div style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '18px' }}>{item.label} Hisoboti</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#1e3a8a', backgroundColor: '#f1f5f9', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' }}>
                        Tafsilotlar {expandedPeriod === item.key ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', marginTop: '10px' }}>
                      
                      <div style={{ backgroundColor: '#f1f5f9', padding: '10px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Sotuv</div>
                        <div style={{ color: '#1e3a8a', fontSize: '13px', fontWeight: 'bold' }}>
                          {item.boughtSom > 0 && <div>{item.boughtSom.toLocaleString()} so'm</div>}
                          {item.boughtUsd > 0 && <div>{item.boughtUsd.toLocaleString()} $</div>}
                          {item.boughtSom === 0 && item.boughtUsd === 0 && '0'}
                        </div>
                      </div>

                      <div style={{ backgroundColor: '#fff7ed', padding: '10px', borderRadius: '8px', border: '1px solid #ffedd5' }}>
                        <div style={{ fontSize: '10px', color: '#b45309', textTransform: 'uppercase', marginBottom: '4px' }}>Vozvrat</div>
                        <div style={{ color: '#d97706', fontSize: '13px', fontWeight: 'bold' }}>
                          {item.returnedSom > 0 && <div>-{item.returnedSom.toLocaleString()} so'm</div>}
                          {item.returnedUsd > 0 && <div>-{item.returnedUsd.toLocaleString()} $</div>}
                          {item.returnedSom === 0 && item.returnedUsd === 0 && '0'}
                        </div>
                      </div>

                      <div style={{ backgroundColor: '#fef2f2', padding: '10px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Tan narx</div>
                        <div style={{ color: '#dc2626', fontSize: '13px', fontWeight: 'bold' }}>
                          {item.costSom > 0 && <div>{item.costSom.toLocaleString()} so'm</div>}
                          {item.costUsd > 0 && <div>{item.costUsd.toLocaleString()} $</div>}
                          {item.costSom === 0 && item.costUsd === 0 && '-'}
                        </div>
                      </div>

                      <div style={{ backgroundColor: '#ecfdf5', padding: '10px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Sof Foyda</div>
                        <div style={{ color: '#059669', fontSize: '13px', fontWeight: 'bold' }}>
                          {item.profitSom !== 0 && <div>{item.profitSom.toLocaleString()} so'm</div>}
                          {item.profitUsd !== 0 && <div>{item.profitUsd.toLocaleString()} $</div>}
                          {item.profitSom === 0 && item.profitUsd === 0 && '0'}
                        </div>
                      </div>

                      <div style={{ backgroundColor: '#fefce8', padding: '10px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Qarz bo'ldi</div>
                        <div style={{ color: '#ca8a04', fontSize: '13px', fontWeight: 'bold' }}>
                          {item.debtSom > 0 && <div>{item.debtSom.toLocaleString()} so'm</div>}
                          {item.debtUsd > 0 && <div>{item.debtUsd.toLocaleString()} $</div>}
                          {item.debtSom === 0 && item.debtUsd === 0 && '0'}
                        </div>
                      </div>

                    </div>

                    {expandedPeriod === item.key && (
                      <div className="fade-in" style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Shu davr ichidagi xaridlar tafsiloti:</div>
                        {item.details.map((det, i) => (
                          <div key={i} style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <div style={{ flex: 1, color: '#1e293b', display: 'flex', alignItems: 'flex-start', gap: '8px', lineHeight: '1.5' }}>
                              {det.type === 'return' ? <RotateCcw size={16} color="#d97706" /> : <ShoppingCart size={16} color="#1e3a8a" />}
                              <span style={{ whiteSpace: 'pre-line' }}>{det.name}</span>
                            </div>
                            <div style={{ fontWeight: 'bold', color: det.type === 'return' ? '#d97706' : '#1e3a8a', minWidth: '90px', textAlign: 'right' }}>
                              {det.type === 'sale' 
                                ? `${det.sum.toLocaleString()} ${det.isKv ? '$' : "so'm"}` 
                                : `-${(det.rSom > 0 ? det.rSom : det.rUsd).toLocaleString()} ${det.rSom > 0 ? "so'm" : "$"}`
                              }
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card" style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }}>
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#1e3a8a' }}>
            <History size={20} color="#1e3a8a" /> Barcha harakatlar xronologiyasi
          </h3>
          {stats.history.length === 0 && <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>Hali xaridlar yo'q</p>}
          
          {stats.history.map(item => {
            if (item.itemType === 'sale') {
              const isKv = isUsdProduct(item.productName, item.unit);
              const remaining = item.totalSum - (item.paidAmount || 0);
              
              return (
                <div key={`sale-${item.id}`} className="fade-in" style={{ padding: '15px', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', borderLeft: '4px solid #1e3a8a', marginBottom: '10px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#1e293b', whiteSpace: 'pre-line', lineHeight: '1.5' }}>{item.productName}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ShoppingCart size={14} color="#64748b" /> {new Date(item.id).toLocaleDateString('uz-UZ')} soat {new Date(item.id).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: '120px' }}>
                      <div style={{ fontWeight: '800', color: '#1e3a8a', fontSize: '16px' }}>
                        {item.totalSum.toLocaleString()} {isKv ? '$' : "so'm"}
                      </div>
                      {item.isDebt ? (
                        <div style={{ fontSize: '12px', color: '#1e3a8a', marginTop: '4px', fontWeight: 'bold' }}>
                          Qarz: {remaining.toLocaleString()} {isKv ? '$' : "so'm"}
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: '#1e3a8a', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', fontWeight: 'bold' }}>
                          <CheckCircle size={14} /> To'langan
                        </div>
                      )}
                    </div>
                  </div>

                  {item.paymentHistory && item.paymentHistory.length > 0 && (
                    <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                      <div style={{ fontSize: '11px', color: '#1e3a8a', fontWeight: 'bold', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase' }}>
                        <Banknote size={14} /> To'lov qilingan vaqtlar:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {item.paymentHistory.map((pay, idx) => (
                          <div key={idx} style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', color: '#1e293b' }}>
                            <span>{idx + 1}. {new Date(pay.date).toLocaleDateString('uz-UZ')} {new Date(pay.date).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
                            <span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>+{pay.amount.toLocaleString()} {isKv ? '$' : "so'm"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            } 
            else if (item.itemType === 'return') {
              const rSom = item.returnSumSom !== undefined ? item.returnSumSom : (!isUsdProduct(item.productName, item.unit) ? (item.returnSum || 0) : 0);
              const rUsd = item.returnSumUsd !== undefined ? item.returnSumUsd : (isUsdProduct(item.productName, item.unit) ? (item.returnSum || 0) : 0);
              
              return (
                <div key={`return-${item.id}`} className="fade-in" style={{ padding: '15px', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', borderLeft: '4px solid #d97706', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#1e293b', whiteSpace: 'pre-line', lineHeight: '1.5' }}>{item.productName}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <RotateCcw size={14} color="#d97706" /> Vozvrat qilingan: {new Date(item.id).toLocaleDateString('uz-UZ')} soat {new Date(item.id).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '120px' }}>
                    <div style={{ fontWeight: '800', color: '#d97706', fontSize: '16px' }}>
                      {rSom > 0 && `-${rSom.toLocaleString()} so'm`}
                      {rUsd > 0 && `-${rUsd.toLocaleString()} $`}
                    </div>
                    <div style={{ fontSize: '12px', color: '#d97706', marginTop: '4px', fontWeight: 'bold' }}>
                      Qaytarildi
                    </div>
                  </div>
                </div>
              );
            }
          })}
        </div>
      </div>
    );
  }

  // ASOSIY MIJOZLAR RO'YXATI
  return (
    <div className="fade-in app-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}><Users size={28} /> Mijozlar Bazasi</h1>
        <button onClick={() => setPage('dashboard')} className="btn btn-danger" style={{ width: 'auto' }}>Dashboard</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
        <div className="card" style={{ alignSelf: 'start', borderTop: '5px solid #3b82f6' }}>
          <h3 style={{ marginTop: 0 }}><UserPlus size={22} color="#3b82f6" /> Yangi mijoz</h3>
          <form onSubmit={handleAddCustomer}>
            <input className="form-control" placeholder="Mijoz ismi" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} required />
            <input className="form-control" placeholder="Telefon" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} />
            <button className="btn btn-primary" style={{ width: '100%' }}>Saqlash</button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Mijozlar ro'yxati</h3>
          {customers.length === 0 && <p style={{ color: '#9ca3af', textAlign: 'center' }}>Mijozlar yo'q</p>}
          {customers.map(c => {
            const stat = getCustomerStats(c.name);
            return (
              <div key={c.id} onClick={() => { setSelectedCustomer(c); setShowReturnsDetails(false); setExpandedPeriod(null); }} className="menu-card" style={{ padding: '15px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', border: '1px solid #f1f5f9', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ background: '#eff6ff', color: '#2563eb', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <b>{c.name}</b>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>
                      {stat.totalBoughtSom > 0 && <span>{stat.totalBoughtSom.toLocaleString()} so'm</span>}
                      {stat.totalBoughtSom > 0 && stat.totalBoughtUsd > 0 && <span style={{color: '#9ca3af', margin: '0 4px'}}>|</span>}
                      {stat.totalBoughtUsd > 0 && <span>{stat.totalBoughtUsd.toLocaleString()} $</span>}
                      {stat.totalBoughtSom === 0 && stat.totalBoughtUsd === 0 && <span>0 so'm</span>}
                    </div>

                    {stat.hasDebt && (
                      <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold' }}>
                        Qarz: 
                        {stat.totalDebtSom > 0 && <span> {stat.totalDebtSom.toLocaleString()} so'm</span>}
                        {stat.totalDebtSom > 0 && stat.totalDebtUsd > 0 && <span style={{color: '#fca5a5', margin: '0 3px'}}>+</span>}
                        {stat.totalDebtUsd > 0 && <span> {stat.totalDebtUsd.toLocaleString()} $</span>}
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={(e) => handleDeleteCustomer(c.id, c.name, e)} 
                    style={{ background: '#fee2e2', border: 'none', color: '#ef4444', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Mijozni o'chirish"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Customers;