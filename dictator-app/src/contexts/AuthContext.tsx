
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { User, UserData, AppDefinition, Habit, UserSettings, LearningModule } from '../types';
import { MOCK_APPS, MOCK_HABITS, MOCK_SETTINGS, MOCK_MODULES } from '../constants';
import { auth } from "../services/firebase";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile
} from "firebase/auth";
import { supabaseService } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  userData: UserData;
  aiModules: LearningModule[];
  allModules: LearningModule[];
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, username: string) => Promise<boolean>;
  logout: () => void;
  updateApps: (apps: AppDefinition[]) => void;
  updateHabits: (habits: Habit[]) => void;
  updateSettings: (settings: UserSettings) => void;
  markModuleComplete: (moduleId: string) => void;
  completeOnboarding: () => void;
  saveAIModule: (moduleData: LearningModule) => Promise<void>;
  authError: string | null;
}

const defaultUserData: UserData = {
  apps: MOCK_APPS,
  habits: MOCK_HABITS,
  settings: MOCK_SETTINGS,
  completedModules: [],
  hasOnboarded: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData>(defaultUserData);
  const [aiModules, setAiModules] = useState<LearningModule[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);

  // Merge mock modules with AI-augmented data
  const allModules = useMemo(() => {
    const merged = [...MOCK_MODULES];
    aiModules.forEach(aiM => {
      const index = merged.findIndex(m => m.id === aiM.id);
      if (index > -1) {
        // Overlay AI enhancements (like generated quizzes) on top of mock modules
        merged[index] = { ...merged[index], ...aiM };
      } else {
        merged.push(aiM);
      }
    });
    return merged;
  }, [aiModules]);

  // Handle Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const currentUser: User = {
          email: firebaseUser.email || '',
          username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User'
        };
        setUser(currentUser);
        
        // Sync user to Supabase
        await supabaseService.syncUser(firebaseUser);
        
        // Load user data from Supabase
        await loadUserData(firebaseUser.uid);
        
        // Load AI modules from Supabase
        await loadAIModules(firebaseUser.uid);
      } else {
        setUser(null);
        setUserData(defaultUserData);
        setAiModules([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async (uid: string) => {
    const supabaseData = await supabaseService.loadUserData(uid);
    
    if (supabaseData) {
      const mergedData: UserData = {
        apps: supabaseData.apps || defaultUserData.apps,
        habits: supabaseData.habits || defaultUserData.habits,
        settings: supabaseData.settings || defaultUserData.settings,
        completedModules: supabaseData.completed_modules || defaultUserData.completedModules,
        hasOnboarded: supabaseData.has_onboarded || defaultUserData.hasOnboarded,
      };
      setUserData(mergedData);
    } else {
      // Fallback to localStorage if Supabase fails
      const savedData = localStorage.getItem(`dictator_data_${uid}`);
      if (savedData) {
        setUserData(JSON.parse(savedData));
      }
    }
  };

  const loadAIModules = async (uid: string) => {
    const modules = await supabaseService.loadAIModules(uid);
    if (modules && modules.length > 0) {
      const formattedModules: LearningModule[] = modules.map(m => ({
        id: m.module_id,
        title: m.title,
        category: m.category as any,
        readTime: '2 min',
        content: m.content,
        diagram: m.content?.diagram,
        quiz: m.content?.quiz,
        systemMasteryQuiz: m.content?.systemMasteryQuiz
      }));
      setAiModules(formattedModules);
    }
  };

  const saveUserData = async (uid: string, data: Partial<UserData>) => {
    try {
      // Update Supabase
      const updates: any = {};
      if (data.apps) updates.apps = data.apps;
      if (data.habits) updates.habits = data.habits;
      if (data.settings) updates.settings = data.settings;
      if (data.completedModules) updates.completed_modules = data.completedModules;
      if (data.hasOnboarded !== undefined) updates.has_onboarded = data.hasOnboarded;

      await supabaseService.updateUserData(uid, updates);
      
      // Update local state
      setUserData(prev => ({ ...prev, ...data }));
      
      // Also keep localStorage as backup
      localStorage.setItem(`dictator_data_${uid}`, JSON.stringify({ ...userData, ...data }));
    } catch (error) {
      console.error('Error saving to Supabase, using localStorage as fallback:', error);
      // Fallback to localStorage
      localStorage.setItem(`dictator_data_${uid}`, JSON.stringify({ ...userData, ...data }));
      setUserData(prev => ({ ...prev, ...data }));
    }
  };

  const handleAuthError = (error: any) => {
    console.error("Firebase Auth Error:", error);
    const code = error.code;
    
    if (code === 'auth/email-already-in-use') {
      setAuthError("This email is already registered.");
    } else if (code === 'auth/weak-password') {
      setAuthError("Password should be at least 6 characters.");
    } else if (code === 'auth/invalid-email') {
      setAuthError("The email address is invalid.");
    } else if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      setAuthError("Invalid email or password.");
    } else if (code === 'auth/unauthorized-domain') {
      setAuthError(`Unauthorized Domain. Please add "${window.location.hostname}" to the "Authorized Domains" list in your Firebase Console (Authentication > Settings).`);
    } else if (code === 'auth/configuration-not-found' || code === 'auth/operation-not-allowed') {
      setAuthError("Identity Toolkit API not enabled or operation not allowed in Firebase Console.");
    } else if (code === 'auth/network-request-failed') {
      setAuthError("Network error. Check your connection.");
    } else if (code === 'auth/popup-closed-by-user') {
      setAuthError("Login window closed. Please try again.");
    } else {
      setAuthError(error.message || "An unexpected error occurred.");
    }
  };

  const register = async (email: string, password: string, username: string): Promise<boolean> => {
    setAuthError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: username });
        await supabaseService.syncUser(userCredential.user);
        await saveUserData(userCredential.user.uid, defaultUserData);
      }
      return true;
    } catch (error: any) {
      handleAuthError(error);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error: any) {
      handleAuthError(error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Firebase Signout Error:", error);
    }
  };

  const getUid = () => auth.currentUser?.uid;

  const updateApps = (apps: AppDefinition[]) => {
    const uid = getUid();
    if (!uid) return;
    saveUserData(uid, { apps });
  };

  const updateHabits = (habits: Habit[]) => {
    const uid = getUid();
    if (!uid) return;
    saveUserData(uid, { habits });
  };

  const updateSettings = (settings: UserSettings) => {
    const uid = getUid();
    if (!uid) return;
    saveUserData(uid, { settings });
  };

  // Explicitly type the Set to Set<string> to ensure Array.from returns string[] and matches the UserData interface
  const markModuleComplete = (moduleId: string) => {
    const uid = getUid();
    if (!uid) return;
    const completed = new Set<string>(userData.completedModules);
    completed.add(moduleId);
    saveUserData(uid, { completedModules: Array.from(completed) });
  };

  const completeOnboarding = () => {
    const uid = getUid();
    if (!uid) return;
    saveUserData(uid, { hasOnboarded: true });
  };

  const saveAIModule = async (moduleData: LearningModule) => {
    const uid = getUid();
    if (!uid) return;

    try {
      // Save to Supabase
      await supabaseService.saveAIModule(uid, {
        id: moduleData.id,
        title: moduleData.title,
        category: moduleData.category,
        content: {
          text: moduleData.content.text,
          diagram: moduleData.diagram,
          quiz: moduleData.quiz,
          systemMasteryQuiz: moduleData.systemMasteryQuiz
        }
      });

      // Update local state
      setAiModules(prev => {
        const exists = prev.find(m => m.id === moduleData.id);
        if (exists) {
          return prev.map(m => m.id === moduleData.id ? moduleData : m);
        }
        return [...prev, moduleData];
      });
    } catch (error) {
      console.error('Error saving AI module:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userData,
      aiModules,
      allModules,
      login,
      register,
      logout,
      updateApps,
      updateHabits,
      updateSettings,
      markModuleComplete,
      completeOnboarding,
      saveAIModule,
      authError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
