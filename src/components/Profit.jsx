import React, { useState } from 'react';
import { ArrowLeft, TrendingUp, Calendar, DollarSign, Activity, ShoppingBag } from 'lucide-react';

const Profit = ({ sales = [], setPage }) => {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  // Tanlangan oraliqdagi barcha savdolarni ajratib olish
  const filteredSales = sales.filter(sale => {
    if (!sale.id) return false;
    const saleDate = new Date(sale.id).toISOString().split('T')[0];
    return saleDate >= startDate && saleDate <= endDate;
  });

  // Tushum va Foydani hisoblash uchun
  let totalProfitSom = 0;
  let totalProfitUsd = 0;
  let totalRevenueSom = 0; 
  let totalRevenueUsd = 0;

  // Jadval uchun tovarlarni bittalab chaqib olish ro'yxati
  const flatSalesList = [];

  filteredSales.forEach(sale => {
    // Agar savdo ichida savatcha (cartItems) bo'lsa, ularni bittalab o'qiymiz
    if (sale.cartItems && sale.cartItems.length > 0) {
      sale.cartItems.forEach(cartItem => {
        const cost = cartItem.product.costPrice || 0; // Olingan narx
        const price = cartItem.product.price || 0; // Sotilgan narx
        const qty = cartItem.qty || 0; 
        
        const isUsd = (cartItem.product.unit === 'kv' || cartItem.product.unit.includes('$'));

        const profit = (price - cost) * qty;
        const revenue = price * qty;

        if (isUsd) {
          totalProfitUsd += profit;
          totalRevenueUsd += revenue;
        } else {
          totalProfitSom += profit;
          totalRevenueSom += revenue;
        }

        flatSalesList.push({
          date: sale.id,
          customer: sale.customer,
          productName: cartItem.product.name,
          qty: qty,
          unit: cartItem.product.unit,
          costPrice: cost,
          price: price,
          profit: profit,
          isUsd: isUsd
        });
      });
    }
  });

  // Eng so'nggi sotilganlar birinchi turishi uchun saralaymiz
  flatSalesList.sort((a, b) => b.date - a.date);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => setPage('dashboard')} className="btn" style={{ width: 'auto', padding: '10px 20px', backgroundColor: '#e5e7eb', color: '#1f2937', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ArrowLeft size={18} /> Ortga qaytish
        </button>
        <h2 style={{ fontSize: '24px', color: '#059669', margin: 0, display: 'flex', gap: '10px', alignItems: 'center' }}>
          Foyda va Statistika <TrendingUp size={28} />
        </h2>
      </div>

      <div className="card" style={{ padding: '20px', marginBottom: '20px', backgroundColor: '#ffffff', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#4b5563', fontWeight: 'bold' }}>
          <Calendar size={20} /> Davrni tanlang:
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}
          />
          <span style={{ color: '#6b7280' }}>dan</span>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '30px' }}>
        
        <div className="card fade-in" style={{ flex: '1 1 300px', padding: '25px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderLeft: '5px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#047857' }}>SOF FOYDA (So'mda)</p>
            <Activity size={24} color="#10b981" />
          </div>
          <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#065f46' }}>
            {totalProfitSom.toLocaleString()} <span style={{ fontSize: '18px', color: '#059669' }}>so'm</span>
          </h2>
          <p style={{ margin: '10px 0 0 0', fontSize: '13px', color: '#059669' }}>
            Umumiy savdo tushumi: {totalRevenueSom.toLocaleString()} so'm
          </p>
        </div>

        <div className="card fade-in" style={{ flex: '1 1 300px', padding: '25px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderLeft: '5px solid #0ea5e9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#0369a1' }}>SOF FOYDA (Dollarda)</p>
            <DollarSign size={24} color="#0ea5e9" />
          </div>
          <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#075985' }}>
            {totalProfitUsd.toLocaleString()} <span style={{ fontSize: '18px', color: '#0284c7' }}>$</span>
          </h2>
          <p style={{ margin: '10px 0 0 0', fontSize: '13px', color: '#0284c7' }}>
            Umumiy savdo tushumi: {totalRevenueUsd.toLocaleString()} $
          </p>
        </div>

      </div>

      <div className="card" style={{ padding: '20px', backgroundColor: '#ffffff' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingBag size={20} color="#4b5563"/> Tanlangan davrdagi sotuvlardan foyda
        </h3>

        {flatSalesList.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px 0' }}>Bu sanalarda sotuv amaliyoti topilmadi.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6', color: '#374151', fontSize: '14px' }}>
                  <th style={{ padding: '12px', borderBottom: '2px solid #d1d5db' }}>Sana & Vaqt</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #d1d5db' }}>Xaridor</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #d1d5db' }}>Mahsulot</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #d1d5db' }}>Miqdori</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #d1d5db' }}>Tan narxi</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #d1d5db' }}>Sotildi</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #d1d5db', textAlign: 'right', color: '#059669' }}>Sof Foyda</th>
                </tr>
              </thead>
              <tbody>
                {flatSalesList.map((sale, idx) => {
                  const cur = sale.isUsd ? '$' : "so'm";

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb', fontSize: '14px' }}>
                      <td style={{ padding: '12px', color: '#6b7280' }}>
                        {new Date(sale.date).toLocaleString('uz-UZ', {day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit'})}
                      </td>
                      <td style={{ padding: '12px', color: '#4b5563' }}>{sale.customer}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#111827' }}>{sale.productName}</td>
                      <td style={{ padding: '12px' }}>{sale.qty} {sale.unit}</td>
                      <td style={{ padding: '12px', color: '#ef4444' }}>{sale.costPrice.toLocaleString()} {cur}</td>
                      <td style={{ padding: '12px', color: '#3b82f6' }}>{sale.price.toLocaleString()} {cur}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>
                        +{sale.profit.toLocaleString()} {cur}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profit;