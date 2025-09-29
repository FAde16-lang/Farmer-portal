import React, { useState } from 'react';
import { User, UserRole } from './types';
import LoginPage from './pages/LoginPage';
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import { api } from './services/mockApi';
import Header from './components/Header';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isNewHarvestModalOpen, setIsNewHarvestModalOpen] = useState(false);

  const handleLogin = async (farmerId: string, pass: string) => {
    const user = await api.authenticate(farmerId, pass);
    if(user) {
        setCurrentUser(user);
    } else {
        throw new Error("Invalid credentials.");
    }
  };

  const handleRegister = async (name: string, farmerId: string, pass: string) => {
    const user = await api.register(name, farmerId, pass);
    if(user){
        setCurrentUser(user);
    } else {
        throw new Error("Registration failed.");
    }
  }
  
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

  const renderDashboard = () => {
    if (!currentUser) return null;

    switch (currentUser.role) {
      case UserRole.FARMER:
        return <FarmerDashboard user={currentUser} />;
      // Lab and Regulator dashboards removed for farmer-only focus
      default:
        return <div className="p-8">Unknown user role. Please log out and try again.</div>;
    }
  };

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} onRegister={handleRegister} onGoogleLogin={handleGoogleLogin} />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Header user={currentUser} onLogout={handleLogout} onNewHarvest={handleNewHarvestClick} />
      <main className="bg-green-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {renderDashboard()}
        </div>
      </main>
    </div>
  );
};

export default App;