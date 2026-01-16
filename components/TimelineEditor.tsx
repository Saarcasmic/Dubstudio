import React, { useState, useEffect, memo } from 'react';
import { VideoAnalysisResult, Segment } from '../types';
import { User, Play, Edit2 } from 'lucide-react';
import { EditModal } from './EditModal';

interface TimelineEditorProps {
  initialData: VideoAnalysisResult;
  onSegmentUpdate: (updatedSegments: Segment[]) => void;
  onPreviewAudio: (speakerId: string, text: string) => Promise<string>;
}

interface TimelineSegmentProps {
  segment: Segment;
  pixelsPerSecond: number;
  colorClass: string;
  onClick: (id: string) => void;
}

const PIXELS_PER_SECOND = 100;
const SPEAKER_COLORS = [
  'bg-blue-600 border-blue-400 text-blue-50',
  'bg-emerald-600 border-emerald-400 text-emerald-50',
  'bg-purple-600 border-purple-400 text-purple-50',
  'bg-orange-600 border-orange-400 text-orange-50',
  'bg-pink-600 border-pink-400 text-pink-50',
];

/**
 * Individual Segment Component
 * Encapsulates logic for a single block to avoid "Hooks inside loops" issues.
 * memo() prevents re-rendering every segment when only one changes.
 */
const TimelineSegment = memo(({ segment, pixelsPerSecond, colorClass, onClick }: TimelineSegmentProps) => {
  // Math Guards: Ensure safe numbers for CSS
  const safeStart = Number.isFinite(segment.start_time) ? Math.max(0, segment.start_time) : 0;
  const safeEnd = Number.isFinite(segment.end_time) ? Math.max(safeStart, segment.end_time) : safeStart + 1;
  const safeDuration = safeEnd - safeStart;

  const leftPos = safeStart * pixelsPerSecond;
  const widthVal = Math.max(safeDuration * pixelsPerSecond, 20); // Min width 20px

  return (
    <div
      onClick={() => onClick(segment.id)}
      className={`absolute top-2 bottom-2 rounded-md border shadow-sm cursor-pointer hover:brightness-110 hover:shadow-md hover:z-10 transition-all overflow-hidden flex flex-col p-2 select-none ${colorClass}`}
      style={{
        left: `${leftPos}px`,
        width: `${widthVal}px`
      }}
      title="Click to edit"
    >
      <div className="flex items-center gap-1 text-[10px] opacity-75 mb-0.5">
        <Play size={8} fill="currentColor" />
        <span>{safeStart.toFixed(1)}s</span>
      </div>
      <div className="text-xs font-medium leading-tight line-clamp-2 overflow-hidden break-words">
        {segment.text}
      </div>
    </div>
  );
});

TimelineSegment.displayName = 'TimelineSegment';

/**
 * Main Editor Component
 */
export const TimelineEditor: React.FC<TimelineEditorProps> = ({ initialData, onSegmentUpdate, onPreviewAudio }) => {
  // 1. Data Integrity Boundary
  if (!initialData || !initialData.metadata || !Array.isArray(initialData.speakers)) {
    console.error('TimelineEditor: Invalid initialData received', initialData);
    return (
      <div className="p-8 bg-gray-900 text-red-400 border border-red-800 rounded-lg">
        Error: Unable to load timeline data. Data structure is invalid.
      </div>
    );
  }

  const [segments, setSegments] = useState<Segment[]>(initialData.segments || []);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  
  // 2. Effect Loop Guard
  // Check if lengths differ or IDs differ to avoid infinite updates if object ref changes but data is same
  useEffect(() => {
    if (initialData.segments && Array.isArray(initialData.segments)) {
      setSegments(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(initialData.segments)) {
          return initialData.segments;
        }
        return prev;
      });
    }
  }, [initialData.segments]);

  const handleSaveSegment = (newText: string) => {
    if (!editingSegmentId) return;
    
    const updatedSegments = segments.map(seg => 
      seg.id === editingSegmentId ? { ...seg, text: newText } : seg
    );
    
    setSegments(updatedSegments);
    onSegmentUpdate(updatedSegments);
    setEditingSegmentId(null);
  };

  const getSpeakerColor = (speakerId: string) => {
    if (!initialData.speakers) return 'bg-gray-600 border-gray-400 text-gray-50';
    const index = initialData.speakers.findIndex(s => s.id === speakerId);
    return SPEAKER_COLORS[index % SPEAKER_COLORS.length] || 'bg-gray-600 border-gray-400 text-gray-50';
  };

  const duration = typeof initialData.metadata.total_duration === 'number' 
    ? initialData.metadata.total_duration 
    : 0;
  
  const totalWidth = Math.max(100, (duration * PIXELS_PER_SECOND) || 100);
  const editingSegment = segments.find(s => s.id === editingSegmentId);

  // Helper to wrap the preview call with the current segment's speaker ID
  const handlePreviewRequest = async (text: string) => {
    if (!editingSegment) return "";
    return onPreviewAudio(editingSegment.speaker_id, text);
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700 flex flex-col h-[500px]">
      <div className="p-4 border-b border-gray-700 bg-gray-900/50 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Edit2 size={18} className="text-indigo-400"/>
          Timeline Editor
        </h3>
        <div className="text-xs text-gray-400">
          Duration: {duration.toFixed(1)}s
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (Speakers) */}
        <div className="w-1/5 min-w-[150px] bg-gray-850 border-r border-gray-700 z-10 flex flex-col">
          <div className="h-8 border-b border-gray-700 bg-gray-900/50"></div> {/* Header spacer */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {initialData.speakers.map((speaker) => (
              <div key={speaker.id} className="h-24 px-4 border-b border-gray-700 flex flex-col justify-center relative group hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${getSpeakerColor(speaker.id).split(' ')[0]}`}></div>
                  <span className="text-sm font-medium text-white truncate" title={speaker.name}>{speaker.name || 'Unknown'}</span>
                </div>
                <div className="text-xs text-gray-500 truncate">{speaker.voice_tone || 'Standard voice'}</div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <User size={14} className="text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Tracks */}
        <div className="w-4/5 flex-1 overflow-x-auto overflow-y-auto bg-gray-900 relative custom-scrollbar">
          <div style={{ width: `${totalWidth}px` }} className="relative min-h-full">
            
            {/* Time Ruler (Top) */}
            <div className="h-8 border-b border-gray-700 bg-gray-900 sticky top-0 z-20 flex items-end pb-1 select-none">
              {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
                <div 
                  key={i} 
                  className="absolute text-[10px] text-gray-500 border-l border-gray-700 pl-1 h-3"
                  style={{ left: `${i * PIXELS_PER_SECOND}px` }}
                >
                  {i}s
                </div>
              ))}
            </div>

            {/* Tracks Container */}
            <div className="relative">
              {/* Background Grid Lines */}
              <div className="absolute inset-0 pointer-events-none z-0">
                 {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="absolute h-full border-r border-gray-800/50" 
                      style={{ left: `${i * PIXELS_PER_SECOND}px` }} 
                    />
                 ))}
              </div>

              {/* Speaker Lanes */}
              {initialData.speakers.map((speaker) => (
                <div key={speaker.id} className="h-24 border-b border-gray-800 relative w-full group">
                   <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.02] pointer-events-none"></div>

                   {/* Render Segments using Child Component */}
                   {segments
                     .filter(s => s.speaker_id === speaker.id)
                     .map(segment => (
                       <TimelineSegment 
                          key={segment.id}
                          segment={segment}
                          pixelsPerSecond={PIXELS_PER_SECOND}
                          colorClass={getSpeakerColor(speaker.id)}
                          onClick={setEditingSegmentId}
                       />
                   ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <EditModal 
        isOpen={!!editingSegmentId}
        initialText={editingSegment?.text || ''}
        onClose={() => setEditingSegmentId(null)}
        onSave={handleSaveSegment}
        onPreview={handlePreviewRequest}
      />
    </div>
  );
};

export const MOCK_DATA: VideoAnalysisResult = {
  metadata: {
    total_duration: 15.0,
    detected_language: 'English',
  },
  speakers: [
    { id: 'spk_1', name: 'Interviewer', voice_tone: 'Professional, Inquisitive' },
    { id: 'spk_2', name: 'Expert', voice_tone: 'Calm, Knowledgeable' },
  ],
  segments: [
    {
      id: 'seg_1',
      speaker_id: 'spk_1',
      start_time: 0.5,
      end_time: 2.5,
      text: 'Welcome to the future of video editing.',
    },
    {
      id: 'seg_2',
      speaker_id: 'spk_2',
      start_time: 3.0,
      end_time: 6.5,
      text: 'It is truly remarkable what we can achieve now with AI.',
    },
    {
      id: 'seg_3',
      speaker_id: 'spk_1',
      start_time: 7.0,
      end_time: 9.0,
      text: 'Can you explain how the voice cloning works?',
    },
    {
      id: 'seg_4',
      speaker_id: 'spk_2',
      start_time: 9.5,
      end_time: 14.0,
      text: 'We extract audio features and map them to a latent space.',
    },
  ],
};