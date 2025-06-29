import { create } from 'zustand';
import { Transcript, TranslationRequest, TranslationResponse, LanguagePreferences } from '../types';
import apiService from '../services/api';

interface TranslationState {
  // State
  transcripts: Transcript[];
  currentTranscription: string;
  currentTranslation: string;
  languagePreferences: LanguagePreferences;
  supportedLanguages: string[];
  isLoading: boolean;
  error: string | null;
  isRecording: boolean;
  
  // Actions
  translateText: (translationData: TranslationRequest) => Promise<TranslationResponse>;
  getTranscripts: (meetingId: string) => Promise<void>;
  addTranscript: (transcript: Transcript) => void;
  updateTranscription: (text: string, isFinal: boolean) => void;
  updateTranslation: (text: string) => void;
  setLanguagePreferences: (preferences: LanguagePreferences) => void;
  getSupportedLanguages: () => Promise<void>;
  setRecording: (recording: boolean) => void;
  clearTranscripts: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useTranslationStore = create<TranslationState>((set, get) => ({
  // Initial state
  transcripts: [],
  currentTranscription: '',
  currentTranslation: '',
  languagePreferences: {
    sourceLanguage: 'en',
    targetLanguage: 'es',
  },
  supportedLanguages: [],
  isLoading: false,
  error: null,
  isRecording: false,

  // Actions
  translateText: async (translationData: TranslationRequest) => {
    console.log('Translation store: Starting translation with data:', translationData);
    set({ isLoading: true, error: null });
    try {
      console.log('Translation store: Calling API service...');
      const response = await apiService.translateText(translationData);
      console.log('Translation store: API response received:', response);
      set({
        isLoading: false,
        error: null,
      });
      return response;
    } catch (error: any) {
      console.error('Translation store: API call failed:', error);
      console.error('Translation store: Error response:', error.response);
      set({
        isLoading: false,
        error: error.response?.data?.detail || error.message || 'Translation failed',
      });
      throw error;
    }
  },

  getTranscripts: async (meetingId: string) => {
    set({ isLoading: true, error: null });
    try {
      const transcripts = await apiService.getTranscripts(meetingId);
      set({
        transcripts,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.detail || error.message || 'Failed to fetch transcripts',
      });
      throw error;
    }
  },

  addTranscript: (transcript: Transcript) => {
    set((state) => ({
      transcripts: [...state.transcripts, transcript],
    }));
  },

  updateTranscription: (text: string, isFinal: boolean) => {
    set({ currentTranscription: text });
    
    // If transcription is final, trigger translation
    if (isFinal && text.trim()) {
      const { languagePreferences } = get();
      const translationData: TranslationRequest = {
        text,
        source_language: languagePreferences.sourceLanguage,
        target_language: languagePreferences.targetLanguage,
      };
      
      get().translateText(translationData).then((response) => {
        set({ currentTranslation: response.translated_text });
      }).catch((error) => {
        console.error('Translation failed:', error);
      });
    }
  },

  updateTranslation: (text: string) => {
    set({ currentTranslation: text });
  },

  setLanguagePreferences: (preferences: LanguagePreferences) => {
    set({ languagePreferences: preferences });
    
    // Re-translate current text if available
    const { currentTranscription } = get();
    if (currentTranscription.trim()) {
      const translationData: TranslationRequest = {
        text: currentTranscription,
        source_language: preferences.sourceLanguage,
        target_language: preferences.targetLanguage,
      };
      
      get().translateText(translationData).then((response) => {
        set({ currentTranslation: response.translated_text });
      }).catch((error) => {
        console.error('Re-translation failed:', error);
      });
    }
  },

  getSupportedLanguages: async () => {
    set({ isLoading: true, error: null });
    try {
      const languages = await apiService.getSupportedLanguages();
      set({
        supportedLanguages: languages,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.detail || error.message || 'Failed to fetch supported languages',
      });
      throw error;
    }
  },

  setRecording: (recording: boolean) => {
    set({ isRecording: recording });
  },

  clearTranscripts: () => {
    set({
      transcripts: [],
      currentTranscription: '',
      currentTranslation: '',
    });
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
})); 