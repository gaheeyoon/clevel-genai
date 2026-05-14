import { useState, useEffect, useCallback, useRef } from 'react';
import {
  createInitialState, computeCurrentState,
  applyWater, applySunlight, applyTemperature,
  startNewCycle, getOverallMood, STAGES, STAGE_NAMES, getStatusLevel,
} from './utils/gameLogic.js';
import { getGreetingMessage, getAIResponse } from './utils/aiConversation.js';
import KongiCharacter from './components/KongiCharacter.jsx';
import './App.css';

const STORAGE_KEY = 'silverjack_state';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// 이모티콘 제거 후 TTS
function stripEmoji(text) {
  return text.replace(/\p{Emoji_Presentation}/gu, '').replace(/\s+/g, ' ').trim();
}

export default function App() {
  const [screen, setScreen] = useState('splash');
  const [gameState, setGameState] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [setupData, setSetupData] = useState({
    userName: '', gender: 'female', familyContact: '', familyContactType: 'phone',
  });
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);
  const greetedRef = useRef(false);
  const sendingRef = useRef(false);

  useEffect(() => {
    const saved = load();
    if (saved && saved.userName) {
      const updated = computeCurrentState({ ...saved, cycleStartTime: saved.cycleStartTime || Date.now() });
      setGameState(updated);
      save(updated);
      setTimeout(() => setScreen('game'), 2000);
    } else {
      setTimeout(() => setScreen('setup'), 2000);
    }
  }, []);

  useEffect(() => {
    if (!gameState || screen !== 'game') return;
    const id = setInterval(() => {
      setGameState(prev => {
        if (!prev) return prev;
        const updated = computeCurrentState(prev);
        save(updated);
        return updated;
      });
    }, 30000);
    return () => clearInterval(id);
  }, [screen]);

  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = stripEmoji(text);
    if (!clean) return;
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = 'ko-KR';
    utter.rate = 0.85;
    utter.pitch = 1.2;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utter);
  }, []);

  useEffect(() => {
    if (screen === 'game' && gameState && !greetedRef.current) {
      greetedRef.current = true;
      const greeting = getGreetingMessage(gameState);
      setChatMessages([{ role: 'kongi', text: greeting }]);
      setTimeout(() => speak(greeting), 500);
    }
  }, [screen, gameState]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('이 기기에서는 음성 인식이 지원되지 않아요. 글자로 입력해주세요!'); return; }
    if (recognitionRef.current) recognitionRef.current.stop();
    const rec = new SR();
    rec.lang = 'ko-KR';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => handleSendMessage(e.results[0][0].transcript);
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  }, []);

  const handleSendMessage = useCallback(async (text) => {
    const msg = (text || inputText).trim();
    if (!msg || sendingRef.current) return;
    sendingRef.current = true;
    setInputText('');
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setIsAIThinking(true);

    const response = await getAIResponse(msg, gameState);
    setIsAIThinking(false);
    sendingRef.current = false;
    setChatMessages(p => [...p, { role: 'kongi', text: response }]);
    speak(response);
    setGameState(s => {
      if (!s) return s;
      const updated = {
        ...s,
        conversationHistory: [
          ...(s.conversationHistory || []).slice(-10),
          { role: 'user', content: msg },
          { role: 'assistant', content: response },
        ],
      };
      save(updated);
      return updated;
    });
  }, [inputText, gameState, speak]);

  const handleCare = useCallback((action) => {
    const responses = {
      water: '감사해요! 시원해요.',
      sun: '햇빛이다! 따뜻해요.',
      temp: '딱 좋은 온도예요!',
    };
    const resp = responses[action];
    setChatMessages(p => [...p, { role: 'kongi', text: resp }]);
    speak(resp);
    setGameState(prev => {
      let updated;
      if (action === 'water') updated = applyWater(prev);
      else if (action === 'sun') updated = applySunlight(prev);
      else updated = applyTemperature(prev);
      save(updated);
      if (updated.stage === STAGES.HARVEST) setTimeout(() => setScreen('harvest'), 800);
      return updated;
    });
  }, [speak]);

  const handleSetupComplete = useCallback(() => {
    if (!setupData.userName.trim()) { alert('이름을 입력해주세요!'); return; }
    const initial = { ...createInitialState(), ...setupData, cycleStartTime: Date.now(), lastCareTime: Date.now() };
    setGameState(initial);
    save(initial);
    greetedRef.current = false;
    setChatMessages([]);
    setScreen('game');
  }, [setupData]);

  const handleHarvest = useCallback(() => {
    setGameState(prev => { const u = startNewCycle(prev); save(u); return u; });
    greetedRef.current = false;
    setChatMessages([]);
    setScreen('game');
  }, []);

  const handleRestart = useCallback(() => {
    setGameState(prev => { const u = startNewCycle(prev); save(u); return u; });
    greetedRef.current = false;
    setChatMessages([]);
    setScreen('game');
  }, []);

  if (screen === 'splash') return <SplashScreen />;
  if (screen === 'setup') return <SetupScreen data={setupData} onChange={setSetupData} onComplete={handleSetupComplete} />;
  if (screen === 'harvest') return <HarvestScreen gameState={gameState} onHarvest={handleHarvest} />;
  if (screen === 'settings') return (
    <SettingsScreen
      gameState={gameState}
      onSave={(updates) => { setGameState(prev => { const u = { ...prev, ...updates }; save(u); return u; }); setScreen('game'); }}
      onBack={() => setScreen('game')}
    />
  );

  if (!gameState) return null;
  const mood = getOverallMood(gameState);
  const lastKongiMsg = [...chatMessages].reverse().find(m => m.role === 'kongi');

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <span className="logo-icon">🌱</span>
          <span className="logo-text">Silver Jack</span>
        </div>
        <button className="icon-btn" onClick={() => setScreen('settings')}>⚙️</button>
      </header>

      <main className="game-main">
        <div className="stage-banner">
          <span className="day-badge">{gameState.day}일째</span>
          <span className="stage-name">{STAGE_NAMES[gameState.stage]}</span>
          <span className="cycle-badge">🏆 {gameState.totalHarvests || 0}회 수확</span>
        </div>

        <div className="character-area" onClick={() => setScreen('chat')}>
          <KongiCharacter stage={gameState.stage} mood={mood} />
          <div className={`speech-bubble ${isSpeaking ? 'speaking' : ''}`}>
            {lastKongiMsg ? lastKongiMsg.text : '안녕하세요!'}
          </div>
        </div>

        <div className="status-section">
          <StatusBar label="💧 물" value={gameState.water} />
          <StatusBar label="☀️ 햇빛" value={gameState.sunlight} />
          <StatusBar label="🌡️ 온도" value={gameState.temperature} />
        </div>

        {gameState.isDead ? (
          <div className="dead-section">
            <p className="dead-msg">콩이가 시들었어요.<br />다시 키워볼까요?</p>
            <button className="care-btn restart-btn" onClick={handleRestart}>다시 시작</button>
          </div>
        ) : gameState.stage === STAGES.HARVEST ? (
          <button className="care-btn harvest-cta" onClick={() => setScreen('harvest')}>
            수확하러 가기!
          </button>
        ) : (
          <div className="care-buttons">
            <button className="care-btn water-btn" onClick={() => handleCare('water')}>
              <span className="care-icon">💧</span>
              <span className="care-label">물주기</span>
            </button>
            <button className="care-btn sun-btn" onClick={() => handleCare('sun')}>
              <span className="care-icon">☀️</span>
              <span className="care-label">햇빛</span>
            </button>
            <button className="care-btn temp-btn" onClick={() => handleCare('temp')}>
              <span className="care-icon">🌡️</span>
              <span className="care-label">온도</span>
            </button>
          </div>
        )}

        <button className="chat-open-btn" onClick={() => setScreen('chat')}>
          콩이랑 대화하기
        </button>
      </main>

      {screen === 'chat' && (
        <ChatOverlay
          messages={chatMessages}
          inputText={inputText}
          isListening={isListening}
          isAIThinking={isAIThinking}
          chatEndRef={chatEndRef}
          onClose={() => setScreen('game')}
          onInput={setInputText}
          onSend={() => handleSendMessage()}
          onListen={startListening}
        />
      )}
    </div>
  );
}

function SplashScreen() {
  return (
    <div className="splash">
      <div className="splash-icon">🌱</div>
      <h1 className="splash-title">Silver Jack</h1>
      <p className="splash-sub">콩이와 함께하는 하루</p>
      <div className="splash-dots">
        <div className="dot" /><div className="dot" /><div className="dot" />
      </div>
    </div>
  );
}

function SetupScreen({ data, onChange, onComplete }) {
  return (
    <div className="setup-screen">
      <div className="setup-card">
        <div className="setup-emoji">🌱</div>
        <h2>안녕하세요!</h2>
        <p className="setup-desc">저는 <strong>콩이</strong>예요.<br />앞으로 잘 부탁드려요!</p>

        <div className="setup-field">
          <label>어르신 이름</label>
          <input type="text" placeholder="예) 김복순" value={data.userName}
            onChange={e => onChange(p => ({ ...p, userName: e.target.value }))} />
        </div>

        <div className="setup-field">
          <label>성별</label>
          <div className="contact-type-row">
            <button className={data.gender === 'female' ? 'type-btn active' : 'type-btn'}
              onClick={() => onChange(p => ({ ...p, gender: 'female' }))}>
              할머니
            </button>
            <button className={data.gender === 'male' ? 'type-btn active' : 'type-btn'}
              onClick={() => onChange(p => ({ ...p, gender: 'male' }))}>
              할아버지
            </button>
          </div>
        </div>

        <div className="setup-field">
          <label>가족 연락처 (미접속 시 알림)</label>
          <div className="contact-type-row">
            <button className={data.familyContactType === 'phone' ? 'type-btn active' : 'type-btn'}
              onClick={() => onChange(p => ({ ...p, familyContactType: 'phone' }))}>📱 전화</button>
            <button className={data.familyContactType === 'email' ? 'type-btn active' : 'type-btn'}
              onClick={() => onChange(p => ({ ...p, familyContactType: 'email' }))}>📧 이메일</button>
          </div>
          <input type={data.familyContactType === 'email' ? 'email' : 'tel'}
            placeholder={data.familyContactType === 'email' ? 'family@email.com' : '010-0000-0000'}
            value={data.familyContact}
            onChange={e => onChange(p => ({ ...p, familyContact: e.target.value }))} />
        </div>

        <button className="start-btn" onClick={onComplete}>콩이 키우기 시작!</button>
      </div>
    </div>
  );
}

function StatusBar({ label, value }) {
  const level = getStatusLevel(value);
  return (
    <div className="status-row">
      <span className="status-label">{label}</span>
      <div className="status-track">
        <div className={`status-fill fill-${level}`} style={{ width: `${Math.max(0, Math.round(value))}%` }} />
      </div>
      <span className="status-pct">{Math.max(0, Math.round(value))}%</span>
    </div>
  );
}

function ChatOverlay({ messages, inputText, isListening, isAIThinking, chatEndRef, onClose, onInput, onSend, onListen }) {
  return (
    <div className="chat-overlay">
      <div className="chat-header">
        <button className="back-btn" onClick={onClose}>← 돌아가기</button>
        <span className="chat-title">콩이와 대화</span>
        <div style={{ width: 88 }} />
      </div>
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-msg ${msg.role}`}>
            {msg.role === 'kongi' && <span className="chat-avatar">🌱</span>}
            <div className={`chat-bubble bubble-${msg.role}`}>{msg.text}</div>
          </div>
        ))}
        {isAIThinking && (
          <div className="chat-msg kongi">
            <span className="chat-avatar">🌱</span>
            <div className="chat-bubble bubble-kongi thinking-bubble">
              <span className="dot" /><span className="dot" /><span className="dot" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="chat-input-row">
        <button className={`mic-btn ${isListening ? 'active' : ''}`} onClick={onListen}
          aria-label={isListening ? '듣는 중' : '음성 입력'}>
          {isListening ? '🔴' : '🎤'}
        </button>
        <input className="chat-input" type="text"
          placeholder="말씀하거나 입력하세요..."
          value={inputText}
          onChange={e => onInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSend()} />
        <button className="send-btn" onClick={onSend}>전송</button>
      </div>
    </div>
  );
}

function HarvestScreen({ gameState, onHarvest }) {
  const next = (gameState?.totalHarvests || 0) + 1;
  const rem = next % 4 === 0 ? 0 : 4 - (next % 4);
  return (
    <div className="harvest-screen">
      <div className="harvest-content">
        <div className="harvest-confetti">🎊 🌱 🎉 🌿 🎊</div>
        <h2>수확 완료!</h2>
        <p className="harvest-msg">콩이가 무럭무럭 자랐어요.<br />7일 동안 수고하셨습니다!</p>
        <div className="harvest-stats">
          <div className="stat-card">
            <span className="stat-num">{next}번째</span>
            <span className="stat-label">수확</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{rem === 0 ? '완성!' : `${rem}번`}</span>
            <span className="stat-label">{rem === 0 ? '배송 출발!' : '더 하면 배송!'}</span>
          </div>
        </div>
        {rem === 0 && (
          <div className="milestone-notice">
            한 달 달성! 실제 콩나물을 보내드릴게요!
          </div>
        )}
        <KongiCharacter stage={STAGES.HARVEST} mood="harvest" />
        <button className="harvest-restart-btn" onClick={onHarvest}>
          새 콩나물 키우기
        </button>
      </div>
    </div>
  );
}

function SettingsScreen({ gameState, onSave, onBack }) {
  const [form, setForm] = useState({
    userName: gameState?.userName || '',
    gender: gameState?.gender || 'female',
    familyContact: gameState?.familyContact || '',
    familyContactType: gameState?.familyContactType || 'phone',
  });
  return (
    <div className="setup-screen">
      <div className="setup-card">
        <button className="back-link" onClick={onBack}>← 뒤로가기</button>
        <h2>설정</h2>
        <div className="setup-field">
          <label>이름</label>
          <input value={form.userName} onChange={e => setForm(p => ({ ...p, userName: e.target.value }))} />
        </div>
        <div className="setup-field">
          <label>성별</label>
          <div className="contact-type-row">
            <button className={form.gender === 'female' ? 'type-btn active' : 'type-btn'}
              onClick={() => setForm(p => ({ ...p, gender: 'female' }))}>할머니</button>
            <button className={form.gender === 'male' ? 'type-btn active' : 'type-btn'}
              onClick={() => setForm(p => ({ ...p, gender: 'male' }))}>할아버지</button>
          </div>
        </div>
        <div className="setup-field">
          <label>가족 연락처</label>
          <div className="contact-type-row">
            <button className={form.familyContactType === 'phone' ? 'type-btn active' : 'type-btn'}
              onClick={() => setForm(p => ({ ...p, familyContactType: 'phone' }))}>📱 전화</button>
            <button className={form.familyContactType === 'email' ? 'type-btn active' : 'type-btn'}
              onClick={() => setForm(p => ({ ...p, familyContactType: 'email' }))}>📧 이메일</button>
          </div>
          <input type={form.familyContactType === 'email' ? 'email' : 'tel'}
            value={form.familyContact}
            onChange={e => setForm(p => ({ ...p, familyContact: e.target.value }))} />
        </div>
        <button className="start-btn" onClick={() => onSave(form)}>저장하기</button>
      </div>
    </div>
  );
}
