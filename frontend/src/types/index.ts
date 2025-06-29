// User Types
export interface User {
  _id: string;
  email: string;
  name: string;
  avatar?: string;
  preferences: UserPreferences;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface UserPreferences {
  default_source_language: string;
  default_target_language: string;
  theme: 'light' | 'dark';
  notifications: boolean;
}

export interface UserRegistration {
  email: string;
  name: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

// Meeting Types
export interface Meeting {
  _id: string;
  meeting_id: string;
  title: string;
  description: string;
  host_id: string;
  participants: string[];
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
  started_at?: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
  join_url: string;
  recording_url?: string;
  scheduled_at: string;
  settings: MeetingSettings;
}

export interface MeetingSettings {
  max_participants: number;
  recording_enabled: boolean;
  transcription_enabled: boolean;
  auto_translate: boolean;
  allow_guest_access: boolean;
  require_authentication: boolean;
}

export interface CreateMeetingRequest {
  title: string;
  description?: string;
  scheduled_at?: string;
  settings?: Partial<MeetingSettings>;
}

export interface JoinMeetingRequest {
  meeting_id: string;
  participant_name: string;
  is_host?: boolean;
}

// Transcript Types
export interface Transcript {
  _id: string;
  meeting_id: string;
  speaker_id: string;
  speaker_name: string;
  timestamp: string;
  original_text: string;
  source_language: string;
  translations: Translation[];
  confidence: number;
  is_final: boolean;
}

export interface Translation {
  target_language: string;
  translated_text: string;
  confidence: number;
}

// Translation Types
export interface LanguagePreferences {
  sourceLanguage: string;
  targetLanguage: string;
}

export interface TranslationRequest {
  text: string;
  source_language: string;
  target_language: string;
  enable_punctuation?: boolean;
}

export interface TranslationResponse {
  original_text: string;
  translated_text: string;
  source_language: string;
  target_language: string;
  confidence: number;
}

export interface TranslationWithDetectionRequest {
  text: string;
  target_language: string;
  auto_detect: boolean;
  enable_punctuation?: boolean;
}

export interface TranslationWithDetectionResponse {
  original_text: string;
  translated_text: string;
  source_language: string;
  target_language: string;
  confidence: number;
  detected_language: string;
  detection_confidence: number;
  is_reliable_detection: boolean;
}

export interface LanguageDetectionRequest {
  text: string;
}

export interface LanguageDetectionResponse {
  detected_language: string;
  confidence: number;
  is_reliable: boolean;
}

// Audio Types
export interface AudioData {
  audioBlob: Blob;
  duration: number;
  sampleRate: number;
}

export interface AudioCaptureConfig {
  sampleRate: number;
  channels: number;
  bitDepth: number;
}

// WebSocket Types
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface TranscriptionMessage extends WebSocketMessage {
  type: 'transcription';
  data: {
    text: string;
    is_final: boolean;
    speaker_id: string;
    confidence: number;
  };
}

export interface TranslationMessage extends WebSocketMessage {
  type: 'translation';
  data: {
    original_text: string;
    translated_text: string;
    source_language: string;
    target_language: string;
    confidence: number;
  };
}

export interface ParticipantMessage extends WebSocketMessage {
  type: 'participant_joined' | 'participant_left';
  data: {
    participant_id: string;
    participant_name: string;
    meeting_id: string;
  };
}

// 100ms Types
export interface HMSConfig {
  userName: string;
  authToken: string;
  settings: {
    isAudioMuted: boolean;
    isVideoMuted: boolean;
  };
}

export interface HMSRoom {
  id: string;
  name: string;
  description?: string;
  template_id: string;
  region: string;
  recording_info: {
    enabled: boolean;
    auto_recording: boolean;
  };
}

// API Response Types
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}

// Error Types
export interface ApiError {
  status: number;
  message: string;
  details?: any;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

// UI Types
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

export interface ModalConfig {
  isOpen: boolean;
  title: string;
  content: React.ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

// Theme Types
export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
}

// Debug Types
export interface DebugInfo {
  status: string;
  timestamp: string;
  services: {
    mongodb?: any;
    redis?: any;
    gcp?: any;
    '100ms'?: any;
  };
  system?: {
    platform: string;
    python_version: string;
    cpu_count: number;
    memory_usage: {
      total: number;
      available: number;
      percent: number;
    };
    disk_usage: {
      total: number;
      free: number;
      percent: number;
    };
  };
}

// Web Speech API Types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

// TTS Types
export interface TTSRequest {
  text: string;
  language_code: string;
  voice_name?: string;
  provider: 'google' | 'browser';
}

export interface TTSResponse {
  success: boolean;
  provider: string;
  text: string;
  language_code: string;
  voice_name?: string;
  audio_data?: string; // Base64 encoded audio
  audio_format?: string;
  error?: string;
}

export interface Voice {
  name: string;
  language_code: string;
  ssml_gender: string;
  natural_sample_rate_hertz: number;
} 