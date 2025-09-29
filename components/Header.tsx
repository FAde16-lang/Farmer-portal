import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { LeafIcon, LogoutIcon, GlobeIcon, ChevronDownIcon } from './Icons';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  onNewHarvest: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, onNewHarvest, onOpenProfile, onOpenSettings }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close dropdown if clicked outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => {
    onOpenProfile();
    setDropdownOpen(false);
  };

  const handleSettingsClick = () => {
    onOpenSettings();
    setDropdownOpen(false);
  };
  
  const handleLogoutClick = () => {
    onLogout();
    setDropdownOpen(false);
  }

  return (
    <header className="bg-white/80 backdrop-blur-lg shadow-md sticky top-0 z-20 border-b border-[var(--color-border)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-3">
             <div className="p-2.5 bg-emerald-100 rounded-xl">
                <LeafIcon className="w-7 h-7 text-emerald-700" />
             </div>
             <div>
                <h1 className="text-xl font-bold text-gray-800 tracking-tight">AyurTrace</h1>
                <p className="text-xs text-[var(--color-text-muted)]">Blockchain Traceability Portal</p>
             </div>
          </div>
          
          {user && (
            <div className="flex items-center space-x-2 sm:space-x-4">
               <button
                onClick={onNewHarvest}
                className="px-4 py-2.5 border border-transparent rounded-full text-sm font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-colors shadow-sm"
              >
                + New Harvest
              </button>
              
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)} 
                  className="flex items-center space-x-3 p-1.5 rounded-full hover:bg-stone-100 transition-colors"
                  title="Account options"
                  aria-haspopup="true"
                  aria-expanded={dropdownOpen}
                >
                   <div className="w-11 h-11 rounded-full bg-[var(--color-primary-light)] text-white flex items-center justify-center font-bold text-lg">
                       {user.name.charAt(0)}
                   </div>
                   <div className="hidden lg:block text-left">
                       <p className="font-semibold text-sm text-gray-800">{user.name}</p>
                       <p className="text-xs text-[var(--color-text-muted)]">{user.role}</p>
                   </div>
                   <ChevronDownIcon className={`w-5 h-5 text-gray-400 hidden lg:block transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                <div 
                  className={`absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-30 transition-all duration-200 ease-in-out transform ${dropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
                >
                    <button onClick={handleProfileClick} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-stone-100">Profile</button>
                    <button onClick={handleSettingsClick} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-stone-100">Settings</button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button onClick={handleLogoutClick} className="w-full text-left flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                        <LogoutIcon className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;