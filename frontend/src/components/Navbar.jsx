import React from 'react';
import { useTheme } from '../themeContext';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, LogOut, Sun, Moon, Sparkles, User as UserIcon } from 'lucide-react';

export default function Navbar({ currentUser, onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="navbar bg-base-100 shadow-md px-4 md:px-8 sticky top-0 z-50 transition-all duration-300">
      <div className="flex-1">
        <a
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => navigate(currentUser ? '/dashboard' : '/')}
        >
          <div className="p-2 bg-primary text-primary-content rounded-xl shadow-lg transition-transform group-hover:scale-105">
            <Stethoscope className="w-6 h-6" />
          </div>
          <span className="font-heading font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Patriot ITS
          </span>
        </a>
      </div>

      <div className="flex-none gap-2">
        {/* Theme Controller */}
        {/* <button 
          onClick={toggleTheme} 
          className="btn btn-ghost btn-circle"
          title={`Switch to ${theme === 'emerald' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'emerald' ? (
            <Moon className="w-5 h-5 text-neutral" />
          ) : (
            <Sun className="w-5 h-5 text-warning" />
          )}
        </button> */}

        {currentUser ? (
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle avatar placeholder">
              <div className="bg-neutral text-neutral-content rounded-full w-10">
                <span className="font-semibold text-sm">
                  {currentUser.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </label>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52 border border-base-200">
              <li className="px-4 py-2 border-b border-base-200">
                <p className="font-bold text-base">{currentUser.name}</p>
                <p className="text-xs text-neutral-500 font-mono">{currentUser.role}</p>
              </li>
              <li>
                <a onClick={() => navigate('/dashboard')}>
                  <UserIcon className="w-4 h-4" /> Dashboard
                </a>
              </li>
              {currentUser.role === 'PESERTA' && (
                <li>
                  <a onClick={() => navigate('/chatbot')}>
                    <Sparkles className="w-4 h-4 text-secondary" /> Chatbot AI
                  </a>
                </li>
              )}
              <li>
                <a onClick={onLogout} className="text-error font-medium">
                  <LogOut className="w-4 h-4" /> Logout
                </a>
              </li>
            </ul>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/login')}
              className="btn btn-ghost btn-sm text-neutral"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              className="btn btn-primary btn-sm rounded-lg"
            >
              Daftar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
