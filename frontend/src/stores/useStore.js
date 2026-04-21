/**
 * Zustand Store - Global state management for the IELTS Practice App
 * Settings are persisted to LocalStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      // ─── Settings ──────────────────────────────────────────
      apiKey: '',
      model: 'gpt-4o-mini',
      baseUrl: '',
      targetScore: 6.5,
      language: 'zh-CN',
      theme: 'light',
      
      setApiKey: (key) => set({ apiKey: key }),
      setModel: (model) => set({ model }),
      setBaseUrl: (url) => set({ baseUrl: url }),
      setTargetScore: (score) => set({ targetScore: score }),
      setLanguage: (lang) => set({ language: lang }),
      setTheme: (theme) => set({ theme }),

      // ─── Practice State ────────────────────────────────────
      practiceTopics: null,       // { part1_topic, part2_3_topic }
      practiceStep: 'idle',       // idle | topics-drawn | generating | answer-ready | practicing
      currentQuestion: null,
      generatedAnswer: null,
      
      setPracticeTopics: (topics) => set({ practiceTopics: topics, practiceStep: 'topics-drawn' }),
      setPracticeStep: (step) => set({ practiceStep: step }),
      setCurrentQuestion: (q) => set({ currentQuestion: q }),
      setGeneratedAnswer: (answer) => set({ generatedAnswer: answer }),
      resetPractice: () => set({
        practiceTopics: null,
        practiceStep: 'idle',
        currentQuestion: null,
        generatedAnswer: null,
      }),

      // ─── Exam State ───────────────────────────────────────
      examSession: null,          // { session_id, current_part, transcript }
      examPart: null,             // 'part1' | 'part2' | 'part3'
      examStatus: 'idle',         // idle | running | scoring | completed
      examReport: null,
      examCueCard: null,
      examTranscript: [],         // local transcript for display

      setExamSession: (session) => set({ examSession: session }),
      setExamPart: (part) => set({ examPart: part }),
      setExamStatus: (status) => set({ examStatus: status }),
      setExamReport: (report) => set({ examReport: report }),
      setExamCueCard: (card) => set({ examCueCard: card }),
      addExamMessage: (msg) => set((state) => ({
        examTranscript: [...state.examTranscript, msg],
      })),
      resetExam: () => set({
        examSession: null,
        examPart: null,
        examStatus: 'idle',
        examReport: null,
        examCueCard: null,
        examTranscript: [],
      }),

      // ─── Topics Cache ─────────────────────────────────────
      topicsCache: [],
      setTopicsCache: (topics) => set({ topicsCache: topics }),

      // ─── Loading / Error ──────────────────────────────────
      loading: false,
      error: null,
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'ielts-practice-storage',
      partialize: (state) => ({
        apiKey: state.apiKey,
        model: state.model,
        baseUrl: state.baseUrl,
        targetScore: state.targetScore,
        language: state.language,
        theme: state.theme,
      }),
    }
  )
);

export default useStore;
