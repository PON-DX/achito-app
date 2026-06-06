import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useChatNotif } from '../contexts/ChatNotifContext';
import { Link } from 'react-router-dom';

const POLL_MS = 3000;

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

function CheckBubble({ data, isMe, time }) {
  return (
    <div
      className={`max-w-[82%] rounded-2xl overflow-hidden text-sm ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
      style={isMe
        ? { background: 'rgba(180,140,30,0.2)', border: '1px solid rgba(212,175,55,0.35)' }
        : { background: 'rgba(30,24,8,0.75)', border: '1px solid rgba(212,175,55,0.12)' }}
    >
      <div className="flex items-center gap-2 px-3 pt-3 pb-2" style={{ borderBottom: '1px solid rgba(212,175,55,0.12)' }}>
        <span className="text-base">🔍</span>
        <span className="text-gold text-xs font-semibold tracking-wider uppercase">เช็คพระ</span>
      </div>
      <img
        src={data.image}
        alt="check-amulet"
        className="w-full max-h-72 object-contain bg-black/30"
        style={{ display: 'block' }}
      />
      {data.note && (
        <p className="text-cream/80 text-xs px-3 pt-2 leading-relaxed">{data.note}</p>
      )}
      <p className="text-right text-cream-muted text-[10px] px-3 pb-2 pt-1 opacity-60">{time}</p>
    </div>
  );
}

function Bubble({ msg, isMe }) {
  const isOrder = msg.message_type === 'order';
  const isCheck = msg.message_type === 'check_amulet';

  if (isCheck) {
    let data = { image: '', note: '' };
    try { data = JSON.parse(msg.content); } catch { data.image = msg.content; }
    return (
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
        <CheckBubble data={data} isMe={isMe} time={formatTime(msg.created_at)} />
      </div>
    );
  }

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isMe ? 'rounded-br-sm' : 'rounded-bl-sm'
        } ${isOrder ? 'w-full max-w-[90%]' : ''}`}
        style={
          isMe
            ? { background: 'rgba(180,140,30,0.25)', border: '1px solid rgba(212,175,55,0.35)' }
            : { background: 'rgba(30,24,8,0.75)', border: '1px solid rgba(212,175,55,0.12)' }
        }
      >
        {isOrder ? (
          <pre className="text-cream text-xs whitespace-pre-wrap font-sans leading-relaxed">{msg.content}</pre>
        ) : (
          <p className="text-cream">{msg.content}</p>
        )}
        <p className="text-right text-cream-muted text-[10px] mt-1.5 opacity-60">{formatTime(msg.created_at)}</p>
      </div>
    </div>
  );
}

export default function Chat() {
  const { user, token } = useAuth();
  const { clearUnread } = useChatNotif();
  const [conv, setConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const lastIdRef = useRef(0);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchConv = useCallback(async () => {
    try {
      const r = await axios.get('/api/chat/conversation', { headers });
      setConv(r.data);
      return r.data;
    } catch { return null; }
  }, [token]);

  const fetchMessages = useCallback(async (convId) => {
    try {
      const r = await axios.get(`/api/chat/conversations/${convId}/messages`, { headers });
      setMessages(r.data);
      if (r.data.length > 0) lastIdRef.current = r.data[r.data.length - 1].id;
    } catch { /* ignore */ }
  }, [token]);

  // Clear unread badge when visiting chat page
  useEffect(() => {
    clearUnread();
    const onFocus = () => clearUnread();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  useEffect(() => {
    if (!user || !token) return;
    (async () => {
      const c = await fetchConv();
      if (c) await fetchMessages(c.id);
      setLoading(false);
    })();
  }, []);

  // Poll for new messages
  useEffect(() => {
    if (!conv) return;
    const id = setInterval(async () => {
      try {
        const r = await axios.get(`/api/chat/conversations/${conv.id}/messages`, { headers });
        if (r.data.length > 0) {
          const newMsgs = r.data.filter(m => m.id > lastIdRef.current);
          if (newMsgs.length > 0) {
            setMessages(r.data);
            lastIdRef.current = r.data[r.data.length - 1].id;
          }
        }
      } catch { /* ignore */ }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [conv?.id, token]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || !conv || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    try {
      const r = await axios.post(`/api/chat/conversations/${conv.id}/messages`, { content: text }, { headers });
      setMessages(prev => [...prev, r.data]);
    } catch { setInput(text); }
    finally { setSending(false); }
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="font-serif text-2xl text-cream">กรุณาเข้าสู่ระบบก่อน</p>
        <Link to="/login" className="btn-gold px-8">เข้าสู่ระบบ</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col" style={{ height: 'calc(100vh - 130px)' }}>
      {/* Header */}
      <div className="glass rounded-2xl px-5 py-4 mb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full border border-gold/40 flex items-center justify-center sacred-icon-anim">
          <span className="text-gold">☸</span>
        </div>
        <div>
          <p className="font-serif text-gold text-base">อชิโต — แชทกับผู้ขาย</p>
          <p className="text-cream-muted text-xs">ส่งข้อความหรือออเดอร์มาที่นี่</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto glass rounded-2xl px-4 py-4 mb-4" style={{ minHeight: 0 }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-cream-muted text-sm animate-pulse">กำลังโหลด...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <span className="text-4xl text-gold/20">💬</span>
            <p className="text-cream-muted text-sm">ยังไม่มีข้อความ</p>
            <p className="text-cream-muted text-xs">เพิ่มสินค้าในตะกร้าแล้วส่งออเดอร์ หรือพิมพ์ข้อความได้เลย</p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const showDate = i === 0 || formatDate(messages[i - 1].created_at) !== formatDate(msg.created_at);
              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="text-center my-3">
                      <span className="text-cream-muted text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(20,16,5,0.6)' }}>
                        {formatDate(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <Bubble msg={msg} isMe={msg.sender_id === user.id} />
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="glass rounded-2xl flex gap-3 px-4 py-3">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="พิมพ์ข้อความ..."
          className="flex-1 bg-transparent text-cream placeholder-cream-muted text-sm focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="btn-gold px-5 py-2 text-sm disabled:opacity-40"
        >
          ส่ง
        </button>
      </form>
    </div>
  );
}
