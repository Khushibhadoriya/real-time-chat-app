// frontend/src/pages/ChatPage.jsx

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';
import useChatStore from '../store/chatStore.js';
import { connectSocket, getSocket } from '../services/socket.js';
import useSocket from '../hooks/useSocket.js';
import Sidebar from '../components/chat/Sidebar.jsx';
import ChatWindow from '../components/chat/ChatWindow.jsx';
import MembersPanel from '../components/chat/MembersPanel.jsx';
import { useState } from 'react';
import { useRef } from 'react';


const ChatPage = () => {
  const { token } = useAuthStore();
  const { fetchMyRooms } = useChatStore();  // ← changed from fetchRooms
  const navigate = useNavigate();
  const initializedRef = useRef(false); // ← prevents double init
  const [showMembers, setShowMembers] = useState(false);

  useSocket();

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    // ─────────────────────────────────────────
    // useRef flag prevents running twice in dev
    // WHY: even without StrictMode, effects can 
    // run multiple times during hot module reload
    // ─────────────────────────────────────────
    if (initializedRef.current) return;
    initializedRef.current = true;

 // ✅ Only connect if not already connected
    // Prevents the double connection causing "Socket connected: undefined"
    const existingSocket = getSocket();
    if (!existingSocket?.connected) {
      connectSocket(token);
    }
    // connectSocket(token);
    fetchMyRooms();  // ← now fetches only user's rooms
  }, [token, navigate, fetchMyRooms]);

  

  return (
    <div className="h-screen bg-slate-950 flex overflow-hidden">
      <Sidebar />
      <ChatWindow onToggleMembers={() => setShowMembers(p => !p)} />
         {showMembers && <MembersPanel onClose={() => setShowMembers(false)} />}
    </div>
  );
};

export default ChatPage;