import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

interface EditModalProps {
  isOpen: boolean;
  initialText: string;
  onClose: () => void;
  onSave: (newText: string) => void;
}

export const EditModal: React.FC<EditModalProps> = ({ isOpen, initialText, onClose, onSave }) => {
  const [text, setText] = useState(initialText);

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  if (!isOpen) return null;

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

        <div className="flex items-center justify-end gap-3 p-4 bg-gray-850 rounded-b-lg border-t border-gray-700">
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
  );
};