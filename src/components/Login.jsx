import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'Ayew_qur' && password === 'ayew_AX') {
      localStorage.setItem('isLoggedIn', 'true');
      onLogin();
    } else {
      setError('Login yoki parol noto\'g\'ri!');
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '400px', margin: '80px auto' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', color: '#1f2937', marginBottom: '10px' }}>Xush kelibsiz!</h2>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Dasturga kirish uchun ma'lumotlarni kiriting</p>
        </div>

        <form onSubmit={handleLogin}>
          <input type="text" className="form-control" placeholder="Login" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input type="password" className="form-control" placeholder="Parol" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '15px', textAlign: 'center' }}>{error}</p>}
          <button type="submit" className="btn btn-primary">Dasturga kirish</button>
        </form>

        <div style={{ marginTop: '30px', textAlign: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
          <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '15px', lineHeight: '1.5' }}>
            Login va parolni bilish va dasturga kirish uchun administratorga murojaat qiling.
          </p>
          <a href="https://t.me/xaamiitov" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'white', backgroundColor: '#0088cc', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}>
            ✈️ Telegram orqali yozish
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;