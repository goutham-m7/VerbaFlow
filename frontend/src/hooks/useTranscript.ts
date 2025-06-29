import { useState, useCallback } from 'react';

export interface TranscriptEntry {
  id: string;
  timestamp: Date;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence?: number;
}

interface TranscriptState {
  entries: TranscriptEntry[];
  sessionStartTime: Date | null;
  isRecording: boolean;
}

interface TranscriptActions {
  addEntry: (entry: Omit<TranscriptEntry, 'id' | 'timestamp'>) => void;
  clearSession: () => void;
  startSession: () => void;
  stopSession: () => void;
  downloadTranscript: (format?: 'txt' | 'json' | 'csv') => void;
  getSessionDuration: () => number;
  getWordCount: () => number;
}

export const useTranscript = (): TranscriptState & TranscriptActions => {
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const addEntry = useCallback((entry: Omit<TranscriptEntry, 'id' | 'timestamp'>) => {
    const newEntry: TranscriptEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setEntries(prev => [...prev, newEntry]);
  }, []);

  const clearSession = useCallback(() => {
    setEntries([]);
    setSessionStartTime(null);
    setIsRecording(false);
  }, []);

  const startSession = useCallback(() => {
    setSessionStartTime(new Date());
    setIsRecording(true);
  }, []);

  const stopSession = useCallback(() => {
    setIsRecording(false);
  }, []);

  const getSessionDuration = useCallback(() => {
    if (!sessionStartTime) return 0;
    const endTime = isRecording ? new Date() : sessionStartTime;
    return Math.floor((endTime.getTime() - sessionStartTime.getTime()) / 1000);
  }, [sessionStartTime, isRecording]);

  const getWordCount = useCallback(() => {
    return entries.reduce((count, entry) => {
      return count + entry.originalText.split(' ').length;
    }, 0);
  }, [entries]);

  const downloadTranscript = useCallback((format: 'txt' | 'json' | 'csv' = 'txt') => {
    if (entries.length === 0) {
      alert('No transcript entries to download');
      return;
    }

    const sessionInfo = {
      startTime: sessionStartTime?.toISOString(),
      endTime: new Date().toISOString(),
      duration: getSessionDuration(),
      wordCount: getWordCount(),
      entryCount: entries.length,
      sourceLanguage: entries[0]?.sourceLanguage || 'en',
      targetLanguage: entries[0]?.targetLanguage || 'es',
    };

    let content = '';
    let filename = `transcript_${new Date().toISOString().split('T')[0]}`;
    let mimeType = '';

    switch (format) {
      case 'txt':
        content = generateTextTranscript(entries, sessionInfo);
        filename += '.txt';
        mimeType = 'text/plain';
        break;
      case 'json':
        content = JSON.stringify({
          sessionInfo,
          entries: entries.map(entry => ({
            ...entry,
            timestamp: entry.timestamp.toISOString()
          }))
        }, null, 2);
        filename += '.json';
        mimeType = 'application/json';
        break;
      case 'csv':
        content = generateCSVTranscript(entries, sessionInfo);
        filename += '.csv';
        mimeType = 'text/csv';
        break;
    }

    // Create and download file
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [entries, sessionStartTime, getSessionDuration, getWordCount]);

  return {
    entries,
    sessionStartTime,
    isRecording,
    addEntry,
    clearSession,
    startSession,
    stopSession,
    downloadTranscript,
    getSessionDuration,
    getWordCount,
  };
};

// Helper functions for generating different transcript formats
function generateTextTranscript(entries: TranscriptEntry[], sessionInfo: any): string {
  let content = `LinguaLive Session Transcript\n`;
  content += `================================\n\n`;
  content += `Session Information:\n`;
  content += `Start Time: ${sessionInfo.startTime}\n`;
  content += `End Time: ${sessionInfo.endTime}\n`;
  content += `Duration: ${formatDuration(sessionInfo.duration)}\n`;
  content += `Total Words: ${sessionInfo.wordCount}\n`;
  content += `Total Entries: ${sessionInfo.entryCount}\n`;
  content += `Source Language: ${sessionInfo.sourceLanguage}\n`;
  content += `Target Language: ${sessionInfo.targetLanguage}\n\n`;
  content += `Transcript Entries:\n`;
  content += `==================\n\n`;

  entries.forEach((entry, index) => {
    content += `${index + 1}. [${entry.timestamp.toLocaleTimeString()}]\n`;
    content += `   Original (${entry.sourceLanguage}): ${entry.originalText}\n`;
    content += `   Translation (${entry.targetLanguage}): ${entry.translatedText}\n`;
    if (entry.confidence) {
      content += `   Confidence: ${(entry.confidence * 100).toFixed(1)}%\n`;
    }
    content += `\n`;
  });

  return content;
}

function generateCSVTranscript(entries: TranscriptEntry[], sessionInfo: any): string {
  let content = `Timestamp,Original Text,Translation,Source Language,Target Language,Confidence\n`;
  
  entries.forEach(entry => {
    const timestamp = entry.timestamp.toISOString();
    const originalText = `"${entry.originalText.replace(/"/g, '""')}"`;
    const translatedText = `"${entry.translatedText.replace(/"/g, '""')}"`;
    const confidence = entry.confidence ? (entry.confidence * 100).toFixed(1) : '';
    
    content += `${timestamp},${originalText},${translatedText},${entry.sourceLanguage},${entry.targetLanguage},${confidence}\n`;
  });

  return content;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
} 