/***********************************************************
 * SENTINEL AI - PROJECT BUNDLE (2026)
 * INSTRUCTIONS:
 * 1. Copy this to a file named 'SentinelAI.tsx' in your app.
 * 2. Ensure you have installed: @google/generative-ai
 ***********************************************************/

// --- MODULE 1: AI SERVICE (gemini.ts) ---
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "YOUR_API_KEY_HERE"; // Replace with your real key
const genAI = new GoogleGenerativeAI(API_KEY);

export const sendMessageToAI = async (prompt: string) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};

// --- MODULE 2: VOICE ENGINE (audioUtils.ts) ---
export const speak = (text: string) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.1; // Sentinel-style authoritative speed
  utterance.pitch = 0.8; // Deeper "AI" tone
  window.speechSynthesis.speak(utterance);
};

// --- MODULE 3: THE MAIN INTERFACE (App.tsx) ---
import React, { useState } from 'react';

const SentinelApp = () => {
  const [messages, setMessages] = useState([{role: 'bot', text: 'SENTINEL ONLINE. Awaiting command.'}]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCommand = async () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', text: input }]);
    setInput('');
    setLoading(true);

    try {
      const aiResponse = await sendMessageToAI(input);
      setMessages(prev => [...prev, { role: 'bot', text: aiResponse }]);
      speak(aiResponse); // Auto-voice response
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: 'ERROR: Core Connection Failed.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#000', color: '#00f2ff', fontFamily: 'monospace', padding: '20px', height: '100vh' }}>
      <header style={{ borderBottom: '2px solid #00f2ff', marginBottom: '20px' }}>
        <h1>SENTINEL_AI_v2.6</h1>
        <p>SYSTEM STATUS: [SECURE]</p>
      </header>

      <div style={{ height: '70%', overflowY: 'auto', border: '1px solid #003333', padding: '10px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: '15px', color: m.role === 'user' ? '#fff' : '#00f2ff' }}>
            <strong>{m.role === 'user' ? '> COMMAND: ' : '> SENTINEL: '}</strong> {m.text}
          </div>
        ))}
        {loading && <div style={{ animation: 'pulse 1s infinite' }}>DECRYPTING...</div>}
      </div>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <input 
          style={{ flex: 1, background: '#111', border: '1px solid #00f2ff', color: '#fff', padding: '10px' }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter authorization code..."
        />
        <button 
          onClick={handleCommand}
          style={{ background: '#00f2ff', color: '#000', fontWeight: 'bold', padding: '10px 20px', cursor: 'pointer' }}
        >
          EXECUTE
        </button>
      </div>
    </div>
  );
};

export default SentinelApp;