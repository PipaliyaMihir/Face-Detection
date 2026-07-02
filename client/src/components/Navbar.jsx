import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TbScan } from 'react-icons/tb';

export default function Navbar() {
  const location = useLocation();
  const isAdmin = location.pathname === '/admin';
  const isLogin = location.pathname === '/login';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
        <div className="flex items-center justify-between h-[70px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <TbScan className="text-white text-xl" />
            </div>
            <span className="text-xl font-display font-bold gradient-text">
              AttendEase
            </span>
          </Link>

          {/* Only show nav items if on admin or login page */}
          <div className="flex items-center gap-4">
            {(isAdmin || isLogin) && (
              <Link
                to="/"
                className="text-sm text-gray-400 hover:text-cyan-400 transition-colors duration-300"
              >
                ← Back to Attendance
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
