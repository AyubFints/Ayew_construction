import React, { useState } from 'react';
import { Package, ArrowLeft, Trash2, PlusCircle } from 'lucide-react';

const Products = ({ products, setProducts, setPage }) => {
  const [name, setName] = useState(''); const [unit, setUnit] = useState('metr'); const [quantity, setQuantity] = useState(''); const [price, setPrice] = useState('');
  const totalWarehouseValue = products.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0);

  const handleAddProduct = (e) => {
    e.preventDefault();
    setProducts([...products, { id: Date.now(), name, unit, quantity: parseFloat(quantity), price: parseFloat(price) }]);
    setName(''); setQuantity(''); setPrice('');
  };
  
  const handleDelete = (id, productName) => { 
    if (window.confirm(`O'chirasizmi: ${productName}?`)) setProducts(products.filter(p => p.id !== id)); 
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
        <p style={{ margin: 0, fontSize: '16px', fontWeight: '500', color: '#9ca3af', textTransform: 'uppercase' }}>Ombordagi tovarlar qiymati</p>
        <h2 style={{ margin: '10px 0 0 0', fontSize: '42px', fontWeight: 'bold' }}>{totalWarehouseValue.toLocaleString()} <span style={{ fontSize: '20px', color: '#d1d5db' }}>so'm</span></h2>
      </div>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: '1 1 350px', borderTop: '4px solid #1e3a8a' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e3a8a', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>Yangi tovar</h3>
          <form onSubmit={handleAddProduct}>
            <input type="text" className="form-control" placeholder="Nomi" value={name} onChange={(e) => setName(e.target.value)} required />
            <select className="form-control" value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="metr">Metr</option><option value="dona">Dona</option><option value="pachka">Pachka</option><option value="kg">KG</option><option value="qop">Qop</option>
            </select>
            <input type="number" className="form-control" placeholder="Miqdori" value={quantity} onChange={(e) => setQuantity(e.target.value)} required min="0.1" step="any" />
            <input type="number" className="form-control" placeholder="1 dona narxi" value={price} onChange={(e) => setPrice(e.target.value)} required min="1" />
            
            {quantity && price && <div style={{ padding: '15px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', color: '#1e3a8a' }}>Umumiy: {(parseFloat(quantity) * parseFloat(price)).toLocaleString()} so'm</div>}
            
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
              <PlusCircle size={20} /> Omborga qo'shish
            </button>
          </form>
        </div>

        <div className="card" style={{ flex: '2 1 400px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e3a8a', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>Mavjud tovarlar</h3>
          {products.length === 0 ? <p style={{ color: '#6b7280' }}>Ombor bo'sh.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {products.map(p => (
                <div key={p.id} style={{ padding: '15px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', position: 'relative' }}>
                  <button onClick={() => handleDelete(p.id, p.name)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash2 size={20} />
                  </button>
                  <h4 style={{ margin: 0, color: '#111827', fontSize: '16px' }}>{p.name}</h4>
                  <div style={{ color: '#4b5563', fontSize: '14px', marginTop: '8px' }}>Qoldiq: <span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>{p.quantity} {p.unit}</span> | Narxi: {p.price.toLocaleString()}</div>
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