import React from 'react';
import { User } from '../types';
import { LeafIcon, LogoutIcon, GlobeIcon, ChevronDownIcon } from './Icons';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  onNewHarvest: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, onNewHarvest }) => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
             <div className="p-2 bg-green-100 rounded-lg">
                <LeafIcon className="w-6 h-6 text-green-700" />
             </div>
             <div>
                <h1 className="text-md font-bold text-gray-800 tracking-tight">Farmer Harvest Tracker</h1>
                <p className="text-xs text-gray-500">Blockchain Traceability Portal</p>
             </div>
          </div>
          
          {user && (
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button className="hidden sm:flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                <GlobeIcon className="w-5 h-5 text-gray-500" />
                <span>English</span>
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
              </button>
              
              <button className="px-3 py-2 border border-transparent rounded-md text-sm font-medium text-gray-700 hover:bg-green-50">
                Dashboard
              </button>

              <button
                onClick={onNewHarvest}
                className="px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                New Harvest
              </button>
              
              <div className="relative">
                <button className="flex items-center space-x-2 p-1 rounded-md hover:bg-gray-100" onClick={onLogout} title="Logout">
                   <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center font-bold">
                       {user.name.charAt(0)}
                   </div>
                   <div className="hidden lg:block text-left">
                       <p className="font-semibold text-sm text-gray-800">{user.name}</p>
                       <p className="text-xs text-gray-500">{user.id}</p>
                   </div>
                   <LogoutIcon className="w-6 h-6 text-red-500" />
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;