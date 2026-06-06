import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const ChatNotifContext = createContext({ unread: 0, clearUnread: () => {} });
const POLL_MS = 5000;

export function ChatNotifProvider({ children }) {
  const { user, token } = useAuth();
  const [unread, setUnread] = useState(0);

  // Customer state
  const convIdRef       = useRef(null);
  const custLastIdRef   = useRef(0);
  const custInitRef     = useRef(false);

  // Admin state: { [convId]: messageCount } — null = not yet initialised
  const adminCountRef   = useRef(null);

  const clearUnread = useCallback(() => setUnread(0), []);

  // Request browser notification permission when user logs in
  useEffect(() => {
    if (!user) return;
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [user?.id]);

  // Reset all refs when user changes (logout / switch account)
  useEffect(() => {
    convIdRef.current     = null;
    custLastIdRef.current = 0;
    custInitRef.current   = false;
    adminCountRef.current = null;
    setUnread(0);
  }, [user?.id]);

  // ── Global background poll ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !token) return;
    const headers = { Authorization: `Bearer ${token}` };
    const onChatPage = () =>
      window.location.pathname === '/chat' || window.location.pathname === '/admin/chat';

    function notify(title, body) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      }
    }

    async function tick() {
      try {
        if (user.role !== 'admin') {
          // ── Customer: poll own conversation ───────────────────────────────
          if (!convIdRef.current) {
            const r = await axios.get('/api/chat/conversation', { headers });
            convIdRef.current = r.data?.id ?? null;
            if (!convIdRef.current) return;
          }
          const r = await axios.get(
            `/api/chat/conversations/${convIdRef.current}/messages`,
            { headers }
          );
          if (!custInitRef.current) {
            // First run: set baseline, no notification
            if (r.data.length > 0) custLastIdRef.current = r.data[r.data.length - 1].id;
            custInitRef.current = true;
            return;
          }
          const newMsgs = r.data.filter(m => m.id > custLastIdRef.current);
          if (newMsgs.length > 0) {
            custLastIdRef.current = r.data[r.data.length - 1].id;
            const fromSeller = newMsgs.filter(m => m.sender_id !== user.id);
            if (fromSeller.length > 0 && !onChatPage()) {
              setUnread(p => p + fromSeller.length);
              const last = fromSeller[fromSeller.length - 1];
              const body =
                last.message_type === 'check_amulet' ? '📷 ส่งรูปเช็คพระ' :
                last.message_type === 'order'         ? '🛕 ออเดอร์ใหม่'   :
                last.content.slice(0, 80);
              notify('อชิโต 💬 มีข้อความใหม่', body);
            }
          }
        } else {
          // ── Admin: poll all conversations ─────────────────────────────────
          const r = await axios.get('/api/chat/conversations', { headers });
          if (adminCountRef.current === null) {
            // First run: set baseline only
            const counts = {};
            r.data.forEach(c => { counts[c.id] = c.message_count; });
            adminCountRef.current = counts;
            return;
          }
          let added = 0;
          let lastBody = '';
          let lastUser = '';
          r.data.forEach(c => {
            const prev = adminCountRef.current[c.id] ?? 0;
            if (c.message_count > prev && c.last_sender_role !== 'admin') {
              added  += c.message_count - prev;
              lastBody = c.last_message_type === 'check_amulet' ? '📷 ส่งรูปเช็คพระ' :
                         c.last_message_type === 'order'         ? '🛕 ออเดอร์ใหม่'   :
                         (c.last_message || '').slice(0, 80);
              lastUser = c.username;
            }
            adminCountRef.current[c.id] = c.message_count;
          });
          if (added > 0 && !onChatPage()) {
            setUnread(p => p + added);
            if (lastUser) notify(`อชิโต 💬 ${lastUser}`, lastBody);
          }
        }
      } catch { /* ignore network errors */ }
    }

    tick(); // immediate first run (initialises baseline)
    const id = setInterval(tick, POLL_MS);
    return () => clearInterval(id);
  }, [user?.id, token]);

  // Sync document title
  useEffect(() => {
    document.title = unread > 0 ? `(${unread}) ข้อความใหม่ · อชิโต` : 'อชิโต';
  }, [unread]);

  return (
    <ChatNotifContext.Provider value={{ unread, clearUnread }}>
      {children}
    </ChatNotifContext.Provider>
  );
}

export const useChatNotif = () => useContext(ChatNotifContext);
