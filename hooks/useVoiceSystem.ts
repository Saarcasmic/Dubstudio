import { useState, useEffect, useCallback } from 'react';
import { VideoAnalysisResult } from '../types';
import { extractAudioClip } from '../utils/audioUtils';
import { VoiceManager } from '../services/VoiceManager';

interface VoiceSystemState {
  isReady: boolean;
  progress: string; // e.g., "Cloning Voice 1/3..."
  speakerStatus: Record<string, 'PENDING' | 'CLONED' | 'FAILED'>;
}

export const useVoiceSystem = (
  videoFile: File | null,
  analysisResult: VideoAnalysisResult | null
) => {
  const [state, setState] = useState<VoiceSystemState>({
    isReady: false,
    progress: '',
    speakerStatus: {},
  });

  // Main Pipeline: When analysis completes, register voices
  useEffect(() => {
    if (!analysisResult) {
      setState(prev => ({ ...prev, isReady: false, progress: '' }));
      return;
    }

    const initializeVoices = async () => {
      const speakers = analysisResult.speakers;
      const initialStatus: Record<string, 'PENDING'> = {};
      speakers.forEach(s => (initialStatus[s.id] = 'PENDING'));
      
      setState({
        isReady: false,
        progress: 'Preparing to clone voices...',
        speakerStatus: initialStatus
      });

      // MOCK DATA MODE: If no video file, just simulate success
      if (!videoFile) {
        await new Promise(r => setTimeout(r, 1000));
        const mockStatus: Record<string, 'CLONED'> = {};
        speakers.forEach(s => {
          // Register a mock mapping in the manager so TTS works
          VoiceManager['voiceMap'].set(s.id, `mock_voice_${s.id}`); 
          mockStatus[s.id] = 'CLONED';
        });
        setState({
          isReady: true,
          progress: 'Demo voices ready (Mock Mode)',
          speakerStatus: mockStatus
        });
        return;
      }

      // REAL MODE: Extract and Clone
      // 1. Identify best segments for each speaker (Longest segment)
      const cloningQueue = speakers.map(speaker => {
        const speakerSegments = analysisResult.segments.filter(s => s.speaker_id === speaker.id);
        if (speakerSegments.length === 0) return null;

        // Find the longest segment to get the best sample
        const bestSegment = speakerSegments.reduce((prev, current) => {
          return (current.end_time - current.start_time) > (prev.end_time - prev.start_time) 
            ? current 
            : prev;
        });

        return { speaker, segment: bestSegment };
      }).filter(item => item !== null);

      // 2. Process Queue
      let completedCount = 0;
      const total = cloningQueue.length;

      for (const item of cloningQueue) {
        if (!item) continue;
        const { speaker, segment } = item;

        try {
          setState(prev => ({
            ...prev,
            progress: `Cloning voice for ${speaker.name} (${completedCount + 1}/${total})...`
          }));

          // A. Extract Audio
          const audioBlob = await extractAudioClip(
            videoFile, 
            segment.start_time, 
            segment.end_time
          );

          // B. Register with Service
          await VoiceManager.registerVoice(speaker.id, audioBlob);

          // Update Status
          setState(prev => ({
            ...prev,
            speakerStatus: { ...prev.speakerStatus, [speaker.id]: 'CLONED' }
          }));

        } catch (error) {
          console.error(`Failed to clone voice for ${speaker.id}`, error);
          setState(prev => ({
            ...prev,
            speakerStatus: { ...prev.speakerStatus, [speaker.id]: 'FAILED' }
          }));
        }
        completedCount++;
      }

      setState(prev => ({
        ...prev,
        isReady: true,
        progress: 'Voice cloning complete.',
      }));
    };

    initializeVoices();
  }, [videoFile, analysisResult]);

  /**
   * Synthesizes new audio for a specific text.
   */
  const synthesizeSegment = useCallback(async (speakerId: string, text: string): Promise<string> => {
    // If in mock mode (no file), we allow it even if status check might fail strictly
    if (!videoFile) {
        return await VoiceManager.generateSpeech(text, speakerId);
    }

    if (!state.speakerStatus[speakerId] || state.speakerStatus[speakerId] === 'FAILED') {
      throw new Error("Voice not available for this speaker.");
    }
    return await VoiceManager.generateSpeech(text, speakerId);
  }, [state.speakerStatus, videoFile]);

  return {
    ...state,
    synthesizeSegment
  };
};