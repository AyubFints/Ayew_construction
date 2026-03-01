import React, { useState } from 'react';
import { Package, ArrowLeft, Trash2, PlusCircle, Check, X, Tags, Filter, FolderPlus } from 'lucide-react';

const Products = ({ products, setProducts, categories = [], setCategories, setPage }) => {
  // Tovar qo'shish formasi holatlari
  const [name, setName] = useState(''); 
  const [unit, setUnit] = useState('metr'); 
  const [quantity, setQuantity] = useState(''); 
  const [price, setPrice] = useState('');
  
  // Bo'limlar (Kategoriyalar)
  const [newCategoryName, setNewCategoryName] = useState('');
  const [activeFilter, setActiveFilter] = useState('Barchasi'); // Qaysi bo'lim tanlangani
  
  // Tovarga kirim qilish (+ miqdor)
  const [addingStockId, setAddingStockId] = useState(null);
  const [stockAmount, setStockAmount] = useState('');
  
  // Tovarni boshqa bo'limga ko'chirish
  const [assigningCatId, setAssigningCatId] = useState(null);
  const [selectedCat, setSelectedCat] = useState('');

  // Jami hisob-kitob
  const totalWarehouseValue = products.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0);

  // Ekranda ko'rinadigan tovarlar
  const displayedProducts = activeFilter === 'Barchasi' 
    ? products 
    : products.filter(p => (p.category || 'Umumiy') === activeFilter);

  // --- BO'LIM YARATISH VA O'CHIRISH ---
  const handleAddCategory = (e) => {
    e.preventDefault();
    const catName = newCategoryName.trim();
    if (!catName) return;
    if (categories.includes(catName) || catName === 'Umumiy' || catName === 'Barchasi') {
      alert("Bu nomdagi bo'lim allaqachon bor!");
      return;
    }
    setCategories([...categories, catName]);
    setNewCategoryName('');
    setActiveFilter(catName); // Yangi bo'lim yaratilgach, srazi o'shanga o'tib oladi
  };

  const handleDeleteCategory = (catToDelete) => {
    if (window.confirm(`"${catToDelete}" bo'limini o'chirasizmi?\n\n(Bu yerdagi tovarlar o'chmaydi, shunchaki "Umumiy" ro'yxatga qaytadi)`)) {
      setCategories(categories.filter(c => c !== catToDelete));
      setProducts(products.map(p => p.category === catToDelete ? { ...p, category: 'Umumiy' } : p));
      if (activeFilter === catToDelete) setActiveFilter('Barchasi');
    }
  };

  // --- TOVAR QO'SHISH ---
  const handleAddProduct = (e) => {
    e.preventDefault();
    // Tovar qaysi bo'lim tanlangan bo'lsa, o'shanga avtomat qo'shiladi
    const productCategory = activeFilter !== 'Barchasi' ? activeFilter : 'Umumiy';
    
    setProducts([...products, { 
      id: Date.now(), 
      name, 
      unit, 
      category: productCategory, 
      quantity: parseFloat(quantity), 
      price: parseFloat(price) 
    }]);
    setName(''); setQuantity(''); setPrice('');
  };
  
  const handleDeleteProduct = (id, productName) => { 
    if (window.confirm(`O'chirasizmi: ${productName}?`)) setProducts(products.filter(p => p.id !== id)); 
  };

  // --- TOVARGA KIRIM QILISH (+ Miqdor) ---
  const handleConfirmAddStock = (id) => {
    const parsedAmount = parseFloat(stockAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return alert("Kiritilgan miqdor xato!");
    setProducts(products.map(p => p.id === id ? { ...p, quantity: p.quantity + parsedAmount } : p));
    setAddingStockId(null); setStockAmount('');
  };

  // --- TOVARNI BO'LIMGA BIRIKTIRISH ---
  const handleAssignCategory = (id) => {
    if (!selectedCat) return alert("Iltimos, bo'limni tanlang!");
    setProducts(products.map(p => p.id === id ? { ...p, category: selectedCat } : p));
    setAssigningCatId(null); setSelectedCat('');
  };

  return (
    <div className="fade-in">
      {/* TEPADAGI PANEL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => setPage('dashboard')} className="btn" style={{ width: 'auto', padding: '10px 20px', backgroundColor: '#e5e7eb', color: '#1f2937', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ArrowLeft size={18} /> Ortga qaytish
        </button>
        <h2 style={{ fontSize: '24px', color: '#1e3a8a', margin: 0, display: 'flex', gap: '10px', alignItems: 'center' }}>
          Tovarlar ombori <Package size={28} />
        </h2>
      </div>

      <div className="card fade-in" style={{ padding: '30px', backgroundColor: '#1e3a8a', color: '#ffffff', marginBottom: '30px', textAlign: 'center', border: 'none' }}>
        <p style={{ margin: 0, fontSize: '16px', fontWeight: '500', color: '#9ca3af', textTransform: 'uppercase' }}>Jami ombor qiymati</p>
        <h2 style={{ margin: '10px 0 0 0', fontSize: '42px', fontWeight: 'bold' }}>{totalWarehouseValue.toLocaleString()} <span style={{ fontSize: '20px', color: '#d1d5db' }}>so'm</span></h2>
      </div>

      {/* ========================================== */}
      {/* 1. TEPADAGI BO'LIMLAR (TABS) VA YARATISH QISMI */}
      {/* ========================================== */}
      <div className="card" style={{ padding: '20px', marginBottom: '30px', borderTop: '4px solid #4b5563', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          
          {/* Chap tomon: Bo'limlar ro'yxati (Filtrlar) */}
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
            
            {/* Yaratilgan bo'limlar */}
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

          {/* O'ng tomon: Yangi bo'lim yaratish formasi */}
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

        </div>
      </div>


      {/* ========================================== */}
      {/* 2. BO'LIMLAR TAGIDA: TOVAR QO'SHISH VA RO'YXAT */}
      {/* ========================================== */}
      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        
        {/* TOVAR QO'SHISH FORMASI (CHAP TOMON) */}
        <div className="card" style={{ flex: '1 1 350px', borderTop: '4px solid #1e3a8a', alignSelf: 'flex-start' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e3a8a', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Yangi tovar ro'yxatga olish 
            {activeFilter !== 'Barchasi' && <span style={{ fontSize: '14px', backgroundColor: '#e5e7eb', padding: '2px 8px', borderRadius: '12px', color: '#4b5563' }}>{activeFilter}</span>}
          </h3>
          <form onSubmit={handleAddProduct}>
            <input type="text" className="form-control" placeholder="Tovar nomi" value={name} onChange={(e) => setName(e.target.value)} required />
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="number" className="form-control" placeholder="Miqdori" value={quantity} onChange={(e) => setQuantity(e.target.value)} required min="0.001" step="any" style={{ flex: 2 }} />
              <select className="form-control" value={unit} onChange={(e) => setUnit(e.target.value)} style={{ flex: 1 }}>
                <option value="metr">Metr</option><option value="dona">Dona</option><option value="pachka">Pachka</option><option value="kg">KG</option><option value="qop">Qop</option>
              </select>
            </div>
            <input type="number" className="form-control" placeholder="1 dona narxi" value={price} onChange={(e) => setPrice(e.target.value)} required min="0" step="any" />
            
            {quantity && price && <div style={{ padding: '15px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', color: '#1e3a8a' }}>Umumiy summa: {(parseFloat(quantity) * parseFloat(price)).toLocaleString()} so'm</div>}
            
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '14px' }}>
              <PlusCircle size={20} /> Tovar qo'shish
            </button>
            <p style={{ margin: '10px 0 0 0', fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>
              * Tovar avtomatik tarzda tepada tanlangan bo'limga qo'shiladi.
            </p>
          </form>
        </div>

        {/* TOVARLAR RO'YXATI (O'NG TOMON) */}
        <div className="card" style={{ flex: '2 1 400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#1e3a8a' }}>
              {activeFilter === 'Barchasi' ? "Barcha tovarlar ro'yxati" : `"${activeFilter}" bo'limidagi tovarlar`}
            </h3>
            <span style={{ backgroundColor: '#e0e7ff', color: '#4338ca', padding: '4px 10px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold' }}>
              {displayedProducts.length} xil tovar
            </span>
          </div>
          
          {displayedProducts.length === 0 ? <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>Bu yerda tovar yo'q.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {displayedProducts.map(p => (
                <div key={p.id} className="fade-in" style={{ padding: '15px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', position: 'relative' }}>
                  
                  {/* O'chirish tugmasi */}
                  <button onClick={() => handleDeleteProduct(p.id, p.name)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="O'chirish"><Trash2 size={20} /></button>
                  
                  <h4 style={{ margin: 0, color: '#111827', fontSize: '18px', paddingRight: '30px' }}>{p.name}</h4>
                  
                  {/* Qaysi bo'limga tegishli ekanligi */}
                  <span style={{ display: 'inline-block', backgroundColor: '#e5e7eb', color: '#4b5563', fontSize: '12px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px', marginTop: '5px' }}>
                    Bo'lim: {p.category || 'Umumiy'}
                  </span>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #d1d5db' }}>
                    
                    {/* Qoldiq va Narxi */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ color: '#6b7280', fontSize: '13px' }}>Qoldiq: <span style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '16px' }}>{p.quantity} {p.unit}</span></div>
                      <div style={{ color: '#6b7280', fontSize: '13px' }}>Narxi: <span style={{ fontWeight: 'bold', color: '#111827', fontSize: '14px' }}>{p.price.toLocaleString()} so'm</span></div>
                    </div>

                    {/* TUGMALAR (KIRIM QILISH VA BO'LIMGA O'TKAZISH) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                      
                      {/* 1. Kirim qilish (+ Miqdor) */}
                      {addingStockId === p.id ? (
                        <div className="fade-in" style={{ display: 'flex', gap: '5px', alignItems: 'center', backgroundColor: '#eff6ff', padding: '6px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                          <input type="number" placeholder="+ Miqdor" value={stockAmount} onChange={e => setStockAmount(e.target.value)} style={{ width: '80px', padding: '6px', border: '1px solid #93c5fd', borderRadius: '6px', outline: 'none' }} autoFocus min="0.001" step="any" />
                          <button onClick={() => handleConfirmAddStock(p.id)} className="btn btn-primary" style={{ padding: '6px 10px', width: 'auto' }}><Check size={16} /></button>
                          <button onClick={() => { setAddingStockId(null); setStockAmount(''); }} className="btn btn-danger" style={{ padding: '6px 10px', width: 'auto' }}><X size={16} /></button>
                        </div>
                      ) : (
                        <button onClick={() => { setAddingStockId(p.id); setAssigningCatId(null); }} className="btn" style={{ width: 'auto', padding: '6px 12px', fontSize: '13px', backgroundColor: '#e0e7ff', color: '#4338ca', display: 'flex', gap: '6px', alignItems: 'center', border: '1px solid #c7d2fe' }}>
                          <PlusCircle size={16} /> Kirim qilish
                        </button>
                      )}

                      {/* 2. Bo'limga o'tkazish */}
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
                        <button onClick={() => { setAssigningCatId(p.id); setAddingStockId(null); setSelectedCat(p.category || 'Umumiy'); }} className="btn" style={{ width: 'auto', padding: '6px 12px', fontSize: '13px', backgroundColor: '#f3f4f6', color: '#4b5563', display: 'flex', gap: '6px', alignItems: 'center', border: '1px solid #d1d5db' }}>
                          <Tags size={16} /> Bo'limga o'tkazish
                        </button>
                      )}
                    </div>

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