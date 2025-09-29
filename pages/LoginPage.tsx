import React, { useState } from 'react';
import { LeafIcon, GoogleIcon } from '../components/Icons';
import { api } from '../services/mockApi';

interface LoginPageProps {
  onLogin: (phone: string, pass: string) => Promise<void>;
  onRegister: (name: string, phone: string, pass: string) => Promise<void>;
  onGoogleLogin: () => Promise<void>;
  onOtpLogin: (phone: string, otp: string) => Promise<void>;
}

type AuthView = 'login' | 'register' | 'otp-request' | 'otp-verify';

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onRegister, onGoogleLogin, onOtpLogin }) => {
  const [authView, setAuthView] = useState<AuthView>('login');
  
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');

  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetFormState = () => {
    setError('');
    setInfo('');
    setIsLoading(false);
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();
    setIsLoading(true);
    try {
      if (authView === 'login') {
        await onLogin(phone, password);
      } else {
        await onRegister(name, phone, password);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();
    setIsLoading(true);
    try {
        await api.sendOtp(phone);
        setInfo(`An OTP has been sent to ${phone}.`);
        setAuthView('otp-verify');
    } catch(err: any) {
        setError(err.message || 'Failed to send OTP.');
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();
    setIsLoading(true);
    try {
        await onOtpLogin(phone, otp);
    } catch (err: any) {
        setError(err.message || 'OTP verification failed.');
    } finally {
        setIsLoading(false);
    }
  }

  const handleGoogleSignIn = async () => {
    resetFormState();
    setIsLoading(true);
    try {
      await onGoogleLogin();
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyles = "appearance-none block w-full px-4 py-3 bg-stone-100 border border-stone-200 rounded-lg shadow-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm";

  const renderFormContent = () => {
    switch (authView) {
        case 'otp-request':
            return (
                 <form className="mt-6 space-y-6" onSubmit={handleOtpRequest}>
                    <h3 className="text-xl font-semibold text-center text-gray-800">Forgot Password?</h3>
                    <p className="text-sm text-center text-gray-500">Enter your phone number and we'll send you an OTP to log in.</p>
                    <div>
                        <label htmlFor="phone" className="sr-only">Phone Number</label>
                        <input id="phone" name="phone" type="tel" placeholder="Phone Number" required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputStyles}/>
                    </div>
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    <div>
                        <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:bg-emerald-400 transition-colors">
                            {isLoading ? 'Sending...' : 'Send OTP'}
                        </button>
                    </div>
                    <div className="text-center">
                        <button type="button" onClick={() => { setAuthView('login'); resetFormState(); }} className="text-sm font-medium text-emerald-600 hover:text-emerald-800">Back to Sign In</button>
                    </div>
                </form>
            );
        case 'otp-verify':
            return (
                <form className="mt-6 space-y-6" onSubmit={handleOtpVerify}>
                    <h3 className="text-xl font-semibold text-center text-gray-800">Verify OTP</h3>
                    <p className="text-sm text-center text-gray-500">Enter the 6-digit code sent to your phone.</p>
                    <div>
                        <label htmlFor="otp" className="sr-only">OTP</label>
                        <input id="otp" name="otp" type="text" placeholder="6-Digit OTP" required value={otp} onChange={(e) => setOtp(e.target.value)} className={inputStyles}/>
                    </div>
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    {info && <p className="text-sm text-blue-600 text-center">{info}</p>}
                    <div>
                        <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:bg-emerald-400 transition-colors">
                            {isLoading ? 'Verifying...' : 'Sign In with OTP'}
                        </button>
                    </div>
                    <div className="text-center">
                        <button type="button" onClick={() => { setAuthView('otp-request'); resetFormState(); }} className="text-sm font-medium text-emerald-600 hover:text-emerald-800">Resend OTP</button>
                    </div>
                </form>
            );
      case 'login':
      case 'register':
      default:
        return (
          <>
            <div className="mt-8">
                <nav className="flex space-x-2 bg-stone-100 p-1 rounded-lg" aria-label="Tabs">
                  <button onClick={() => { setAuthView('login'); resetFormState(); }} className={`w-1/2 font-semibold text-sm rounded-md py-2.5 transition-colors ${authView === 'login' ? 'bg-white shadow text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}>
                    Sign In
                  </button>
                  <button onClick={() => { setAuthView('register'); resetFormState(); }} className={`w-1/2 font-semibold text-sm rounded-md py-2.5 transition-colors ${authView === 'register' ? 'bg-white shadow text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}>
                    Register
                  </button>
                </nav>
            </div>
            
            <div className="mt-6">
                <button type="button" onClick={handleGoogleSignIn} disabled={isLoading} className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-stone-50 disabled:bg-stone-200 transition-colors">
                  <GoogleIcon className="w-5 h-5 mr-3" />
                  Sign {authView === 'login' ? 'in' : 'up'} with Google
                </button>
            </div>
            
            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Or continue with</span></div>
            </div>

            <form className="mt-6 space-y-6" onSubmit={handlePasswordSubmit}>
                {authView === 'register' && (
                  <div>
                    <label htmlFor="name" className="sr-only">Full Name</label>
                    <input id="name" name="name" type="text" placeholder="Full Name" required value={name} onChange={(e) => setName(e.target.value)} className={inputStyles}/>
                  </div>
                )}

                <div>
                  <label htmlFor="phone" className="sr-only">Phone Number</label>
                  <input id="phone" name="phone" type="tel" placeholder="Phone Number" required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputStyles}/>
                </div>

                <div>
                  <label htmlFor="password" className="sr-only">Password</label>
                  <input id="password" name="password" type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputStyles}/>
                </div>
                
                {authView === 'login' && (
                  <div className="text-right">
                    <button type="button" onClick={() => { setAuthView('otp-request'); resetFormState(); }} className="text-sm font-medium text-emerald-600 hover:text-emerald-800">Forgot password?</button>
                  </div>
                )}

                {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                <div>
                  <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:bg-emerald-400 transition-colors">
                    {isLoading ? 'Processing...' : (authView === 'login' ? 'Sign In' : 'Create Account')}
                  </button>
                </div>
            </form>
          </>
        );
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex w-1/2 bg-emerald-700 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full"></div>
        <div className="absolute bottom-16 -left-24 w-80 h-80 bg-white/10 rounded-full"></div>
        <div>
            <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-lg">
                    <LeafIcon className="w-6 h-6 text-emerald-700" />
                </div>
                <span className="text-2xl font-bold">AyurTrace</span>
            </div>
        </div>
        <div>
            <h1 className="text-4xl font-bold leading-tight">Authenticity from<br/>Seed to Shelf.</h1>
            <p className="mt-4 text-lg text-emerald-100 max-w-md">Join our blockchain-powered network to ensure transparency and trust in the Ayurvedic supply chain.</p>
        </div>
        <div className="text-sm text-emerald-200">
            &copy; {new Date().getFullYear()} AyurTrace. All rights reserved.
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-[var(--color-bg-base)]">
        <div className="w-full max-w-md">
            <div className="bg-white p-8 rounded-2xl shadow-xl">
              {authView !== 'otp-request' && authView !== 'otp-verify' && (
                  <>
                      <h2 className="text-3xl font-bold text-gray-900 text-center lg:text-left">
                      {authView === 'login' ? 'Welcome Back' : 'Create an Account'}
                      </h2>
                      <p className="mt-2 text-center lg:text-left text-gray-600">
                      {authView === 'login' ? 'Sign in to manage your harvests.' : 'Join the network of trusted farmers.'}
                      </p>
                  </>
              )}
              {renderFormContent()}
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;