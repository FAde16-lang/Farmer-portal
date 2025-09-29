import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import LoginPage from './pages/LoginPage';
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import LabDashboard from './pages/lab/LabDashboard';
import RegulatorDashboard from './pages/regulator/RegulatorDashboard';
import { api } from './services/mockApi';
import Header from './components/Header';
import Modal from './components/Modal';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // State for the editable profile form
  const [editableUser, setEditableUser] = useState<Partial<User>>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // State for editable settings form
  const [editableSettings, setEditableSettings] = useState({
    notifications: { sms: true, ivr: true },
    language: 'English',
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);


  useEffect(() => {
    // Keep editable user in sync when modal opens
    if (currentUser) {
      setEditableUser({ name: currentUser.name, country: currentUser.country });
      setEditableSettings(currentUser.settings);
    }
  }, [currentUser, isProfileModalOpen, isSettingsModalOpen]);


  const handleLogin = async (phone: string, pass: string) => {
    const user = await api.authenticate(phone, pass);
    if(user) {
        setCurrentUser(user);
    } else {
        throw new Error("Invalid credentials.");
    }
  };

  const handleRegister = async (name: string, phone: string, pass: string) => {
    const user = await api.register(name, phone, pass);
    if(user){
        setCurrentUser(user);
    } else {
        throw new Error("Registration failed.");
    }
  }

  const handleOtpLogin = async (phone: string, otp: string) => {
    const user = await api.verifyOtp(phone, otp);
    if (user) {
      setCurrentUser(user);
    } else {
      throw new Error("OTP verification failed.");
    }
  };
  
  const handleGoogleLogin = async () => {
    const user = await api.authenticateWithGoogle();
    if (user) {
      setCurrentUser(user);
    } else {
      throw new Error("Google Sign-In failed.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };
  
  const handleNewHarvestClick = () => {
      // This is a bit of a trick to communicate between Header and Dashboard
      // A proper implementation might use Context API
      document.dispatchEvent(new CustomEvent('openNewHarvestModal'));
  };

  const handleProfileFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditableUser(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSavingProfile(true);
    try {
      const updatedUser = await api.updateUser(currentUser.id, editableUser);
      setCurrentUser(updatedUser);
      setIsProfileModalOpen(false);
    } catch (error) {
      console.error("Failed to update user:", error);
      alert("Could not update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };
  
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSavingSettings(true);
    try {
      const updatedUser = await api.updateUser(currentUser.id, { settings: editableSettings });
      setCurrentUser(updatedUser);
      setIsSettingsModalOpen(false);
    } catch(error) {
      console.error("Failed to update settings:", error);
      alert("Could not update settings.");
    } finally {
      setIsSavingSettings(false);
    }
  }

  const renderDashboard = () => {
    if (!currentUser) return null;

    switch (currentUser.role) {
      case UserRole.FARMER:
        return <FarmerDashboard user={currentUser} />;
      case UserRole.LAB:
        return <LabDashboard user={currentUser} />;
      case UserRole.REGULATOR:
        return <RegulatorDashboard user={currentUser} />;
      default:
        return <div className="p-8">Unknown user role. Please log out and try again.</div>;
    }
  };

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} onRegister={handleRegister} onGoogleLogin={handleGoogleLogin} onOtpLogin={handleOtpLogin} />;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)]">
      <Header 
        user={currentUser} 
        onLogout={handleLogout} 
        onNewHarvest={handleNewHarvestClick}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />
      <main>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {renderDashboard()}
        </div>
      </main>
      
      {/* Profile Modal */}
      <Modal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} title="My Profile">
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <div>
            <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" id="profile-name" name="name" value={editableUser.name || ''} onChange={handleProfileFormChange} className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900" />
          </div>
          <div>
            <label htmlFor="profile-phone" className="block text-sm font-medium text-gray-700">Phone Number (read-only)</label>
            <input type="text" id="profile-phone" value={currentUser.phone} readOnly className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 bg-stone-100 cursor-not-allowed" />
          </div>
          <div>
            <label htmlFor="profile-country" className="block text-sm font-medium text-gray-700">Country</label>
            <input type="text" id="profile-country" name="country" value={editableUser.country || ''} onChange={handleProfileFormChange} className="mt-1 block w-full border border-stone-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900" />
          </div>
          <div className="pt-4 flex justify-end">
            <button type="submit" disabled={isSavingProfile} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400">
              {isSavingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Settings Modal */}
      <Modal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} title="Settings">
        <form onSubmit={handleUpdateSettings} className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                <p className="text-sm text-gray-500">Manage how you receive notifications from AyurTrace.</p>
                <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="flex-grow flex flex-col">
                            <span className="text-sm font-medium text-gray-900">SMS Notifications</span>
                            <span className="text-sm text-gray-500">For batch status updates and recalls.</span>
                        </span>
                        <button 
                            type="button" 
                            className={`${editableSettings.notifications.sms ? 'bg-emerald-600' : 'bg-gray-200'} relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500`} 
                            role="switch" 
                            aria-checked={editableSettings.notifications.sms}
                            onClick={() => setEditableSettings(prev => ({...prev, notifications: {...prev.notifications, sms: !prev.notifications.sms}}))}
                        >
                            <span className="sr-only">Use setting</span>
                            <span aria-hidden="true" className={`${editableSettings.notifications.sms ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}></span>
                        </button>
                    </div>
                     <div className="flex items-center justify-between">
                        <span className="flex-grow flex flex-col">
                            <span className="text-sm font-medium text-gray-900">IVR Call Confirmations</span>
                            <span className="text-sm text-gray-500">For submitting new harvest batches.</span>
                        </span>
                        <button 
                            type="button" 
                            className={`${editableSettings.notifications.ivr ? 'bg-emerald-600' : 'bg-gray-200'} relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500`} 
                            role="switch" 
                            aria-checked={editableSettings.notifications.ivr}
                            onClick={() => setEditableSettings(prev => ({...prev, notifications: {...prev.notifications, ivr: !prev.notifications.ivr}}))}
                        >
                            <span className="sr-only">Use setting</span>
                            <span aria-hidden="true" className={`${editableSettings.notifications.ivr ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}></span>
                        </button>
                    </div>
                </div>
            </div>
            <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900">Language</h3>
                <p className="text-sm text-gray-500">Choose your preferred language for the application.</p>
                 <div className="mt-4">
                     <select 
                        id="language" 
                        name="language" 
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md bg-white text-gray-900"
                        value={editableSettings.language}
                        onChange={(e) => setEditableSettings(prev => ({...prev, language: e.target.value}))}
                    >
                         <option value="English">English</option>
                         <option value="Hindi">हिन्दी (Hindi) - Coming Soon</option>
                         <option value="Kannada">ಕನ್ನಡ (Kannada) - Coming Soon</option>
                     </select>
                 </div>
            </div>
            <div className="pt-4 flex justify-end">
                <button type="submit" disabled={isSavingSettings} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400">
                    {isSavingSettings ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
      </Modal>
    </div>
  );
};

export default App;
