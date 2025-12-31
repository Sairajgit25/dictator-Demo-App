
export interface AppDefinition {
  id: string;
  name: string;
  packageName: string;
  icon: string;
  isBlocked: boolean;
  dailyUsageMinutes: number;
  limitMinutes: number;
}

export interface Habit {
  id: string;
  title: string;
  cue: string;
  reminderTime?: string; // HH:MM 24h format
  streak: number;
  frequency: 'Daily' | 'Weekly';
  completedToday: boolean;
  history: boolean[]; // last 365 days mocked. Last element is Today.
}

export interface LearningModule {
  id: string;
  title: string;
  category: 'Finance' | 'Tech' | 'Health' | 'Science';
  readTime: string;
  diagram?: string; // Mermaid syntax
  imageUrl?: string; // URL for visualization
  content: {
    text: string;
  };
  quiz?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
  };
}

export type ThemeColor = 'lime' | 'teal' | 'gold' | 'olive' | 'pale' | 'dark';

export interface UserSettings {
  powerColor: ThemeColor;
  relaxColor: ThemeColor;
  strictMode: boolean;
  strictModeStart: string;
  strictModeEnd: string;
  dailyXpGoal: number;
}

export interface UserData {
  apps: AppDefinition[];
  habits: Habit[];
  settings: UserSettings;
  completedModules: string[];
  customModules: LearningModule[];
  masteryQuizzes: Record<string, any[]>; // Stores generated questions per module ID
  hasOnboarded: boolean;
}

export interface User {
  username: string;
  email: string;
}
