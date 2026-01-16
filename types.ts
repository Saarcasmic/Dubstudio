export interface Speaker {
  id: string;
  name: string;
  voice_tone: string;
}

export interface Segment {
  id: string;
  speaker_id: string;
  start_time: number;
  end_time: number;
  text: string;
}

export interface VideoMetadata {
  total_duration: number;
  detected_language: string;
}

export interface VideoAnalysisResult {
  metadata: VideoMetadata;
  speakers: Speaker[];
  segments: Segment[];
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}