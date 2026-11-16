
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { getChatSession, generateSpeech, decodeAndPlayAudio } from '../services/geminiService';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Initialize chat session
  const chatSessionRef = useRef<any>(null);

  useEffect(() => {
    chatSessionRef.current = getChatSession(
      "You are SENTINEL-X, a high-level security AI assistant. You are professional, precise, and slightly futuristic. You help users manage their security dashboard, understand threat logs, and provide technical advice on cybersecurity. Keep responses concise and informative."
    );
    
    // Initial greeting
    setMessages([
      {
        role: 'model',
        content: "Sentinel-X online. Systems nominal. How can I assist with your security operations today?",
        timestamp: new Date()
      }
    ]);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await chatSessionRef.current.sendMessage({ message: input });
      const modelResponse = result.text;

      const assistantMessage: ChatMessage = {
        role: 'model',
        content: modelResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (isTTSEnabled) {
        const audioData = await generateSpeech(modelResponse);
        if (audioData) {
          await decodeAndPlayAudio(audioData);
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        role: 'model',
        content: "Error: Communication link unstable. Please retry command.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] max-w-4xl mx-auto glass rounded-2xl border border-slate-800 overflow-hidden animate-in">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Assistant Node</h3>
            <p className="text-[10px] text-emerald-500 font-bold uppercase">Ready for Input</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsTTSEnabled(!isTTSEnabled)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${isTTSEnabled ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          <span className="text-[10px] font-bold uppercase">{isTTSEnabled ? 'Audio ON' : 'Audio OFF'}</span>
        </button>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
      >
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in`}
          >
            <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
              msg.role === 'user' 
                ? 'bg-cyan-600 text-white rounded-tr-none shadow-lg shadow-cyan-900/20' 
                : 'bg-slate-800/80 border border-slate-700 text-slate-200 rounded-tl-none'
            }`}>
              <p className="text-sm leading-relaxed">{msg.content}</p>
              <div className={`mt-2 text-[9px] font-bold uppercase ${msg.role === 'user' ? 'text-cyan-100/50' : 'text-slate-500'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl rounded-tl-none px-5 py-3">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-6 border-t border-slate-800 bg-slate-900/30">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Interrogate Sentinel-X..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 pl-6 pr-16 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600 mono"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-3 p-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50 disabled:bg-slate-800 transition-all shadow-lg shadow-cyan-900/40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
        <p className="mt-3 text-[9px] text-center text-slate-600 uppercase tracking-widest font-bold">
          Encrypted Channel • End-to-End Secure
        </p>
      </form>
    </div>
  );
};

export default ChatInterface;
