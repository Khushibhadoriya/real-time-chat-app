// frontend/src/components/chat/MembersPanel.jsx

import { X, Crown, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import useChatStore from '../../store/chatStore.js';
import useAuthStore from '../../store/authStore.js';
import api from '../../services/api.js';

// ─────────────────────────────────────────────
// MEMBERS PANEL
// Slides in from right when members button clicked
// Shows: all members, online status, leave room option
// ─────────────────────────────────────────────

const MembersPanel = ({ onClose }) => {
  const { activeRoom, onlineUsers, rooms, fetchMyRooms, setActiveRoom } = useChatStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  if (!activeRoom) return null;

  const members = activeRoom.members || [];
  const isCreator = activeRoom.createdBy?._id === user?._id ||
                    activeRoom.createdBy === user?._id;

  // Check if member is online
  const isOnline = (memberId) => {
    return onlineUsers.includes(memberId?.toString());
  };

  // Sort: online members first, then offline
  const sortedMembers = [...members].sort((a, b) => {
    const aOnline = isOnline(a._id);
    const bOnline = isOnline(b._id);
    if (aOnline && !bOnline) return -1;
    if (!aOnline && bOnline) return 1;
    return 0;
  });

  // Leave room handler
  const handleLeaveRoom = async () => {
    if (activeRoom.name === 'General') {
      toast.error('You cannot leave the General room');
      return;
    }

    try {
      await api.post(`/rooms/${activeRoom._id}/leave`);

      toast.success(`Left #${activeRoom.name}`);

      // Remove room from sidebar
      await fetchMyRooms();

      // Clear active room
      setActiveRoom(null);
      onClose();

    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to leave room');
    }
  };

  return (
    // Slide-in panel from right
    <div className="w-64 shrink-0 bg-slate-900 border-l border-slate-800
                    flex flex-col h-full">

      {/* ── Panel Header ── */}
      <div className="px-4 py-4 border-b border-slate-800
                      flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-sm">Members</h3>
          <p className="text-slate-500 text-xs">
            {members.length} total ·{' '}
            <span className="text-emerald-400">
              {members.filter(m => isOnline(m._id)).length} online
            </span>
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg
                     text-slate-400 hover:text-white hover:bg-slate-800
                     transition-all"
        >
          <X size={16} />
        </button>
      </div>

      {/* ── Room Info ── */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-800/30">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{activeRoom.avatar}</span>
          <div>
            <p className="text-white text-sm font-medium">#{activeRoom.name}</p>
            {activeRoom.description && (
              <p className="text-slate-500 text-xs mt-0.5">
                {activeRoom.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Members List ── */}
      <div className="flex-1 overflow-y-auto py-3 px-3"
           style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>

        {sortedMembers.map((member) => {
          const online = isOnline(member._id);
          const isYou = member._id === user?._id;
          const isRoomCreator = activeRoom.createdBy?._id === member._id ||
                                activeRoom.createdBy === member._id;

          return (
            <div key={member._id}
              className="flex items-center gap-3 px-2 py-2.5 rounded-xl
                         hover:bg-slate-800/50 transition-colors group">

              {/* Avatar with online indicator */}
              <div className="relative shrink-0">
                <img
                  src={member.avatar}
                  alt={member.username}
                  className="w-8 h-8 rounded-lg object-cover"
                />
                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5
                                 rounded-full border-2 border-slate-900
                                 ${online ? 'bg-emerald-500' : 'bg-slate-600'}`}
                />
              </div>

              {/* Name + badges */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-sm font-medium truncate
                                   ${online ? 'text-white' : 'text-slate-400'}`}>
                    {member.username}
                    {isYou ? ' (you)' : ''}
                  </span>

                  {/* Crown for room creator */}
                  {isRoomCreator && (
                    <Crown size={11} className="text-amber-400 shrink-0" />
                  )}
                </div>

                <p className={`text-xs ${online ? 'text-emerald-400' : 'text-slate-600'}`}>
                  {online ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Leave Room Button ── */}
      {activeRoom.name !== 'General' && (
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLeaveRoom}
            className="w-full flex items-center justify-center gap-2
                       py-2.5 rounded-xl border border-red-500/30
                       text-red-400 hover:bg-red-500/10 hover:border-red-500/50
                       text-sm font-medium transition-all duration-200"
          >
            <LogOut size={15} />
            Leave #{activeRoom.name}
          </button>
        </div>
      )}

    </div>
  );
};

export default MembersPanel;