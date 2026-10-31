import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, HelpCircle } from 'lucide-react';

export default function ChatAgent({ analysisResult }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello ${analysisResult?.profile?.full_name || 'there'}! I'm your O*NET Career AI Agent. I've analyzed your CV against the official Occupational Information Network database. Your top match is **${analysisResult?.suitable_job_profiles?.[0]?.title}** with an overall fit score of **${analysisResult?.suitable_job_profiles?.[0]?.match_score}%**. What career questions can I answer for you today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState([
    'How do I optimize my resume bullet points for ATS scanners?',
    'What portfolio project would bridge my critical skill gaps?',
    'Explain the salary range and demand for my top O*NET match.',
    'What certifications are most valuable for this career path?'
  ]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (messageText) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isTyping) return;

    const userMessage = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          chat_history: messages.slice(-6),
          analysis_context: analysisResult,
        }),
      });
      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply },
      ]);
      if (data.suggested_questions && data.suggested_questions.length > 0) {
        setSuggestedPrompts(data.suggested_questions);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered a temporary connection error. Please try asking again.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="glass-panel chat-window">
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="brand-icon-wrapper" style={{ width: 32, height: 32, borderRadius: 8 }}>
            <Bot size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>AI Career Strategist Agent</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Grounding advice on O*NET SOC: {analysisResult?.suitable_job_profiles?.[0]?.soc_code}
            </div>
          </div>
        </div>
        <div className="badge badge-primary">
          <Sparkles size={12} />
          <span>Interactive Counselor</span>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`message-bubble ${m.role === 'user' ? 'message-user' : 'message-assistant'}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: '0.75rem', opacity: 0.8 }}>
              {m.role === 'user' ? <User size={13} /> : <Bot size={13} />}
              <span>{m.role === 'user' ? 'You' : 'PathFinder Career Agent'}</span>
            </div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
          </div>
        ))}

        {isTyping && (
          <div className="message-bubble message-assistant">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <div className="radar-spinner" style={{ width: 16, height: 16, borderWidth: 2, margin: 0 }}></div>
              <span>Agent is reviewing your CV and formulating insights...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {suggestedPrompts.length > 0 && (
        <div className="suggested-prompts">
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <HelpCircle size={13} />
            <span>Suggested:</span>
          </div>
          {suggestedPrompts.map((prompt, i) => (
            <button
              key={i}
              className="prompt-chip"
              onClick={() => handleSend(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <form
        className="chat-input-bar"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <input
          type="text"
          className="chat-input"
          placeholder="Ask anything about your resume, skill gaps, or interview strategy..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={!input.trim() || isTyping}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
