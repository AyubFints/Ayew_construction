import React, { useState } from 'react';
import { Package, ArrowLeft, Trash2, PlusCircle } from 'lucide-react';

const Products = ({ products, setProducts, setPage }) => {
  const [name, setName] = useState(''); 
  const [unit, setUnit] = useState('metr'); 
  const [quantity, setQuantity] = useState(''); 
  const [price, setPrice] = useState('');
  
  const totalWarehouseValue = products.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0);

  // YANGI TOVAR QO'SHISH
  const handleAddProduct = (e) => {
    e.preventDefault();
    setProducts([...products, { 
      id: Date.now(), 
      name, 
      unit, 
      quantity: parseFloat(quantity), 
      price: parseFloat(price) 
    }]);
    setName(''); setQuantity(''); setPrice('');
  };
  
  // TOVARNI BUTUNLAY O'CHIRISH
  const handleDelete = (id, productName) => { 
    if (window.confirm(`O'chirasizmi: ${productName}?`)) setProducts(products.filter(p => p.id !== id)); 
  };

  // MAVJUD TOVARGA ZAXIRA QO'SHISH (YANGI FUNKSIYA)
  const handleAddStock = (id, currentName, currentUnit) => {
    const val = window.prompt(`Mavjud tovar ustiga kirim qilish:\n\n📦 ${currentName}\nQancha ${currentUnit} qo'shmoqchisiz?`);
    
    // Agar "Otmena" bossa yoki hech narsa yozmasa
    if (val === null || val.trim() === '') return; 
    
    const parsedAmount = parseFloat(val);
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Iltimos, to'g'ri miqdor kiriting!");
      return;
    }

    // Ombordagi mavjud tovarga qo'shish
    setProducts(products.map(p => 
      p.id === id ? { ...p, quantity: p.quantity + parsedAmount } : p
    ));
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => setPage('dashboard')} className="btn" style={{ width: 'auto', padding: '10px 20px', backgroundColor: '#e5e7eb', color: '#1f2937', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ArrowLeft size={18} /> Ortga qaytish
        </button>
        <h2 style={{ fontSize: '24px', color: '#1e3a8a', margin: 0, display: 'flex', gap: '10px', alignItems: 'center' }}>
          Tovarlar ombori <Package size={28} />
        </h2>
      </div>

      <div className="card fade-in" style={{ padding: '30px', backgroundColor: '#1e3a8a', color: '#ffffff', marginBottom: '30px', textAlign: 'center', border: 'none' }}>
        <p style={{ margin: 0, fontSize: '16px', fontWeight: '500', color: '#9ca3af', textTransform: 'uppercase' }}>Ombordagi tovarlar jami qiymati</p>
        <h2 style={{ margin: '10px 0 0 0', fontSize: '42px', fontWeight: 'bold' }}>{totalWarehouseValue.toLocaleString()} <span style={{ fontSize: '20px', color: '#d1d5db' }}>so'm</span></h2>
      </div>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        
        {/* YANGI TOVAR YARATISH FORMASI */}
        <div className="card" style={{ flex: '1 1 350px', borderTop: '4px solid #1e3a8a' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e3a8a', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>Yangi tovar ro'yxatga olish</h3>
          <form onSubmit={handleAddProduct}>
            <input type="text" className="form-control" placeholder="Nomi" value={name} onChange={(e) => setName(e.target.value)} required />
            <select className="form-control" value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="metr">Metr</option><option value="dona">Dona</option><option value="pachka">Pachka</option><option value="kg">KG</option><option value="qop">Qop</option>
            </select>
            
            <input type="number" className="form-control" placeholder="Miqdori" value={quantity} onChange={(e) => setQuantity(e.target.value)} required min="0.001" step="any" />
            <input type="number" className="form-control" placeholder="1 dona narxi (Masalan: 6.200)" value={price} onChange={(e) => setPrice(e.target.value)} required min="0" step="any" />
            
            {quantity && price && <div style={{ padding: '15px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', color: '#1e3a8a' }}>Kirim qilinayotgan summa: {(parseFloat(quantity) * parseFloat(price)).toLocaleString()} so'm</div>}
            
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
              <PlusCircle size={20} /> Omborga qo'shish
            </button>
          </form>
        </div>

        {/* MAVJUD TOVARLAR VA ULARGA QO'SHISH TUGMASI */}
        <div className="card" style={{ flex: '2 1 400px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e3a8a', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>Mavjud tovarlar qoldig'i</h3>
          
          {products.length === 0 ? <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>Ombor hozircha bo'sh.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {products.map(p => (
                <div key={p.id} className="fade-in" style={{ padding: '15px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', position: 'relative' }}>
                  
                  {/* O'chirish tugmasi */}
                  <button onClick={() => handleDelete(p.id, p.name)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Butunlay o'chirish">
                    <Trash2 size={20} />
                  </button>
                  
                  <h4 style={{ margin: 0, color: '#111827', fontSize: '18px', paddingRight: '30px' }}>{p.name}</h4>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '15px' }}>
                    
                    <div style={{ color: '#4b5563', fontSize: '14px', lineHeight: '1.6' }}>
                      Qoldiq: <span style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '16px' }}>{p.quantity} {p.unit}</span> <br/>
                      Narxi: <span style={{ fontWeight: '500', color: '#111827' }}>{p.price.toLocaleString()} so'm</span>
                    </div>
                    
                    {/* USTIGA QO'SHISH TUGMASI (YANGI) */}
                    <button 
                      onClick={() => handleAddStock(p.id, p.name, p.unit)} 
                      className="btn" 
                      style={{ width: 'auto', padding: '10px 15px', fontSize: '14px', backgroundColor: '#e0e7ff', color: '#4338ca', display: 'flex', gap: '6px', alignItems: 'center' }}
                    >
                      <PlusCircle size={18} /> Qo'shish
                    </button>

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