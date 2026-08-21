import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, BookOpen, Search, User, CheckCircle, ChevronDown, ChevronUp, 
  Clock, History, Calendar, DollarSign, MessageCircle, PlusCircle, X, Trash2, Edit 
} from 'lucide-react';

import { auth, db } from '../firebase';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const Debts = ({ sales, setSales, setPage, customers = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [repayAmounts, setRepayAmounts] = useState({});
  const [expandedCustomer, setExpandedCustomer] = useState(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newDebtCustomer, setNewDebtCustomer] = useState('');
  const [newDebtAmount, setNewDebtAmount] = useState('');
  const [newDebtCurrency, setNewDebtCurrency] = useState('som');
  const [newDebtReason, setNewDebtReason] = useState('');
  const [newDebtDays, setNewDebtDays] = useState('');

  const [editingDebt, setEditingDebt] = useState(null);

  const isUsdUnit = (unit) => {
    if (!unit) return false;
    return unit.toLowerCase() === 'kv' || unit.includes('$');
  };

  const isUsdProduct = (productName, unit) => {
    if (isUsdUnit(unit)) return true;
    if (typeof productName === 'string' && (productName.includes('$') || productName.includes(' kv '))) return true;
    return false;
  };

  const debtSales = sales.filter(s => s.isDebt === true);

  // ==========================================
  // YANGI: Mijozlarni qarzlarini guruhlash va Jami qarzini hisoblash
  // ==========================================
  const groupedDebts = useMemo(() => {
    const groups = {};
    
    debtSales.forEach(sale => {
      const customerName = sale.customer || "Noma'lum mijoz";
      
      if (!groups[customerName]) {
        // Agar guruh hali ochilmagan bo'lsa, yaratamiz
        const foundCustomer = customers.find(c => c.name === customerName);
        groups[customerName] = {
          customer: customerName,
          phone: sale.customerPhone || (foundCustomer ? foundCustomer.phone : ''),
          totalSom: 0,
          totalUsd: 0,
          debts: []
        };
      }
      
      const isKv = isUsdProduct(sale.productName, sale.unit);
      const remaining = sale.totalSum - (sale.paidAmount || 0);
      
      // Guruhning umumiy qarzini hisoblash
      if (isKv) {
        groups[customerName].totalUsd += remaining;
      } else {
        groups[customerName].totalSom += remaining;
      }
      
      // Har bir qarzni o'zining ro'yxatiga qo'shish
      groups[customerName].debts.push(sale);
    });

    // Qidiruv bo'yicha filtrlash
    const searchLower = searchQuery.toLowerCase();
    const filteredGroups = Object.values(groups).filter(g => 
      g.customer.toLowerCase().includes(searchLower)
    );

    // Ichidagi qarzlarni sanasi bo'yicha (eng yangisi tepada) saralash
    filteredGroups.forEach(g => {
      g.debts.sort((a, b) => b.id - a.id);
    });

    return filteredGroups;
  }, [debtSales, searchQuery, customers]);

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAmountChange = (e) => {
    let rawValue = e.target.value.replace(/\s/g, '').replace(/[^\d.]/g, '');
    const parts = rawValue.split('.');
    if (parts[0]) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }
    setNewDebtAmount(parts.join('.'));
  };

  const handleEditAmountChange = (e) => {
    let rawValue = e.target.value.replace(/\s/g, '').replace(/[^\d.]/g, '');
    const parts = rawValue.split('.');
    if (parts[0]) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }
    setEditingDebt({ ...editingDebt, editAmount: parts.join('.') });
  };

  const handleAddManualDebt = async (e) => {
    e.preventDefault();
    const amount = parseFloat(newDebtAmount.replace(/\s/g, ''));
    
    if (!newDebtCustomer.trim() || isNaN(amount) || amount <= 0) {
      return alert("Iltimos, mijoz ismi va summani to'g'ri kiriting!");
    }

    const days = parseInt(newDebtDays) || 0;
    const now = Date.now();
    const reasonText = newDebtReason.trim() ? `- Sabab: ${newDebtReason}` : '';
    const productName = `[Qo'lda qo'shilgan qarz] ${reasonText}`;

    const foundCustomer = customers.find(c => c.name.toLowerCase() === newDebtCustomer.toLowerCase());

    const newDebtSale = {
      id: now,
      customer: foundCustomer ? foundCustomer.name : newDebtCustomer,
      customerPhone: foundCustomer ? foundCustomer.phone : '',
      productName: productName,
      unit: newDebtCurrency === 'usd' ? 'Dona/$' : 'dona', 
      totalSum: amount,
      paidAmount: 0,
      isDebt: true,
      wasDebt: true,
      isReceived: false,
      debtDays: days,
      debtDeadline: days > 0 ? now + (days * 24 * 60 * 60 * 1000) : null,
    };

    const yangiSales = [...sales, newDebtSale];
    
    if (window.confirm(`${newDebtCustomer}ga ${amount.toLocaleString()} ${newDebtCurrency === 'usd' ? '$' : "so'm"} qarz yozamizmi?`)) {
      setSales(yangiSales);

      if (auth.currentUser) {
        try {
          const storeUid = auth.currentUser.uid;
          await setDoc(doc(db, "stores", storeUid, "sales", newDebtSale.id.toString()), newDebtSale);
        } catch (error) {
          console.error("Qarzni saqlashda xato:", error);
        }
      }

      setShowAddForm(false);
      setNewDebtCustomer('');
      setNewDebtAmount('');
      setNewDebtReason('');
      setNewDebtDays('');
      setNewDebtCurrency('som');
    }
  };

  const handleRepay = async (sale, isFull) => {
    const isKv = isUsdProduct(sale.productName, sale.unit);
    const remainingDebt = sale.totalSum - (sale.paidAmount || 0);
    const currencyStr = isKv ? '$' : "so'm";
    
    const amount = isFull ? remainingDebt : parseFloat(repayAmounts[sale.id]);

    if (isNaN(amount) || amount <= 0) return alert("Summani to'g'ri kiriting!");
    if (amount > remainingDebt + 0.01) return alert(`Xato! Qoldiq qarz: ${remainingDebt.toLocaleString()} ${currencyStr}`);

    if (window.confirm(`${sale.customer}dan ${amount.toLocaleString()} ${currencyStr} qabul qilasizmi?`)) {
      const now = Date.now(); 
      const newPaidAmount = (sale.paidAmount || 0) + amount;
      const isFullyPaid = Math.abs(newPaidAmount - sale.totalSum) < 0.1;
      
      const newPaymentEntry = { id: Date.now(), amount: amount, date: now };

      const yangiSales = sales.map(s => {
        if (s.id === sale.id) {
          return { 
            ...s, 
            paidAmount: newPaidAmount, 
            isDebt: !isFullyPaid, 
            wasDebt: true,
            lastPaymentDate: now, 
            paymentHistory: [...(s.paymentHistory || []), newPaymentEntry]
          };
        }
        return s;
      });

      setSales(yangiSales); 
      setRepayAmounts({ ...repayAmounts, [sale.id]: '' });

      if (auth.currentUser) {
        try {
          const storeUid = auth.currentUser.uid;
          await updateDoc(doc(db, "stores", storeUid, "sales", sale.id.toString()), {
            paidAmount: newPaidAmount,
            isDebt: !isFullyPaid,
            wasDebt: true,
            lastPaymentDate: now,
            paymentHistory: [...(sale.paymentHistory || []), newPaymentEntry]
          });
        } catch (error) {
          console.error("To'lovni bulutga saqlashda xato:", error);
        }
      }
    }
  };

  const handleDeleteDebt = async (saleId, customerName) => {
    if (window.confirm(`${customerName}ning ushbu qarzini ro'yxatdan butunlay o'chirmoqchimisiz?`)) {
      const yangiSales = sales.filter(s => s.id !== saleId);
      setSales(yangiSales);

      if (auth.currentUser) {
        try {
          const storeUid = auth.currentUser.uid;
          await deleteDoc(doc(db, "stores", storeUid, "sales", saleId.toString()));
        } catch (error) {
          console.error("Qarzni o'chirishda xato:", error);
        }
      }
    }
  };

  const startEditing = (sale) => {
    setEditingDebt({
      ...sale,
      editAmount: sale.totalSum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const cleanAmount = parseFloat(editingDebt.editAmount.replace(/\s/g, ''));
    const cleanPaidAmount = parseFloat(editingDebt.paidAmount) || 0;

    if (!editingDebt.customer.trim() || isNaN(cleanAmount) || cleanAmount <= 0) {
      return alert("Mijoz ismi va summani to'g'ri kiriting!");
    }

    const days = parseInt(editingDebt.debtDays) || 0;
    const isFullyPaid = Math.abs(cleanPaidAmount - cleanAmount) < 0.1 || cleanPaidAmount >= cleanAmount;
    const debtDeadline = days > 0 ? editingDebt.id + (days * 24 * 60 * 60 * 1000) : null;

    const yangiSales = sales.map(s => {
      if (s.id === editingDebt.id) {
        return {
          ...s,
          customer: editingDebt.customer,
          productName: editingDebt.productName,
          unit: editingDebt.unit,
          totalSum: cleanAmount,
          paidAmount: cleanPaidAmount,
          isDebt: !isFullyPaid, 
          debtDays: days,
          debtDeadline: debtDeadline
        };
      }
      return s;
    });

    if (window.confirm("O'zgarishlarni saqlashni tasdiqlaysizmi?")) {
      setSales(yangiSales);
      
      if (auth.currentUser) {
        try {
          const storeUid = auth.currentUser.uid;
          await updateDoc(doc(db, "stores", storeUid, "sales", editingDebt.id.toString()), {
            customer: editingDebt.customer,
            productName: editingDebt.productName,
            unit: editingDebt.unit,
            totalSum: cleanAmount,
            paidAmount: cleanPaidAmount,
            isDebt: !isFullyPaid,
            debtDays: days,
            debtDeadline: debtDeadline
          });
        } catch (error) {
          console.error("Tahrirlashni saqlashda xato:", error);
        }
      }
      setEditingDebt(null);
    }
  };

  const totalDebtSumSom = debtSales.reduce((acc, s) => !isUsdProduct(s.productName, s.unit) ? acc + (s.totalSum - (s.paidAmount || 0)) : acc, 0);
  const totalDebtSumDollar = debtSales.reduce((acc, s) => isUsdProduct(s.productName, s.unit) ? acc + (s.totalSum - (s.paidAmount || 0)) : acc, 0);

  return (
    <div className="fade-in app-container" style={{ paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <button onClick={() => setPage('dashboard')} className="btn btn-danger" style={{ width: 'auto', padding: '10px 20px', backgroundColor: '#e5e7eb', color: '#1f2937', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ArrowLeft size={18} /> Ortga qaytish
        </button>
        <h2 style={{ fontSize: '24px', color: '#1e3a8a', margin: 0, display: 'flex', gap: '10px', alignItems: 'center' }}>
          Qarz Daftari <BookOpen size={28} />
        </h2>
      </div>

      <div className="card fade-in" style={{ padding: '30px', backgroundColor: '#ef4444', color: '#ffffff', marginBottom: '30px', textAlign: 'center', border: 'none', borderRadius: '15px' }}>
        <p style={{ margin: 0, fontSize: '16px', color: '#fee2e2', textTransform: 'uppercase', fontWeight: 'bold' }}>Umumiy Qarzlar</p>
        <h2 style={{ margin: '10px 0 0 0', fontSize: '32px' }}>
          {totalDebtSumSom > 0 && <div>{totalDebtSumSom.toLocaleString()} so'm</div>}
          {totalDebtSumDollar > 0 && <div>{totalDebtSumDollar.toLocaleString()} $</div>}
          {totalDebtSumSom === 0 && totalDebtSumDollar === 0 && <div>0 so'm</div>}
        </h2>
      </div>

      <div style={{ marginBottom: '20px' }}>
        {!showAddForm ? (
          <button 
            onClick={() => setShowAddForm(true)} 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', backgroundColor: '#1e3a8a' }}
          >
            <PlusCircle size={20} /> Yangi qarz qo'shish (Qo'lda kiritish)
          </button>
        ) : (
          <div className="card fade-in" style={{ border: '2px solid #1e3a8a', padding: '20px', backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#1e3a8a', fontSize: '18px' }}>Yangi qarz yozish</h3>
              <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleAddManualDebt} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#4b5563', marginBottom: '5px', display: 'block' }}>Mijoz ismi (yangi yoki bazadan)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Mijoz ismini kiriting..." 
                  list="customerList"
                  value={newDebtCustomer}
                  onChange={e => setNewDebtCustomer(e.target.value)}
                  required
                  style={{ marginBottom: 0 }}
                />
                <datalist id="customerList">
                  {customers.map((c, i) => <option key={i} value={c.name} />)}
                </datalist>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#4b5563', marginBottom: '5px', display: 'block' }}>Summasi</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="0" 
                    value={newDebtAmount} 
                    onChange={handleAmountChange} 
                    required 
                    style={{ marginBottom: 0 }} 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#4b5563', marginBottom: '5px', display: 'block' }}>Valyuta</label>
                  <select className="form-control" value={newDebtCurrency} onChange={e => setNewDebtCurrency(e.target.value)} style={{ marginBottom: 0 }}>
                    <option value="som">So'm</option>
                    <option value="usd">$ (USD)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#4b5563', marginBottom: '5px', display: 'block' }}>Nima sababdan? (Ixtiyoriy)</label>
                <input type="text" className="form-control" placeholder="Masalan: Naqd pul berildi, eski hisob..." value={newDebtReason} onChange={e => setNewDebtReason(e.target.value)} style={{ marginBottom: 0 }} />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#4b5563', marginBottom: '5px', display: 'block' }}>Necha kunga? (Ixtiyoriy)</label>
                <input type="number" className="form-control" placeholder="Muddat (kun)" value={newDebtDays} onChange={e => setNewDebtDays(e.target.value)} min="0" style={{ marginBottom: 0 }} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#10b981', border: 'none', padding: '12px', fontWeight: 'bold', marginTop: '10px' }}>
                Qarzni tasdiqlash va yozish
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: '30px', borderTop: '4px solid #ef4444' }}>
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <Search size={18} color="#6b7280" style={{ position: 'absolute', left: '12px', top: '14px' }} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Mijoz ismi bo'yicha qidiruv..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
        </div>

        {/* YANGI: Guruhlangan Mijozlar Ro'yxati */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
          {groupedDebts.map((group, gIndex) => (
            <div key={gIndex} className="card fade-in" style={{ padding: 0, border: '1px solid #93c5fd', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              
              {/* TEPADAGI QISM: Mijoz Ismi va Jami Qarz */}
              <div style={{ backgroundColor: '#eff6ff', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #bfdbfe', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ backgroundColor: '#1e3a8a', color: 'white', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px' }}>
                    {group.customer.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: '#1e3a8a', fontSize: '20px' }}>{group.customer}</h3>
                    {group.phone && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{group.phone}</div>}
                  </div>
                </div>
                
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>Shu mijozning Jami qarzi:</div>
                  <div style={{ color: '#ef4444', fontWeight: '900', fontSize: '20px', lineHeight: '1.2' }}>
                    {group.totalSom > 0 && <div>{group.totalSom.toLocaleString()} so'm</div>}
                    {group.totalUsd > 0 && <div>{group.totalUsd.toLocaleString()} $</div>}
                  </div>

                  {group.phone && (
                    <a 
                      href={`sms:${group.phone}?body=${encodeURIComponent(`Assalomu alaykum, ${group.customer}. Do'kondan olingan tovarlar bo'yicha umumiy qarzingiz: ${group.totalSom > 0 ? group.totalSom.toLocaleString() + " so'm" : ""} ${group.totalUsd > 0 ? group.totalUsd.toLocaleString() + " $" : ""}. Iltimos to'lovni amalga oshiring.`)}`} 
                      style={{ backgroundColor: '#2563eb', color: 'white', padding: '4px 10px', fontSize: '11px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', border: 'none', borderRadius: '6px', marginTop: '8px', fontWeight: 'bold' }}
                    >
                      <MessageCircle size={14} /> Jami qarzni SMS qilish
                    </a>
                  )}
                </div>
              </div>

              {/* PASTKI QISM: Har bir qarz alohida ro'yxatda */}
              <div style={{ padding: '15px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {group.debts.map(sale => {
                  const isKv = isUsdProduct(sale.productName, sale.unit);
                  const currency = isKv ? '$' : "so'm";
                  const remaining = sale.totalSum - (sale.paidAmount || 0);

                  let daysLeftText = null;
                  let isUrgent = false;

                  if (sale.debtDeadline) {
                    const daysLeft = Math.ceil((sale.debtDeadline - Date.now()) / (1000 * 60 * 60 * 24));
                    isUrgent = daysLeft <= 3;
                    if (daysLeft > 0) {
                      daysLeftText = `${daysLeft} kun qoldi`;
                    } else if (daysLeft === 0) {
                      daysLeftText = "Bugun to'lash muddati!";
                    } else {
                      daysLeftText = `${Math.abs(daysLeft)} kun o'tib ketdi!`;
                      isUrgent = true;
                    }
                  }

                  // Agar qarz tahrirlanayotgan bo'lsa
                  if (editingDebt && editingDebt.id === sale.id) {
                    return (
                      <div key={sale.id} className="fade-in" style={{ padding: '15px', backgroundColor: '#f0fdf4', border: '2px solid #10b981', borderRadius: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                          <h4 style={{ margin: 0, color: '#10b981', fontWeight: 'bold' }}>Qarzni tahrirlash</h4>
                          <button onClick={() => setEditingDebt(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4b5563' }}>Mijoz ismi</label>
                            <input type="text" className="form-control" value={editingDebt.customer} onChange={e => setEditingDebt({...editingDebt, customer: e.target.value})} required />
                          </div>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4b5563' }}>Sabab / Tovar nomi</label>
                            <input type="text" className="form-control" value={editingDebt.productName} onChange={e => setEditingDebt({...editingDebt, productName: e.target.value})} required />
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <div style={{ flex: 2 }}>
                              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4b5563' }}>Umumiy summa</label>
                              <input type="text" className="form-control" value={editingDebt.editAmount} onChange={handleEditAmountChange} required />
                            </div>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4b5563' }}>Valyuta</label>
                              <select className="form-control" value={editingDebt.unit} onChange={e => setEditingDebt({...editingDebt, unit: e.target.value})}>
                                <option value="dona">So'm</option>
                                <option value="Dona/$">$ (USD)</option>
                              </select>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4b5563' }}>To'langan qismi</label>
                              <input type="number" className="form-control" value={editingDebt.paidAmount || 0} onChange={e => setEditingDebt({...editingDebt, paidAmount: e.target.value})} min="0" step="any" />
                            </div>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4b5563' }}>Muddati (kun)</label>
                              <input type="number" className="form-control" value={editingDebt.debtDays || 0} onChange={e => setEditingDebt({...editingDebt, debtDays: e.target.value})} min="0" />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button type="submit" className="btn" style={{ backgroundColor: '#10b981', color: 'white', flex: 1 }}>Saqlash</button>
                            <button type="button" onClick={() => setEditingDebt(null)} className="btn" style={{ backgroundColor: '#6b7280', color: 'white', flex: 1 }}>Bekor qilish</button>
                          </div>
                        </form>
                      </div>
                    );
                  }

                  // Asosiy ko'rinish
                  return (
                    <div key={sale.id} className="fade-in" style={{ padding: '15px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderLeft: isUrgent ? '4px solid #dc2626' : '4px solid #f59e0b', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ flex: 1, minWidth: '180px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#1f2937', whiteSpace: 'pre-line', lineHeight: '1.4' }}>
                              {sale.productName}
                            </span>
                            <button onClick={() => startEditing(sale)} style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', padding: 2, marginLeft: '5px' }} title="Tahrirlash">
                              <Edit size={16} />
                            </button>
                            <button onClick={() => handleDeleteDebt(sale.id, sale.customer)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }} title="O'chirish">
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={14} /> Sana: {new Date(sale.id).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                          
                          {sale.debtDeadline && (
                            <div style={{ marginTop: '8px' }}>
                              <span style={{ backgroundColor: isUrgent ? '#fee2e2' : '#d1fae5', color: isUrgent ? '#dc2626' : '#059669', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={12} /> {daysLeftText}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div style={{ textAlign: 'right', minWidth: '120px' }}>
                          <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>Shu tovar bo'yicha qarz:</div>
                          <div style={{ fontWeight: 'bold', color: '#ef4444', fontSize: '18px', marginTop: '2px' }}>
                            {remaining.toLocaleString()} {currency}
                          </div>
                          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Xarid summasi: {sale.totalSum?.toLocaleString()} {currency}</div>
                        </div>
                      </div>

                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #e5e7eb' }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <input 
                            type="number" 
                            className="form-control" 
                            placeholder="To'lov summasi..." 
                            value={repayAmounts[sale.id] || ''} 
                            onChange={(e) => setRepayAmounts({...repayAmounts, [sale.id]: e.target.value})} 
                            style={{ marginBottom: 0, flex: '1 1 120px' }} 
                          />
                          <button onClick={() => handleRepay(sale, false)} className="btn" style={{ backgroundColor: '#f59e0b', color: 'white', flex: '1 1 auto', fontSize: '13px', padding: '10px' }}>
                            Qism to'lov
                          </button>
                          <button onClick={() => handleRepay(sale, true)} className="btn" style={{ backgroundColor: '#10b981', color: 'white', flex: '1 1 auto', fontSize: '13px', padding: '10px' }}>
                            To'liq yopish
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          ))}
        </div>
      </div>
      
      {groupedDebts.length === 0 && searchQuery && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
           Mijoz topilmadi...
        </div>
      )}

      {/* TARIX QISMI */}
      <div className="card" style={{ borderTop: '2px dashed #d1d5db', paddingTop: '20px' }}>
        <h3 style={{ fontSize: '18px', color: '#1e3a8a', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
           <History size={20} /> Mijozlar qarzi va to'lovlar tarixi
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredCustomers.map(customer => {
            const customerHistory = sales.filter(s => 
              s.customer?.toLowerCase() === customer.name?.toLowerCase() && (s.isDebt || s.wasDebt)
            );
            
            if (customerHistory.length === 0) return null;

            return (
              <div key={customer.id || customer.name} style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div 
                  onClick={() => setExpandedCustomer(expandedCustomer === customer.name ? null : customer.name)}
                  style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: expandedCustomer === customer.name ? '#f8fafc' : '#fff' }}
                >
                  <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#1e3a8a', color: '#fff', width: '35px', height: '35px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: '16px' }}>{customer.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                     {expandedCustomer === customer.name ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {expandedCustomer === customer.name && (
                  <div style={{ padding: '15px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {customerHistory.sort((a,b) => b.id - a.id).map(h => {
                        const isKv = isUsdProduct(h.productName, h.unit);
                        const currency = isKv ? '$' : "so'm";
                        const rem = h.totalSum - (h.paidAmount || 0);

                        return (
                          <div key={h.id} style={{ padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', backgroundColor: '#fff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px', marginBottom: '8px' }}>
                              <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{h.productName}</span>
                              <span style={{ fontSize: '12px', color: '#6b7280' }}>{new Date(h.id).toLocaleDateString()}</span>
                            </div>

                            <div style={{ marginBottom: '10px' }}>
                              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#4b5563', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                 <Clock size={12} /> To'lovlar xronologiyasi:
                              </div>
                              {h.paymentHistory && h.paymentHistory.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '10px', borderLeft: '2px solid #e5e7eb' }}>
                                  {h.paymentHistory.map((pay, idx) => (
                                    <div key={pay.id} style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                                      <span style={{ color: '#6b7280' }}>{idx + 1}. {new Date(pay.date).toLocaleDateString()} {new Date(pay.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                      <span style={{ color: '#059669', fontWeight: '500' }}>+{pay.amount.toLocaleString()} {currency}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>Hali to'lov qilinmagan (faqat qarz)</div>
                              )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #e5e7eb' }}>
                              <div style={{ fontSize: '13px' }}>Jami: <b>{h.totalSum.toLocaleString()}</b></div>
                              <div style={{ fontSize: '13px', color: h.isDebt ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                                {h.isDebt ? `Qolgan: ${rem.toLocaleString()} ${currency}` : '✅ To\'liq to\'langan'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Debts;