import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, Plus, Trash2, Calendar, Clock, TrendingDown, TrendingUp, 
  Users, UserPlus, Phone, DollarSign, CheckCircle, 
  ChevronRight, X, Edit, FileText, Utensils, Zap, Building, Wallet, 
  Search, AlertTriangle, ArrowRight, CornerDownRight, BarChart3
} from 'lucide-react';

import { auth, db } from "../firebase";
import { doc, setDoc, updateDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';

const Arenda = ({ arenda = [], setArenda, setPage }) => {
  // Ko'rinish rejimi: 'hub' (bosh menyu) | 'salary' | 'utilities' | 'food' | 'rent'
  const [currentView, setCurrentView] = useState('hub');

  // Ishchilar ro'yxati (Firebase `employees` kolleksiyasidan real-vaqtda sinxronlashadi)
  const [employees, setEmployees] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('app_employees') || '[]');
    } catch (e) {
      return [];
    }
  });

  // Modal oynalar holati
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState(null);
  const [payingEmployee, setPayingEmployee] = useState(null);

  // Yangi chiqim qo'shish formasi
  const [expenseType, setExpenseType] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseNote, setExpenseNote] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Yangi / Tahrirlanayotgan ishchi formasi
  const [empFullName, setEmpFullName] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empSalary, setEmpSalary] = useState('');

  // Oylik berish formasi
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Qidiruv
  const [searchQuery, setSearchQuery] = useState('');

  // =========================================================================
  // 1. FIREBASE REAL-TIME SINXRONIZATSIYA (Ishchilar barcha telefonlarda ko'rinadi)
  // =========================================================================
  useEffect(() => {
    let unsubscribeSnap = () => {};
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const storeUid = user.uid;
        const employeesRef = collection(db, "stores", storeUid, "employees");
        unsubscribeSnap = onSnapshot(employeesRef, (snapshot) => {
          const emps = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setEmployees(emps);
          localStorage.setItem('app_employees', JSON.stringify(emps));
        }, (error) => {
          console.error("Ishchilarni yuklashda xatolik:", error);
        });
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSnap();
    };
  }, []);

  // Tanlangan ishchi yangilansa, detail modali ham avtomatik yangilansin
  useEffect(() => {
    if (selectedEmployeeForDetail) {
      const updated = employees.find(e => e.id === selectedEmployeeForDetail.id);
      if (updated) setSelectedEmployeeForDetail(updated);
    }
  }, [employees]);

  // =========================================================================
  // 2. VAQT VA SANALAR MATEMATIKASI (KUNLIK, HAFTALIK, OYLIK, O'TGAN OY)
  // =========================================================================
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11
  const currentDate = now.getDate(); // 1-31

  const todayStart = new Date(currentYear, currentMonth, currentDate, 0, 0, 0, 0).getTime();
  const todayEnd = new Date(currentYear, currentMonth, currentDate, 23, 59, 59, 999).getTime();

  // Oxirgi 7 kun
  const sevenDaysAgoStart = todayStart - (6 * 24 * 60 * 60 * 1000);

  // Shu oy
  const monthStart = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0).getTime();
  const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999).getTime();
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // O'tgan oy
  const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevMonthStart = new Date(prevMonthYear, prevMonth, 1, 0, 0, 0, 0).getTime();
  const prevMonthEnd = new Date(prevMonthYear, prevMonth + 1, 0, 23, 59, 59, 999).getTime();

  // Pul formatlash
  const formatMoney = (amount) => {
    if (!amount && amount !== 0) return '0';
    return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  // Sana formatlash
  const formatDateDisplay = (timestampOrDateStr) => {
    if (!timestampOrDateStr) return '';
    const d = new Date(timestampOrDateStr);
    if (isNaN(d.getTime())) return String(timestampOrDateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${mins}`;
  };

  // Eski yozuvlarni kategoriya bo'yicha aqlli aniqlash
  const getItemCategory = (item) => {
    if (item.category) return item.category;
    const t = (item.type || '').toLowerCase();
    const n = (item.note || '').toLowerCase();
    const c = t + ' ' + n;
    if (c.includes('oylik') || c.includes('maosh') || c.includes('ishchi') || item.employeeId) return 'salary';
    if (c.includes('gaz') || c.includes('suv') || c.includes('svet') || c.includes('elektr') || c.includes('kommunal')) return 'utilities';
    if (c.includes('ovqat') || c.includes('tushlik') || c.includes('choy') || c.includes('non') || c.includes('yeb') || c.includes('osh') || c.includes('ichimlik')) return 'food';
    return 'rent';
  };

  // Statistika hisoblash funksiyasi
  const calcStatsForItems = (items) => {
    let today = 0;
    let week = 0;
    let month = 0;
    let prevMonth = 0;

    items.forEach(item => {
      const amt = Number(item.amount) || 0;
      const ts = Number(item.timestamp) || (item.date ? new Date(item.date).getTime() : 0);
      if (!ts) return;

      if (ts >= todayStart && ts <= todayEnd) today += amt;
      if (ts >= sevenDaysAgoStart && ts <= todayEnd) week += amt;
      if (ts >= monthStart && ts <= monthEnd) month += amt;
      if (ts >= prevMonthStart && ts <= prevMonthEnd) prevMonth += amt;
    });

    const diffMonth = month - prevMonth;
    return { today, week, month, prevMonth, diffMonth };
  };

  // Statistika hisoblari
  const allStats = useMemo(() => calcStatsForItems(arenda), [arenda]);
  const salaryStats = useMemo(() => calcStatsForItems(arenda.filter(i => getItemCategory(i) === 'salary')), [arenda]);
  const utilitiesStats = useMemo(() => calcStatsForItems(arenda.filter(i => getItemCategory(i) === 'utilities')), [arenda]);
  const foodStats = useMemo(() => calcStatsForItems(arenda.filter(i => getItemCategory(i) === 'food')), [arenda]);
  const rentStats = useMemo(() => calcStatsForItems(arenda.filter(i => getItemCategory(i) === 'rent')), [arenda]);

  // Hozirgi ichki sahifa statistikasi
  const currentCategoryStats = useMemo(() => {
    switch (currentView) {
      case 'salary': return salaryStats;
      case 'utilities': return utilitiesStats;
      case 'food': return foodStats;
      case 'rent': return rentStats;
      default: return allStats;
    }
  }, [currentView, allStats, salaryStats, utilitiesStats, foodStats, rentStats]);

  // Chiqimlar ro'yxati (ichki sahifa uchun)
  const currentCategoryExpenses = useMemo(() => {
    let list = arenda.filter(item => getItemCategory(item) === currentView);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => 
        (item.type && item.type.toLowerCase().includes(q)) || 
        (item.note && item.note.toLowerCase().includes(q)) ||
        (item.date && item.date.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [arenda, currentView, searchQuery]);

  // Ishchilar ro'yxati qidiruv bilan
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const q = searchQuery.toLowerCase().trim();
    return employees.filter(emp => 
      (emp.name && emp.name.toLowerCase().includes(q)) ||
      (emp.phone && emp.phone.toLowerCase().includes(q))
    );
  }, [employees, searchQuery]);

  // So'nggi 5 ta xarajat (Bosh menyuda ko'rsatish uchun)
  const recentExpenses = useMemo(() => {
    return [...arenda].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 5);
  }, [arenda]);

  // =========================================================================
  // 3. ISHCHI HISOBLARI (KUNLIK STAVKA, TO'LANGAN OYLIK, QARZ / AVANS)
  // =========================================================================
  const getEmployeeCalculations = (emp) => {
    const salary = Number(emp.salary) || 0;
    // Kunlik stavka: Bir oyning kuniga bo'lganda ular kuniga qancha pul topayotgani
    const dailyRate = Math.round(salary / daysInCurrentMonth);

    // Shu oyda ishchiga to'langan jami summa
    const payments = emp.payments || [];
    const thisMonthPayments = payments.filter(p => {
      const ts = p.timestamp || (p.date ? new Date(p.date).getTime() : 0);
      return ts >= monthStart && ts <= monthEnd;
    });

    const paidThisMonth = thisMonthPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Bugungi kungacha ishlangan kunlar
    const workedDaysThisMonth = currentDate;
    // Bugungi kungacha ishlab topgan haqi
    const earnedTillToday = dailyRate * workedDaysThisMonth;

    // Oy oxirigacha umumiy qoldiq oylik
    const remainingMonthSalary = salary - paidThisMonth;

    // Bugungi kunga nisbatan balans (kunlik hisob bo'yicha)
    const balanceTillToday = earnedTillToday - paidThisMonth;

    let isFullyPaid = false;
    let advanceAmount = 0;
    let advanceDays = 0;
    let debtDays = 0;
    let statusText = '';
    let statusType = 'normal'; // 'debt' | 'advance' | 'exact'

    if (paidThisMonth > salary) {
      isFullyPaid = true;
      advanceAmount = paidThisMonth - salary;
      advanceDays = dailyRate > 0 ? Math.round(advanceAmount / dailyRate) : 0;
      statusType = 'advance';
      statusText = `Nargi oyning ${formatMoney(advanceAmount)} so'm puli (${advanceDays} kunlik) oldindan to'langan!`;
    } else if (paidThisMonth === salary) {
      isFullyPaid = true;
      statusType = 'exact';
      statusText = `Shu oylik maosh to'liq yopilgan.`;
    } else {
      if (balanceTillToday > 0) {
        debtDays = dailyRate > 0 ? Math.ceil(balanceTillToday / dailyRate) : 0;
        statusType = 'debt';
        statusText = `Bugungi kungacha ${debtDays} kunlik (${formatMoney(balanceTillToday)} so'm) qarzimiz bor.`;
      } else {
        const advToday = Math.abs(balanceTillToday);
        const advDays = dailyRate > 0 ? Math.round(advToday / dailyRate) : 0;
        statusType = 'advance';
        statusText = `Bugungi kungacha to'langan (${advDays} kunlik avans berilgan).`;
      }
    }

    return {
      salary,
      dailyRate,
      paidThisMonth,
      remainingMonthSalary,
      earnedTillToday,
      balanceTillToday,
      isFullyPaid,
      advanceAmount,
      advanceDays,
      debtDays,
      statusText,
      statusType,
      paymentsCount: payments.length
    };
  };

  // =========================================================================
  // 4. CHIQIMLARNI QO'SHISH VA O'CHIRISH
  // =========================================================================
  const handleAmountInput = (val, setter) => {
    const raw = val.replace(/\s/g, '').replace(/[^\d]/g, '');
    setter(formatMoney(raw));
  };

  const handleOpenAddExpense = () => {
    setExpenseType('');
    setExpenseAmount('');
    setExpenseNote('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setShowAddExpenseModal(true);
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    const cleanAmount = parseFloat(expenseAmount.replace(/\s/g, ''));
    if (!expenseType.trim() || isNaN(cleanAmount) || cleanAmount <= 0) {
      alert("Iltimos, chiqim nomi va summasini to'g'ri kiriting!");
      return;
    }

    const nowTs = Date.now();
    const selectedDateTs = expenseDate ? new Date(expenseDate).getTime() : nowTs;
    const finalDateObj = new Date(selectedDateTs);
    finalDateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    const newExpense = {
      id: nowTs,
      type: expenseType.trim(),
      amount: cleanAmount,
      note: expenseNote.trim(),
      category: currentView === 'hub' ? 'utilities' : currentView,
      date: expenseDate || now.toLocaleDateString(),
      timestamp: finalDateObj.getTime()
    };

    setArenda([newExpense, ...arenda]);
    setShowAddExpenseModal(false);

    if (auth.currentUser) {
      try {
        const storeUid = auth.currentUser.uid;
        await setDoc(doc(db, "stores", storeUid, "arenda", newExpense.id.toString()), newExpense);
      } catch (err) {
        console.error("Chiqimni saqlashda xato:", err);
      }
    }
  };

  const handleDeleteExpense = async (id, employeeId = null, paymentId = null) => {
    if (!window.confirm("Rostan ham ushbu chiqimni o'chirmoqchimisiz?")) return;

    setArenda(arenda.filter(i => i.id !== id));

    if (auth.currentUser) {
      try {
        const storeUid = auth.currentUser.uid;
        await deleteDoc(doc(db, "stores", storeUid, "arenda", id.toString()));

        if (employeeId) {
          const emp = employees.find(e => e.id === employeeId);
          if (emp && emp.payments) {
            const updatedPayments = emp.payments.filter(p => p.id !== paymentId && p.id !== id);
            await updateDoc(doc(db, "stores", storeUid, "employees", employeeId), {
              payments: updatedPayments
            });
          }
        }
      } catch (err) {
        console.error("Chiqimni o'chirishda xatolik:", err);
      }
    }
  };

  // =========================================================================
  // 5. ISHCHINI QO'SHISH, TAHRIRLASH VA O'CHIRISH
  // =========================================================================
  const handleOpenAddEmployee = () => {
    setEditingEmployee(null);
    setEmpFullName('');
    setEmpPhone('');
    setEmpSalary('');
    setShowAddEmployeeModal(true);
  };

  const handleOpenEditEmployee = (emp, e) => {
    if (e) e.stopPropagation();
    setEditingEmployee(emp);
    setEmpFullName(emp.name || '');
    setEmpPhone(emp.phone || '');
    setEmpSalary(formatMoney(emp.salary || ''));
    setShowAddEmployeeModal(true);
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    const cleanSalary = parseFloat(empSalary.replace(/\s/g, ''));
    if (!empFullName.trim() || isNaN(cleanSalary) || cleanSalary < 0) {
      alert("Iltimos, ishchining ism-familiyasi va oylik summasini to'g'ri kiriting!");
      return;
    }

    const nowTs = Date.now();
    const empData = {
      name: empFullName.trim(),
      phone: empPhone.trim(),
      salary: cleanSalary,
      updatedAt: nowTs
    };

    let updatedEmployees = [];
    let empId = '';

    if (editingEmployee) {
      empId = editingEmployee.id;
      updatedEmployees = employees.map(emp => emp.id === empId ? { ...emp, ...empData } : emp);
    } else {
      empId = `emp_${nowTs}`;
      const newEmp = {
        id: empId,
        ...empData,
        createdAt: nowTs,
        payments: []
      };
      updatedEmployees = [newEmp, ...employees];
    }

    setEmployees(updatedEmployees);
    setShowAddEmployeeModal(false);
    setEditingEmployee(null);

    if (auth.currentUser) {
      try {
        const storeUid = auth.currentUser.uid;
        await setDoc(doc(db, "stores", storeUid, "employees", empId), empData, { merge: true });
      } catch (err) {
        console.error("Ishchini saqlashda xato:", err);
      }
    }
  };

  const handleDeleteEmployee = async (empId, empName, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Rostan ham "${empName}" ismli ishchini o'chirmoqchimisiz?`)) return;

    setEmployees(employees.filter(emp => emp.id !== empId));
    if (selectedEmployeeForDetail && selectedEmployeeForDetail.id === empId) {
      setSelectedEmployeeForDetail(null);
    }

    if (auth.currentUser) {
      try {
        const storeUid = auth.currentUser.uid;
        await deleteDoc(doc(db, "stores", storeUid, "employees", empId));
      } catch (err) {
        console.error("Ishchini o'chirishda xatolik:", err);
      }
    }
  };

  // =========================================================================
  // 6. ISHCHIGA OYLIK BERISH
  // =========================================================================
  const handleOpenPayModal = (emp, e) => {
    if (e) e.stopPropagation();
    setPayingEmployee(emp);
    setPayAmount('');
    setPayNote('');
    setPayDate(new Date().toISOString().split('T')[0]);
  };

  const handleConfirmSalaryPayment = async (e) => {
    e.preventDefault();
    if (!payingEmployee) return;

    const cleanAmount = parseFloat(payAmount.replace(/\s/g, ''));
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      alert("Iltimos, to'lov summasini to'g'ri kiriting!");
      return;
    }

    const empCalc = getEmployeeCalculations(payingEmployee);
    const newTotalPaid = empCalc.paidThisMonth + cleanAmount;
    
    // Foydalanuvchi talabi: Agar summa ishchini oyligidan ko'p bo'lsa nargi oy pulini to'ladingiz desin
    if (newTotalPaid > empCalc.salary) {
      const excess = newTotalPaid - empCalc.salary;
      const excessDays = empCalc.dailyRate > 0 ? Math.round(excess / empCalc.dailyRate) : 0;
      const confirmAdv = window.confirm(
        `DIQQAT!\nBu to'lov bilan ishchining shu oylik maoshidan (${formatMoney(empCalc.salary)} so'm) oshib ketadi!\n\n` +
        `Nargi oyning ${formatMoney(excess)} so'm pulini (${excessDays} kunlik avans) ham to'lamoqdasiz.\n\n` +
        `To'lovni tasdiqlaysizmi?`
      );
      if (!confirmAdv) return;
    }

    const nowTs = Date.now();
    const payDateObj = payDate ? new Date(payDate) : new Date();
    payDateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    const finalTimestamp = payDateObj.getTime();

    const paymentRecord = {
      id: nowTs,
      amount: cleanAmount,
      date: payDate || now.toLocaleDateString(),
      timestamp: finalTimestamp,
      note: payNote.trim() || `Oylik to'lovi`
    };

    const updatedPayments = [paymentRecord, ...(payingEmployee.payments || [])];
    const updatedEmployees = employees.map(emp => 
      emp.id === payingEmployee.id ? { ...emp, payments: updatedPayments } : emp
    );
    setEmployees(updatedEmployees);

    const salaryExpense = {
      id: nowTs,
      type: `Oylik: ${payingEmployee.name}`,
      amount: cleanAmount,
      note: payNote.trim() || `${payDate} sanasidagi ish haqi`,
      category: 'salary',
      employeeId: payingEmployee.id,
      paymentId: paymentRecord.id,
      date: payDate || now.toLocaleDateString(),
      timestamp: finalTimestamp
    };

    setArenda([salaryExpense, ...arenda]);
    setPayingEmployee(null);

    if (auth.currentUser) {
      try {
        const storeUid = auth.currentUser.uid;
        await updateDoc(doc(db, "stores", storeUid, "employees", payingEmployee.id), {
          payments: updatedPayments
        });
        await setDoc(doc(db, "stores", storeUid, "arenda", salaryExpense.id.toString()), salaryExpense);
      } catch (err) {
        console.error("Oylik to'lovini saqlashda xato:", err);
      }
    }
  };

  const handleDeleteSinglePayment = async (empId, paymentId) => {
    if (!window.confirm("Ushbu to'lovni bekor qilmoqchimisiz? Chiqimlardan ham o'chiriladi.")) return;

    const emp = employees.find(e => e.id === empId);
    if (!emp) return;

    const updatedPayments = (emp.payments || []).filter(p => p.id !== paymentId);
    setEmployees(employees.map(e => e.id === empId ? { ...e, payments: updatedPayments } : e));
    setArenda(arenda.filter(a => a.id !== paymentId && a.paymentId !== paymentId));

    if (auth.currentUser) {
      try {
        const storeUid = auth.currentUser.uid;
        await updateDoc(doc(db, "stores", storeUid, "employees", empId), {
          payments: updatedPayments
        });
        await deleteDoc(doc(db, "stores", storeUid, "arenda", paymentId.toString()));
      } catch (err) {
        console.error("To'lovni o'chirishda xatolik:", err);
      }
    }
  };

  // Kategoriya ma'lumotlari
  const categoryConfig = {
    salary: {
      title: "Ishchilar Oyligi",
      subtitle: `${employees.length} nafar ishchi ro'yxatda`,
      icon: <Users size={24} color="#ffffff" />,
      bgIcon: <Users size={90} />,
      color: "#2563eb",
      lightBg: "#eff6ff",
      addBtnText: "Yangi Ishchi Qo'shish"
    },
    utilities: {
      title: "Suv, Gaz, Svet",
      subtitle: "Elektr, gaz, suv va boshqa kommunal",
      icon: <Zap size={24} color="#ffffff" />,
      bgIcon: <Zap size={90} />,
      color: "#d97706",
      lightBg: "#fffbeb",
      addBtnText: "Kommunal Chiqim Yozish"
    },
    food: {
      title: "Ovqatlanish (Yeb-ichar)",
      subtitle: "Tushlik, choyxona va oziq-ovqat xarajatlari",
      icon: <Utensils size={24} color="#ffffff" />,
      bgIcon: <Utensils size={90} />,
      color: "#dc2626",
      lightBg: "#fef2f2",
      addBtnText: "Ovqat Chiqimi Yozish"
    },
    rent: {
      title: "Arenda & Boshqa Chiqimlar",
      subtitle: "Do'kon ijarasi, transport va xo'jalik",
      icon: <Building size={24} color="#ffffff" />,
      bgIcon: <Building size={90} />,
      color: "#7c3aed",
      lightBg: "#f5f3ff",
      addBtnText: "Arenda Chiqimi Yozish"
    }
  };

  return (
    <div className="fade-in" style={{ width: '100%', maxWidth: '100%', margin: '0', padding: '0 0 120px 0', boxSizing: 'border-box' }}>
      
      {/* Maxsus Mobil va Dark Mode CSS */}
      <style>{`
        .touch-card {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          -webkit-tap-highlight-color: transparent;
          width: 100% !important;
          box-sizing: border-box !important;
        }
        .touch-card:active {
          transform: scale(0.98);
        }
        .arenda-subcard {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          box-sizing: border-box !important;
        }
        body.dark-mode .arenda-subcard {
          background-color: #1e293b !important;
          border-color: #334155 !important;
        }
        body.dark-mode .touch-card {
          background-color: #1e293b !important;
          border-color: #334155 !important;
        }
        .arenda-header-row {
          padding: 0 2px;
        }
      `}</style>

      {/* ================================================================= */}
      {/* 1. ASOSIY KATEGORIYALAR MENYUSI (HUB REJIMI) */}
      {/* ================================================================= */}
      {currentView === 'hub' ? (
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
          {/* Sarlavha qismi */}
          <div className="arenda-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button 
                onClick={() => setPage('dashboard')} 
                style={{ 
                  border: 'none', background: '#ffffff', width: '42px', height: '42px', 
                  borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', color: '#1e3a8a'
                }}
              >
                <ArrowLeft size={22} />
              </button>
              <div>
                <h1 style={{ margin: 0, fontSize: '19px', fontWeight: '800', color: '#1e3a8a' }}>
                  Arenda va Chiqimlar
                </h1>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
                  Bo'limni tanlang va ichiga kiring
                </span>
              </div>
            </div>
          </div>

          {/* KATTA STATISTIKA KARTASI (Tepada 3-4 kategoriya yig'indisi) */}
          <div className="card" style={{ 
            width: '100%', boxSizing: 'border-box',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)', 
            color: '#ffffff', borderRadius: '16px', padding: '18px 16px', marginBottom: '16px', 
            boxShadow: '0 8px 25px rgba(30, 58, 138, 0.25)', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', right: '-15px', top: '-15px', opacity: 0.08, transform: 'rotate(15deg)' }}>
              <Wallet size={180} />
            </div>

            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', opacity: 0.85, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} /> Shu oy jami barcha chiqimlar
            </div>
            
            <div style={{ fontSize: '32px', fontWeight: '900', marginTop: '6px', letterSpacing: '-0.5px' }}>
              {formatMoney(allStats.month)} <span style={{ fontSize: '18px', fontWeight: '600', opacity: 0.85 }}>so'm</span>
            </div>

            {/* O'tgan oy bilan taqqoslash (ko'p / kam) */}
            <div style={{ 
              marginTop: '15px', background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(10px)', 
              padding: '10px 14px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', 
              alignItems: 'center', flexWrap: 'wrap', gap: '8px' 
            }}>
              <span style={{ fontSize: '12px', opacity: 0.9 }}>O'tgan oyga nisbatan:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {allStats.diffMonth > 0 ? (
                  <span style={{ background: '#ef4444', color: 'white', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TrendingUp size={14} /> +{formatMoney(allStats.diffMonth)} ko'p
                  </span>
                ) : allStats.diffMonth < 0 ? (
                  <span style={{ background: '#10b981', color: 'white', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TrendingDown size={14} /> -{formatMoney(Math.abs(allStats.diffMonth))} kam
                  </span>
                ) : (
                  <span style={{ fontSize: '12px', opacity: 0.9 }}>O'tgan oy bilan teng</span>
                )}
              </div>
            </div>

            <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '8px', textAlign: 'right' }}>
              O'tgan oygi jami: {formatMoney(allStats.prevMonth)} so'm
            </div>
          </div>

          {/* KATEGORIYALAR RO'YXATI (Telefonda alohida ichiga kiriladigan kartalar) */}
          <div style={{ marginBottom: '10px' }}>
            <h3 style={{ margin: '0 0 12px 4px', fontSize: '15px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Kategoriyalar
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', width: '100%', boxSizing: 'border-box' }}>
            
            {/* 1. ISHCHILAR OYLIGI KARTASI */}
            <div 
              onClick={() => { setCurrentView('salary'); setSearchQuery(''); }}
              className="card touch-card"
              style={{ 
                padding: '15px 14px', borderRadius: '16px', cursor: 'pointer', display: 'flex', 
                alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e8f0', 
                boxShadow: '0 3px 10px rgba(0,0,0,0.03)', position: 'relative', overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(37,99,235,0.25)', flexShrink: 0 }}>
                  <Users size={24} color="#ffffff" />
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
                    Ishchilar Oyligi
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    {employees.length} nafar ishchi | Kunlik stavka va avanslar
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#2563eb', marginTop: '4px' }}>
                    Shu oy: {formatMoney(salaryStats.month)} so'm
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8' }}>
                <ChevronRight size={22} />
              </div>
            </div>

            {/* 2. SUV, GAZ, SVET KARTASI */}
            <div 
              onClick={() => { setCurrentView('utilities'); setSearchQuery(''); }}
              className="card touch-card"
              style={{ 
                padding: '15px 14px', borderRadius: '16px', cursor: 'pointer', display: 'flex', 
                alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e8f0', 
                boxShadow: '0 3px 10px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(217,119,6,0.25)', flexShrink: 0 }}>
                  <Zap size={24} color="#ffffff" />
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
                    Suv, Gaz, Svet
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Elektr, gaz, suv va kommunal chiqimlar
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#d97706', marginTop: '4px' }}>
                    Shu oy: {formatMoney(utilitiesStats.month)} so'm
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8' }}>
                <ChevronRight size={22} />
              </div>
            </div>

            {/* 3. OVQATLANISH KARTASI */}
            <div 
              onClick={() => { setCurrentView('food'); setSearchQuery(''); }}
              className="card touch-card"
              style={{ 
                padding: '15px 14px', borderRadius: '16px', cursor: 'pointer', display: 'flex', 
                alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e8f0', 
                boxShadow: '0 3px 10px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(220,38,38,0.25)', flexShrink: 0 }}>
                  <Utensils size={24} color="#ffffff" />
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
                    Ovqatlanish (Yeb-ichar)
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Tushlik, choyxona va oziq-ovqat zametkalari
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#dc2626', marginTop: '4px' }}>
                    Shu oy: {formatMoney(foodStats.month)} so'm
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8' }}>
                <ChevronRight size={22} />
              </div>
            </div>

            {/* 4. ARENDA & BOSHQALAR KARTASI */}
            <div 
              onClick={() => { setCurrentView('rent'); setSearchQuery(''); }}
              className="card touch-card"
              style={{ 
                padding: '15px 14px', borderRadius: '16px', cursor: 'pointer', display: 'flex', 
                alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e8f0', 
                boxShadow: '0 3px 10px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(124,58,237,0.25)', flexShrink: 0 }}>
                  <Building size={24} color="#ffffff" />
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
                    Arenda & Boshqa Chiqimlar
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Do'kon ijarasi, transport, xaridlar
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#7c3aed', marginTop: '4px' }}>
                    Shu oy: {formatMoney(rentStats.month)} so'm
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8' }}>
                <ChevronRight size={22} />
              </div>
            </div>

          </div>

          {/* OXIRGI CHIQIMLAR TASMASI (RECENT EXPENSES) */}
          {recentExpenses.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 12px 4px', fontSize: '14px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                So'nggi Chiqimlar
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
                {recentExpenses.map(item => (
                  <div key={item.id} className="card" style={{ padding: '12px 14px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>{item.type}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                        {formatDateDisplay(item.timestamp || item.date)} {item.note ? `| ${item.note}` : ''}
                      </div>
                    </div>
                    <div style={{ fontWeight: '800', color: '#b91c1c', fontSize: '15px' }}>
                      -{formatMoney(item.amount)} so'm
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ================================================================= */
        /* 2. KATEGORIYA ICHIGA KIRGANDA (KATEGORIYA SAHIFASI) */
        /* ================================================================= */
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
          {/* Ichki sahifa sarlavhasi va orqaga tugmasi */}
          <div className="arenda-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button 
                onClick={() => { setCurrentView('hub'); setSearchQuery(''); }}
                style={{ 
                  border: 'none', background: '#ffffff', width: '42px', height: '42px', 
                  borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', color: '#1e3a8a'
                }}
              >
                <ArrowLeft size={22} />
              </button>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>
                  {categoryConfig[currentView]?.title}
                </h2>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  {categoryConfig[currentView]?.subtitle}
                </span>
              </div>
            </div>

            {/* "+ Qo'shish" tugmasi */}
            {currentView === 'salary' ? (
              <button 
                onClick={handleOpenAddEmployee}
                className="btn btn-primary"
                style={{ width: 'auto', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold' }}
              >
                <UserPlus size={16} /> Ishchi
              </button>
            ) : (
              <button 
                onClick={handleOpenAddExpense}
                className="btn btn-primary"
                style={{ width: 'auto', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold' }}
              >
                <Plus size={16} /> Chiqim
              </button>
            )}
          </div>

          {/* O'SHA KATEGORIYANING STATISTIKASI (1 kun, 1 hafta, 1 oy va o'tgan oydan farqi) */}
          <div style={{ 
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '8px', marginBottom: '14px', width: '100%', boxSizing: 'border-box' 
          }}>
            <div className="card" style={{ padding: '12px 10px', borderRadius: '14px', borderLeft: '4px solid #3b82f6', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={13} color="#3b82f6" /> BUGUN (1 kunda)
              </div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', marginTop: '3px' }}>
                {formatMoney(currentCategoryStats.today)} <span style={{ fontSize: '10px', color: '#64748b' }}>so'm</span>
              </div>
            </div>

            <div className="card" style={{ padding: '12px 10px', borderRadius: '14px', borderLeft: '4px solid #f59e0b', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={13} color="#f59e0b" /> 1 HAFTADA (7 kun)
              </div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', marginTop: '3px' }}>
                {formatMoney(currentCategoryStats.week)} <span style={{ fontSize: '10px', color: '#64748b' }}>so'm</span>
              </div>
            </div>

            <div className="card" style={{ padding: '12px 10px', borderRadius: '14px', borderLeft: '4px solid #10b981', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <BarChart3 size={13} color="#10b981" /> 1 OYDA (Shu oy)
              </div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', marginTop: '3px' }}>
                {formatMoney(currentCategoryStats.month)} <span style={{ fontSize: '10px', color: '#64748b' }}>so'm</span>
              </div>
            </div>

            <div className="card" style={{ padding: '12px 10px', borderRadius: '14px', borderLeft: currentCategoryStats.diffMonth > 0 ? '4px solid #ef4444' : '4px solid #10b981', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {currentCategoryStats.diffMonth > 0 ? <TrendingUp size={13} color="#ef4444" /> : <TrendingDown size={13} color="#10b981" />} O'TGAN OYDAN
              </div>
              <div style={{ fontSize: '14px', fontWeight: '800', marginTop: '3px', color: currentCategoryStats.diffMonth > 0 ? '#dc2626' : '#16a34a' }}>
                {currentCategoryStats.diffMonth > 0 ? `+${formatMoney(currentCategoryStats.diffMonth)} ko'p` : currentCategoryStats.diffMonth < 0 ? `-${formatMoney(Math.abs(currentCategoryStats.diffMonth))} kam` : "Teng"}
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>
                O'tgan oy: {formatMoney(currentCategoryStats.prevMonth)} so'm
              </div>
            </div>
          </div>

          {/* QIDIRUV MAYDONI */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <input 
              type="text" 
              className="form-control"
              placeholder={currentView === 'salary' ? "Ishchi ismi yoki telefoni..." : "Qidirish (nomi yoki zametkasi)..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '42px', marginBottom: '0', height: '46px', fontSize: '14px' }}
            />
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* =============================================================== */}
          {/* ICHKI TARKIB: ISHCHILAR OYLIGI REJIMI */}
          {/* =============================================================== */}
          {currentView === 'salary' ? (
            <div>
              {filteredEmployees.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '35px 20px', color: '#94a3b8' }}>
                  <Users size={44} style={{ opacity: 0.3, marginBottom: '8px' }} />
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '16px' }}>Ishchilar topilmadi</h4>
                  <p style={{ fontSize: '13px', margin: '0 0 15px 0' }}>Boshlash uchun yangi ishchi qo'shing.</p>
                  <button onClick={handleOpenAddEmployee} className="btn btn-primary" style={{ width: 'auto', margin: '0 auto', padding: '10px 22px' }}>
                    + Ishchi qo'shish
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
                  {filteredEmployees.map(emp => {
                    const calc = getEmployeeCalculations(emp);

                    return (
                      <div 
                        key={emp.id} 
                        className="card touch-card"
                        onClick={() => setSelectedEmployeeForDetail(emp)}
                        style={{ 
                          padding: '14px', borderRadius: '16px', cursor: 'pointer', 
                          border: '1px solid #e2e8f0', boxShadow: '0 3px 10px rgba(0,0,0,0.03)',
                          width: '100%', boxSizing: 'border-box'
                        }}
                      >
                        {/* Ism, Telefon, Tahrirlash/O'chirish */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <div>
                            <div style={{ fontSize: '17px', fontWeight: '800', color: '#1e293b' }}>
                              {emp.name}
                            </div>
                            {emp.phone && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                                <Phone size={13} /> {emp.phone}
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                            <button 
                              onClick={(e) => handleOpenEditEmployee(emp, e)}
                              style={{ border: 'none', background: '#f1f5f9', color: '#475569', width: '34px', height: '34px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={(e) => handleDeleteEmployee(emp.id, emp.name, e)}
                              style={{ border: 'none', background: '#fee2e2', color: '#dc2626', width: '34px', height: '34px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Oylik va kunlik topayotgan puli */}
                        <div className="arenda-subcard" style={{ padding: '10px 14px', borderRadius: '12px', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>Oylik maoshi:</span>
                            <span style={{ fontWeight: '800', color: '#1e3a8a', fontSize: '14px' }}>{formatMoney(calc.salary)} so'm</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>Kunlik topayotgan puli:</span>
                            <span style={{ fontWeight: '700', color: '#10b981', fontSize: '13px' }}>~{formatMoney(calc.dailyRate)} so'm/kun</span>
                          </div>
                        </div>

                        {/* Shu oy to'langan summa */}
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                            <span style={{ color: '#475569', fontWeight: '600' }}>Shu oy to'landi:</span>
                            <span style={{ fontWeight: '800', color: calc.paidThisMonth >= calc.salary ? '#16a34a' : '#1e293b' }}>
                              {formatMoney(calc.paidThisMonth)} so'm
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ 
                              width: `${Math.min(100, calc.salary > 0 ? (calc.paidThisMonth / calc.salary) * 100 : 0)}%`, 
                              height: '100%', 
                              backgroundColor: calc.paidThisMonth > calc.salary ? '#3b82f6' : calc.paidThisMonth === calc.salary ? '#10b981' : '#f59e0b'
                            }} />
                          </div>
                        </div>

                        {/* Qarz yoki Avans holati */}
                        <div style={{ 
                          padding: '8px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', marginBottom: '12px',
                          backgroundColor: calc.statusType === 'debt' ? '#fff1f2' : calc.statusType === 'advance' ? '#eff6ff' : '#f0fdf4',
                          color: calc.statusType === 'debt' ? '#be123c' : calc.statusType === 'advance' ? '#1d4ed8' : '#15803d',
                          border: `1px solid ${calc.statusType === 'debt' ? '#fecdd3' : calc.statusType === 'advance' ? '#bfdbfe' : '#bbf7d0'}`
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {calc.statusType === 'debt' ? <AlertTriangle size={15} /> : <CheckCircle size={15} />}
                            <span>{calc.statusText}</span>
                          </div>
                        </div>

                        {/* "Oylik berish" tugmasi */}
                        <button 
                          onClick={(e) => handleOpenPayModal(emp, e)}
                          className="btn btn-primary"
                          style={{ 
                            width: '100%', padding: '12px', display: 'flex', alignItems: 'center', 
                            justifyContent: 'center', gap: '8px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold' 
                          }}
                        >
                          <DollarSign size={17} /> Oylik / Avans Berish
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* =============================================================== */
            /* ICHKI TARKIB: BOSHQA KATEGORIYALAR (OVQAT, KOMMUNAL, ARENDA) */
            /* =============================================================== */
            <div>
              {currentCategoryExpenses.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '35px 20px', color: '#94a3b8' }}>
                  <FileText size={44} style={{ opacity: 0.3, marginBottom: '8px' }} />
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '16px' }}>Hozircha chiqim yozilmagan</h4>
                  <p style={{ fontSize: '13px', margin: '0 0 15px 0' }}>Yangi chiqim kiritish uchun yuqoridagi tugmani bosing.</p>
                  <button onClick={handleOpenAddExpense} className="btn btn-primary" style={{ width: 'auto', margin: '0 auto', padding: '10px 22px' }}>
                    + Chiqim yozish
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
                  {currentCategoryExpenses.map(item => (
                    <div 
                      key={item.id} 
                      className="card"
                      style={{ 
                        padding: '12px 14px', borderRadius: '14px', display: 'flex', 
                        justifyContent: 'space-between', alignItems: 'center', gap: '10px',
                        border: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '15px' }}>
                          {item.type}
                        </div>
                        {/* Zametka / Izoh */}
                        {item.note && (
                          <div style={{ fontSize: '12px', color: '#475569', marginTop: '3px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <FileText size={13} color="#64748b" style={{ flexShrink: 0 }} />
                            <span>{item.note}</span>
                          </div>
                        )}
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                          {formatDateDisplay(item.timestamp || item.date)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: '900', color: '#b91c1c', fontSize: '16px' }}>
                            -{formatMoney(item.amount)}
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '3px' }}>so'm</span>
                        </div>
                        <button 
                          onClick={() => handleDeleteExpense(item.id, item.employeeId, item.paymentId)}
                          style={{ border: 'none', background: '#fee2e2', color: '#dc2626', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* 3. MODAL: ISHCHINING BATAFSIL KO'RINISHI VA TO'LOVLAR TARIXI */}
      {/* ================================================================= */}
      {selectedEmployeeForDetail && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px'
        }}>
          <div className="card fade-in" style={{ maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '22px', borderRadius: '20px' }}>
            {(() => {
              const calc = getEmployeeCalculations(selectedEmployeeForDetail);
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                    <div>
                      <h3 style={{ margin: 0, color: '#1e3a8a', fontSize: '19px', fontWeight: '800' }}>
                        {selectedEmployeeForDetail.name}
                      </h3>
                      {selectedEmployeeForDetail.phone && (
                        <a 
                          href={`tel:${selectedEmployeeForDetail.phone}`} 
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#2563eb', fontSize: '13px', marginTop: '4px', textDecoration: 'none', fontWeight: 'bold' }}
                        >
                          <Phone size={13} /> {selectedEmployeeForDetail.phone}
                        </a>
                      )}
                    </div>
                    <button 
                      onClick={() => setSelectedEmployeeForDetail(null)}
                      style={{ border: 'none', background: '#f1f5f9', color: '#475569', width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Ko'rsatkichlar */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '12px' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>Belgilangan Oylik</span>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: '#1e3a8a', marginTop: '2px' }}>
                        {formatMoney(calc.salary)} so'm
                      </div>
                    </div>
                    <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '12px' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>Kuniga topayotgan puli</span>
                      <div style={{ fontSize: '16px', fontWeight: '900', color: '#15803d', marginTop: '2px' }}>
                        ~{formatMoney(calc.dailyRate)} so'm
                      </div>
                    </div>
                  </div>

                  {/* Holat kartochkasi */}
                  <div style={{ 
                    padding: '12px', borderRadius: '12px', marginBottom: '16px',
                    backgroundColor: calc.statusType === 'debt' ? '#fff1f2' : calc.statusType === 'advance' ? '#eff6ff' : '#f0fdf4',
                    border: `1px solid ${calc.statusType === 'debt' ? '#fecdd3' : calc.statusType === 'advance' ? '#bfdbfe' : '#bbf7d0'}`
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: calc.statusType === 'debt' ? '#be123c' : calc.statusType === 'advance' ? '#1d4ed8' : '#15803d' }}>
                      {calc.statusText}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      - Shu oyda berildi: <b>{formatMoney(calc.paidThisMonth)} so'm</b><br />
                      - Qolgan oylik: <b>{calc.remainingMonthSalary > 0 ? `${formatMoney(calc.remainingMonthSalary)} so'm` : "To'liq yopilgan"}</b>
                    </div>
                  </div>

                  {/* Oylik berish tugmasi */}
                  <button 
                    onClick={() => handleOpenPayModal(selectedEmployeeForDetail)}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '12px', marginBottom: '18px', fontSize: '15px' }}
                  >
                    <DollarSign size={18} /> Oylik / Avans Berish
                  </button>

                  {/* To'lovlar Tarixi */}
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={15} color="#1e3a8a" /> To'lovlar Tarixi ({calc.paymentsCount})
                  </h4>

                  {(!selectedEmployeeForDetail.payments || selectedEmployeeForDetail.payments.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '15px', color: '#94a3b8', fontSize: '13px' }}>
                      To'lovlar tarixi yo'q.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                      {selectedEmployeeForDetail.payments.map(p => (
                        <div key={p.id} className="arenda-subcard" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '10px' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', color: '#15803d', fontSize: '14px' }}>
                              +{formatMoney(p.amount)} so'm
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              {p.date || formatDateDisplay(p.timestamp)} | {p.note || 'Oylik to\'lovi'}
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDeleteSinglePayment(selectedEmployeeForDetail.id, p.id)}
                            style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                            title="Bekor qilish"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 4. MODAL: OYLIK BERISH FORMASI */}
      {/* ================================================================= */}
      {payingEmployee && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          zIndex: 999999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px'
        }}>
          <div className="card fade-in" style={{ maxWidth: '420px', width: '100%', padding: '22px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, color: '#1e3a8a', fontSize: '18px', fontWeight: '800' }}>
                Oylik / Avans Berish
              </h3>
              <button 
                onClick={() => setPayingEmployee(null)}
                style={{ border: 'none', background: '#f1f5f9', color: '#475569', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="arenda-subcard" style={{ padding: '12px', borderRadius: '12px', marginBottom: '14px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#1e293b' }}>{payingEmployee.name}</div>
              {(() => {
                const calc = getEmployeeCalculations(payingEmployee);
                return (
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                    Oylik: <b>{formatMoney(calc.salary)}</b> | Shu oy to'langan: <b>{formatMoney(calc.paidThisMonth)}</b>
                  </div>
                );
              })()}
            </div>

            <form onSubmit={handleConfirmSalaryPayment}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>
                  Berilayotgan Summa (so'mda) *
                </label>
                <input 
                  type="text"
                  className="form-control"
                  placeholder="Masalan: 2 000 000"
                  value={payAmount}
                  onChange={e => handleAmountInput(e.target.value, setPayAmount)}
                  required
                  autoFocus
                  style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e3a8a' }}
                />
              </div>

              {/* Dinamik ogohlantirish (User talabi: agar summa ishchini oyligidan ko'p bo'lsa nargi oy pulini to'ladingiz desin) */}
              {(() => {
                const clean = parseFloat(payAmount.replace(/\s/g, '')) || 0;
                const calc = getEmployeeCalculations(payingEmployee);
                const newTotal = calc.paidThisMonth + clean;
                if (clean > 0 && newTotal > calc.salary) {
                  const excess = newTotal - calc.salary;
                  const excessDays = calc.dailyRate > 0 ? Math.round(excess / calc.dailyRate) : 0;
                  return (
                    <div style={{ 
                      backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', 
                      borderRadius: '10px', padding: '10px 12px', marginBottom: '12px', color: '#1d4ed8', fontSize: '12px', fontWeight: 'bold',
                      display: 'flex', alignItems: 'flex-start', gap: '8px'
                    }}>
                      <AlertTriangle size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: '1px' }} />
                      <span>
                        Diqqat: Bu to'lov ishchining oyligidan oshadi! Nargi oyning <u>{formatMoney(excess)} so'm</u> ({excessDays} kunlik) pulini ham to'lamoqdasiz.
                      </span>
                    </div>
                  );
                }
                return null;
              })()}

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>
                  To'lov Sanasi
                </label>
                <input 
                  type="date"
                  className="form-control"
                  value={payDate}
                  onChange={e => setPayDate(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>
                  Izoh (Zametka)
                </label>
                <input 
                  type="text"
                  className="form-control"
                  placeholder="Masalan: Avans berildi, naqd yoki karta"
                  value={payNote}
                  onChange={e => setPayNote(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 'bold' }}>
                To'lovni Saqlash
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 5. MODAL: YANGI ISHCHI QO'SHISH / TAHRIRLASH */}
      {/* ================================================================= */}
      {showAddEmployeeModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px'
        }}>
          <div className="card fade-in" style={{ maxWidth: '400px', width: '100%', padding: '22px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, color: '#1e3a8a', fontSize: '18px', fontWeight: '800' }}>
                {editingEmployee ? "Ishchini Tahrirlash" : "Yangi Ishchi Qo'shish"}
              </h3>
              <button 
                onClick={() => setShowAddEmployeeModal(false)}
                style={{ border: 'none', background: '#f1f5f9', color: '#475569', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>
                  Ism va Familiya *
                </label>
                <input 
                  type="text"
                  className="form-control"
                  placeholder="Masalan: Aliyev Vali"
                  value={empFullName}
                  onChange={e => setEmpFullName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>
                  Telefon raqami
                </label>
                <input 
                  type="text"
                  className="form-control"
                  placeholder="+998 90 123 45 67"
                  value={empPhone}
                  onChange={e => setEmpPhone(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>
                  Oylik Maoshi (so'mda) *
                </label>
                <input 
                  type="text"
                  className="form-control"
                  placeholder="Masalan: 5 000 000"
                  value={empSalary}
                  onChange={e => handleAmountInput(e.target.value, setEmpSalary)}
                  required
                  style={{ fontSize: '16px', fontWeight: 'bold' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 'bold' }}>
                {editingEmployee ? "O'zgarishlarni Saqlash" : "Ishchini Saqlash"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 6. MODAL: YANGI CHIQIM YOZISH (KOMMUNAL, OVQAT, ARENDA) */}
      {/* ================================================================= */}
      {showAddExpenseModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px'
        }}>
          <div className="card fade-in" style={{ maxWidth: '420px', width: '100%', padding: '22px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, color: '#1e3a8a', fontSize: '18px', fontWeight: '800' }}>
                {categoryConfig[currentView]?.title || "Chiqim"} Yozish
              </h3>
              <button 
                onClick={() => setShowAddExpenseModal(false)}
                style={{ border: 'none', background: '#f1f5f9', color: '#475569', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveExpense}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>
                  Chiqim Nomi / Turi *
                </label>
                <input 
                  type="text"
                  className="form-control"
                  placeholder={
                    currentView === 'food' ? "Masalan: Obedga osh va non, Choyxona" :
                    currentView === 'utilities' ? "Masalan: Svet (Elektr), Gaz, Suv" :
                    "Masalan: Do'kon arendasi, Transport"
                  }
                  value={expenseType}
                  onChange={e => setExpenseType(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>
                  Summa (so'mda) *
                </label>
                <input 
                  type="text"
                  className="form-control"
                  placeholder="Masalan: 150 000"
                  value={expenseAmount}
                  onChange={e => handleAmountInput(e.target.value, setExpenseAmount)}
                  required
                  style={{ fontSize: '17px', fontWeight: 'bold', color: '#b91c1c' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>
                  Sana
                </label>
                <input 
                  type="date"
                  className="form-control"
                  value={expenseDate}
                  onChange={e => setExpenseDate(e.target.value)}
                  required
                />
              </div>

              {/* User talabi: yeb-ichar ga chiqib ketyotgan chiqimni zametka qilib yozib yursa bo'lsin */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>
                  Zametka (Batafsil tavsif / eslatma)
                </label>
                <textarea 
                  className="form-control"
                  placeholder="Masalan: 4 kishilik tushlik, choyxona yoki kvitansiya raqami..."
                  value={expenseNote}
                  onChange={e => setExpenseNote(e.target.value)}
                  rows="2"
                  style={{ resize: 'none' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 'bold' }}>
                Chiqimni Saqlash
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Arenda;
