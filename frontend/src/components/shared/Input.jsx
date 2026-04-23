// frontend/src/components/shared/Input.jsx

// ─────────────────────────────────────────────
// REUSABLE INPUT COMPONENT
// Props:
//   label      → text shown above input ("Email Address")
//   icon       → Lucide icon component to show inside input
//   error      → error message to show below input
//   ...props   → any other HTML input attributes (type, value, onChange, etc.)
// ─────────────────────────────────────────────

const Input = ({ label, icon: Icon, error, ...props }) => {
  return (
    <div className="flex flex-col gap-1.5">

      {/* Label above the input */}
      {label && (
        <label className="text-sm font-medium text-slate-300">
          {label}
        </label>
      )}

      {/* Input wrapper — position relative so icon can be absolute inside */}
      <div className="relative">

        {/* Icon on the left side of input */}
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon size={17} />
          </div>
        )}

        {/* The actual input element */}
        {/* ...props spreads: type, value, onChange, placeholder, etc. */}
        <input
          {...props}
          className={`
            w-full rounded-xl border bg-slate-800/50 px-4 py-3 text-sm text-white
            placeholder-slate-500 outline-none transition-all duration-200
            focus:ring-2 focus:ring-violet-500 focus:border-transparent
            ${Icon ? 'pl-10' : 'pl-4'}
            ${error
              ? 'border-red-500/70 focus:ring-red-500'
              : 'border-slate-700 hover:border-slate-600'
            }
          `}
        />
      </div>

      {/* Error message below input */}
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}

    </div>
  );
};

export default Input;