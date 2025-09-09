'use client';

import React, { useState } from 'react';
import styles from './ChatWidget.module.scss';

interface Message {
  role: 'user' | 'bot';
  text: string;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Hi! How can I help you today?' }
  ]);
  const [sending, setSending] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      const reply = typeof data.reply === 'string' ? data.reply : 'Sorry, I could not answer that.';
      setMessages(prev => [...prev, { role: 'bot', text: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Network error. Please try again.' }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.chatWidget}>
      {open ? (
        <div className={styles.panel}>
          <div className={styles.header}>Assistant</div>
          <div className={styles.messages}>
            {messages.map((m, idx) => (
              <div key={idx} className={m.role === 'user' ? styles.bubbleUser : styles.bubbleBot}>{m.text}</div>
            ))}
          </div>
          <div className={styles.inputBar}>
            <input
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            />
            <button className={styles.sendBtn} onClick={send} disabled={sending}>Send</button>
          </div>
        </div>
      ) : null}

      <button className={styles.toggleButton} onClick={() => setOpen(!open)}>
        {open ? 'Close' : 'Chat'}
      </button>
    </div>
  );
}


