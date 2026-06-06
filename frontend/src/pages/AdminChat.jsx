import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useChatNotif } from '../contexts/ChatNotifContext';

const POLL_MS = 3000;

function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}
function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

function Bubble({ msg }) {
  const isMe = msg.sender_role === 'admin';
  const isOrder = msg.message_type === 'order';
  const isCheck = msg.message_type === 'check_amulet';

  if (isCheck) {
    let data = { image: '', note: '' };
    try { data = JSON.parse(msg.content); } catch { data.image = msg.content; }
    return (
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
        <div
          className={`max-w-[82%] rounded-2xl overflow-hidden text-sm ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
          style={isMe
            ? { background: 'rgba(180,140,30,0.2)', border: '1px solid rgba(212,175,55,0.35)' }
            : { background: 'rgba(30,24,8,0.75)', border: '1px solid rgba(212,175,55,0.12)' }}
        >
          {!isMe && <p className="text-gold/60 text-[10px] px-3 pt-2">{msg.sender_username}</p>}
          <div className="flex items-center gap-2 px-3 pt-2 pb-2" style={{ borderBottom: '1px solid rgba(212,175,55,0.12)' }}>
            <span>🔍</span>
            <span className="text-gold text-xs font-semibold tracking-wider uppercase">เช็คพระ</span>
          </div>
          <img src={data.image} alt="check-amulet" className="w-full max-h-72 object-contain bg-black/30" />
          {data.note && <p className="text-cream/80 text-xs px-3 pt-2 leading-relaxed">{data.note}</p>}
          <p className="text-right text-cream-muted text-[10px] px-3 pb-2 pt-1 opacity-60">{formatTime(msg.created_at)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'} ${isOrder ? 'w-[90%]' : ''}`}
        style={
          isMe
            ? { background: 'rgba(180,140,30,0.25)', border: '1px solid rgba(212,175,55,0.35)' }
            : { background: 'rgba(30,24,8,0.75)', border: '1px solid rgba(212,175,55,0.12)' }
        }
      >
        {!isMe && <p className="text-gold/60 text-[10px] mb-1">{msg.sender_username}</p>}
        {isOrder
          ? <pre className="text-cream text-xs whitespace-pre-wrap font-sans leading-relaxed">{msg.content}</pre>
          : <p className="text-cream leading-relaxed">{msg.content}</p>
        }
        <p className="text-right text-cream-muted text-[10px] mt-1 opacity-60">{formatTime(msg.created_at)}</p>
      </div>
    </div>
  );
}

export default function AdminChat() {
  const { user, token } = useAuth();
  const { clearUnread } = useChatNotif();
  const [convList, setConvList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const bottomRef = useRef(null);
  const headers = { Authorization: `Bearer ${token}` };

  const fetchConvList = useCallback(async () => {
    try {
      const r = await axios.get('/api/chat/conversations', { headers });
      setConvList(r.data);
    } catch { /* ignore */ }
    finally { setLoadingConvs(false); }
  }, [token]);

  const fetchMessages = useCallback(async (convId) => {
    try {
      const r = await axios.get(`/api/chat/conversations/${convId}/messages`, { headers });
      setMessages(r.data);
    } catch { /* ignore */ }
  }, [token]);

  // Clear unread badge when visiting chat page
  useEffect(() => {
    clearUnread();
    const onFocus = () => clearUnread();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  useEffect(() => { fetchConvList(); }, []);

  useEffect(() => {
    if (!selected) return;
    fetchMessages(selected.id);
    const id = setInterval(() => {
      fetchConvList();
      fetchMessages(selected.id);
    }, POLL_MS);
    return () => clearInterval(id);
  }, [selected?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function sendReply(e) {
    e.preventDefault();
    if (!input.trim() || !selected || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    try {
      const r = await axios.post(`/api/chat/conversations/${selected.id}/messages`, { content: text }, { headers });
      setMessages(prev => [...prev, r.data]);
    } catch { setInput(text); }
    finally { setSending(false); }
  }

  if (!user || user.role !== 'admin') {
    return <div className="p-8 text-cream-muted">ไม่มีสิทธิ์เข้าถึง</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-serif text-2xl text-gold mb-6 flex items-center gap-3">
        <span className="rotate-sacred-slow">☸</span> แชทกับลูกค้า
      </h1>

      <div className="flex gap-4" style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>
        {/* Conversation list */}
        <div className="w-72 flex-shrink-0 glass rounded-2xl overflow-hidden flex flex-col">
          <div className="p-3 border-b border-gold/10">
            <p className="text-cream-muted text-xs tracking-wider uppercase">การสนทนาทั้งหมด</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <p className="text-cream-muted text-sm p-4 text-center animate-pulse">กำลังโหลด...</p>
            ) : convList.length === 0 ? (
              <p className="text-cream-muted text-sm p-4 text-center">ยังไม่มีการสนทนา</p>
            ) : (
              convList.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={`w-full text-left px-4 py-3 border-b border-gold/5 transition-all duration-200 hover:bg-gold/5 ${selected?.id === c.id ? 'bg-gold/10 border-l-2 border-l-gold' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-full border border-gold/30 flex items-center justify-center text-gold text-xs flex-shrink-0">
                      {c.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <p className="text-cream text-sm font-medium truncate">{c.username}</p>
                  </div>
                  {c.last_message && (
                    <p className="text-cream-muted text-xs truncate pl-9">
                      {c.last_sender_role === 'admin' ? '↩ ' : ''}
                      {c.last_message_type === 'check_amulet' ? '📷 เช็คพระ'
                        : c.last_message_type === 'order' ? '🛕 ออเดอร์ใหม่'
                        : c.last_message.slice(0, 45)}
                    </p>
                  )}
                  <p className="text-cream-muted text-[10px] pl-9 mt-0.5 opacity-50">
                    {c.message_count} ข้อความ
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selected ? (
            <div className="glass rounded-2xl flex-1 flex items-center justify-center">
              <div className="text-center">
                <span className="text-4xl text-gold/20">💬</span>
                <p className="text-cream-muted text-sm mt-3">เลือกการสนทนาจากด้านซ้าย</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="glass rounded-2xl px-4 py-3 mb-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-gold/30 flex items-center justify-center text-gold text-sm">
                  {selected.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-cream text-sm font-medium">{selected.username}</p>
                  {selected.email && <p className="text-cream-muted text-xs">{selected.email}</p>}
                </div>
              </div>

              {/* Messages */}
              <div className="glass rounded-2xl flex-1 overflow-y-auto px-4 py-4 mb-3" style={{ minHeight: 0 }}>
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-cream-muted text-sm">ยังไม่มีข้อความ</p>
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
                          <Bubble msg={msg} currentUserId={user.id} />
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </>
                )}
              </div>

              {/* Reply input */}
              <form onSubmit={sendReply} className="glass rounded-2xl flex gap-3 px-4 py-3">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={`ตอบกลับ ${selected.username}...`}
                  className="flex-1 bg-transparent text-cream placeholder-cream-muted text-sm focus:outline-none"
                />
                <button type="submit" disabled={!input.trim() || sending} className="btn-gold px-5 py-2 text-sm disabled:opacity-40">
                  ส่ง
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
