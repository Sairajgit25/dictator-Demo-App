import React, { useState } from 'react';
import { ShieldAlert, Activity, BookOpen, ChevronRight, Check, Crown } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "Welcome to Dictator",
    description: "Reclaim your agency through friction and redirection. Rule your mind.",
    icon: <Crown size={48} className="text-black" />,
    color: "bg-dictator-lime"
  },
  {
    title: "Ruthless Blocking",
    description: "Identify time-sinks. Lock them down. Stop the doomscroll before it starts.",
    icon: <ShieldAlert size={48} className="text-black" />,
    color: "bg-red-400"
  },
  {
    title: "Atomic Habits",
    description: "Build streaks. Track consistency. Forge new neural pathways with daily reps.",
    icon: <Activity size={48} className="text-black" />,
    color: "bg-dictator-teal"
  },
  {
    title: "Micro-Learning",
    description: "Replace cheap dopamine with actual knowledge. Learn something new in seconds.",
    icon: <BookOpen size={48} className="text-black" />,
    color: "bg-dictator-gold"
  }
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-[#FEFFA7]">
      {/* Card */}
      <div className={`w-full max-w-sm aspect-[4/5] rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center mb-8 transition-colors duration-500 p-8 ${step.color}`}>
        <div className="mb-8 p-6 bg-white border-4 border-black rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-bounce-slow">
          {step.icon}
        </div>
        <h2 className="text-3xl font-black text-center mb-4 leading-tight">{step.title}</h2>
        <p className="text-center font-serif text-lg leading-relaxed">{step.description}</p>
      </div>

      {/* Pagination Dots */}
      <div className="flex gap-3 mb-8">
        {steps.map((_, idx) => (
          <div 
            key={idx}
            className={`w-3 h-3 rounded-full border-2 border-black transition-all duration-300 ${
              idx === currentStep ? 'bg-black scale-125' : 'bg-transparent'
            }`}
          />
        ))}
      </div>

      {/* Action Button */}
      <button
        onClick={handleNext}
        className="w-full max-w-sm py-4 rounded-xl border-4 border-black bg-white font-black text-xl flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all hover:bg-gray-50"
      >
        {currentStep === steps.length - 1 ? (
          <>Get Started <Check size={28} strokeWidth={3} /></>
        ) : (
          <>Next <ChevronRight size={28} strokeWidth={3} /></>
        )}
      </button>
    </div>
  );
};

export default Onboarding;