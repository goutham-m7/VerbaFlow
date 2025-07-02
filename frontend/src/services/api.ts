import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  User, 
  UserRegistration, 
  UserLogin, 
  AuthResponse,
  Meeting,
  CreateMeetingRequest,
  JoinMeetingRequest,
  Transcript,
  TranslationRequest,
  TranslationResponse,
  TranslationWithDetectionRequest,
  TranslationWithDetectionResponse,
  LanguageDetectionRequest,
  LanguageDetectionResponse,
  PaginatedResponse,
  DebugInfo,
  TTSRequest,
  TTSResponse,
  Voice
} from '../types';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              localStorage.setItem('access_token', response.access_token);
              localStorage.setItem('refresh_token', response.refresh_token);
              
              originalRequest.headers.Authorization = `Bearer ${response.access_token}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth Endpoints
  async register(userData: UserRegistration): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/api/v1/auth/register', userData);
    return response.data;
  }

  async login(credentials: UserLogin): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/api/v1/auth/login', credentials);
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/api/v1/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  }

  async logout(): Promise<void> {
    await this.api.post('/api/v1/auth/logout');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get('/api/v1/auth/me');
    return response.data;
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    const response: AxiosResponse<User> = await this.api.put('/api/v1/auth/profile', userData);
    return response.data;
  }

  // Meeting Endpoints
  async createMeeting(meetingData: CreateMeetingRequest): Promise<Meeting> {
    const response: AxiosResponse<Meeting> = await this.api.post('/api/v1/meetings', meetingData);
    return response.data;
  }

  async getMeetings(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Meeting>> {
    const response: AxiosResponse<PaginatedResponse<Meeting>> = await this.api.get('/api/v1/meetings', {
      params: { page, limit },
    });
    return response.data;
  }

  async getMeeting(meetingId: string): Promise<Meeting> {
    const response: AxiosResponse<Meeting> = await this.api.get(`/api/v1/meetings/${meetingId}`);
    return response.data;
  }

  async updateMeeting(meetingId: string, meetingData: Partial<Meeting>): Promise<Meeting> {
    const response: AxiosResponse<Meeting> = await this.api.put(`/api/v1/meetings/${meetingId}`, meetingData);
    return response.data;
  }

  async deleteMeeting(meetingId: string): Promise<void> {
    await this.api.delete(`/api/v1/meetings/${meetingId}`);
  }

  async joinMeeting(joinData: JoinMeetingRequest): Promise<{ join_url: string; auth_token: string }> {
    const response: AxiosResponse<{ join_url: string; auth_token: string }> = await this.api.post(
      `/api/v1/meetings/${joinData.meeting_id}/join`,
      joinData
    );
    return response.data;
  }

  async leaveMeeting(meetingId: string): Promise<void> {
    await this.api.post(`/api/v1/meetings/${meetingId}/leave`);
  }

  async startMeeting(meetingId: string): Promise<Meeting> {
    const response: AxiosResponse<Meeting> = await this.api.post(`/api/v1/meetings/${meetingId}/start`);
    return response.data;
  }

  async endMeeting(meetingId: string): Promise<Meeting> {
    const response: AxiosResponse<Meeting> = await this.api.post(`/api/v1/meetings/${meetingId}/end`);
    return response.data;
  }

  // Transcript Endpoints
  async getTranscripts(meetingId: string): Promise<Transcript[]> {
    const response: AxiosResponse<Transcript[]> = await this.api.get(`/api/v1/transcripts/${meetingId}`);
    return response.data;
  }

  async getTranscript(transcriptId: string): Promise<Transcript> {
    const response: AxiosResponse<Transcript> = await this.api.get(`/api/v1/transcripts/id/${transcriptId}`);
    return response.data;
  }

  async getUserTranscripts(userId: string): Promise<any[]> {
    const response: AxiosResponse<any[]> = await this.api.get(`/api/v1/transcripts/user/${userId}`);
    return response.data;
  }

  async deleteTranscript(transcriptId: string): Promise<void> {
    await this.api.delete(`/api/v1/transcripts/${transcriptId}`);
  }

  // Translation Endpoints
  async translateText(translationData: TranslationRequest): Promise<TranslationResponse> {
    console.log('API Service: translateText called with:', translationData);
    console.log('API Service: Making POST request to /api/v1/translation/translate');
    const response: AxiosResponse<TranslationResponse> = await this.api.post('/api/v1/translation/translate', translationData);
    console.log('API Service: Response received:', response.data);
    return response.data;
  }

  async translateWithDetection(translationData: TranslationWithDetectionRequest): Promise<TranslationWithDetectionResponse> {
    console.log('API Service: translateWithDetection called with:', translationData);
    const response: AxiosResponse<TranslationWithDetectionResponse> = await this.api.post('/api/v1/translation/translate-with-detection', translationData);
    console.log('API Service: Response received:', response.data);
    return response.data;
  }

  async detectLanguage(text: string): Promise<LanguageDetectionResponse> {
    console.log('API Service: detectLanguage called with:', text);
    const request: LanguageDetectionRequest = { text };
    const response: AxiosResponse<LanguageDetectionResponse> = await this.api.post('/api/v1/translation/detect-language', request);
    console.log('API Service: Language detection response:', response.data);
    return response.data;
  }

  async getSupportedLanguages(): Promise<string[]> {
    const response: AxiosResponse<string[]> = await this.api.get('/api/v1/translation/languages');
    return response.data;
  }

  // User Endpoints
  async getUsers(page: number = 1, limit: number = 10): Promise<PaginatedResponse<User>> {
    const response: AxiosResponse<PaginatedResponse<User>> = await this.api.get('/api/v1/users', {
      params: { page, limit },
    });
    return response.data;
  }

  async getUser(userId: string): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get(`/api/v1/users/${userId}`);
    return response.data;
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    const response: AxiosResponse<User> = await this.api.put(`/api/v1/users/${userId}`, userData);
    return response.data;
  }

  async deleteUser(userId: string): Promise<void> {
    await this.api.delete(`/api/v1/users/${userId}`);
  }

  // Debug Endpoints
  async getDebugInfo(): Promise<DebugInfo> {
    const response: AxiosResponse<DebugInfo> = await this.api.get('/debug/all');
    return response.data;
  }

  async getMongoDBDebug(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/debug/mongodb');
    return response.data;
  }

  async getRedisDebug(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/debug/redis');
    return response.data;
  }

  async getGCPDebug(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/debug/gcp');
    return response.data;
  }

  async get100msDebug(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/debug/100ms');
    return response.data;
  }

  // Health Check
  async getHealth(): Promise<{ status: string }> {
    const response: AxiosResponse<{ status: string }> = await this.api.get('/health');
    return response.data;
  }

  // File Upload
  async uploadAudioFile(file: File, meetingId?: string): Promise<{ file_url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (meetingId) {
      formData.append('meeting_id', meetingId);
    }

    const response: AxiosResponse<{ file_url: string }> = await this.api.post('/upload/audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // WebSocket Connection
  getWebSocketUrl(meetingId: string): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.REACT_APP_WS_HOST || window.location.host;
    return `${protocol}//${host}/ws?meeting_id=${meetingId}`;
  }

  // TTS Endpoints
  async synthesizeSpeech(ttsData: TTSRequest): Promise<TTSResponse> {
    const response: AxiosResponse<TTSResponse> = await this.api.post('/api/v1/translation/tts', ttsData);
    return response.data;
  }

  async getVoices(languageCode: string = 'en-US'): Promise<Voice[]> {
    const response: AxiosResponse<{ voices: Voice[] }> = await this.api.get(`/api/v1/translation/tts/voices/${languageCode}`);
    return response.data.voices;
  }
}

// Create singleton instance
const apiService = new ApiService();
export default apiService; 