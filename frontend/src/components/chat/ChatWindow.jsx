// frontend/src/components/chat/ChatWindow.jsx

import { useEffect, useRef } from 'react';
import { Hash, Users } from 'lucide-react';
import useChatStore from '../../store/chatStore.js';
import useAuthStore from '../../store/authStore.js';
import MessageBubble from './MessageBubble.jsx';
import MessageInput from './MessageInput.jsx';

// ─────────────────────────────────────────────
// CHAT WINDOW
// Shows: room header, messages list, typing indicator, input
// ─────────────────────────────────────────────

const ChatWindow = ({onToggleMembers }) => {
  const { activeRoom, messages, isLoadingMessages, typingUsers, fetchMessages } = useChatStore();
  const { user } = useAuthStore();

  // Ref to the bottom of message list — for auto-scroll
  const messagesEndRef = useRef(null);

  // ── Auto-scroll to bottom when messages change ──
  // WHY: New message arrives → user should see it without manual scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Load messages when active room changes ──
  useEffect(() => {
    if (activeRoom) {
      fetchMessages(activeRoom._id);
    }
  }, [activeRoom?._id], fetchMessages);

  // Get typing users for current room
  const currentTyping = activeRoom ? (typingUsers[activeRoom._id] || []) : [];

  // Build typing text: "John", "John and Sarah", "John, Sarah and 2 others"
  const getTypingText = () => {
    if (currentTyping.length === 0) return null;
    if (currentTyping.length === 1) return `${currentTyping[0]} is typing...`;
    if (currentTyping.length === 2) return `${currentTyping[0]} and ${currentTyping[1]} are typing...`;
    return `${currentTyping[0]}, ${currentTyping[1]} and ${currentTyping.length - 2} others are typing...`;
  };

  // ── NO ROOM SELECTED STATE ──
  if (!activeRoom) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center
                      bg-slate-950 gap-4">
        <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center
                        justify-center border border-slate-700">
          <Hash size={36} className="text-slate-600" />
        </div>
        <div className="text-center">
          <h3 className="text-white font-semibold text-lg">
            No room selected
          </h3>
          <p className="text-slate-500 text-sm mt-1">
            Choose a room from the sidebar to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-950 min-w-0">

      {/* ── Room Header ── */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50
                      flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center
                          justify-center text-lg border border-slate-700">
            {activeRoom.avatar}
          </div>
          <div>
            <h2 className="text-white font-semibold text-sm">
              #{activeRoom.name}
            </h2>
            <p className="text-slate-500 text-xs">
              {activeRoom.members?.length || 0} members
            </p>
          </div>
        </div>

        {/* ── Members Toggle Button ── */}
        <button
          onClick={onToggleMembers}
          title="Show members"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                     text-slate-400 hover:text-violet-400
                     hover:bg-violet-400/10 transition-all duration-200
                     border border-transparent hover:border-violet-500/20"
        >
          <Users size={18} />
          <span className="text-xs font-medium">
            {activeRoom.members?.length || 0}
          </span>
        </button>
      </div>

      {/* ── Messages Area ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4"
           style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>

        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-violet-500
                              border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 text-sm">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="text-5xl">{activeRoom.avatar}</div>
            <div className="text-center">
              <h3 className="text-white font-medium">
                Welcome to #{activeRoom.name}!
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                Be the first to send a message
              </p>
            </div>
          </div>
        ) : (
          <div>
            {messages.map((msg) => (
              <MessageBubble key={msg._id} message={msg} />
            ))}
          </div>
        )}

        {/* Typing indicator */}
        {currentTyping.length > 0 && (
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <span className="text-slate-400 text-xs italic">
              {getTypingText()}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Message Input ── */}
      <MessageInput />
    </div>
  );
};

export default ChatWindow;