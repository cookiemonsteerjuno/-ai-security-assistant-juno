import React, { useRef } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatInterfaceProps {
  chatMessages: ChatMessage[];
  chatInput: string;
  setChatInput: (v: string) => void;
  onSendChat: (e: React.FormEvent) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  chatMessages,
  chatInput,
  setChatInput,
  onSendChat,
}) => {
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="p-5 rounded-2xl glass flex flex-col h-[70vh]">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-cyan-400 mono flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>SENTINEL-X HIGH-SECURITY AI ASSISTANT</span>
          </h2>
          <p className="text-xs text-slate-400">
            Connected to live patch scanner, firewall reload engine, and APK packager.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setChatInput('Apply all high security patches and verify SPL')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 text-cyan-300 text-[11px] mono"
          >
            Prompt: Apply Patches
          </button>
          <button
            type="button"
            onClick={() => setChatInput('Build Android APK with high security patches')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 text-emerald-300 text-[11px] mono"
          >
            Prompt: Build APK
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {chatMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-2xl p-3.5 rounded-2xl text-xs whitespace-pre-line ${
                msg.role === 'user'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-200'
              }`}
            >
              {msg.actionTag && (
                <div className="text-[10px] font-bold mono text-cyan-400 mb-1">[{msg.actionTag}]</div>
              )}
              <div>{msg.content}</div>
              <div className="text-[10px] opacity-60 mt-1.5 mono">{msg.timestamp}</div>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={onSendChat} className="pt-3 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          placeholder="Ask Sentinel AI to deploy high-security patches, audit ports, or export an APK..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;
