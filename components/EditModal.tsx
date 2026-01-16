import React, { useState, useEffect } from 'react';
import { X, Save, Volume2, Loader2 } from 'lucide-react';

interface EditModalProps {
  isOpen: boolean;
  initialText: string;
  onClose: () => void;
  onSave: (newText: string) => void;
  onPreview: (text: string) => Promise<string>;
}

export const EditModal: React.FC<EditModalProps> = ({ isOpen, initialText, onClose, onSave, onPreview }) => {
  const [text, setText] = useState(initialText);
  const [isPreviewing, setIsPreviewing] = useState(false);

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  if (!isOpen) return null;

  const handlePreviewClick = async () => {
    if (isPreviewing) return;
    setIsPreviewing(true);
    try {
      const audioUrl = await onPreview(text);
      if (audioUrl && audioUrl !== "mock_audio_url") {
        const audio = new Audio(audioUrl);
        await audio.play();
      } else {
        // Fallback tone if real API is missing in mock mode
        console.log("Mock Audio Played");
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.connect(ctx.destination);
        osc.start();
        setTimeout(() => osc.stop(), 500);
      }
    } catch (error) {
      console.error("Preview failed", error);
      alert("Failed to generate speech preview.");
    } finally {
      setIsPreviewing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-md border border-gray-700 transform transition-all scale-100">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Edit Dubbing Script</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wide">Spoken Text</label>
          <textarea
            className="w-full h-32 bg-gray-900 text-white p-3 rounded border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none text-sm leading-relaxed"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-850 rounded-b-lg border-t border-gray-700">
           <button
             onClick={handlePreviewClick}
             disabled={isPreviewing}
             className="flex items-center gap-2 px-3 py-2 text-indigo-300 hover:text-indigo-100 bg-indigo-900/30 hover:bg-indigo-900/50 rounded-md text-sm font-medium transition-colors border border-indigo-800/50"
           >
             {isPreviewing ? <Loader2 size={16} className="animate-spin" /> : <Volume2 size={16} />}
             Preview Voice
           </button>

           <div className="flex items-center gap-3">
             <button 
               onClick={onClose}
               className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
             >
               Cancel
             </button>
             <button 
               onClick={() => onSave(text)}
               className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
             >
               <Save size={16} />
               Save Changes
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};