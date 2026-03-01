import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Lock, User, LogIn, UserPlus } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Dastur qulay bo'lishi uchun oddiy loginga soxta pochta ulaymiz (Firebase pochta so'raydi)
    const email = `${loginName.trim().toLowerCase()}@dokon.uz`;

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("🎉 Muvaffaqiyatli ro'yxatdan o'tdingiz!");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      // Dasturga kirish App.jsx orqali boshqariladi
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') setError("Login yoki parol xato!");
      else if (err.code === 'auth/email-already-in-use') setError("Bu login band, boshqasini tanlang!");
      else if (err.code === 'auth/weak-password') setError("Parol kamida 6 ta belgi bo'lishi kerak!");
      else setError("Xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', padding: '20px' }}>
      <div className="card fade-in" style={{ maxWidth: '400px', width: '100%', padding: '40px', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', borderTop: '6px solid #1e3a8a' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ width: '70px', height: '70px', backgroundColor: '#e0e7ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto' }}>
            <Lock size={32} color="#1e3a8a" />
          </div>
          <h2 style={{ margin: 0, color: '#1e3a8a', fontSize: '24px' }}>{isRegistering ? "Yangi do'kon ochish" : "Tizimga kirish"}</h2>
          <p style={{ margin: '10px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
            {isRegistering ? "O'zingizga login va parol o'ylab toping" : "O'z loginingiz va parolingizni kiriting"}
          </p>
        </div>

        {error && <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center', fontWeight: '500' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 'bold', color: '#374151', fontSize: '14px' }}>
              <User size={16} /> Login (Foydalanuvchi nomi)
            </label>
            <input type="text" className="form-control" placeholder="Masalan: admin123" value={loginName} onChange={(e) => setLoginName(e.target.value)} required autoFocus />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 'bold', color: '#374151', fontSize: '14px' }}>
              <Lock size={16} /> Parol
            </label>
            <input type="password" className="form-control" placeholder="******" value={password} onChange={(e) => setPassword(e.target.value)} required minLength="6" />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? "Kuting..." : (isRegistering ? <><UserPlus size={20} /> Ro'yxatdan o'tish</> : <><LogIn size={20} /> Kirish</>)}
          </button>
        </form>

        <div style={{ marginTop: '25px', textAlign: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
            {isRegistering ? "Akkauntingiz bormi?" : "Hali ro'yxatdan o'tmaganmisiz?"}
          </p>
          <button onClick={() => { setIsRegistering(!isRegistering); setError(''); }} style={{ background: 'none', border: 'none', color: '#1e3a8a', fontWeight: 'bold', fontSize: '15px', marginTop: '10px', cursor: 'pointer', textDecoration: 'underline' }}>
            {isRegistering ? "Tizimga kirish" : "Yangi akkaunt yaratish"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Login;