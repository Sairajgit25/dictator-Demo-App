import React from 'react';
import { User, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onOpenAuth: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenAuth }) => {
  const { user } = useAuth();
  const logoUrl = "https://file-service-full-2-w2-192518426000.us-central1.run.app/image/2491a97d-6975-47e2-aa00-88005b4d0811";

  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-dictator-lime border-b-4 border-black z-40 px-4 shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="max-w-md mx-auto h-full flex items-center justify-between">
        
        {/* Left: Logo Image */}
        <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center bg-black border-2 border-black rounded-lg overflow-hidden shadow-sm">
            <img 
              src={logoUrl} 
              alt="Dictator Logo" 
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback if image fails
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerText = '🛡️';
              }}
            />
        </div>

        {/* Middle: App Name */}
        <div className="flex-1 text-center">
          <h1 className="font-black text-3xl tracking-tighter text-black drop-shadow-sm italic">
            DICTATOR
          </h1>
        </div>

        {/* Right: Login/User Logo */}
        <div className="w-14 flex justify-end">
          <button 
            onClick={onOpenAuth}
            className={`p-2.5 rounded-xl border-2 border-black transition-all active:translate-y-0.5 active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
              user 
                ? 'bg-white hover:bg-gray-50 text-black' 
                : 'bg-black text-white hover:bg-gray-800'
            }`}
            title={user ? "Account" : "Login"}
          >
            {user ? <User size={24} strokeWidth={2.5} /> : <LogIn size={24} strokeWidth={2.5} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;