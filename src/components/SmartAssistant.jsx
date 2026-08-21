import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Edit2, X, Send } from 'lucide-react';

const SmartAssistant = ({ page, setPage, sales, products, customers }) => {
  const [isListening, setIsListening] = useState(false);
  const [isDetectingSound, setIsDetectingSound] = useState(false); 
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showWaveform, setShowWaveform] = useState(false);
  const [isAwaitingCommand, setIsAwaitingCommand] = useState(false); 
  
  const [isHovered, setIsHovered] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [manualText, setManualText] = useState('');
  
  const [spokenText, setSpokenText] = useState('');
  
  const recognitionRef = useRef(null);
  const awaitingCommandRef = useRef(false);
  const resetTimerRef = useRef(null);
  const inactivityTimerRef = useRef(null);
  
  const todayStr = new Date().toLocaleDateString('uz-UZ');

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const formatPul = (summa) => {
    if (!summa || summa === 0) return "0";
    const million = Math.floor(summa / 1000000);
    const ming = Math.floor((summa % 1000000) / 1000);
    const qoldiq = summa % 1000;

    let res = [];
    if (million > 0) res.push(`${million} million`);
    if (ming > 0) res.push(`${ming} ming`);
    if (qoldiq > 0 && million === 0) res.push(`${qoldiq}`);
    
    return res.length > 0 ? res.join(" ") : "0";
  };

  const turnOffMicrophone = (autoOff = false) => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
    setIsDetectingSound(false);
    setIsAwaitingCommand(false);
    awaitingCommandRef.current = false;
    clearTimeout(inactivityTimerRef.current);
    
    if (autoOff) speak("Kutish rejimiga o'tdim.");
  };

  // HISOBOTNI TO'LIQ TO'XTATISH VA YOPISH (X tugmasi uchun)
  const stopEverything = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setShowWaveform(false);
    setSpokenText('');
  };

  const resetInactivityTimer = () => {
    clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      turnOffMicrophone(true); 
    }, 120000); 
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'uz-UZ'; 

      recognition.onspeechstart = () => {
        setIsDetectingSound(true);
        resetInactivityTimer(); 
      };
      
      recognition.onspeechend = () => setIsDetectingSound(false);

      recognition.onresult = (event) => {
        setIsDetectingSound(false);
        resetInactivityTimer(); 
        
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript.toLowerCase().trim();
        processCommand(transcript);
      };

      recognition.onerror = (event) => turnOffMicrophone();

      recognition.onend = () => {
        setIsDetectingSound(false);
        if (isListening) recognition.start();
      };

      recognitionRef.current = recognition;
    }
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      clearTimeout(resetTimerRef.current);
      clearTimeout(inactivityTimerRef.current);
    };
  }, [isListening, page, sales]);

  const toggleListen = () => {
    if (isListening) {
      turnOffMicrophone(false); 
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
      setIsAwaitingCommand(true);
      awaitingCommandRef.current = true;
      speak("Eshitaman, nima yordam kerak?");
      resetInactivityTimer(); 
    }
  };

  const speak = (text, fullScreen = false) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); 
      setSpokenText(text);

      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const bestVoice = voices.find(v => v.lang.includes('uz') && v.name.includes('Google')) || 
                        voices.find(v => v.lang.includes('uz')) || voices[0];
      if (bestVoice) utterance.voice = bestVoice;
      utterance.lang = 'uz-UZ'; 
      utterance.rate = 0.85; 
      utterance.pitch = 1.0; 

      utterance.onstart = () => {
        setIsSpeaking(true);
        if (fullScreen) setShowWaveform(true);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setShowWaveform(false);
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  const processCommand = (text, isManual = false) => {
    const textLower = text.toLowerCase();
    const wakeWords = ["smart dokon", "smart do'kon", "smart do‘kon", "smart do kon", "smart", "dokon"];
    const usedWakeWord = wakeWords.find(w => textLower.includes(w));

    let commandText = textLower;
    let isTriggered = false;

    if (usedWakeWord && !isManual) {
      isTriggered = true;
      commandText = textLower.replace(usedWakeWord, '').trim();
    }

    if (isManual || awaitingCommandRef.current || isTriggered) {
      clearTimeout(resetTimerRef.current);
      awaitingCommandRef.current = false;
      setIsAwaitingCommand(false);

      if (commandText === '' && isTriggered) {
        awaitingCommandRef.current = true;
        setIsAwaitingCommand(true);
        speak("Eshitaman, nima yordam kerak?");
        resetTimerRef.current = setTimeout(() => {
          awaitingCommandRef.current = false;
          setIsAwaitingCommand(false);
        }, 10000);
        return; 
      }

      const target = (commandText || textLower);
      const hasWord = (wordsArr) => wordsArr.some(w => target.includes(w));

      const isQarz = hasWord(["qarz", "qars", "xarz", "qariz"]);
      const isSavdo = hasWord(["savdo", "savda", "kassa", "bugun", "bugum"]);
      const isHisobotOrAction = hasWord(["hisobot", "hissobot", "xisobot", "xissobot", "qancha", "jami", "kim", "ayt", "bor", "ber", "korsat"]);
      const isSotuv = hasWord(["sotuv", "satuv", "stuv", "sotish"]);
      const isOmbor = hasWord(["ombor", "anbor", "onbor", "tovar", "tavar"]);
      const isYordam = hasWord(["tushuntir", "tushintir", "nima bu", "joy"]);

      let matchedAction = null;

      if (isQarz && isHisobotOrAction) matchedAction = 'qarz_hisobot';
      else if (isSavdo && isHisobotOrAction) matchedAction = 'savdo_hisobot';
      else if (isSotuv) matchedAction = 'sotuv_kir';
      else if (isQarz) matchedAction = 'qarz_kir';
      else if (isOmbor) matchedAction = 'ombor_kir';
      else if (isYordam) matchedAction = 'yordam';
      else if (isSavdo) matchedAction = 'savdo_hisobot'; 

      if (matchedAction === 'qarz_hisobot') {
          const debts = sales.filter(s => s.isDebt);
          const jamiQarz = debts.reduce((acc, curr) => acc + (curr.totalSum - (curr.paidAmount || 0)), 0);
          
          let customerDebtsMap = {};
          debts.forEach(s => {
            const cName = s.customerName || "Noma'lum mijoz";
            const qoldiq = s.totalSum - (s.paidAmount || 0);
            customerDebtsMap[cName] = (customerDebtsMap[cName] || 0) + qoldiq;
          });

          let detailsArr = Object.entries(customerDebtsMap).map(([name, sum]) => `• ${name}: ${formatPul(sum)} so'm`);
          let detailsText = detailsArr.length > 0 ? "\n\nQarzdorlar ro'yxati:\n" + detailsArr.join("\n") : "\n\nHozircha qarzdorlar yo'q.";

          speak(`Qarzlar hisoboti.\n\nDo'konning jami olinmagan qarzlari: ${formatPul(jamiQarz)} so'mni tashkil etadi.${detailsText}`, true);
      }
      else if (matchedAction === 'savdo_hisobot') {
          const todaysSales = sales.filter(s => new Date(s.id).toLocaleDateString('uz-UZ') === todayStr);
          const jamiSumma = todaysSales.reduce((acc, curr) => acc + curr.totalSum, 0);

          let salesDetails = todaysSales.map((sale, index) => {
            const client = sale.customerName || "Naqd xaridor";
            const itemsList = sale.items ? sale.items.map(i => `${i.name || i.productName} (${i.qty || i.quantity || 1} dona)`).join(", ") : "Tovar";
            return `${index + 1}. Mijoz: ${client} | Tovarlar: ${itemsList} | Jami: ${formatPul(sale.totalSum)} so'm`;
          });

          let salesText = salesDetails.length > 0 ? "\n\nBugungi xaridlar tafsiloti:\n" + salesDetails.join("\n") : "\n\nBugun hali savdo bo'lmadi.";

          speak(`Bugungi savdo hisoboti.\n\nJami ${todaysSales.length} ta xarid bo'ldi. Umumiy aylanma: ${formatPul(jamiSumma)} so'm.${salesText}`, true);
      }
      else if (matchedAction === 'sotuv_kir') {
          setPage('sell'); speak("Sotuv bo'limiga kiryapman.");
      }
      else if (matchedAction === 'qarz_kir') {
          setPage('debts'); speak("Qarz daftari ochilmoqda.");
      }
      else if (matchedAction === 'ombor_kir') {
          setPage('products'); speak("Ombor bo'limiga o'tdim.");
      }
      else if (matchedAction === 'yordam') {
          if (page === 'dashboard') speak("Bu bosh sahifa. Bu yerda do'konning umumiy holati va kassa ko'rsatiladi.");
          else if (page === 'sell') speak("Bu sotuv bo'limi. Bu yerda mijozlarga tovar sotishingiz mumkin.");
          else if (page === 'debts') speak("Bu qarz daftari. Mijozlarning qarzlari shu yerda saqlanadi.");
          else speak("Siz dastur ichidasiz.");
      }
      else {
          speak("Kechirasiz, men buni tushunmadim. Qaytadan ayting.");
      }
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualText.trim() !== '') {
      setShowTextInput(false);
      processCommand(manualText, true); 
      setManualText('');
      if (isListening) resetInactivityTimer(); 
    }
  };

  const handleQuickCommand = (cmdText) => {
    setShowTextInput(false);
    processCommand(cmdText, true);
    if (isListening) resetInactivityTimer(); 
  };

  const getAnimation = () => {
    if (isSpeaking) return 'rainbow-speaking 1s infinite';
    if (isAwaitingCommand) return 'pulse-awaiting 1.5s infinite';
    if (isDetectingSound) return 'color-shift-idle 10s infinite, ripple-detecting 0.6s infinite'; 
    if (isListening) return 'color-shift-idle 10s infinite'; 
    return 'none';
  };

  return (
    <>
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'
        }}
      >
        <div 
          onClick={toggleListen}
          style={{
            width: '55px', height: '55px', borderRadius: '50%',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            color: 'white', cursor: 'pointer', transition: 'all 0.3s ease',
            backgroundColor: (!isListening && !isSpeaking) ? '#1e3a8a' : undefined,
            animation: getAnimation(),
          }}
        >
          {isListening ? <Mic size={26} /> : <MicOff size={26} />}
        </div>

        <div 
          onClick={() => setShowTextInput(true)}
          style={{
            width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#10b981',
            color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center',
            cursor: 'pointer', opacity: isHovered ? 1 : 0, visibility: isHovered ? 'visible' : 'hidden',
            transform: isHovered ? 'translateY(0)' : 'translateY(-15px)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
          }}
          title="Qo'lda yozish"
        >
          <Edit2 size={18} />
        </div>
      </div>

      {showTextInput && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 10000,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div className="fade-in" style={{
            backgroundColor: 'white', padding: '20px', borderRadius: '15px', 
            width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={20}/> Matnli buyruq
              </h3>
              <button onClick={() => setShowTextInput(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                <X size={24}/>
              </button>
            </div>
            
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input 
                type="text" 
                autoFocus
                placeholder="Buyruq yozing..."
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                style={{
                  width: '100%', padding: '12px 15px', borderRadius: '8px', 
                  border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none'
                }}
              />
              <button type="submit" style={{
                backgroundColor: '#10b981', color: 'white', border: 'none', 
                padding: '12px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold',
                cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
              }}>
                <Send size={18}/> Jo'natish
              </button>
            </form>

            <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 10px 0' }}>Yoki tayyor buyruqlardan birini tanlang:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  "Bugungi savdo hisobotini ber", 
                  "Jami qarzlar qancha?", 
                  "Sotuv bo'limiga kirish", 
                  "Omborga kirish"
                ].map(cmd => (
                  <span 
                    key={cmd} 
                    onClick={() => handleQuickCommand(cmd)}
                    style={{
                      padding: '8px 12px', backgroundColor: '#f1f5f9', color: '#1e3a8a', 
                      borderRadius: '20px', fontSize: '13px', cursor: 'pointer', border: '1px solid #cbd5e1',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#e2e8f0'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                  >
                    {cmd}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* HISOBOT OYNASI VA X TUGMASI */}
      {showWaveform && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.85)', 
          backdropFilter: 'blur(5px)', 
          zIndex: 9998, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', padding: '20px',
        }}>
          
          {/* OYNA ICHIDAGI MATN VA X TUGMASI */}
          <div style={{
            maxWidth: '650px', width: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            padding: '25px', borderRadius: '15px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            marginBottom: '30px',
            maxHeight: '65vh', 
            overflowY: 'auto',
            position: 'relative'
          }}>
            {/* QIZIL X TUGMASI */}
            <button 
              onClick={stopEverything}
              style={{
                position: 'sticky', top: '0', float: 'right',
                backgroundColor: '#ef4444', color: 'white', border: 'none',
                borderRadius: '50%', width: '36px', height: '36px',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                zIndex: 10
              }}
              title="To'xtatish va yopish"
            >
              <X size={20} />
            </button>

            <p style={{ 
              color: '#ffffff', fontSize: '17px', lineHeight: '1.6', 
              margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'sans-serif', clear: 'both' 
            }}>
              {spokenText}
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '50px' }}>
            {[...Array(15)].map((_, i) => (
              <div 
                key={i}
                style={{
                  width: '8px', backgroundColor: '#3b82f6', borderRadius: '10px',
                  animation: `waveform-bounce ${0.5 + Math.random()}s infinite alternate ease-in-out`,
                  animationDelay: `${Math.random()}s`
                }}
              />
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes color-shift-idle {
          0%   { background-color: #1e3a8a; transform: scale(1); } 
          20%  { background-color: #10b981; transform: scale(1); } 
          40%  { background-color: #38bdf8; transform: scale(1); } 
          60%  { background-color: #000000; transform: scale(1); } 
          80%  { background-color: #f97316; transform: scale(1); } 
          100% { background-color: #1e3a8a; transform: scale(1); } 
        }

        @keyframes ripple-detecting {
          0%   { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
          50%  { transform: scale(1.1); box-shadow: 0 0 0 8px rgba(255, 255, 255, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
        }

        @keyframes pulse-awaiting {
          0%   { background-color: #f59e0b; box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.8); }
          70%  { background-color: #f59e0b; box-shadow: 0 0 0 15px rgba(245, 158, 11, 0); }
          100% { background-color: #f59e0b; box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }

        @keyframes rainbow-speaking {
          0%   { transform: scale(0.9); background-color: #3b82f6; box-shadow: 0 0 20px #3b82f6; }
          50%  { transform: scale(1.15); background-color: #06b6d4; box-shadow: 0 0 35px #06b6d4; }
          100% { transform: scale(0.9); background-color: #3b82f6; box-shadow: 0 0 20px #3b82f6; }
        }

        @keyframes waveform-bounce {
          0%   { height: 10px; opacity: 0.5; background-color: #3b82f6; }
          100% { height: 50px; opacity: 1; background-color: #60a5fa; box-shadow: 0 0 10px #60a5fa; }
        }
      `}</style>
    </>
  );
};

export default SmartAssistant;