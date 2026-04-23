// frontend/src/pages/AuthPage.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Mail, Lock, User, Zap, Shield, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore.js';
import Input from '../components/shared/Input.jsx';

// ─────────────────────────────────────────────
// AUTH PAGE
// Handles both Login and Register in one page
// Tab switching changes which form is visible
// ─────────────────────────────────────────────

const AuthPage = () => {
  // 'login' or 'register' — controls which tab is active
  const [activeTab, setActiveTab] = useState('login');

  // Form state — controlled inputs
  // WHY controlled: React tracks every keystroke → we can validate live
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Field-level errors
  const [errors, setErrors] = useState({});

  // Get actions and state from Zustand auth store
  const { login, register, isLoading } = useAuthStore();

  // useNavigate → programmatically redirect after login
  const navigate = useNavigate();

  // ─────────────────────────────────────────
  // HANDLE INPUT CHANGE
  // One handler for ALL inputs
  // e.target.name tells us which field changed
  // ─────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Update only the field that changed
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field as user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // ─────────────────────────────────────────
  // VALIDATION
  // Run before submitting — catches errors early
  // ─────────────────────────────────────────
  const validate = () => {
    const newErrors = {};

    if (activeTab === 'register') {
      if (!formData.username.trim()) {
        newErrors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);

    // Returns true if no errors (empty object)
    return Object.keys(newErrors).length === 0;
  };

  // ─────────────────────────────────────────
  // HANDLE SUBMIT
  // ─────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault(); // prevent page refresh on form submit

    // Run validation first
    if (!validate()) return;

    let result;

    if (activeTab === 'login') {
      result = await login(formData.email, formData.password);
    } else {
      result = await register(formData.username, formData.email, formData.password);
    }

    if (result.success) {
      toast.success(
        activeTab === 'login' ? '👋 Welcome back!' : '🎉 Account created!'
      );
      navigate('/chat'); // redirect to chat page
    } else {
      toast.error(result.message);
    }
  };

  // ─────────────────────────────────────────
  // SWITCH TABS — reset form when switching
  // ─────────────────────────────────────────
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setFormData({ username: '', email: '', password: '', confirmPassword: '' });
    setErrors({});
  };

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 flex">

      {/* ── LEFT SIDE — Decorative Panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden
                      bg-linear-to-br from-violet-900 via-slate-900 to-indigo-900
                      flex-col items-center justify-center p-12">

        {/* Decorative blurred circles in background */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-violet-600/20
                        rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/20
                        rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        {/* Content on top of decorative bg */}
        <div className="relative z-10 flex flex-col items-center text-center gap-8">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-violet-500 rounded-2xl flex items-center
                            justify-center shadow-lg shadow-violet-500/30">
              <MessageSquare size={28} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">
              ChatSphere
            </h1>
          </div>

          {/* Tagline */}
          <p className="text-slate-300 text-lg max-w-sm leading-relaxed">
            Connect, collaborate, and chat in real-time with teams around the world.
          </p>

          {/* Feature list */}
          <div className="flex flex-col gap-4 w-full max-w-xs">
            {[
              { icon: Zap, text: 'Real-time messaging — zero delay' },
              { icon: Users, text: 'Group rooms for every topic' },
              { icon: Shield, text: 'Secure JWT authentication' },
            ].map(({ icon: Icon, text }) => (
              <div key={text}
                className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3
                           border border-white/10">
                <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center
                                justify-center shrink-0">
                  <Icon size={16} className="text-violet-400" />
                </div>
                <span className="text-slate-300 text-sm">{text}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── RIGHT SIDE — Auth Form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">

          {/* Mobile logo — only shows on small screens */}
          <div className="flex lg:hidden items-center gap-2 justify-center mb-8">
            <div className="w-9 h-9 bg-violet-500 rounded-xl flex items-center justify-center">
              <MessageSquare size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white">ChatSphere</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">
              {activeTab === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-slate-400 mt-1 text-sm">
              {activeTab === 'login'
                ? 'Sign in to continue to ChatSphere'
                : 'Join thousands of users on ChatSphere'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-slate-800/50 rounded-xl p-1 mb-8 border border-slate-700">
            {['login', 'register'].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabSwitch(tab)}
                className={`
                  flex-1 py-2.5 rounded-lg text-sm font-medium capitalize
                  transition-all duration-200
                  ${activeTab === tab
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                    : 'text-slate-400 hover:text-slate-300'
                  }
                `}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Username — only for register */}
            {activeTab === 'register' && (
              <Input
                label="Username"
                name="username"
                type="text"
                placeholder="Enter your username"
                icon={User}
                value={formData.username}
                onChange={handleChange}
                error={errors.username}
              />
            )}

            {/* Email */}
            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="Enter your email"
              icon={Mail}
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
            />

            {/* Password */}
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="Enter your password"
              icon={Lock}
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
            />

            {/* Confirm Password — only for register */}
            {activeTab === 'register' && (
              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                icon={Lock}
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
              />
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full bg-violet-600 hover:bg-violet-500
                         disabled:bg-violet-800 disabled:cursor-not-allowed
                         text-white font-semibold py-3 rounded-xl
                         transition-all duration-200
                         shadow-lg shadow-violet-500/20
                         hover:shadow-violet-500/30 hover:-translate-y-0.5
                         active:translate-y-0"
            >
              {isLoading
                ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    {activeTab === 'login' ? 'Signing in...' : 'Creating account...'}
                  </span>
                )
                : (activeTab === 'login' ? 'Sign In' : 'Create Account')
              }
            </button>

          </form>

          {/* Bottom text */}
          <p className="text-center text-slate-500 text-sm mt-6">
            {activeTab === 'login'
              ? "Don't have an account? "
              : 'Already have an account? '}
            <button
              onClick={() => handleTabSwitch(
                activeTab === 'login' ? 'register' : 'login'
              )}
              className="text-violet-400 hover:text-violet-300
                         font-medium transition-colors"
            >
              {activeTab === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

        </div>
      </div>

    </div>
  );
};

export default AuthPage;