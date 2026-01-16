import React from 'react';
import { Speaker } from '../types';

interface SpeakerListProps {
  speakers: Speaker[];
}

export const SpeakerList: React.FC<SpeakerListProps> = ({ speakers }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-md h-full overflow-y-auto">
      <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">Identified Speakers</h3>
      <div className="space-y-4">
        {speakers.map((speaker) => (
          <div key={speaker.id} className="flex items-start space-x-3 p-3 bg-gray-700 rounded-md">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {speaker.id.split('_')[1] || 'S'}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{speaker.name}</p>
              <p className="text-xs text-gray-400 mt-1 italic">{speaker.voice_tone}</p>
            </div>
          </div>
        ))}
        {speakers.length === 0 && (
          <p className="text-gray-500 text-sm italic">No speakers detected yet.</p>
        )}
      </div>
    </div>
  );
};