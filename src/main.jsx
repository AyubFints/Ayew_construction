import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // Asosiy App faylimizni chaqiramiz

// React dasturini HTML dagi 'root' degan joyga ulaymiz
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);