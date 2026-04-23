// frontend/src/components/chat/MessageBubble.jsx

import { format } from 'date-fns';
import useAuthStore from '../../store/authStore.js';

// ─────────────────────────────────────────────
// MESSAGE BUBBLE
// Renders differently based on if YOU sent it or someone else
//
// YOUR message    → right aligned, violet background
// THEIR message   → left aligned, slate background
// ─────────────────────────────────────────────

const MessageBubble = ({ message }) => {
  const { user } = useAuthStore();

  // Check if this message was sent by the logged-in user
  const isOwn = message.sender._id === user._id;

  // Format timestamp: "2024-01-15T10:30:00Z" → "10:30 AM"
  const timeString = format(new Date(message.createdAt), 'h:mm a');

  return (
    <div className={`flex items-end gap-2 mb-4 
                    ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>

      {/* Avatar — only show for other users messages */}
      {!isOwn && (
        <img
          src={message.sender.avatar}
          alt={message.sender.username}
          className="w-8 h-8 rounded-full object-cover shrink-0
                     border-2 border-slate-700"
        />
      )}

      {/* Message content */}
      <div className={`flex flex-col gap-1 max-w-[70%]
                      ${isOwn ? 'items-end' : 'items-start'}`}>

        {/* Sender name — only for others messages */}
        {!isOwn && (
          <span className="text-xs text-slate-400 ml-1 font-medium">
            {message.sender.username}
          </span>
        )}

        {/* Bubble */}
        <div className={`
          px-4 py-2.5 rounded-2xl text-sm leading-relaxed
          ${isOwn
            ? 'bg-violet-600 text-white rounded-br-sm'
            : 'bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700'
          }
        `}>
          {message.content}
        </div>

        {/* Timestamp */}
        <span className="text-xs text-slate-500 mx-1">
          {timeString}
        </span>

      </div>
    </div>
  );
};

export default MessageBubble;