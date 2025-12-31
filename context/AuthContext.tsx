
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserData, AppDefinition, Habit, UserSettings, LearningModule } from '../types';
import { MOCK_APPS, MOCK_HABITS, MOCK_SETTINGS } from '../constants';

interface AuthContextType {
  user: User | null;
  userData: UserData;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, username: string) => Promise<boolean>;
  logout: () => void;
  updateApps: (apps: AppDefinition[]) => void;
  updateHabits: (habits: Habit[]) => void;
  updateSettings: (settings: UserSettings) => void;
  markModuleComplete: (moduleId: string) => void;
  addCustomModule: (module: LearningModule) => void;
  saveMasteryQuiz: (moduleId: string, questions: any[]) => void;
  completeOnboarding: () => void;
  authError: string | null;
}

const defaultUserData: UserData = {
  apps: MOCK_APPS,
  habits: MOCK_HABITS,
  settings: MOCK_SETTINGS,
  completedModules: [],
  customModules: [],
  masteryQuizzes: {},
  hasOnboarded: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData>(defaultUserData);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Check for active session
    const session = localStorage.getItem('dictator_active_session');
    if (session) {
      const { email } = JSON.parse(session);
      loadUserSession(email);
    }
  }, []);

  const loadUserSession = (email: string) => {
    const db = JSON.parse(localStorage.getItem('dictator_users_db') || '{}');
    if (db[email]) {
      setUser({ email, username: db[email].username });
      // Load user specific data or default
      const savedData = localStorage.getItem(`dictator_data_${email}`);
      const parsedData = savedData ? JSON.parse(savedData) : defaultUserData;
      // Ensure customModules and masteryQuizzes exists in older saves
      setUserData({ 
        ...defaultUserData, 
        ...parsedData, 
        customModules: parsedData.customModules || [],
        masteryQuizzes: parsedData.masteryQuizzes || {}
      });
    }
  };

  const saveUserData = (email: string, data: UserData) => {
    localStorage.setItem(`dictator_data_${email}`, JSON.stringify(data));
    setUserData(data);
  };

  const register = async (email: string, password: string, username: string): Promise<boolean> => {
    setAuthError(null);
    const db = JSON.parse(localStorage.getItem('dictator_users_db') || '{}');
    
    if (db[email]) {
      setAuthError("User already exists with this email.");
      return false;
    }

    // Save user credentials
    db[email] = { password, username };
    localStorage.setItem('dictator_users_db', JSON.stringify(db));

    // Initialize data for new user
    saveUserData(email, defaultUserData);

    // Auto login
    return login(email, password);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setAuthError(null);
    const db = JSON.parse(localStorage.getItem('dictator_users_db') || '{}');
    const userRecord = db[email];

    if (userRecord && userRecord.password === password) {
      const userObj = { email, username: userRecord.username };
      setUser(userObj);
      localStorage.setItem('dictator_active_session', JSON.stringify({ email }));
      loadUserSession(email);
      return true;
    } else {
      setAuthError("Invalid email or password.");
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setUserData(defaultUserData);
    localStorage.removeItem('dictator_active_session');
  };

  // Data Update Wrappers
  const updateApps = (apps: AppDefinition[]) => {
    if (!user) return;
    const newData = { ...userData, apps };
    saveUserData(user.email, newData);
  };

  const updateHabits = (habits: Habit[]) => {
    if (!user) return;
    const newData = { ...userData, habits };
    saveUserData(user.email, newData);
  };

  const updateSettings = (settings: UserSettings) => {
    if (!user) return;
    const newData = { ...userData, settings };
    saveUserData(user.email, newData);
  };

  const markModuleComplete = (moduleId: string) => {
    if (!user) return;
    const completed = new Set(userData.completedModules);
    completed.add(moduleId);
    const newData = { ...userData, completedModules: Array.from(completed) };
    saveUserData(user.email, newData);
  };

  const addCustomModule = (module: LearningModule) => {
    if (!user) return;
    const newData = { ...userData, customModules: [module, ...userData.customModules] };
    saveUserData(user.email, newData);
  };

  const saveMasteryQuiz = (moduleId: string, questions: any[]) => {
    if (!user) return;
    const masteryQuizzes = { ...userData.masteryQuizzes, [moduleId]: questions };
    const newData = { ...userData, masteryQuizzes };
    saveUserData(user.email, newData);
  };

  const completeOnboarding = () => {
    if (!user) return;
    const newData = { ...userData, hasOnboarded: true };
    saveUserData(user.email, newData);
  }

  return (
    <AuthContext.Provider value={{
      user,
      userData,
      login,
      register,
      logout,
      updateApps,
      updateHabits,
      updateSettings,
      markModuleComplete,
      addCustomModule,
      saveMasteryQuiz,
      completeOnboarding,
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
