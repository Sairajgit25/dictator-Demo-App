
import React, { useState, useEffect } from 'react';
import { X, ArrowRight, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, authError } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({ email: '', username: '', password: '' });
      setIsRegistering(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let success = false;
      if (isRegistering) {
        success = await register(formData.email, formData.password, formData.username);
      } else {
        success = await login(formData.email, formData.password);
      }

      if (success) {
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] overflow-hidden">
        {/* Header */}
        <div className="bg-dictator-lime p-4 border-b-4 border-black flex justify-between items-center">
          <h2 className="text-xl font-black flex items-center gap-2">
            {isRegistering ? <UserPlus size={24} /> : <LogIn size={24} />}
            {isRegistering ? 'INITIALIZE USER' : 'AUTHENTICATE'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-black/10 rounded">
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {authError && (
            <div className="bg-red-100 border-2 border-red-500 text-red-700 p-3 rounded-lg text-sm font-bold flex items-center gap-2 animate-fade-in">
              <AlertCircle size={16} /> {authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase text-gray-500 mb-1">Email Address</label>
              <input 
                type="email"
                required
                className="w-full p-3 bg-gray-50 border-2 border-black rounded-lg focus:outline-none focus:ring-4 ring-dictator-teal transition-all font-bold"
                placeholder="user@example.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            {isRegistering && (
              <div className="animate-fade-in">
                <label className="block text-xs font-black uppercase text-gray-500 mb-1">Callsign (Username)</label>
                <input 
                  type="text"
                  required
                  className="w-full p-3 bg-gray-50 border-2 border-black rounded-lg focus:outline-none focus:ring-4 ring-dictator-teal transition-all font-bold"
                  placeholder="Maverick"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-black uppercase text-gray-500 mb-1">Password</label>
              <input 
                type="password"
                required
                className="w-full p-3 bg-gray-50 border-2 border-black rounded-lg focus:outline-none focus:ring-4 ring-dictator-teal transition-all font-bold"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 bg-black text-white font-black text-lg rounded-xl shadow-[4px_4px_0px_0px_#1DD3B0] active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? 'PROCESSING...' : (isRegistering ? 'REGISTER' : 'LOGIN')}
              {!loading && <ArrowRight className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />}
            </button>
          </form>

          <div className="pt-4 text-center border-t-2 border-gray-100">
            <p className="text-xs font-bold text-gray-500 mb-2">
              {isRegistering ? 'Already have an ID?' : 'Need an account?'}
            </p>
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm font-black underline hover:text-dictator-teal transition-colors"
            >
              {isRegistering ? 'Login via Protocol' : 'Register New ID'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
