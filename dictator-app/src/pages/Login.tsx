import React from 'react';
import { ArrowUpRight, Terminal } from 'lucide-react';

interface LoginProps {
    onOpenAuth: () => void;
}

const Login: React.FC<LoginProps> = ({ onOpenAuth }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-24 animate-fade-in">
      <div className="w-full max-w-sm text-center space-y-8">
        
        <div className="inline-block relative">
            <div className="p-6 bg-dictator-lime border-4 border-black rounded-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative z-10">
                <Terminal size={48} />
            </div>
            <div className="absolute inset-0 bg-black rounded-full transform translate-x-2 translate-y-2 z-0"></div>
        </div>

        <div>
            <h1 className="text-5xl font-black mb-4 leading-none">RULE YOUR<br/>MIND.</h1>
            <p className="font-serif text-lg text-gray-600 leading-relaxed max-w-xs mx-auto">
                Reclaim your agency through friction, redirection, and habit formation.
            </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left space-y-4">
            <div className="flex items-start gap-3">
                <div className="bg-black text-white p-1 rounded">1</div>
                <p className="text-sm font-bold">Log in via the top right icon.</p>
            </div>
            <div className="flex items-start gap-3">
                <div className="bg-black text-white p-1 rounded">2</div>
                <p className="text-sm font-bold">Block distractions.</p>
            </div>
            <div className="flex items-start gap-3">
                <div className="bg-black text-white p-1 rounded">3</div>
                <p className="text-sm font-bold">Build new protocols.</p>
            </div>
        </div>

        <button 
            onClick={onOpenAuth}
            className="w-full py-4 bg-black text-white font-black text-xl rounded-xl shadow-[6px_6px_0px_0px_#1DD3B0] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 group hover:bg-gray-900"
        >
            INITIALIZE <ArrowUpRight className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};

export default Login;