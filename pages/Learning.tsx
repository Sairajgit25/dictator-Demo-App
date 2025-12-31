
import React, { useState, useEffect } from 'react';
import { MOCK_MODULES } from '../constants';
import MermaidChart from '../components/MermaidChart';
import { 
  CheckCircle, 
  XCircle, 
  BrainCircuit, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  Trophy, 
  Check, 
  Search, 
  Image as ImageIcon, 
  Loader2, 
  RefreshCcw, 
  ChevronLeft,
  Activity,
  Maximize2,
  X,
  FilePlus2
} from 'lucide-react';
import { 
  generateQuizForTopic, 
  generateModuleQuiz, 
  generateSummary, 
  generateImageForModule 
} from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { LearningModule } from '../types';

const Learning: React.FC = () => {
  const { userData, markModuleComplete, addCustomModule, saveMasteryQuiz, user } = useAuth();
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const completedModules = new Set(userData.completedModules);

  // AI Topic Explorer State
  const [aiTopic, setAiTopic] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [isSavingModule, setIsSavingModule] = useState(false);
  const [hasSavedAiResult, setHasSavedAiResult] = useState(false);

  // AI Module Quiz State
  const [moduleQuizData, setModuleQuizData] = useState<any[] | null>(null);
  const [moduleQuizLoading, setModuleQuizLoading] = useState(false);
  const [moduleQuizAnswers, setModuleQuizAnswers] = useState<Record<number, number>>({});
  const [moduleQuizSubmitted, setModuleQuizSubmitted] = useState(false);

  // AI Summary State
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // AI Image Gen State
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Gallery Modal State
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryImage, setGalleryImage] = useState<string | null>(null);

  // Combine Mock Modules and User Custom Modules
  const allModules = [...MOCK_MODULES, ...(userData.customModules || [])];
  const selectedModule = allModules.find(m => m.id === selectedModuleId);

  // Helper to check progress for a specific module ID from localStorage (Answers only)
  const getModuleQuizProgress = (moduleId: string) => {
    if (!user) return null;
    const key = `dictator_quiz_answers_${user.username}_${moduleId}`;
    const saved = localStorage.getItem(key);
    const questions = userData.masteryQuizzes[moduleId];
    
    if (questions && saved) {
      try {
        const parsed = JSON.parse(saved);
        const answeredCount = Object.keys(parsed.answers || {}).length;
        const totalCount = questions.length;
        return {
          answered: answeredCount,
          total: totalCount,
          percent: totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0,
          isSubmitted: parsed.submitted
        };
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  // Load saved AI quiz state when entering a module
  useEffect(() => {
    if (selectedModuleId && user) {
        // Prioritize data from userData.masteryQuizzes
        const questions = userData.masteryQuizzes[selectedModuleId];
        if (questions) {
            setModuleQuizData(questions);
        }

        // Load answers from localStorage
        const key = `dictator_quiz_answers_${user.username}_${selectedModuleId}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.answers) setModuleQuizAnswers(parsed.answers);
                if (parsed.submitted !== undefined) setModuleQuizSubmitted(parsed.submitted);
            } catch (e) {
                console.error("Error loading quiz answers", e);
            }
        }
    }
  }, [selectedModuleId, user, userData.masteryQuizzes]);

  // Persist AI quiz ANSWERS when they change
  useEffect(() => {
    if (selectedModuleId && user && moduleQuizData) {
         const key = `dictator_quiz_answers_${user.username}_${selectedModuleId}`;
         localStorage.setItem(key, JSON.stringify({
             answers: moduleQuizAnswers,
             submitted: moduleQuizSubmitted
         }));
    }
  }, [selectedModuleId, user, moduleQuizAnswers, moduleQuizSubmitted, moduleQuizData]);

  // Filter modules based on search term
  const filteredModules = allModules.filter(module => {
    const term = searchTerm.toLowerCase();
    return (
      module.title.toLowerCase().includes(term) ||
      module.content.text.toLowerCase().includes(term) ||
      module.category.toLowerCase().includes(term)
    );
  });

  const resetState = () => {
    setSelectedModuleId(null);
    setQuizAnswer(null);
    setShowExplanation(false);
    setModuleQuizData(null);
    setModuleQuizAnswers({});
    setModuleQuizSubmitted(false);
    setSummary(null);
    setIsSummarizing(false);
    setGeneratedImage(null);
    setIsGeneratingImage(false);
    setImageError(false);
    setIsGalleryOpen(false);
  };

  const handleQuizSubmit = (index: number) => {
    setQuizAnswer(index);
    setShowExplanation(true);
    if (selectedModule?.quiz && index === selectedModule.quiz.correctIndex) {
        markModuleComplete(selectedModule.id);
    }
  };

  const handleAiGenerate = async () => {
    if(!aiTopic) return;
    setAiLoading(true);
    setAiResult(null);
    setHasSavedAiResult(false);
    const result = await generateQuizForTopic(aiTopic);
    setAiResult(result);
    setAiLoading(false);
  };

  const handleSaveAiToLibrary = () => {
    if (!aiResult || !aiTopic) return;
    
    setIsSavingModule(true);
    
    // Create a new module from AI result
    const newModuleId = `custom-${Date.now()}`;
    const newModule: LearningModule = {
        id: newModuleId,
        title: aiTopic.charAt(0).toUpperCase() + aiTopic.slice(1),
        category: 'Science', // Default for AI explorer
        readTime: 'Generated',
        diagram: aiResult.diagram,
        content: {
            text: aiResult.summary || `A deeper dive into ${aiTopic}.`
        },
        quiz: aiResult.quiz
    };

    addCustomModule(newModule);
    
    // Also save the generated exam if it exists (Explorer generates a single quiz part of the module)
    // But for the Mastery Exam section to work, we can convert the explorer result into a small mastery set if needed
    // For now, explorer results are mainly modules with built-in baseline quizzes.
    
    setTimeout(() => {
        setIsSavingModule(false);
        setHasSavedAiResult(true);
    }, 800);
  };

  const handleGenerateModuleQuiz = async () => {
    if (!selectedModule) return;
    setModuleQuizLoading(true);
    const questions = await generateModuleQuiz(selectedModule.content.text);
    if (questions && questions.length > 0) {
        setModuleQuizData(questions);
        saveMasteryQuiz(selectedModule.id, questions);
    }
    setModuleQuizLoading(false);
  };

  const handleSummarize = async () => {
    if (!selectedModule) return;
    setIsSummarizing(true);
    const text = await generateSummary(selectedModule.content.text);
    setSummary(text);
    setIsSummarizing(false);
  };

  const handleGenerateImage = async () => {
      if (!selectedModule) return;
      setIsGeneratingImage(true);
      setImageError(false);
      const img = await generateImageForModule(selectedModule.title, selectedModule.content.text.substring(0, 200));
      if (img) {
        setGeneratedImage(img);
      } else {
        setImageError(true);
      }
      setIsGeneratingImage(false);
  };

  const toggleModuleQuizAnswer = (qIndex: number, optionIndex: number) => {
    if (moduleQuizAnswers[qIndex] !== undefined) return;
    
    const newAnswers = {
      ...moduleQuizAnswers,
      [qIndex]: optionIndex
    };
    setModuleQuizAnswers(newAnswers);

    if (moduleQuizData && Object.keys(newAnswers).length === moduleQuizData.length) {
        setModuleQuizSubmitted(true);
        markModuleComplete(selectedModule!.id);
    }
  };

  const calculateScore = () => {
    if (!moduleQuizData) return 0;
    let score = 0;
    moduleQuizData.forEach((q, idx) => {
      if (moduleQuizAnswers[idx] === q.correctIndex) score++;
    });
    return score;
  };

  const openGallery = (img: string) => {
    setGalleryImage(img);
    setIsGalleryOpen(true);
  };

  const handleResetExamProgress = () => {
      if (user && selectedModuleId) {
          const key = `dictator_quiz_answers_${user.username}_${selectedModuleId}`;
          localStorage.removeItem(key);
      }
      setModuleQuizAnswers({});
      setModuleQuizSubmitted(false);
      // NOTE: We DO NOT clear moduleQuizData, so it remains visible for re-attempt
  };

  if (selectedModule) {
    const isModuleComplete = completedModules.has(selectedModule.id);
    const activeImage = generatedImage || selectedModule.imageUrl;

    return (
      <div className="p-6 pb-24 bg-white min-h-screen animate-slide-in-right">
        {/* Gallery Modal */}
        {isGalleryOpen && galleryImage && (
          <div className="fixed inset-0 z-[110] bg-black/95 flex flex-col items-center justify-center p-4 animate-fade-in backdrop-blur-md">
            <button 
              onClick={() => setIsGalleryOpen(false)}
              className="absolute top-6 right-6 p-3 bg-white text-black border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:scale-110 active:scale-95 transition-all z-[120]"
            >
              <X size={24} strokeWidth={3} />
            </button>
            <div className="w-full max-w-4xl relative group">
              <div className="absolute -top-10 left-0 text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-dictator-teal rounded-full animate-pulse"></span>
                ASSET INSPECTION: {selectedModule.title.toUpperCase()}
              </div>
              <div className="p-2 bg-white border-4 border-black rounded-3xl shadow-[0_0_50px_rgba(175,252,65,0.3)]">
                <img 
                  src={galleryImage} 
                  alt="High Res Visual" 
                  className="w-full h-auto rounded-2xl object-contain max-h-[75vh]"
                />
              </div>
              <div className="mt-6 flex justify-between items-center text-white/50 text-[10px] font-black uppercase tracking-widest">
                <span>BIT-DEPTH: 24-BIT RENDER</span>
                <span>SECURE ENCRYPTED VIEW</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
            <button 
              onClick={resetState}
              className="text-sm font-black flex items-center gap-1 hover:translate-x-[-2px] transition-transform uppercase tracking-tighter"
            >
              <ChevronLeft size={18} strokeWidth={3} /> Library
            </button>
            {isModuleComplete && (
                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-dictator-teal/20 text-teal-900 px-3 py-1 rounded-full border-2 border-dictator-teal">
                    <CheckCircle size={12} strokeWidth={3} /> Achievement Unlocked
                </span>
            )}
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <span className="inline-block px-3 py-1 bg-dictator-teal border-2 border-black rounded-lg text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase">
            {selectedModule.category}
          </span>
          <span className="text-xs font-bold text-gray-400 font-mono">{selectedModule.readTime}</span>
        </div>
        
        <h1 className="text-4xl font-serif font-black mb-6 leading-tight border-l-4 border-dictator-lime pl-4">{selectedModule.title}</h1>

        {/* AI Summary Section */}
        <div className="mb-8">
            {!summary && !isSummarizing && (
                <button 
                    onClick={handleSummarize}
                    className="flex items-center gap-2 text-xs font-black bg-dictator-pale border-2 border-black px-4 py-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all uppercase tracking-tight"
                >
                    <Sparkles size={16} /> Decrypt Core Concepts
                </button>
            )}
            
            {isSummarizing && (
                <div className="flex items-center gap-3 text-sm font-black text-dictator-teal animate-pulse px-2">
                    <Loader2 size={18} className="animate-spin" /> SYNTHESIZING SUMMARY...
                </div>
            )}

            {summary && (
                <div className="p-5 bg-yellow-50 border-4 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <Sparkles size={40} />
                    </div>
                    <h4 className="text-[10px] font-black uppercase text-gray-400 mb-2 flex items-center gap-1 tracking-widest">
                        Protocol Brief
                    </h4>
                    <p className="text-lg italic text-gray-800 leading-relaxed font-serif relative z-10">
                        "{summary}"
                    </p>
                </div>
            )}
        </div>
        
        <div className="prose prose-lg mb-10 font-serif leading-relaxed text-gray-800">
          <p>{selectedModule.content.text}</p>
        </div>

        {/* Visuals: Diagram OR Image */}
        <div className="mb-10">
          <h3 className="font-sans font-black mb-4 text-gray-400 uppercase text-[10px] tracking-[0.3em]">Operational Visualization</h3>
          {selectedModule.diagram ? (
            <div className="border-4 border-black rounded-2xl p-2 bg-gray-50 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] min-h-[320px] flex items-center justify-center">
               <MermaidChart chart={selectedModule.diagram} />
            </div>
          ) : (
              <div className="border-4 border-black rounded-2xl p-6 bg-gray-50 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
                  {activeImage && !isGeneratingImage ? (
                      <div className="w-full group">
                          <div className="relative overflow-hidden rounded-xl border-2 border-black/5">
                            <img src={activeImage} alt="Visual Concept" className="w-full h-auto object-cover max-h-80 animate-fade-in" />
                            {/* Overlay Maximize Button */}
                            <button 
                                onClick={() => openGallery(activeImage)}
                                className="absolute bottom-4 right-4 p-3 bg-white text-black border-2 border-black rounded-xl shadow-[4px_4px_0_0_#000] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-dictator-lime active:scale-90"
                            >
                                <Maximize2 size={18} strokeWidth={3} />
                            </button>
                          </div>
                          <div className="mt-4 flex justify-between items-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Educational Asset Render</p>
                            <div className="flex gap-4">
                                <button onClick={() => openGallery(activeImage)} className="text-[10px] font-black text-black uppercase underline flex items-center gap-1"><Maximize2 size={10} /> View Large</button>
                                <button onClick={handleGenerateImage} className="text-[10px] font-black text-dictator-teal uppercase underline">Regenerate</button>
                            </div>
                          </div>
                      </div>
                  ) : (
                      <div className="text-center w-full h-full flex flex-col items-center justify-center">
                          {isGeneratingImage ? (
                               <div className="flex flex-col items-center justify-center w-full">
                                  <div className="w-16 h-16 border-4 border-dictator-teal border-t-transparent rounded-full animate-spin mb-6"></div>
                                  <p className="text-sm font-black text-gray-400 animate-pulse tracking-widest">ENGINEERING VISUAL PROXY...</p>
                               </div>
                          ) : imageError ? (
                               <div className="text-center">
                                  <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
                                  <p className="text-lg text-red-600 mb-6 font-black uppercase">Render Pipeline Failure</p>
                                  <button 
                                      onClick={handleGenerateImage}
                                      className="flex items-center gap-2 px-6 py-3 bg-black text-white font-black rounded-xl border-2 border-black hover:bg-gray-800 transition-all shadow-[4px_4px_0px_0px_#ef4444]"
                                  >
                                      <RefreshCcw size={18} /> RETRY CONNECTION
                                  </button>
                               </div>
                          ) : (
                              <>
                                  <ImageIcon size={64} className="mx-auto text-gray-200 mb-6" />
                                  <p className="text-lg text-gray-400 mb-6 font-black uppercase tracking-tighter">No Active Visualization</p>
                                  <button 
                                      onClick={handleGenerateImage}
                                      className="flex items-center gap-3 px-8 py-4 bg-dictator-lime text-black font-black rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 transition-all uppercase text-sm"
                                  >
                                      <Sparkles size={20} /> Deploy AI Visualizer
                                  </button>
                              </>
                          )}
                      </div>
                  )}
              </div>
          )}
        </div>

        {/* Existing Static Quiz */}
        {selectedModule.quiz && (
          <div className="mt-12 p-8 bg-dictator-pale rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black text-2xl mb-6 flex items-center gap-3 uppercase tracking-tighter">
              <BrainCircuit size={28} /> Baseline Check
            </h3>
            <p className="mb-6 font-bold text-lg leading-snug">{selectedModule.quiz.question}</p>
            <div className="space-y-4">
              {selectedModule.quiz.options.map((option, idx) => {
                let btnClass = "w-full text-left p-5 rounded-xl border-2 border-black bg-white hover:bg-gray-50 transition-all font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none";
                if (showExplanation) {
                  if (idx === selectedModule.quiz?.correctIndex) btnClass = "w-full text-left p-5 rounded-xl border-4 border-black bg-dictator-lime font-black";
                  else if (idx === quizAnswer) btnClass = "w-full text-left p-5 rounded-xl border-2 border-black bg-red-100 opacity-60";
                }
                
                return (
                  <button 
                    key={idx}
                    disabled={showExplanation}
                    onClick={() => handleQuizSubmit(idx)}
                    className={btnClass}
                  >
                    <div className="flex justify-between items-center">
                      <span>{option}</span>
                      {showExplanation && idx === selectedModule.quiz?.correctIndex && <CheckCircle size={24} className="text-black" />}
                      {showExplanation && idx === quizAnswer && idx !== selectedModule.quiz?.correctIndex && <XCircle size={24} className="text-red-500" />}
                    </div>
                  </button>
                );
              })}
            </div>
            {showExplanation && selectedModule.quiz.explanation && (
              <div className="mt-6 p-4 bg-black text-white text-sm rounded-xl border-2 border-gray-800 flex gap-3 animate-fade-in">
                 <AlertCircle size={20} className="shrink-0 text-dictator-gold" />
                 <p><span className="font-black text-dictator-gold uppercase">Operational Insight:</span> {selectedModule.quiz.explanation}</p>
              </div>
            )}
          </div>
        )}

        {/* AI Generated Module Quiz (Mastery Exam) */}
        <div className="mt-20 border-t-4 border-black pt-12">
           {!moduleQuizData && !moduleQuizLoading && (
             <div className="text-center p-10 bg-dictator-dark text-white rounded-[32px] shadow-[12px_12px_0px_0px_#AFFC41] border-4 border-black overflow-hidden relative">
                <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-dictator-lime/10 rounded-full blur-3xl"></div>
                <Sparkles size={56} className="mx-auto mb-6 text-dictator-lime animate-pulse" />
                <h3 className="text-3xl font-black mb-4 uppercase tracking-tighter">System Mastery Exam</h3>
                <p className="text-gray-400 mb-10 font-medium text-lg">Initiate a personalized recursive evaluation of the source material using the Dictator's neural engine.</p>
                <button 
                  onClick={handleGenerateModuleQuiz}
                  className="w-full py-5 bg-dictator-lime text-black font-black text-xl rounded-2xl hover:scale-[1.02] active:scale-95 transition-all border-4 border-black shadow-[0_6px_0_0_#000] active:shadow-none active:translate-y-1 uppercase"
                >
                  Generate Protocol Exam
                </button>
             </div>
           )}

           {moduleQuizLoading && (
             <div className="p-16 text-center">
               <div className="animate-spin w-16 h-16 border-8 border-black border-t-dictator-teal rounded-full mx-auto mb-8"></div>
               <p className="font-black text-xl animate-pulse tracking-widest uppercase">Parsing Knowledge Strands...</p>
             </div>
           )}

           {moduleQuizData && (
             <div className="animate-fade-in space-y-10">
               <div className="flex items-center justify-between border-b-4 border-black pb-6">
                 <div>
                    <h3 className="text-3xl font-black flex items-center gap-3 uppercase tracking-tighter">
                    <Trophy className="text-dictator-gold" size={32} /> Final Evaluation
                    </h3>
                    <p className="text-xs font-black text-gray-400 mt-1 tracking-widest">PROTOCOL VERSION 1.0.RC</p>
                 </div>
                 {moduleQuizSubmitted && (
                   <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pass Score</span>
                      <span className="text-3xl font-black bg-black text-white px-5 py-2 rounded-xl border-2 border-dictator-lime shadow-[4px_4px_0px_0px_#AFFC41]">
                        {calculateScore()} / {moduleQuizData.length}
                      </span>
                   </div>
                 )}
               </div>

               <div className="space-y-8">
                 {moduleQuizData.map((q, qIdx) => {
                   const isAnswered = moduleQuizAnswers[qIdx] !== undefined;
                   
                   return (
                   <div key={qIdx} className="p-6 border-4 border-black rounded-2xl bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative">
                     <div className="absolute -top-4 -left-4 w-10 h-10 bg-black text-white flex items-center justify-center font-black rounded-lg border-2 border-white transform -rotate-6">
                        {qIdx + 1}
                     </div>
                     <p className="font-black mb-6 text-xl leading-snug pl-6">{q.question}</p>
                     <div className="space-y-3">
                       {q.options.map((opt: string, optIdx: number) => {
                         const isSelected = moduleQuizAnswers[qIdx] === optIdx;
                         const isCorrect = q.correctIndex === optIdx;
                         
                         let bgClass = "bg-white hover:bg-gray-100";
                         let borderClass = "border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
                         let textClass = "font-bold";

                         if (isAnswered) {
                           if (isCorrect) {
                             bgClass = "bg-dictator-lime/40";
                             borderClass = "border-4 border-black";
                             textClass = "font-black";
                           } else if (isSelected && !isCorrect) {
                             bgClass = "bg-red-500/10";
                             borderClass = "border-2 border-red-500 opacity-50";
                             textClass = "text-red-800 line-through";
                           } else {
                             bgClass = "bg-white opacity-40";
                           }
                         }

                         return (
                           <button
                             key={optIdx}
                             onClick={() => toggleModuleQuizAnswer(qIdx, optIdx)}
                             disabled={isAnswered}
                             className={`w-full text-left p-4 rounded-xl transition-all flex justify-between items-center active:scale-[0.98] ${bgClass} ${borderClass} ${textClass}`}
                           >
                             <span>{opt}</span>
                             {isAnswered && isCorrect && <CheckCircle size={20} className="text-black" />}
                             {isAnswered && isSelected && !isCorrect && <XCircle size={20} className="text-red-500" />}
                           </button>
                         );
                       })}
                     </div>
                     {isAnswered && (
                       <div className="mt-5 p-4 bg-dictator-teal/10 text-teal-900 text-sm rounded-xl border-2 border-dictator-teal/30 flex gap-3 animate-fade-in font-medium">
                         <AlertCircle size={20} className="shrink-0 text-dictator-teal" />
                         <p>{q.explanation}</p>
                       </div>
                     )}
                   </div>
                 )})}
               </div>
               
               <button 
                  onClick={handleResetExamProgress}
                  className="w-full mt-10 py-5 bg-white text-black border-4 border-black font-black text-xl rounded-2xl hover:bg-gray-50 shadow-[6px_6px_0px_0px_#000] active:shadow-none active:translate-y-1 transition-all uppercase"
               >
                  Reset Exam Progress
               </button>
             </div>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-24 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold mb-2 tracking-tighter uppercase italic">Neural Library</h1>
        <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Expend resources. Gain willpower.</p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-10 group">
        <input 
          type="text"
          placeholder="Search Protocols..."
          className="w-full p-5 pl-14 rounded-[24px] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:translate-y-1 focus:shadow-none transition-all placeholder:text-gray-400 font-black text-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-dictator-teal transition-colors" size={24} />
      </div>

      {/* AI Topic Explorer */}
      <div className="mb-12 bg-dictator-dark text-white p-6 rounded-[32px] border-4 border-black shadow-[8px_8px_0px_0px_#AFFC41] relative overflow-hidden">
         <div className="absolute top-[-10%] right-[-10%] p-4 text-dictator-lime opacity-5">
            <BrainCircuit size={120} />
         </div>
         <h2 className="font-black text-2xl text-dictator-lime mb-3 flex items-center gap-3 uppercase tracking-tighter relative z-10">
            <BrainCircuit size={28} /> AI Topic Explorer
         </h2>
         <p className="text-sm text-gray-300 mb-6 font-medium leading-relaxed relative z-10">Forge immediate understanding of any concept. The engine generates summaries, logical structures, and evaluations in real-time.</p>
         <div className="flex gap-3 mb-6 relative z-10">
           <input 
              type="text" 
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="Topic name (e.g. Stoicism)"
              className="flex-1 px-4 py-3 rounded-xl border-none text-black focus:ring-4 ring-dictator-lime font-black placeholder:text-gray-300"
           />
           <button 
             onClick={handleAiGenerate}
             disabled={aiLoading}
             className="bg-dictator-lime text-black w-14 h-14 rounded-xl font-black border-4 border-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
           >
             {aiLoading ? <Loader2 className="animate-spin" /> : <ArrowRight size={24} strokeWidth={3} />}
           </button>
         </div>

         {aiResult && (
           <div className="mt-6 animate-fade-in space-y-6 relative z-10">
             <div className="flex flex-col gap-4">
                {!hasSavedAiResult ? (
                    <button 
                        onClick={handleSaveAiToLibrary}
                        disabled={isSavingModule}
                        className="w-full py-3 bg-white text-black font-black rounded-xl border-2 border-black shadow-[4px_4px_0_0_#AFFC41] active:translate-y-1 active:shadow-none transition-all uppercase flex items-center justify-center gap-2 text-sm"
                    >
                        {isSavingModule ? <Loader2 className="animate-spin" /> : <FilePlus2 size={18} />}
                        {isSavingModule ? 'ARCHIVING...' : 'Deploy to Neural Library'}
                    </button>
                ) : (
                    <div className="w-full py-3 bg-dictator-teal text-black font-black rounded-xl border-2 border-black flex items-center justify-center gap-2 text-sm animate-fade-in">
                        <Check size={18} strokeWidth={4} />
                        ASSET ARCHIVED IN LIBRARY
                    </div>
                )}
             </div>

             {aiResult.summary && (
               <div className="p-4 bg-gray-900/80 rounded-2xl border-2 border-gray-700 backdrop-blur-sm">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest">Concept Summary</h4>
                  <p className="text-sm text-gray-200 leading-relaxed font-serif italic">"{aiResult.summary}"</p>
               </div>
             )}

             {aiResult.diagram && (
               <div className="p-2 bg-white rounded-2xl border-4 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] min-h-[320px] flex flex-col">
                 <h4 className="text-[10px] font-black text-gray-400 uppercase mb-3 text-center tracking-widest p-2">Structural Map</h4>
                 <div className="flex-1 flex items-center justify-center">
                    <MermaidChart chart={aiResult.diagram} />
                 </div>
               </div>
             )}

             {aiResult.quiz && (
                <div className="p-5 bg-gray-800 rounded-2xl border-2 border-gray-600">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="bg-dictator-lime text-black text-[10px] font-black px-2 py-0.5 rounded uppercase">Evaluation</span>
                        <p className="font-bold text-sm text-white">{aiResult.quiz.question}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                    {aiResult.quiz.options?.map((opt: string, i: number) => (
                        <div key={i} className={`text-xs p-3 rounded-xl transition-all border-2 ${i === aiResult.quiz.correctIndex ? 'bg-dictator-lime/20 text-dictator-lime border-dictator-lime font-black' : 'bg-gray-700/50 text-gray-400 border-transparent'}`}>
                        {opt}
                        </div>
                    ))}
                    </div>
                    {aiResult.quiz.explanation && (
                        <div className="mt-4 text-[10px] text-gray-400 border-t border-gray-700 pt-3 italic">
                            <span className="font-black text-dictator-lime uppercase mr-1">Logic:</span> {aiResult.quiz.explanation}
                        </div>
                    )}
                </div>
             )}
           </div>
         )}
      </div>

      <div className="grid gap-8">
        <h2 className="font-black text-xs text-gray-400 uppercase tracking-[0.4em] mb-[-12px]">Approved Protocols</h2>
        {filteredModules.length > 0 ? (
            filteredModules.map(module => {
                const isComplete = completedModules.has(module.id);
                const quizProgress = getModuleQuizProgress(module.id);
                const isCustom = module.id.startsWith('custom-');
                
                return (
                    <div 
                        key={module.id}
                        onClick={() => setSelectedModuleId(module.id)}
                        className={`group p-6 rounded-[28px] border-4 border-black transition-all duration-300 hover:scale-[1.02] cursor-pointer relative overflow-hidden ${
                            isComplete 
                              ? 'bg-green-50 shadow-[6px_6px_0px_0px_#1DD3B0] border-dictator-teal' 
                              : 'bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
                        }`}
                    >
                        {isComplete && (
                          <div className="absolute top-0 right-0 w-24 h-24 bg-dictator-teal/5 rounded-full translate-x-12 translate-y-[-12px] flex items-end justify-start p-4">
                             <Check size={32} className="text-dictator-teal opacity-20" strokeWidth={4} />
                          </div>
                        )}

                        <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-2">
                                <span className={`px-3 py-1 text-[10px] font-black border-2 border-black rounded-lg uppercase tracking-tight ${isComplete ? 'bg-dictator-teal text-white' : 'bg-dictator-gold text-black'}`}>
                                    {module.category}
                                </span>
                                {isCustom && (
                                    <span className="px-3 py-1 text-[10px] font-black bg-black text-white border-2 border-black rounded-lg uppercase tracking-tight flex items-center gap-1">
                                        <BrainCircuit size={10} /> Neural Gen
                                    </span>
                                )}
                            </div>
                            {isComplete ? (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-dictator-teal text-white rounded-full border-2 border-black animate-fade-in">
                                    <Check size={12} strokeWidth={4} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Protocol Clear</span>
                                </div>
                            ) : quizProgress && quizProgress.answered > 0 ? (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-dictator-lime text-black rounded-full border-2 border-black">
                                    <Activity size={12} strokeWidth={3} className="animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest font-mono">{quizProgress.answered}/{quizProgress.total} OPS</span>
                                </div>
                            ) : (
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono">{module.readTime}</span>
                            )}
                        </div>

                        <div className="flex items-center gap-3 mb-3">
                            <h3 className={`font-black text-2xl leading-tight transition-all ${isComplete ? 'text-teal-900' : 'text-black'} group-hover:translate-x-1`}>
                              {module.title}
                            </h3>
                            {isComplete && <CheckCircle size={28} className="text-dictator-teal fill-dictator-teal/20" strokeWidth={2.5} />} 
                        </div>

                        <p className={`text-sm font-serif line-clamp-2 leading-relaxed ${isComplete ? 'text-teal-800/60' : 'text-gray-500'}`}>
                          {module.content.text}
                        </p>

                        {/* Progress Bar for active modules */}
                        {!isComplete && quizProgress && quizProgress.answered > 0 && (
                          <div className="mt-5 space-y-1.5">
                            <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              <span>Neural Mapping</span>
                              <span className="text-dictator-lime font-mono">{quizProgress.percent}%</span>
                            </div>
                            <div className="w-full h-3 bg-gray-100 rounded-full border-2 border-black overflow-hidden p-[1px]">
                              <div 
                                className="h-full bg-dictator-lime rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${quizProgress.percent}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                    </div>
                );
            })
        ) : (
            <div className="text-center py-20 text-gray-400 font-black uppercase tracking-widest border-4 border-dashed border-gray-200 rounded-[32px] bg-gray-50">
                <Search size={48} className="mx-auto mb-4 opacity-20" />
                No Signal Found for "{searchTerm}"
            </div>
        )}
      </div>
    </div>
  );
};

export default Learning;
