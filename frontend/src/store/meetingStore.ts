import { create } from 'zustand';
import { Meeting, CreateMeetingRequest, JoinMeetingRequest } from '../types';
import apiService from '../services/api';

interface MeetingState {
  // State
  meetings: Meeting[];
  currentMeeting: Meeting | null;
  isLoading: boolean;
  error: string | null;
  totalMeetings: number;
  currentPage: number;
  
  // Actions
  createMeeting: (meetingData: CreateMeetingRequest) => Promise<Meeting>;
  getMeetings: (page?: number, limit?: number) => Promise<void>;
  getMeeting: (meetingId: string) => Promise<Meeting>;
  joinMeeting: (joinData: JoinMeetingRequest) => Promise<{ join_url: string; auth_token: string }>;
  leaveMeeting: (meetingId: string) => Promise<void>;
  startMeeting: (meetingId: string) => Promise<Meeting>;
  endMeeting: (meetingId: string) => Promise<Meeting>;
  updateMeeting: (meetingId: string, meetingData: Partial<Meeting>) => Promise<Meeting>;
  deleteMeeting: (meetingId: string) => Promise<void>;
  setCurrentMeeting: (meeting: Meeting | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useMeetingStore = create<MeetingState>((set, get) => ({
  // Initial state
  meetings: [],
  currentMeeting: null,
  isLoading: false,
  error: null,
  totalMeetings: 0,
  currentPage: 1,

  // Actions
  createMeeting: async (meetingData: CreateMeetingRequest) => {
    set({ isLoading: true, error: null });
    try {
      const meeting = await apiService.createMeeting(meetingData);
      set((state) => ({
        meetings: [meeting, ...state.meetings],
        isLoading: false,
        error: null,
      }));
      return meeting;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.detail || error.message || 'Failed to create meeting',
      });
      throw error;
    }
  },

  getMeetings: async (page = 1, limit = 10) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.getMeetings(page, limit);
      set({
        meetings: response.items,
        totalMeetings: response.total,
        currentPage: response.page,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.detail || error.message || 'Failed to fetch meetings',
      });
      throw error;
    }
  },

  getMeeting: async (meetingId: string) => {
    set({ isLoading: true, error: null });
    try {
      const meeting = await apiService.getMeeting(meetingId);
      set({
        currentMeeting: meeting,
        isLoading: false,
        error: null,
      });
      return meeting;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.detail || error.message || 'Failed to fetch meeting',
      });
      throw error;
    }
  },

  joinMeeting: async (joinData: JoinMeetingRequest) => {
    set({ isLoading: true, error: null });
    try {
      const result = await apiService.joinMeeting(joinData);
      set({
        isLoading: false,
        error: null,
      });
      return result;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.detail || error.message || 'Failed to join meeting',
      });
      throw error;
    }
  },

  leaveMeeting: async (meetingId: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiService.leaveMeeting(meetingId);
      set({
        currentMeeting: null,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.detail || error.message || 'Failed to leave meeting',
      });
      throw error;
    }
  },

  startMeeting: async (meetingId: string) => {
    set({ isLoading: true, error: null });
    try {
      const meeting = await apiService.startMeeting(meetingId);
      set((state) => ({
        currentMeeting: meeting,
        meetings: state.meetings.map((m) => 
          m._id === meetingId ? meeting : m
        ),
        isLoading: false,
        error: null,
      }));
      return meeting;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.detail || error.message || 'Failed to start meeting',
      });
      throw error;
    }
  },

  endMeeting: async (meetingId: string) => {
    set({ isLoading: true, error: null });
    try {
      const meeting = await apiService.endMeeting(meetingId);
      set((state) => ({
        currentMeeting: meeting,
        meetings: state.meetings.map((m) => 
          m._id === meetingId ? meeting : m
        ),
        isLoading: false,
        error: null,
      }));
      return meeting;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.detail || error.message || 'Failed to end meeting',
      });
      throw error;
    }
  },

  updateMeeting: async (meetingId: string, meetingData: Partial<Meeting>) => {
    set({ isLoading: true, error: null });
    try {
      const meeting = await apiService.updateMeeting(meetingId, meetingData);
      set((state) => ({
        currentMeeting: state.currentMeeting?._id === meetingId ? meeting : state.currentMeeting,
        meetings: state.meetings.map((m) => 
          m._id === meetingId ? meeting : m
        ),
        isLoading: false,
        error: null,
      }));
      return meeting;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.detail || error.message || 'Failed to update meeting',
      });
      throw error;
    }
  },

  deleteMeeting: async (meetingId: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiService.deleteMeeting(meetingId);
      set((state) => ({
        meetings: state.meetings.filter((m) => m._id !== meetingId),
        currentMeeting: state.currentMeeting?._id === meetingId ? null : state.currentMeeting,
        isLoading: false,
        error: null,
      }));
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.detail || error.message || 'Failed to delete meeting',
      });
      throw error;
    }
  },

  setCurrentMeeting: (meeting: Meeting | null) => {
    set({ currentMeeting: meeting });
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
})); 