import React, { ChangeEvent } from 'react';

interface VideoUploaderProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({ onFileSelect, isLoading }) => {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <label
        className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors
        ${isLoading ? 'bg-gray-800 border-gray-600 cursor-not-allowed opacity-50' : 'bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-gray-500'}`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <svg className="w-10 h-10 mb-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
          </svg>
          <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload video</span></p>
          <p className="text-xs text-gray-500">MP4, MOV, WebM (Max 50MB for demo)</p>
        </div>
        <input 
          id="dropzone-file" 
          type="file" 
          className="hidden" 
          accept="video/*"
          onChange={handleFileChange}
          disabled={isLoading}
        />
      </label>
    </div>
  );
};