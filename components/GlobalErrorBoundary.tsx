import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Logger } from '../utils/logger';
import { AlertTriangle, Download, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to our custom logger
    Logger.error('React Component Crashed', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 text-center text-white font-sans">
          <div className="bg-gray-900 border border-red-800/50 p-8 rounded-xl shadow-2xl max-w-lg w-full">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-red-900/20 rounded-full">
                <AlertTriangle size={48} className="text-red-500" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-gray-400 mb-6 text-sm">
              The application encountered a critical error and could not render.
            </p>

            <div className="bg-black/50 p-4 rounded-md mb-6 text-left overflow-auto max-h-40 border border-gray-800">
              <code className="text-red-400 text-xs font-mono break-all">
                {this.state.error?.toString()}
              </code>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
              >
                <RefreshCcw size={16} />
                Reload App
              </button>
              
              <button
                onClick={() => Logger.downloadLogs()}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Download size={16} />
                Download Error Logs
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}