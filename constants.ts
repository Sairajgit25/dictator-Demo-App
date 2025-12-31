import { AppDefinition, Habit, LearningModule, UserSettings } from './types';

export const COLORS = {
  lime: '#AFFC41',
  pale: '#FEFFA7',
  teal: '#1DD3B0',
  gold: '#FEE440',
  olive: '#B9E769',
  dark: '#1a1a1a',
};

export const MOCK_QUOTES = [
  { text: "Discipline is freedom.", author: "Jocko Willink" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "You have power over your mind - not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius" },
  { text: "The happiness of your life depends upon the quality of your thoughts.", author: "Marcus Aurelius" },
  { text: "Man conquers the world by conquering himself.", author: "Zeno of Citium" },
  { text: "No man is free who is not master of himself.", author: "Epictetus" },
  { text: "It is not death that a man should fear, but he should fear never beginning to live.", author: "Marcus Aurelius" },
  { text: "To be calm is the highest achievement of the self.", author: "Zen Proverb" },
  { text: "Focus on what you can control. Ignore the rest.", author: "Stoic Maxim" },
  { text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King" }
];

export const MOCK_APPS: AppDefinition[] = [
  { id: '1', name: 'Instagram', packageName: 'com.instagram.android', icon: 'camera', isBlocked: true, dailyUsageMinutes: 45, limitMinutes: 30 },
  { id: '2', name: 'TikTok', packageName: 'com.zhiliaoapp.musically', icon: 'video', isBlocked: true, dailyUsageMinutes: 12, limitMinutes: 15 },
  { id: '3', name: 'YouTube', packageName: 'com.google.android.youtube', icon: 'play', isBlocked: false, dailyUsageMinutes: 120, limitMinutes: 60 },
  { id: '4', name: 'Twitter / X', packageName: 'com.twitter.android', icon: 'twitter', isBlocked: true, dailyUsageMinutes: 5, limitMinutes: 20 },
];

export const MOCK_HABITS: Habit[] = [
  { id: 'h1', title: 'Deep Work', cue: 'After morning coffee', reminderTime: '09:00', streak: 12, frequency: 'Daily', completedToday: true, history: Array(365).fill(false).map(() => Math.random() > 0.6) },
  { id: 'h2', title: 'Read 10 Pages', cue: 'Before bed', reminderTime: '21:30', streak: 5, frequency: 'Daily', completedToday: false, history: Array(365).fill(false).map(() => Math.random() > 0.4) },
  { id: 'h3', title: 'Gym', cue: 'At 5:00 PM', reminderTime: '17:00', streak: 24, frequency: 'Weekly', completedToday: false, history: Array(365).fill(false).map(() => Math.random() > 0.7) },
];

export const MOCK_MODULES: LearningModule[] = [
  {
    id: 'fin-101',
    title: 'Compound Interest',
    category: 'Finance',
    readTime: '3 min',
    diagram: `graph TD; A[Principal] --> B(Interest Rate); B --> C{Time}; C -->|Long Term| D[Exponential Growth]; C -->|Short Term| E[Linear Growth];`,
    content: {
      text: 'Compound interest is the interest on a loan or deposit calculated based on both the initial principal and the accumulated interest from previous periods.',
    },
    quiz: {
      question: "What is the key factor for exponential growth?",
      options: ["Principal Amount", "Time", "Bank Choice", "Currency"],
      correctIndex: 1,
      explanation: "Time is the exponent in the compound interest formula, meaning the longer the money is left to grow, the more dramatic the exponential effect becomes."
    }
  },
  {
    id: 'tech-101',
    title: 'Blockchain Consensus',
    category: 'Tech',
    readTime: '5 min',
    diagram: `sequenceDiagram; Miner->>Network: Propose Block; Network->>Nodes: Validate Hash; Nodes-->>Miner: Confirm; Miner->>Chain: Append Block;`,
    content: {
      text: 'Consensus mechanisms allow distributed systems to work together and stay secure. Proof of Work (PoW) and Proof of Stake (PoS) are the most common.',
    }
  },
  {
    id: 'health-101',
    title: 'Circadian Rhythms',
    category: 'Health',
    readTime: '4 min',
    diagram: `graph TD; A[Morning Light] -->|Suppresses| B(Melatonin); A -->|Increases| C(Cortisol); C --> D[Wakefulness]; E[Evening Darkness] -->|Increases| B; B --> F[Sleepiness];`,
    content: {
      text: 'Your circadian rhythm is your body\'s internal 24-hour clock that regulates sleep-wake cycles. It responds primarily to light and darkness. Disrupting this rhythm can lead to sleep disorders, obesity, and mental health issues. Viewing sunlight early in the morning helps anchor this rhythm, improving energy levels and sleep quality.',
    },
    quiz: {
      question: "What is the primary external cue for regulating circadian rhythms?",
      options: ["Temperature", "Light", "Food", "Sound"],
      correctIndex: 1,
      explanation: "Light (zeitgeber) is the strongest external cue that signals the brain's master clock to align biological processes with day and night."
    }
  },
  {
    id: 'sci-101',
    title: 'Neuroplasticity',
    category: 'Science',
    readTime: '5 min',
    diagram: `graph LR; A[New Stimulus] --> B[Neurons Fire Together]; B --> C[Synaptic Connection Strengthens]; C -->|Repetition| D[Myelination]; D --> E[Fast, Automatic Skill];`,
    content: {
      text: 'Neuroplasticity is the brain\'s ability to reorganize itself by forming new neural connections throughout life. It allows neurons to compensate for injury and adjust to new situations. This means your habits, skills, and personality are not fixed; they can be physically rewired through repetition and focus.',
    },
    quiz: {
      question: "Which mechanism speeds up neural transmission in established habits?",
      options: ["Hydration", "Myelination", "Oxidation", "Digestion"],
      correctIndex: 1,
      explanation: "Myelin is a fatty substance that wraps around nerve fibers (axons), acting as insulation to significantly increase the speed of electrical signal transmission."
    }
  },
  {
    id: 'fin-102',
    title: 'Asset Allocation',
    category: 'Finance',
    readTime: '4 min',
    diagram: `pie title Recommended Portfolio (Moderate); "Stocks" : 60; "Bonds" : 30; "Cash/Equivalents" : 10`,
    content: {
      text: 'Asset allocation is the strategy of dividing your investment portfolio across various asset classes like stocks, bonds, and cash. The goal is to balance risk and reward according to your time horizon and risk tolerance. Diversification helps mitigate the impact of market volatility on your overall wealth.',
    },
    quiz: {
      question: "What is the primary purpose of asset allocation?",
      options: ["Maximize short-term gains", "Avoid all taxes", "Balance risk and reward", "Eliminate all fees"],
      correctIndex: 2,
      explanation: "Asset allocation aims to balance risk and reward by apportioning portfolio assets according to an individual's goals, risk tolerance, and investment horizon."
    }
  },
  {
    id: 'health-102',
    title: 'Dopamine Dynamics',
    category: 'Health',
    readTime: '6 min',
    content: {
      text: 'Dopamine is not just about pleasure; it is the molecule of craving and motivation. Modern super-stimuli (social media, junk food, drugs) flood the brain with dopamine, causing the brain to downregulate receptors. This leads to a higher tolerance and a "numb" feeling towards everyday tasks. A "Dopamine Detox" involves abstaining from high-stimulation activities to reset baseline sensitivity.',
    },
    // Placeholder image since diagram is removed for demonstration of image fallback
    imageUrl: "https://images.unsplash.com/photo-1555685812-4b943f3e994a?auto=format&fit=crop&q=80&w=1000",
    quiz: {
      question: "What happens to dopamine receptors after chronic overstimulation?",
      options: ["They multiply", "They become more sensitive", "They downregulate (decrease)", "They disappear permanently"],
      correctIndex: 2,
      explanation: "The brain adapts to excess dopamine by reducing the number of receptors (downregulation) to maintain balance, leading to tolerance and reduced sensitivity."
    }
  },
  {
    id: 'sci-102',
    title: 'Entropy & Chaos',
    category: 'Science',
    readTime: '3 min',
    diagram: `graph TD; A[Ordered System] -->|Time + Neglect| B[Disordered System (High Entropy)]; B -->|Work/Energy Input| A;`,
    content: {
      text: 'Entropy is a measure of the disorder of a system. The Second Law of Thermodynamics states that the total entropy of an isolated system generally increases over time. In the context of life and habits, this means that without constant input of energy (effort/discipline), your life will naturally tend towards disorder and chaos.',
    },
    quiz: {
      question: "According to the Second Law of Thermodynamics, what does an isolated system tend towards?",
      options: ["Order", "Disorder (Entropy)", "Expansion", "Compression"],
      correctIndex: 1,
      explanation: "Isolated systems naturally progress towards thermodynamic equilibrium, a state of maximum entropy or disorder."
    }
  }
];

export const MOCK_SETTINGS: UserSettings = {
  powerColor: 'lime',
  relaxColor: 'pale',
  strictMode: false,
  strictModeStart: '22:00',
  strictModeEnd: '07:00',
  dailyXpGoal: 100
};

export const MOCK_WEEKLY_USAGE = [
  { day: 'Mon', current: 145, previous: 120 },
  { day: 'Tue', current: 130, previous: 140 },
  { day: 'Wed', current: 90, previous: 110 },
  { day: 'Thu', current: 160, previous: 130 },
  { day: 'Fri', current: 110, previous: 150 },
  { day: 'Sat', current: 190, previous: 180 },
  { day: 'Sun', current: 175, previous: 160 },
];

export const MOCK_MONTHLY_USAGE = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  current: Math.floor(Math.random() * 80) + 60 + (Math.sin(i / 5) * 30),
  previous: Math.floor(Math.random() * 80) + 60 + (Math.cos(i / 5) * 30),
}));