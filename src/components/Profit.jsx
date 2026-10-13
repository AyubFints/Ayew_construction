import React, { useState } from 'react';
import { ArrowLeft, TrendingUp, Calendar, DollarSign, Activity, ShoppingBag } from 'lucide-react';

const Profit = ({ sales = [], returns = [], products = [], setPage }) => {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  // Tanlangan oraliqdagi SAVDOLAR
  const filteredSales = sales.filter(sale => {
    if (!sale || !sale.id) return false;
    const saleDate = new Date(sale.id).toISOString().split('T')[0];
    return saleDate >= startDate && saleDate <= endDate;
  });

  // Tanlangan oraliqdagi QAYTISHLAR
  const filteredReturns = returns.filter(ret => {
    if (!ret || !ret.id) return false;
    const retDate = new Date(ret.id).toISOString().split('T')[0];
    return retDate >= startDate && retDate <= endDate;
  });

  let totalProfitSom = 0;
  let totalProfitUsd = 0;
  let totalRevenueSom = 0; 
  let totalRevenueUsd = 0;

  const flatActivityList = [];

  // ================= 1. SAVDOLARNI HISOBLASH (QO'SHISH) =================
  filteredSales.forEach(sale => {
    if (sale.cartItems && Array.isArray(sale.cartItems)) {
      sale.cartItems.forEach(cartItem => {
        if (!cartItem || !cartItem.product) return;

        const cost = cartItem.product.costPrice || 0; 
        const price = cartItem.price || cartItem.product.price || 0; 
        const qty = cartItem.qty || 0; 
        
        const unit = cartItem.product.unit || '';
        const isUsd = (unit === 'kv' || unit.includes('$'));

        const profit = (price - cost) * qty;
        const revenue = price * qty;

        if (isUsd) {
          totalProfitUsd += profit;
          totalRevenueUsd += revenue;
        } else {
          totalProfitSom += profit;
          totalRevenueSom += revenue;
        }

        flatActivityList.push({
          date: sale.id,
          customer: sale.customer || 'Chakana xaridor',
          productName: cartItem.product.name || 'Noma\'lum tovar',
          qty: qty,
          unit: unit,
          costPrice: cost,
          price: price,
          profit: profit, 
          isUsd: isUsd,
          type: 'sale' 
        });
      });
    }
  });

  // ================= 2. QAYTISHLARNI HISOBLASH (AYIRISH VA ESKI VOZVRATLARNI TOPISH) =================
  filteredReturns.forEach(ret => {
    
    // AGAR YANGI VOZVRAT BO'LSA (cartItems bor bo'lsa)
    if (ret.cartItems && Array.isArray(ret.cartItems) && ret.cartItems.length > 0) {
      ret.cartItems.forEach(cartItem => {
        if (!cartItem || !cartItem.product) return;

        const cost = cartItem.product.costPrice || 0;
        const returnPrice = cartItem.price || cartItem.product.price || 0; 
        const qty = cartItem.qty || 0; 
        
        const unit = cartItem.product.unit || '';
        const isUsd = (unit === 'kv' || unit.includes('$'));

        const lostProfit = (returnPrice - cost) * qty;
        const lostRevenue = returnPrice * qty;

        if (isUsd) {
          totalProfitUsd -= lostProfit;
          totalRevenueUsd -= lostRevenue;
        } else {
          totalProfitSom -= lostProfit;
          totalRevenueSom -= lostRevenue;
        }

        flatActivityList.push({
          date: ret.id,
          customer: ret.customer || 'Chakana xaridor',
          productName: cartItem.product.name,
          qty: qty,
          unit: unit,
          costPrice: cost,
          price: returnPrice,
          profit: -lostProfit, 
          isUsd: isUsd,
          type: 'return' 
        });
      });
    } 
    // AGAR ESKI VOZVRAT BO'LSA (Yozuv ko'rinishidagi ma'lumot)
    else if (ret.productName) {
      const isUsd = ret.unit === 'kv' || (ret.unit && ret.unit.includes('$'));
      const returnTotalSum = ret.returnSumSom || ret.returnSumUsd || ret.returnSum || 0;
      
      // Eski tovar ismini tozalash va aslini topish
      let cleanName = ret.productName;
      if (cleanName.includes('•')) cleanName = cleanName.split('—')[0].replace('•', '').trim();
      
      // Ombordan tovarning asl tan narxini va sotuv narxini aniqlaymiz
      const foundProduct = products.find(p => p.name.toLowerCase().trim() === cleanName.toLowerCase().trim());
      
      const cost = foundProduct ? (foundProduct.costPrice || 0) : 0;
      const price = foundProduct ? (foundProduct.price || 0) : 0;
      
      // Miqdorini aniqlash (Umumiy summani narxga bo'lib qancha donaligini bilamiz)
      let qty = 1;
      if (price > 0 && returnTotalSum > 0) {
        qty = returnTotalSum / price;
      }

      const lostProfit = (price - cost) * qty;
      const lostRevenue = returnTotalSum;

      if (isUsd) {
        totalProfitUsd -= lostProfit;
        totalRevenueUsd -= lostRevenue;
      } else {
        totalProfitSom -= lostProfit;
        totalRevenueSom -= lostRevenue;
      }

      flatActivityList.push({
        date: ret.id,
        customer: ret.customer || 'Chakana xaridor',
        productName: cleanName,
        qty: parseFloat(qty.toFixed(2)),
        unit: ret.unit || 'dona',
        costPrice: cost,
        price: price,
        profit: -lostProfit,
        isUsd: isUsd,
        type: 'return' 
      });
    }
  });

  flatActivityList.sort((a, b) => b.date - a.date);

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
            Vozvratdan keyingi tushum: {totalRevenueSom.toLocaleString()} so'm
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
            Vozvratdan keyingi tushum: {totalRevenueUsd.toLocaleString()} $
          </p>
        </div>

      </div>

      <div className="card" style={{ padding: '20px', backgroundColor: '#ffffff' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingBag size={20} color="#4b5563"/> Davrdagi harakatlar va minus qilingan foydalar
        </h3>

        {flatActivityList.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px 0' }}>Bu sanalarda sotuv yoki vozvrat amaliyoti topilmadi.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6', color: '#374151', fontSize: '14px' }}>
                  <th style={{ padding: '12px', borderBottom: '2px solid #d1d5db' }}>Harakat</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #d1d5db' }}>Sana & Vaqt</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #d1d5db' }}>Xaridor</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #d1d5db' }}>Mahsulot</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #d1d5db' }}>Miqdori</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #d1d5db', textAlign: 'right', color: '#059669' }}>Foyda / Zarar</th>
                </tr>
              </thead>
              <tbody>
                {flatActivityList.map((item, idx) => {
                  const cur = item.isUsd ? '$' : "so'm";
                  const isReturn = item.type === 'return';

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb', fontSize: '14px', backgroundColor: isReturn ? '#fef2f2' : 'transparent' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: isReturn ? '#ef4444' : '#10b981' }}>
                        {isReturn ? 'Qaytarildi' : 'Sotildi'}
                      </td>
                      <td style={{ padding: '12px', color: '#6b7280' }}>
                        {new Date(item.date).toLocaleString('uz-UZ', {day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit'})}
                      </td>
                      <td style={{ padding: '12px', color: '#4b5563' }}>{item.customer}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#111827' }}>{item.productName}</td>
                      <td style={{ padding: '12px' }}>{item.qty} {item.unit}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: isReturn ? '#ef4444' : '#10b981' }}>
                        {isReturn ? '' : '+'}{item.profit.toLocaleString()} {cur}
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