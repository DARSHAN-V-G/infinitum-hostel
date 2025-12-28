import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const { logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/home' },
    { name: 'Rooms', href: '/home/add-rooms' },
    { name: 'Search Members', href: '/home/accommodation-details' },
    { name: 'All Accommodations', href: '/home/all-accommodations' },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-br from-gray-900 via-[rgba(67,2,105,0.3)] to-gray-900 flex relative overflow-hidden tomorrow-regular ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex flex-col h-full relative">
          {/* Animated background glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute w-48 h-48 -top-24 -left-24 bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute w-48 h-48 -bottom-24 -right-24 bg-pink-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
          </div>

          {/* Logo/Brand */}
          <div className="relative flex items-center justify-center h-16 px-4 bg-gradient-to-r from-purple-600/30 to-pink-600/30 border-b border-purple-500/20">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 blur-xl"></div>
            <div className="flex items-center space-x-2 relative z-10">
              <img 
                src="/src/assets/infinitumLogo.png" 
                alt="Infinitum Logo" 
                className="h-16 w-auto"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 relative z-10">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`group relative flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-purple-300 border-r-4 border-purple-500 shadow-lg shadow-purple-500/20'
                      : 'text-gray-400 hover:bg-purple-500/10 hover:text-purple-300'
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg blur-sm"></div>
                  )}
                  <span className="relative z-10">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="relative z-10 p-4 border-t border-purple-500/20">
            <button
              onClick={handleLogout}
              className="group relative flex items-center w-full px-4 py-3 text-sm font-medium text-pink-400 rounded-lg hover:bg-pink-500/10 transition-all duration-200 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              <svg className="relative z-10 w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="relative z-10">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;