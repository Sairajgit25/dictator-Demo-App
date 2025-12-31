import React, { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import BottomNav from './dictator-app/src/components/BottomNav';
import Header from './dictator-app/src/components/Header';
import AuthModal from './dictator-app/src/components/AuthModal';
import Dashboard from './dictator-app/src/pages/Dashboard';
import Blocklist from './dictator-app/src/pages/Blocklist';
import Learning from './dictator-app/src/pages/Learning';
import Habits from './dictator-app/src/pages/Habits';
import Settings from './dictator-app/src/pages/Settings';
import Onboarding from './dictator-app/src/components/Onboarding';
import Login from './dictator-app/src/pages/Login';
import { AuthProvider, useAuth } from './dictator-app/src/contexts/AuthContext';
import { requestNotificationPermission, sendNotification } from './dictator-app/src/services/notificationService';
import { COLORS } from './dictator-app/src/constants';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user, userData, completeOnboarding } = useAuth();

  // Redirect to settings if user clicks top right icon while logged in
  const handleHeaderAuthClick = () => {
    if (user) {
        setActiveTab('settings');
    } else {
        setIsAuthModalOpen(true);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'blocklist':
        return <Blocklist />;
      case 'learning':
        return <Learning />;
      case 'habits':
        return <Habits />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  // Notification & Timer Logic
  useEffect(() => {
    if (user) {
      requestNotificationPermission();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Check every minute for Strict Mode or Habit Cues
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

      // 1. Strict Mode Notification
      if (userData.settings.strictMode) {
        // Start Time
        if (userData.settings.strictModeStart === currentTime) {
            sendNotification("⚠️ Strict Mode Activated", {
                body: "Lockdown protocols initiated. Distractions are now blocked.",
                tag: 'strict-mode-start'
            });
        }
        // End Time
        if (userData.settings.strictModeEnd === currentTime) {
             sendNotification("🔓 Strict Mode Disengaged", {
                body: "Restrictions lifted. You have regained access to blocked apps.",
                tag: 'strict-mode-end'
            });
        }
      }

      // 2. Specific Habit Reminders
      userData.habits.forEach(habit => {
         if (habit.reminderTime === currentTime && !habit.completedToday) {
             sendNotification(`⚡ Protocol Reminder: ${habit.title}`, {
                 body: `Time to execute: ${habit.cue}`,
                 tag: `habit-${habit.id}`
             });
         }
      });

      // 3. Fallback Habit Reminder (Generic)
      if (currentTime === "20:00") {
        const pendingHabits = userData.habits.filter(h => h.frequency === 'Daily' && !h.completedToday);
        if (pendingHabits.length > 0) {
           sendNotification("⚡ Discipline Check", {
             body: `You have ${pendingHabits.length} protocols pending today. Don't break the streak.`,
             tag: 'habit-reminder-generic'
           });
        }
      }

    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user, userData]);

  // Dynamic Theme Logic: Apply powerColor and relaxColor globally via CSS variables and overrides
  const powerColor = COLORS[userData.settings.powerColor] || COLORS.lime;
  const relaxColor = COLORS[userData.settings.relaxColor] || COLORS.pale;

  return (
    <HashRouter>
      <style>
        {`
          :root {
            --power-color: ${powerColor};
            --relax-color: ${relaxColor};
          }
          /* Override the static tailwind classes to apply theme globally */
          .bg-dictator-pale, body, #root > div { background-color: var(--relax-color) !important; }
          .bg-dictator-lime { background-color: var(--power-color) !important; }
          .border-dictator-lime { border-color: var(--power-color) !important; }
          .text-dictator-teal, .text-dictator-lime { color: var(--power-color) !important; }
          .shadow-dictator-lime { --tw-shadow-color: var(--power-color); }
          
          /* Ensure specific backgrounds also respect the theme */
          main { background-color: var(--relax-color) !important; }
          
          /* Smooth transition for theme switches */
          .transition-theme {
            transition: background-color 0.5s ease-in-out, color 0.5s ease-in-out, border-color 0.5s ease-in-out;
          }
        `}
      </style>
      <div className="min-h-screen font-sans text-gray-900 overflow-x-hidden transition-theme bg-dictator-pale">
        {/* Auth Modal */}
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

        {/* Global Header */}
        <Header onOpenAuth={handleHeaderAuthClick} />

        {/* Main Application Logic */}
        {!user ? (
            // Landing/Guest View
            <main className="max-w-md mx-auto min-h-screen relative shadow-xl sm:border-x-2 sm:border-black/10 transition-theme bg-dictator-pale">
                 <Login onOpenAuth={() => setIsAuthModalOpen(true)} />
            </main>
        ) : (
            <>
                {!userData.hasOnboarded && <Onboarding onComplete={completeOnboarding} />}
                
                {userData.hasOnboarded && (
                <main className="max-w-md mx-auto min-h-screen relative shadow-xl sm:border-x-2 sm:border-black/10 pt-20 transition-theme bg-dictator-pale">
                    {renderContent()}
                    <BottomNav currentTab={activeTab} setTab={setActiveTab} />
                </main>
                )}
            </>
        )}
      </div>
    </HashRouter>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
