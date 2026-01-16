import React, { useState, useCallback } from 'react';
import { VideoUploader } from './components/VideoUploader';
import { SpeakerList } from './components/SpeakerList';
import { TimelineEditor, MOCK_DATA } from './components/TimelineEditor';
import { analyzeVideo } from './services/VideoAnalyzer';
import { VideoAnalysisResult, Segment, AnalysisStatus } from './types';

const App: React.FC = () => {
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<VideoAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setVideoFile(file);
    setStatus(AnalysisStatus.ANALYZING);
    setErrorMsg(null);
    setAnalysisResult(null);

    try {
      // Analyze video using the service
      const result = await analyzeVideo(file);
      setAnalysisResult(result);
      setStatus(AnalysisStatus.COMPLETED);
    } catch (error: any) {
      console.error("Analysis failed:", error);
      setStatus(AnalysisStatus.ERROR);
      setErrorMsg(error.message || "An unknown error occurred during video analysis.");
    }
  };

  // Handler for loading mock data for testing UI without API calls
  const loadMockData = () => {
    setVideoFile(null);
    setAnalysisResult(MOCK_DATA);
    setStatus(AnalysisStatus.COMPLETED);
  };

  const handleSegmentUpdate = useCallback((updatedSegments: Segment[]) => {
    setAnalysisResult((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        segments: updatedSegments,
      };
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg"></div>
            <h1 className="text-xl font-bold tracking-tight">DubStudio AI</h1>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={loadMockData} className="text-xs text-indigo-400 hover:text-indigo-300 underline">
               Load Demo Data
             </button>
             <div className="text-sm text-gray-400">
                Powered by Gemini 3 Pro
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error Notification */}
        {status === AnalysisStatus.ERROR && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-center justify-between">
             <span className="text-red-200">{errorMsg}</span>
             <button 
               onClick={() => setStatus(AnalysisStatus.IDLE)}
               className="text-red-300 hover:text-white"
             >
               Dismiss
             </button>
          </div>
        )}

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          
          {/* Top Section: Analysis / Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 space-y-6">
                {status === AnalysisStatus.IDLE || status === AnalysisStatus.ERROR ? (
                  <VideoUploader 
                    onFileSelect={handleFileSelect} 
                    isLoading={false} 
                  />
                ) : status === AnalysisStatus.ANALYZING ? (
                   <div className="w-full h-64 bg-gray-800 rounded-lg flex flex-col items-center justify-center border border-gray-700 animate-pulse">
                      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-indigo-400 font-medium">Analyzing Video Content...</p>
                      <p className="text-gray-500 text-sm mt-2">Extracting speakers and segments using Gemini 3 Pro</p>
                   </div>
                ) : (
                   <div className="bg-black rounded-lg overflow-hidden shadow-xl aspect-video relative group border border-gray-800 flex items-center justify-center">
                     {videoFile ? (
                       <video 
                         src={URL.createObjectURL(videoFile)} 
                         controls 
                         className="w-full h-full object-contain"
                       />
                     ) : (
                       <div className="text-gray-500 text-sm">Video Preview Unavailable (Mock Data Mode)</div>
                     )}
                   </div>
                )}
             </div>

             <div className="space-y-6">
                {status === AnalysisStatus.COMPLETED && analysisResult ? (
                  <>
                     <div className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Metadata</h3>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-gray-900 p-3 rounded text-center">
                              <p className="text-xs text-gray-500">Language</p>
                              <p className="text-lg font-bold text-white">{analysisResult.metadata.detected_language}</p>
                           </div>
                           <div className="bg-gray-900 p-3 rounded text-center">
                              <p className="text-xs text-gray-500">Duration</p>
                              <p className="text-lg font-bold text-white">{analysisResult.metadata.total_duration.toFixed(1)}s</p>
                           </div>
                        </div>
                     </div>
                     <SpeakerList speakers={analysisResult.speakers} />
                  </>
                ) : (
                  <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 h-full flex items-center justify-center text-gray-500 italic text-sm">
                     Analysis details will appear here.
                  </div>
                )}
             </div>
          </div>

          {/* Bottom Section: Timeline Editor */}
          {status === AnalysisStatus.COMPLETED && analysisResult && (
            <div className="mt-4">
               <TimelineEditor 
                 initialData={analysisResult}
                 onSegmentUpdate={handleSegmentUpdate}
               />
               
               <div className="mt-6 flex justify-end">
                  <button 
                    className="py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
                    onClick={() => alert("Voice cloning phase not implemented in this demo.")}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                    Start Voice Cloning
                  </button>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;