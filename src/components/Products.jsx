import React, { useState, useEffect, useRef } from 'react';
import { Package, ArrowLeft, Trash2, PlusCircle, Check, X, Tags, Filter, FolderPlus, Edit, DollarSign, ScanLine, QrCode, Camera } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

const Products = ({ products, setProducts, categories = [], setCategories, setPage, saveToFirebase }) => {
  const [name, setName] = useState(''); 
  const [unit, setUnit] = useState('metr'); 
  const [quantity, setQuantity] = useState(''); 
  const [costPrice, setCostPrice] = useState(''); 
  const [price, setPrice] = useState(''); 
  const [barcode, setBarcode] = useState(''); // YANGI: Skaner kodi (ihtiyoriy)
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [activeFilter, setActiveFilter] = useState('Barchasi');
  
  const [addingStockId, setAddingStockId] = useState(null);
  const [stockAmount, setStockAmount] = useState('');
  
  const [assigningCatId, setAssigningCatId] = useState(null);
  const [selectedCat, setSelectedCat] = useState('');

  const [editingProductId, setEditingProductId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const [changingPriceId, setChangingPriceId] = useState(null);
  const [newPriceAmount, setNewPriceAmount] = useState('');

  const [changingCostPriceId, setChangingCostPriceId] = useState(null);
  const [newCostPriceAmount, setNewCostPriceAmount] = useState('');

  const [searchQuery, setSearchQuery] = useState('');

  // YANGI: Skaner uchun state'lar
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const scannerRef = useRef(null);
  const scannerInstanceRef = useRef(null);

  // ================= SKANER FUNKSIYASI (Telefon + Kompyuter) =================
  // SUPERMARKET USULIDAGI "PIIP" OVOZI (kod o'qilganda)
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.value = 1800;
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
      osc.onended = () => ctx.close().catch(() => {});
    } catch (e) {}
  };

  useEffect(() => {
    if (showScanner) {
      setScannerError('');
      let cancelled = false;
      let alreadyScanned = false; // Bir marta o'qigach qayta ishlamasin
      
      // Kichik kechikish, DOM tayyor bo'lishi uchun
      const timer = setTimeout(() => {
        if (cancelled) return;
        try {
          // FAQAT SHTRIX-KODLAR (QR kod o'qilmaydi)
          // MUHIM: formatlarni cheklamaymiz - hamma turini urinib ko'radi (yaxshiroq tanish)
          const html5QrCode = new Html5Qrcode("qr-reader", {
            verbose: false
          });
          scannerInstanceRef.current = html5QrCode;

          html5QrCode.start(
            { facingMode: "environment" }, // Telefonda orqa kamera
            {
              fps: 15, // O'rtacha tezlik - juda yuqori bo'lsa telefon uddalay olmaydi
              qrbox: undefined, // Butun kadr bo'ylab qidiradi (aniqlik oshadi)
              aspectRatio: 1.0,
              disableFlip: false, // Teskari holatda ham o'qiy oladigan qilamiz
              videoConstraints: {
                facingMode: "environment",
                width: { ideal: 1920 }, // Yuqori aniqlik - shtrix-kod aniq ko'rinishi uchun
                height: { ideal: 1080 },
                // Fokusni yaqinga sozlash (muhim!)
                advanced: [
                  { focusMode: "continuous" },
                  { focusMode: "auto" }
                ]
              }
            },
            (decodedText) => {
              // KOD KO'RINDI = DARHOL SAQLANADI (hech narsa bosilmaydi)
              if (alreadyScanned) return;
              // Bo'sh yoki qisqa kodlarni tashlab yuborish
              if (!decodedText || decodedText.trim().length < 4) return;
              alreadyScanned = true;
              playBeep(); // Supermarket "piip"i
              setBarcode(decodedText.trim());
              setShowScanner(false); // Kamerani cleanup o'zi to'xtatadi
            },
            (errorMessage) => {
              // Har bir frame'ni "xato" deb hisoblaydi - jim tursin
            }
          ).then(() => {
            // Kamera ishga tushdi - torchni (fonar) yoqishga urinib ko'ramiz agar mumkin bo'lsa
            if (cancelled) {
              html5QrCode.stop().catch(() => {});
            }
          }).catch(err => {
            console.error("Kamera xatosi:", err);
            if (!cancelled) {
              setScannerError("Kameraga ruxsat berilmadi yoki qurilma topilmadi. Brauzer sozlamalarida kamerani yoqing.");
            }
          });
        } catch (err) {
          console.error(err);
          if (!cancelled) setScannerError("Skanerni ishga tushirishda xatolik");
        }
      }, 300);

      return () => {
        cancelled = true;
        clearTimeout(timer);
        const scanner = scannerInstanceRef.current;
        scannerInstanceRef.current = null;
        if (scanner) {
          try {
            if (scanner.isScanning) {
              scanner.stop().then(() => {
                try { scanner.clear(); } catch (e) {}
              }).catch(() => {});
            } else {
              try { scanner.clear(); } catch (e) {}
            }
          } catch (e) {}
        }
      };
    }
  }, [showScanner]);

  // X tugmasi endi darhol yopadi - kamerani useEffect cleanup o'zi to'xtatadi
  const closeScanner = () => {
    setShowScanner(false);
  };

  // ================= HISOB-KITOB =================
  const totalValueSom = products.reduce((acc, curr) => {
    return (curr.unit !== 'kv' && curr.unit !== 'Dona/$') ? acc + (curr.quantity * curr.price) : acc;
  }, 0);

  const totalValueUsd = products.reduce((acc, curr) => {
    return (curr.unit === 'kv' || curr.unit === 'Dona/$') ? acc + (curr.quantity * curr.price) : acc;
  }, 0);

  const totalCostValueSom = products.reduce((acc, curr) => {
    const cost = curr.costPrice || 0;
    return (curr.unit !== 'kv' && curr.unit !== 'Dona/$') ? acc + (curr.quantity * cost) : acc;
  }, 0);

  const totalCostValueUsd = products.reduce((acc, curr) => {
    const cost = curr.costPrice || 0;
    return (curr.unit === 'kv' || curr.unit === 'Dona/$') ? acc + (curr.quantity * cost) : acc;
  }, 0);

  // ================= AQLLI QIDIRUV =================
  const getMatchScore = (productName, query) => {
    if (!query) return 0;
    const name = (productName || '').toLowerCase().trim();
    const q = query.toLowerCase().trim();
    
    if (name === q) return 100;
    if (name.startsWith(q)) return 80;
    if (name.includes(q)) return 60;
    
    const nameWords = name.split(/\s+/);
    const queryWords = q.split(/\s+/);
    let score = 0;

    queryWords.forEach(qw => {
      nameWords.forEach(nw => {
        if (nw === qw) score += 40;
        else if (nw.startsWith(qw)) score += 30;
        else if (nw.includes(qw)) score += 20;
        else {
          let qIdx = 0;
          let matches = 0;
          for (let i = 0; i < nw.length; i++) {
            if (nw[i] === qw[qIdx]) {
              matches++;
              qIdx++;
              if (qIdx === qw.length) break;
            }
          }
          if (matches === qw.length) score += 15;
          else if (matches >= qw.length - 1 && qw.length > 2) score += 10;
        }
      });
    });
    return score;
  };

  const filteredByCat = activeFilter === 'Barchasi' 
    ? products 
    : products.filter(p => (p.category || 'Umumiy') === activeFilter);

  const displayedProducts = [...filteredByCat].sort((a, b) => {
    if (!searchQuery.trim()) return 0;
    const scoreA = getMatchScore(a.name, searchQuery);
    const scoreB = getMatchScore(b.name, searchQuery);
    return scoreB - scoreA;
  });

  // ================= HANDLERS =================
  const handleAddCategory = (e) => {
    e.preventDefault();
    const catName = newCategoryName.trim();
    if (!catName) return;
    if (categories.includes(catName) || catName === 'Umumiy' || catName === 'Barchasi') {
      alert("Bu nomdagi bo'lim allaqachon bor!");
      return;
    }
    const newCategories = [...categories, catName];
    setCategories(newCategories);
    saveToFirebase({ categories: newCategories });
    setNewCategoryName('');
    setActiveFilter(catName);
  };

  const handleDeleteCategory = (catToDelete) => {
    if (window.confirm(`"${catToDelete}" bo'limini o'chirasizmi?\n\n(Bu yerdagi tovarlar o'chmaydi, shunchaki "Umumiy" ro'yxatga qaytadi)`)) {
      const newCategories = categories.filter(c => c !== catToDelete);
      const newProducts = products.map(p => p.category === catToDelete ? { ...p, category: 'Umumiy' } : p);
      
      setCategories(newCategories);
      setProducts(newProducts);
      saveToFirebase({ categories: newCategories, products: newProducts });
      
      if (activeFilter === catToDelete) setActiveFilter('Barchasi');
    }
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    const productCategory = activeFilter !== 'Barchasi' ? activeFilter : 'Umumiy';
    
    // Barcode dublikatini tekshirish (agar kiritilgan bo'lsa)
    if (barcode.trim()) {
      const duplicate = products.find(p => p.barcode === barcode.trim());
      if (duplicate) {
        if (!window.confirm(`Bu shtrix-kod "${duplicate.name}" tovariga tegishli. Baribir qo'shasizmi?`)) {
          return;
        }
      }
    }
    
    const newProduct = { 
      id: Date.now().toString(),
      name, 
      unit, 
      category: productCategory, 
      quantity: parseFloat(quantity), 
      costPrice: parseFloat(costPrice), 
      price: parseFloat(price),
      barcode: barcode.trim() || null // Skaner kodi - ihtiyoriy
    };

    const newProducts = [...products, newProduct];
    setProducts(newProducts);
    saveToFirebase({ products: newProducts });
    
    setName(''); setQuantity(''); setCostPrice(''); setPrice(''); setBarcode('');
  };
  
  const handleDeleteProduct = (id, productName) => { 
    if (window.confirm(`O'chirasizmi: ${productName}?`)) {
      const newProducts = products.filter(p => p.id !== id);
      setProducts(newProducts);
      saveToFirebase({ products: newProducts });
    }
  };

  const handleConfirmAddStock = (id) => {
    const parsedAmount = parseFloat(stockAmount);
    if (isNaN(parsedAmount) || parsedAmount === 0) return alert("Kiritilgan miqdor xato!");
    
    const newProducts = products.map(p => p.id === id ? { ...p, quantity: p.quantity + parsedAmount } : p);
    setProducts(newProducts);
    saveToFirebase({ products: newProducts });
    
    setAddingStockId(null); setStockAmount('');
  };

  const handleAssignCategory = (id) => {
    if (!selectedCat) return alert("Iltimos, bo'limni tanlang!");
    
    const newProducts = products.map(p => p.id === id ? { ...p, category: selectedCat } : p);
    setProducts(newProducts);
    saveToFirebase({ products: newProducts });
    
    setAssigningCatId(null); setSelectedCat('');
  };

  const handleSaveEditName = (id) => {
    if (!editingName.trim()) return alert("Tovar nomi bo'sh bo'lishi mumkin emas!");
    
    const newProducts = products.map(p => p.id === id ? { ...p, name: editingName.trim() } : p);
    setProducts(newProducts);
    saveToFirebase({ products: newProducts });
    
    setEditingProductId(null);
  };

  const handleConfirmChangePrice = (id) => {
    const parsedPrice = parseFloat(newPriceAmount);
    if (isNaN(parsedPrice) || parsedPrice < 0) return alert("Narxni to'g'ri kiriting!");
    
    const newProducts = products.map(p => p.id === id ? { ...p, price: parsedPrice } : p);
    setProducts(newProducts);
    saveToFirebase({ products: newProducts });
    
    setChangingPriceId(null); setNewPriceAmount('');
  };

  const handleConfirmChangeCostPrice = (id) => {
    const parsedCostPrice = parseFloat(newCostPriceAmount);
    if (isNaN(parsedCostPrice) || parsedCostPrice < 0) return alert("Olingan narxni to'g'ri kiriting!");
    
    const newProducts = products.map(p => p.id === id ? { ...p, costPrice: parsedCostPrice } : p);
    setProducts(newProducts);
    saveToFirebase({ products: newProducts });
    
    setChangingCostPriceId(null); setNewCostPriceAmount('');
  };

  const getUnitText = (u) => {
    if (!u) return 'dona';
    if (u === 'Dona/$') return 'dona';
    return u;
  };

  return (
    <div className="fade-in">
      
      {/* ================= SKANER MODAL (Kamera oynasi) ================= */}
      {showScanner && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            maxWidth: '500px',
            width: '100%',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#1e3a8a', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Camera size={22} /> Skaner qilish
              </h3>
              <button 
                onClick={closeScanner}
                style={{ background: '#ef4444', border: 'none', color: 'white', width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            {scannerError ? (
              <div style={{ padding: '20px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', textAlign: 'center' }}>
                {scannerError}
              </div>
            ) : (
              <>
                <div 
                  id="qr-reader" 
                  ref={scannerRef}
                  style={{ 
                    width: '100%', 
                    borderRadius: '12px', 
                    overflow: 'hidden',
                    backgroundColor: '#000'
                  }}
                ></div>
                <p style={{ margin: '15px 0 0 0', fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>
                  📷 Kodni yorug'da, 10-15 sm masofada tuting. Aniq fokus zarur.
                </p>
              </>
            )}

            {/* Qo'lda kiritish / Fizik skaner varianti (Kompyuter uchun asosiy) */}
            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '2px solid #1e3a8a' }}>
              <div style={{ 
                backgroundColor: '#eff6ff', 
                border: '2px solid #bfdbfe',
                borderRadius: '10px', 
                padding: '12px',
                marginBottom: '10px'
              }}>
                <p style={{ 
                  margin: '0 0 4px 0', 
                  fontSize: '14px', 
                  fontWeight: 'bold',
                  color: '#1e3a8a'
                }}>
                  ⌨️ Kompyuterdan yoki fizik skaner bilan
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#475569' }}>
                  Kodni yozing va <b>Enter</b> bosing yoki <b>Saqlash</b> tugmasini bosing
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="Shtrix-kodni bu yerga yozing..." 
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyDown={(e) => {
                    // Fizik skaner kod oxirida Enter yuboradi - avtomatik saqlanadi
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (barcode.trim()) closeScanner();
                    }
                  }}
                  autoFocus
                  style={{ 
                    flex: 1, 
                    padding: '14px 16px', 
                    border: '2px solid #1e3a8a', 
                    borderRadius: '10px', 
                    outline: 'none', 
                    fontSize: '18px',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    letterSpacing: '1px'
                  }}
                />
                <button 
                  onClick={closeScanner}
                  disabled={!barcode.trim()}
                  style={{ 
                    padding: '14px 24px', 
                    backgroundColor: barcode.trim() ? '#1e3a8a' : '#94a3b8', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '10px', 
                    cursor: barcode.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '15px',
                    fontWeight: 'bold'
                  }}
                >
                  Saqlash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= YUQORI PANEL ================= */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => setPage('dashboard')} className="btn" style={{ width: 'auto', padding: '10px 20px', backgroundColor: '#e5e7eb', color: '#1f2937', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ArrowLeft size={18} /> Ortga qaytish
        </button>
        <h2 style={{ fontSize: '24px', color: '#1e3a8a', margin: 0, display: 'flex', gap: '10px', alignItems: 'center' }}>
          Tovarlar ombori <Package size={28} />
        </h2>
      </div>

      {/* ================= UMUMIY QIYMAT KARTOCHKALARI ================= */}
      <div className="card fade-in" style={{ padding: '30px', backgroundColor: '#1e3a8a', color: '#ffffff', marginBottom: '30px', border: 'none', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ textAlign: 'center', paddingBottom: '20px', borderBottom: '1px solid #475569' }}>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '10px' }}>Jami ombor qiymati (Sotuv narxida)</p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '36px', fontWeight: 'bold', color: '#ffffff' }}>
                {totalValueSom.toLocaleString()} <span style={{ fontSize: '18px', color: '#9ca3af' }}>so'm</span>
              </h2>
            </div>
            <div style={{ width: '2px', height: '30px', backgroundColor: '#4b5563' }}></div>
            <div>
              <h2 style={{ margin: 0, fontSize: '36px', fontWeight: 'bold', color: '#10b981' }}>
                {totalValueUsd.toLocaleString()} <span style={{ fontSize: '18px', color: '#9ca3af' }}>$</span>
              </h2>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#fca5a5', textTransform: 'uppercase', marginBottom: '10px' }}>Jami ombor qiymati (Tan narxida)</p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#fecaca' }}>
                {totalCostValueSom.toLocaleString()} <span style={{ fontSize: '16px', color: '#fca5a5' }}>so'm</span>
              </h2>
            </div>
            <div style={{ width: '2px', height: '25px', backgroundColor: '#4b5563' }}></div>
            <div>
              <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#fecaca' }}>
                {totalCostValueUsd.toLocaleString()} <span style={{ fontSize: '16px', color: '#fca5a5' }}>$</span>
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* ================= BO'LIMLAR ================= */}
      <div className="card" style={{ padding: '20px', marginBottom: '30px', borderTop: '4px solid #4b5563', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', flex: '1 1 auto' }}>
            <span style={{ color: '#4b5563', fontWeight: 'bold', marginRight: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={18}/> Bo'limlar:
            </span>
            
            <button onClick={() => setActiveFilter('Barchasi')} className="btn" style={{ width: 'auto', padding: '8px 16px', fontSize: '14px', borderRadius: '20px', backgroundColor: activeFilter === 'Barchasi' ? '#1e3a8a' : '#e5e7eb', color: activeFilter === 'Barchasi' ? 'white' : '#1f2937', fontWeight: '500' }}>
              Barchasi
            </button>
            <button onClick={() => setActiveFilter('Umumiy')} className="btn" style={{ width: 'auto', padding: '8px 16px', fontSize: '14px', borderRadius: '20px', backgroundColor: activeFilter === 'Umumiy' ? '#1e3a8a' : '#e5e7eb', color: activeFilter === 'Umumiy' ? 'white' : '#1f2937', fontWeight: '500' }}>
              Umumiy
            </button>
            
            {categories.map((cat, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', backgroundColor: activeFilter === cat ? '#1e3a8a' : '#f3f4f6', color: activeFilter === cat ? 'white' : '#1f2937', borderRadius: '20px', border: `1px solid ${activeFilter === cat ? '#1e3a8a' : '#d1d5db'}` }}>
                <button onClick={() => setActiveFilter(cat)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '8px 14px', fontSize: '14px', fontWeight: '500' }}>
                  {cat}
                </button>
                <button onClick={() => handleDeleteCategory(cat)} style={{ background: 'none', border: 'none', color: activeFilter === cat ? '#fca5a5' : '#ef4444', cursor: 'pointer', padding: '8px 12px', borderLeft: `1px solid ${activeFilter === cat ? '#3b82f6' : '#d1d5db'}` }} title="Bo'limni o'chirish">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          {searchQuery.trim() === '' && (
            <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Yangi bo'lim qo'shish..." 
                value={newCategoryName} 
                onChange={(e) => setNewCategoryName(e.target.value)} 
                style={{ width: '220px', marginBottom: 0, padding: '10px', fontSize: '14px' }} 
                required 
              />
              <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '10px 15px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                <FolderPlus size={18} /> Qo'shish
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ================= AQLLI QIDIRUV ================= */}
      <div style={{ marginBottom: '25px', width: '100%' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input 
            type="text" 
            className="form-control" 
            placeholder="🔍 Aqlli qidiruv (Tovar nomini yozing)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '14px 20px', 
              fontSize: '16px', 
              borderRadius: '10px', 
              border: '2px solid #1e3a8a', 
              marginBottom: 0,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              outline: 'none'
            }} 
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')} 
              style={{ 
                position: 'absolute', 
                right: '15px', 
                background: '#ef4444', 
                border: 'none', 
                cursor: 'pointer', 
                color: '#ffffff',
                fontWeight: 'bold',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px'
              }}
              title="Tozalash"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        
        {/* ================= YANGI TOVAR QO'SHISH FORMASI ================= */}
        {searchQuery.trim() === '' && (
          <div className="card" style={{ flex: '1 1 350px', borderTop: '4px solid #1e3a8a', alignSelf: 'flex-start' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e3a8a', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Yangi tovar ro'yxatga olish 
              {activeFilter !== 'Barchasi' && <span style={{ fontSize: '14px', backgroundColor: '#e5e7eb', padding: '2px 8px', borderRadius: '12px', color: '#4b5563' }}>{activeFilter}</span>}
            </h3>
            <form onSubmit={handleAddProduct}>

              {/* ===== YANGI: SKANER TUGMASI (Tovar nomi tepasida) ===== */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '8px' 
              }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#4b5563' }}>
                  Tovar nomi:
                </label>
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: barcode ? '#10b981' : '#1e3a8a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  title="Kamera orqali skaner qilish"
                >
                  {barcode ? <><Check size={16} /> Skanerlangan</> : <><ScanLine size={16} /> Skaner qilish</>}
                </button>
              </div>

              <input 
                type="text" 
                className="form-control" 
                placeholder="Tovar nomi" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />

              {/* ===== SKANERLANGAN KOD KO'RSATILADI ===== */}
              {barcode && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  padding: '10px 14px',
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '8px',
                  marginBottom: '15px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                    <QrCode size={18} style={{ color: '#059669', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '11px', color: '#059669', fontWeight: 'bold' }}>SKANERLANGAN KOD:</div>
                      <div style={{ 
                        fontFamily: 'monospace', 
                        fontSize: '14px', 
                        color: '#065f46', 
                        fontWeight: 'bold',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {barcode}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBarcode('')}
                    style={{
                      background: '#ef4444',
                      border: 'none',
                      color: 'white',
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                    title="Kodni o'chirish"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="number" className="form-control" placeholder="Miqdori" value={quantity} onChange={(e) => setQuantity(e.target.value)} required min="0.001" step="any" style={{ flex: 2 }} />
                <select className="form-control" value={unit} onChange={(e) => setUnit(e.target.value)} style={{ flex: 1 }}>
                  <option value="metr">Metr</option>
                  <option value="kv">KV($)</option> 
                  <option value="Dona/$">Dona($)</option>
                  <option value="dona">Dona</option>
                  <option value="pachka">Pachka</option>
                  <option value="kg">KG</option>
                  <option value="qop">Qop</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block', fontWeight: 'bold' }}>Olingan narxi (1 {getUnitText(unit)}):</label>
                  <input type="number" className="form-control" placeholder="Masalan: 10000" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} required min="0" step="any" style={{ width: '100%', marginBottom: 0 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block', fontWeight: 'bold' }}>Sotilish narxi (1 {getUnitText(unit)}):</label>
                  <input type="number" className="form-control" placeholder="Masalan: 12000" value={price} onChange={(e) => setPrice(e.target.value)} required min="0" step="any" style={{ width: '100%', marginBottom: 0 }} />
                </div>
              </div>
              
              {quantity && price && (
                <div style={{ padding: '15px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', marginBottom: '20px', color: '#1e3a8a' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    Umumiy qiymat (Sotuv): {(parseFloat(quantity) * parseFloat(price)).toLocaleString()} {(unit === 'kv' || unit === 'Dona/$') ? '$' : "so'm"}
                  </div>
                  {costPrice && (
                    <div style={{ fontSize: '13px', color: '#10b981', fontWeight: 'bold' }}>
                      Kutilayotgan sof foyda: {((parseFloat(price) - parseFloat(costPrice)) * parseFloat(quantity)).toLocaleString()} {(unit === 'kv' || unit === 'Dona/$') ? '$' : "so'm"}
                    </div>
                  )}
                </div>
              )}
              
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '14px' }}>
                <PlusCircle size={20} /> Tovar qo'shish
              </button>
              <p style={{ margin: '10px 0 0 0', fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>
                * Tovar avtomatik tarzda tepada tanlangan bo'limga qo'shiladi.
              </p>
            </form>
          </div>
        )}

        {/* ================= TOVARLAR RO'YXATI ================= */}
        <div className="card" style={{ flex: searchQuery.trim() ? '1 1 100%' : '2 1 400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#1e3a8a' }}>
              {searchQuery.trim() ? "Qidiruv natijalari" : (activeFilter === 'Barchasi' ? "Barcha tovarlar ro'yxati" : `"${activeFilter}" bo'limidagi tovarlar`)}
            </h3>
            <span style={{ backgroundColor: '#e0e7ff', color: '#4338ca', padding: '4px 10px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold' }}>
              {displayedProducts.length} xil tovar
            </span>
          </div>
          
          {displayedProducts.length === 0 ? <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>Bu yerda tovar yo'q yoki topilmadi.</p> : (
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: searchQuery.trim() ? 'repeat(auto-fill, minmax(400px, 1fr))' : '1fr', 
              gap: '15px' 
            }}>
              
              {displayedProducts.map(p => (
                <div key={p.id} className="fade-in" style={{ padding: '15px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', position: 'relative' }}>
                  
                  <button onClick={() => handleDeleteProduct(p.id, p.name)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="O'chirish"><Trash2 size={20} /></button>
                  
                  {editingProductId === p.id ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px', paddingRight: '35px' }}>
                      <input 
                        type="text" 
                        value={editingName} 
                        onChange={(e) => setEditingName(e.target.value)} 
                        style={{ flex: 1, padding: '8px 12px', border: '1px solid #6366f1', borderRadius: '8px', outline: 'none', fontSize: '16px' }} 
                        autoFocus 
                      />
                      <button onClick={() => handleSaveEditName(p.id)} className="btn btn-primary" style={{ padding: '8px', width: 'auto' }} title="Saqlash"><Check size={18} /></button>
                      <button onClick={() => setEditingProductId(null)} className="btn btn-danger" style={{ padding: '8px', width: 'auto' }} title="Bekor qilish"><X size={18} /></button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingRight: '35px', marginBottom: '10px' }}>
                      <h4 style={{ margin: 0, color: '#111827', fontSize: '18px' }}>{p.name}</h4>
                      <button 
                        onClick={() => { 
                          setEditingProductId(p.id); setEditingName(p.name); 
                          setAddingStockId(null); setAssigningCatId(null); 
                          setChangingPriceId(null); setChangingCostPriceId(null);
                        }} 
                        style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }} 
                        title="Nomini o'zgartirish"
                      >
                        <Edit size={18} />
                      </button>
                    </div>
                  )}

                  {/* ===== YANGI: SKANER KODI KO'RSATILADI (agar bor bo'lsa) ===== */}
                  {p.barcode && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      backgroundColor: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      borderRadius: '6px',
                      marginBottom: '8px'
                    }}>
                      <QrCode size={14} style={{ color: '#059669' }} />
                      <span style={{ fontSize: '12px', color: '#065f46', fontFamily: 'monospace', fontWeight: 'bold' }}>
                        {p.barcode}
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ display: 'inline-block', backgroundColor: '#e5e7eb', color: '#4b5563', fontSize: '12px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px', alignSelf: 'flex-start', marginBottom: '4px' }}>
                      Bo'lim: {p.category || 'Umumiy'}
                    </span>
                    
                    <div style={{ color: '#6b7280', fontSize: '14px' }}>Qoldiq: <span style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '16px' }}>{p.quantity} {p.unit}</span></div>
                    
                    <div style={{ color: '#6b7280', fontSize: '13px' }}>
                      1 {getUnitText(p.unit)} olingan narxi: <span style={{ fontWeight: 'bold', color: '#ef4444', fontSize: '14px' }}>{p.costPrice ? p.costPrice.toLocaleString() : 'Kiritilmagan'} {(p.unit === 'kv' || p.unit === 'Dona/$') ? '$' : "so'm"}</span>
                    </div>
                    
                    <div style={{ color: '#6b7280', fontSize: '13px' }}>
                      1 {getUnitText(p.unit)} sotilish narxi: <span style={{ fontWeight: 'bold', color: '#10b981', fontSize: '14px' }}>{p.price.toLocaleString()} {(p.unit === 'kv' || p.unit === 'Dona/$') ? '$' : "so'm"}</span>
                    </div>
                    
                    <div style={{ color: '#1e3a8a', fontSize: '13px', marginTop: '4px', backgroundColor: '#eff6ff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #bfdbfe', display: 'inline-block', alignSelf: 'flex-start' }}>
                      Umumiy summasi: <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{(p.quantity * p.price).toLocaleString()} {(p.unit === 'kv' || p.unit === 'Dona/$') ? '$' : "so'm"}</span>
                    </div>

                    {p.costPrice && p.price && (
                      <div style={{ color: '#059669', fontSize: '13px', marginTop: '2px', backgroundColor: '#ecfdf5', padding: '4px 8px', borderRadius: '6px', display: 'inline-block', alignSelf: 'flex-start' }}>
                        Foyda (1 {getUnitText(p.unit)} uchun): <span style={{ fontWeight: 'bold' }}>{(p.price - p.costPrice).toLocaleString()} {(p.unit === 'kv' || p.unit === 'Dona/$') ? '$' : "so'm"}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: '1px dashed #d1d5db', margin: '15px 0' }}></div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                    
                    {addingStockId === p.id ? (
                      <div className="fade-in" style={{ display: 'flex', gap: '5px', alignItems: 'center', backgroundColor: '#eff6ff', padding: '6px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                        <input 
                          type="number" 
                          placeholder="Miqdor" 
                          value={stockAmount} 
                          onChange={e => setStockAmount(e.target.value)} 
                          style={{ width: '80px', padding: '6px', border: '1px solid #93c5fd', borderRadius: '6px', outline: 'none' }} 
                          autoFocus 
                          step="any" 
                        />
                        <button onClick={() => handleConfirmAddStock(p.id)} className="btn btn-primary" style={{ padding: '6px 10px', width: 'auto' }}><Check size={16} /></button>
                        <button onClick={() => { setAddingStockId(null); setStockAmount(''); }} className="btn btn-danger" style={{ padding: '6px 10px', width: 'auto' }}><X size={16} /></button>
                      </div>
                    ) : (
                      <button onClick={() => { 
                        setAddingStockId(p.id); setAssigningCatId(null); 
                        setEditingProductId(null); setChangingPriceId(null); setChangingCostPriceId(null); 
                      }} className="btn" style={{ width: 'auto', padding: '6px 12px', fontSize: '13px', backgroundColor: '#e0e7ff', color: '#4338ca', display: 'flex', gap: '6px', alignItems: 'center', border: '1px solid #c7d2fe' }}>
                        <PlusCircle size={16} /> Kirim
                      </button>
                    )}

                    {assigningCatId === p.id ? (
                      <div className="fade-in" style={{ display: 'flex', gap: '5px', alignItems: 'center', backgroundColor: '#f3f4f6', padding: '6px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                        <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)} style={{ padding: '6px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none', fontSize: '13px' }}>
                          <option value="">-- Bo'lim --</option>
                          <option value="Umumiy">Umumiy</option>
                          {categories.map((c, i) => <option key={i} value={c}>{c}</option>)}
                        </select>
                        <button onClick={() => handleAssignCategory(p.id)} className="btn" style={{ backgroundColor: '#10b981', color: 'white', padding: '6px 10px', width: 'auto' }}><Check size={16} /></button>
                        <button onClick={() => setAssigningCatId(null)} className="btn btn-danger" style={{ padding: '6px 10px', width: 'auto' }}><X size={16} /></button>
                      </div>
                    ) : (
                      <button onClick={() => { 
                        setAssigningCatId(p.id); setAddingStockId(null); 
                        setSelectedCat(p.category || 'Umumiy'); setEditingProductId(null); 
                        setChangingPriceId(null); setChangingCostPriceId(null); 
                      }} className="btn" style={{ width: 'auto', padding: '6px 12px', fontSize: '13px', backgroundColor: '#f3f4f6', color: '#4b5563', display: 'flex', gap: '6px', alignItems: 'center', border: '1px solid #d1d5db' }}>
                        <Tags size={16} /> Ko'chirish
                      </button>
                    )}

                    {changingCostPriceId === p.id ? (
                      <div className="fade-in" style={{ display: 'flex', gap: '5px', alignItems: 'center', backgroundColor: '#fef2f2', padding: '6px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                        <input 
                          type="number" 
                          placeholder="Yangi olingan narx" 
                          value={newCostPriceAmount} 
                          onChange={e => setNewCostPriceAmount(e.target.value)} 
                          style={{ width: '110px', padding: '6px', border: '1px solid #fca5a5', borderRadius: '6px', outline: 'none' }} 
                          autoFocus 
                          min="0" step="any" 
                        />
                        <button onClick={() => handleConfirmChangeCostPrice(p.id)} className="btn btn-primary" style={{ padding: '6px 10px', width: 'auto', backgroundColor: '#ef4444', border: 'none' }} title="Saqlash"><Check size={16} /></button>
                        <button onClick={() => { setChangingCostPriceId(null); setNewCostPriceAmount(''); }} className="btn btn-danger" style={{ padding: '6px 10px', width: 'auto', backgroundColor: '#991b1b' }} title="Bekor qilish"><X size={16} /></button>
                      </div>
                    ) : (
                      <button onClick={() => { 
                        setChangingCostPriceId(p.id); setChangingPriceId(null); 
                        setAddingStockId(null); setAssigningCatId(null); setEditingProductId(null);
                        setNewCostPriceAmount(p.costPrice || '');
                      }} className="btn" style={{ width: 'auto', padding: '6px 12px', fontSize: '13px', backgroundColor: '#fef2f2', color: '#991b1b', display: 'flex', gap: '6px', alignItems: 'center', border: '1px solid #fecaca' }}>
                        <DollarSign size={16} /> Tan narxi
                      </button>
                    )}

                    {changingPriceId === p.id ? (
                      <div className="fade-in" style={{ display: 'flex', gap: '5px', alignItems: 'center', backgroundColor: '#f0fdf4', padding: '6px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                        <input 
                          type="number" 
                          placeholder="Yangi sotuv narxi" 
                          value={newPriceAmount} 
                          onChange={e => setNewPriceAmount(e.target.value)} 
                          style={{ width: '110px', padding: '6px', border: '1px solid #86efac', borderRadius: '6px', outline: 'none' }} 
                          autoFocus 
                          min="0" step="any" 
                        />
                        <button onClick={() => handleConfirmChangePrice(p.id)} className="btn btn-primary" style={{ padding: '6px 10px', width: 'auto', backgroundColor: '#10b981', border: 'none' }} title="Saqlash"><Check size={16} /></button>
                        <button onClick={() => { setChangingPriceId(null); setNewPriceAmount(''); }} className="btn btn-danger" style={{ padding: '6px 10px', width: 'auto' }} title="Bekor qilish"><X size={16} /></button>
                      </div>
                    ) : (
                      <button onClick={() => { 
                        setChangingPriceId(p.id); setChangingCostPriceId(null); 
                        setAddingStockId(null); setAssigningCatId(null); setEditingProductId(null); 
                        setNewPriceAmount(p.price); 
                      }} className="btn" style={{ width: 'auto', padding: '6px 12px', fontSize: '13px', backgroundColor: '#f0fdf4', color: '#166534', display: 'flex', gap: '6px', alignItems: 'center', border: '1px solid #bbf7d0' }}>
                        <DollarSign size={16} /> Sotuv narxi
                      </button>
                    )}

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;