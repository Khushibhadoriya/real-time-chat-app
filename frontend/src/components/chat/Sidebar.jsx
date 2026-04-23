// frontend/src/components/chat/Sidebar.jsx

import { useState } from 'react';
import { LogOut, Plus, X, Hash, Compass } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore.js';
import useChatStore from '../../store/chatStore.js';
import { useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const {
    rooms,           // MY rooms only
    allRooms,        // all rooms for browse modal
    activeRoom,
    setActiveRoom,
    onlineUsers,
    createRoom,
    joinRoom,
    fetchAllRooms,
    fetchMyRooms,
  } = useChatStore();

  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBrowseModal, setShowBrowseModal] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', description: '', avatar: '💬' });
  const [isCreating, setIsCreating] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState(null);

  // ── LOGOUT ────────────────────────────────
  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  // ── SELECT ROOM ───────────────────────────
  const handleRoomSelect = (room) => {
    setActiveRoom(room);
  };

  // ── OPEN BROWSE MODAL ─────────────────────
  const handleOpenBrowse = async () => {
    setShowBrowseModal(true);
    await fetchAllRooms(); // load all rooms when modal opens
  };

  // ── JOIN ROOM FROM BROWSE ─────────────────
  const handleJoinRoom = async (room) => {
    setJoiningRoomId(room._id);
    const result = await joinRoom(room._id);
    setJoiningRoomId(null);

    if (result.success) {
      toast.success(`Joined #${room.name}!`);
      setActiveRoom(result.room);
      setShowBrowseModal(false);
    } else {
      toast.error(result.message);
    }
  };

  // ── CREATE ROOM ───────────────────────────
  const handleCreateRoom = async () => {
    if (!newRoom.name.trim()) {
      toast.error('Room name is required');
      return;
    }
    setIsCreating(true);
    const result = await createRoom(newRoom.name, newRoom.description, newRoom.avatar);
    setIsCreating(false);

    if (result.success) {
      toast.success(`#${newRoom.name} created!`);
      setShowCreateModal(false);
      setNewRoom({ name: '', description: '', avatar: '💬' });
      setActiveRoom(result.room);
    } else {
      toast.error(result.message);
    }
  };

  const avatarOptions = ['💬', '💻', '🎮', '🎵', '📚', '🌍', '🔥', '⚡', '🎨', '🚀'];

  // ── GET UNIQUE MEMBERS ACROSS MY ROOMS ────
  // Collect all members from rooms I'm in
  const allMembers = rooms
    .flatMap((r) => r.members || [])
    .filter((member, index, self) =>
      member && self.findIndex((m) => m._id === member._id) === index
    );

  // ── CHECK IF USER IS ONLINE ───────────────
  // onlineUsers contains string IDs
  // member._id from API is also a string (JSON parsed)

  // ── ONLINE CHECK ──────────────────────────────
  // onlineUsers = array of string IDs like ["665abc123", "665def456"]
  // member._id from MongoDB populated = string after JSON parse
  // ALWAYS convert both sides to string before comparing
  const isUserOnline = (memberId) => {
    if (!memberId) return false;
    const idStr = memberId.toString();
    const result = onlineUsers.includes(idStr);
    return result;
  };

  // ── CHECK IF ALREADY MEMBER ───────────────
  const isMemberOf = (room) => {
    return room.members?.some(
      (m) => m._id?.toString() === user?._id?.toString()
    );
  };

  return (
    <>
      <div className="w-72 shrink-0 bg-slate-900 border-r border-slate-800
                      flex flex-col h-full">

        {/* ── User Profile Header ── */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={user?.avatar}
                  alt={user?.username}
                  className="w-9 h-9 rounded-xl object-cover border-2 border-slate-700"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3
                                bg-emerald-500 rounded-full border-2 border-slate-900" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{user?.username}</p>
                <p className="text-emerald-400 text-xs">● Online</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="w-8 h-8 flex items-center justify-center rounded-lg
                         text-slate-400 hover:text-red-400 hover:bg-red-400/10
                         transition-all duration-200"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* ── Scrollable Content ── */}
        <div className="flex-1 overflow-y-auto py-4 px-3"
             style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>

          {/* ── My Rooms Section ── */}
          <div className="flex items-center justify-between px-2 mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              My Rooms
            </span>
            <div className="flex items-center gap-1">
              {/* Browse all rooms button */}
              <button
                onClick={handleOpenBrowse}
                className="w-6 h-6 flex items-center justify-center rounded
                           text-slate-400 hover:text-violet-400 transition-colors"
                title="Browse all rooms"
              >
                <Compass size={14} />
              </button>
              {/* Create room button */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-6 h-6 flex items-center justify-center rounded
                           text-slate-400 hover:text-violet-400 transition-colors"
                title="Create new room"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>

          {/* Room items */}
          <div className="flex flex-col gap-1 mb-6">
            {rooms.length === 0 ? (
              <p className="text-slate-600 text-xs px-2 py-1">
                No rooms yet. Create or browse rooms!
              </p>
            ) : (
              rooms.map((room) => {
                const isActive = activeRoom?._id === room._id;
                return (
                  <button
                    key={room._id}
                    onClick={() => handleRoomSelect(room)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                      text-left transition-all duration-150
                      ${isActive
                        ? 'bg-violet-600/20 border border-violet-500/30 text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                      }
                    `}
                  >
                    <span className="text-base shrink-0">{room.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate
                                    ${isActive ? 'text-white' : ''}`}>
                        #{room.name}
                      </p>
                      {room.description && (
                        <p className="text-xs text-slate-500 truncate">
                          {room.description}
                        </p>
                      )}
                    </div>
                    {isActive && (
                      <div className="w-1.5 h-1.5 bg-violet-400 rounded-full shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* ── Online Members Section ── */}
          <div>
            <div className="px-2 mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {/* Count only online members from my rooms */}
                Online — {allMembers.filter(m => isUserOnline(m._id)).length}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              {allMembers.map((member) => {
                const online = isUserOnline(member._id);
                return (
                  <div key={member._id}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl">
                    <div className="relative shrink-0">
                      <img
                        src={member.avatar}
                        alt={member.username}
                        className="w-7 h-7 rounded-lg object-cover"
                      />
                      {/* Green dot = online, gray dot = offline */}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5
                                      rounded-full border-2 border-slate-900
                                      ${online ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                    </div>
                    <span className={`text-sm truncate
                                     ${online ? 'text-slate-300' : 'text-slate-500'}`}>
                      {member.username}
                      {member._id === user?._id ? ' (you)' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* ── Create Room Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50
                        flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700
                          w-full max-w-md shadow-2xl">

            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h3 className="text-white font-semibold text-lg">Create New Room</h3>
              <button onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              {/* Avatar picker */}
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">
                  Room Icon
                </label>
                <div className="flex flex-wrap gap-2">
                  {avatarOptions.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setNewRoom((p) => ({ ...p, avatar: emoji }))}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center
                                  transition-all border
                                  ${newRoom.avatar === emoji
                                    ? 'bg-violet-600/30 border-violet-500'
                                    : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                                  }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 block mb-1.5">
                  Room Name *
                </label>
                <div className="relative">
                  <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. tech-talk"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom((p) => ({ ...p, name: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl
                               px-4 py-2.5 pl-9 text-white text-sm placeholder-slate-500
                               outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 block mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="What's this room about?"
                  value={newRoom.description}
                  onChange={(e) => setNewRoom((p) => ({ ...p, description: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl
                             px-4 py-2.5 text-white text-sm placeholder-slate-500
                             outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700
                           text-slate-400 hover:text-white text-sm font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={isCreating}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500
                           disabled:bg-violet-800 text-white text-sm font-medium transition-all"
              >
                {isCreating ? 'Creating...' : 'Create Room'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Browse All Rooms Modal ── */}
      {showBrowseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50
                        flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700
                          w-full max-w-md shadow-2xl max-h-[80vh] flex flex-col">

            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div>
                <h3 className="text-white font-semibold text-lg">Browse Rooms</h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Discover and join public rooms
                </p>
              </div>
              <button onClick={() => setShowBrowseModal(false)}
                className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-4 flex flex-col gap-2">
              {allRooms.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">
                  Loading rooms...
                </p>
              ) : (
                allRooms.map((room) => {
                  const alreadyMember = isMemberOf(room);
                  return (
                    <div key={room._id}
                      className="flex items-center gap-3 p-3 rounded-xl
                                 bg-slate-800/50 border border-slate-700">

                      <span className="text-2xl shrink-0">{room.avatar}</span>

                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">#{room.name}</p>
                        <p className="text-slate-500 text-xs truncate">
                          {room.description || 'No description'}
                        </p>
                        <p className="text-slate-600 text-xs mt-0.5">
                          {room.members?.length || 0} members
                        </p>
                      </div>

                      {alreadyMember ? (
                        <span className="text-xs text-emerald-400 font-medium
                                         bg-emerald-400/10 px-2 py-1 rounded-lg shrink-0">
                          Joined ✓
                        </span>
                      ) : (
                        <button
                          onClick={() => handleJoinRoom(room)}
                          disabled={joiningRoomId === room._id}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg shrink-0
                                     bg-violet-600 hover:bg-violet-500 text-white
                                     disabled:bg-violet-800 transition-all"
                        >
                          {joiningRoomId === room._id ? 'Joining...' : 'Join'}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;