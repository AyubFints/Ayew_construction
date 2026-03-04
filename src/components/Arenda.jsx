import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Calendar, BarChart3, Clock, TrendingDown, ChevronRight } from 'lucide-react';

const Arenda = ({ arenda = [], setArenda, setPage }) => {
  const [type, setType] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [filter, setFilter] = useState('month'); // day, month, year, history

  const now = new Date();
  const todayStr = now.toLocaleDateString();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // --- MANTIQ: FILTRLASH ---
  const filteredData = arenda.filter(item => {
    const d = new Date(item.timestamp);
    if (filter === 'day') return d.toLocaleDateString() === todayStr;
    if (filter === 'month') return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    if (filter === 'year') return d.getFullYear() === currentYear;
    return true; // History uchun hamma ma'lumotlar
  });

  // --- STATISTIKA HISOB-KITOBI ---
  const stats = {
    today: arenda.filter(i => new Date(i.timestamp).toLocaleDateString() === todayStr)
                .reduce((s, i) => s + i.amount, 0),
    month: arenda.filter(i => new Date(i.timestamp).getMonth() === currentMonth && new Date(i.timestamp).getFullYear() === currentYear)
                .reduce((s, i) => s + i.amount, 0),
    year: arenda.filter(i => new Date(i.timestamp).getFullYear() === currentYear)
                .reduce((s, i) => s + i.amount, 0),
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!type || !amount) return alert("Ma'lumotlarni to'liq kiriting!");

    const newExpense = {
      id: Date.now(),
      type,
      amount: parseFloat(amount),
      note,
      date: todayStr,
      timestamp: new Date().getTime(),
    };

    setArenda([newExpense, ...arenda]);
    setType(''); setAmount(''); setNote('');
  };

  return (
    <div className="arenda-container" style={containerStyle}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate { animation: fadeIn 0.4s ease-out forwards; }
        .card-hover { transition: all 0.3s ease; }
        .card-hover:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
        .tab-active { background: #1e3a8a !important; color: white !important; }
      `}</style>

      {/* TEPPA QISM */}
      <div style={headerStyle}>
        <button onClick={() => setPage('dashboard')} style={backBtnStyle} className="card-hover">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 style={{ margin: 0, color: '#1e3a8a' }}>Chiqimlar Nazorati</h2>
          <span style={{ fontSize: '12px', color: '#64748b' }}>{todayStr} holatiga ko'ra</span>
        </div>
      </div>

      {/* STATISTIKA VIDJETLARI (KUN, OY, YIL) */}
      <div style={statsGridStyle}>
        <div style={statCardStyle('#eff6ff', '#1e3a8a')} className="card-hover animate">
          <span style={statLabelStyleText}>Bugun</span>
          <h3 style={statValueStyle}>{stats.today.toLocaleString()}</h3>
        </div>
        <div style={statCardStyle('#fff1f2', '#be123c')} className="card-hover animate">
          <span style={statLabelStyleText}>Shu oy</span>
          <h3 style={statValueStyle}>{stats.month.toLocaleString()}</h3>
        </div>
        <div style={statCardStyle('#f0fdf4', '#15803d')} className="card-hover animate">
          <span style={statLabelStyleText}>Shu yil</span>
          <h3 style={statValueStyle}>{stats.year.toLocaleString()}</h3>
        </div>
      </div>

      {/* FILTRLAR (TABS) */}
      <div style={tabBoxStyle}>
        {['day', 'month', 'year', 'history'].map((t) => (
          <button 
            key={t}
            onClick={() => setFilter(t)}
            style={tabItemStyle}
            className={filter === t ? 'tab-active' : ''}
          >
            {t === 'day' && 'Kunlik'}
            {t === 'month' && 'Oylik'}
            {t === 'year' && 'Yillik'}
            {t === 'history' && 'Tarix'}
          </button>
        ))}
      </div>

      {/* QO'SHISH FORMASI */}
      <div style={formBoxStyle} className="animate">
        <h4 style={{margin: '0 0 15px 0', display:'flex', alignItems:'center', gap:'8px'}}>
          <Plus size={18} color="#1e3a8a"/> Yangi xarajat
        </h4>
        <form onSubmit={handleAdd} style={formInputGrid}>
          <input type="text" placeholder="Turi (Gaz, Suv...)" value={type} onChange={e => setType(e.target.value)} style={inputFieldStyle} />
          <input type="number" placeholder="Summa" value={amount} onChange={e => setAmount(e.target.value)} style={inputFieldStyle} />
          <input type="text" placeholder="Izoh" value={note} onChange={e => setNote(e.target.value)} style={inputFieldStyle} />
          <button type="submit" style={saveBtnStyle} className="card-hover">Saqlash</button>
        </form>
      </div>

      {/* RO'YXAT */}
      <div className="animate" style={{marginTop: '20px'}}>
        <h4 style={{color: '#475569', marginBottom: '10px'}}>Yozuvlar ({filteredData.length})</h4>
        {filteredData.length > 0 ? filteredData.map(item => (
          <div key={item.id} style={listItemStyle} className="card-hover">
            <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={iconBoxStyle}><TrendingDown size={18} color="#be123c"/></div>
              <div>
                <div style={{fontWeight:'bold', color:'#1e293b'}}>{item.type}</div>
                <div style={{fontSize:'12px', color:'#94a3b8'}}>{item.date} • {item.note || 'Izohsiz'}</div>
              </div>
            </div>
            <div style={{textAlign:'right', display:'flex', alignItems:'center', gap:'12px'}}>
              <span style={{fontWeight:'bold', color:'#b91c1c'}}>-{item.amount.toLocaleString()}</span>
              <button onClick={() => setArenda(arenda.filter(i => i.id !== item.id))} style={deleteBtnStyle}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )) : (
          <div style={emptyStateStyle}>Ma'lumot topilmadi</div>
        )}
      </div>
    </div>
  );
};

// --- MODERN STILLAR ---
const containerStyle = { padding: '20px', maxWidth: '500px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' };
const headerStyle = { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' };
const backBtnStyle = { border: 'none', background: '#fff', width: '40px', height: '40px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' };
const statsGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' };
const statCardStyle = (bg, color) => ({ background: bg, padding: '12px', borderRadius: '16px', border: `1px solid ${bg}`, textAlign: 'center' });
const statLabelStyleText = { fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: '600' };
const statValueStyle = { margin: 0, fontSize: '14px', color: '#1e293b' };
const tabBoxStyle = { display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '12px', marginBottom: '20px' };
const tabItemStyle = { flex: 1, padding: '8px', border: 'none', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', transition: '0.3s', color: '#475569' };
const formBoxStyle = { background: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' };
const formInputGrid = { display: 'flex', flexDirection: 'column', gap: '10px' };
const inputFieldStyle = { padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', background: '#fcfcfc' };
const saveBtnStyle = { padding: '12px', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' };
const listItemStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#fff', borderRadius: '16px', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' };
const iconBoxStyle = { background: '#fff1f2', padding: '10px', borderRadius: '12px' };
const deleteBtnStyle = { border: 'none', background: 'none', color: '#cbd5e1', cursor: 'pointer' };
const emptyStateStyle = { textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' };

export default Arenda;