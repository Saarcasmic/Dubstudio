export interface LogEntry {
  timestamp: string;
  level: 'ERROR' | 'INFO' | 'WARN';
  message: string;
  stack?: string;
  context?: any;
}

// In-memory log storage. Resets on every page reload (refresh).
let logStore: LogEntry[] = [];

export const Logger = {
  /**
   * Logs an error to the internal store and console.
   */
  error: (message: string, error?: any, context?: any) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      stack: error?.stack || String(error),
      context
    };
    logStore.push(entry);
    console.error(`[Logger] ${message}`, error);
  },

  /**
   * Logs info to the internal store.
   */
  info: (message: string, context?: any) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      context
    };
    logStore.push(entry);
    console.log(`[Logger] ${message}`, context);
  },

  /**
   * Returns all current logs.
   */
  getLogs: () => logStore,

  /**
   * Generates a Blob and triggers a browser download for the log file.
   */
  downloadLogs: () => {
    const content = logStore.map(entry => {
      return `[${entry.timestamp}] [${entry.level}] ${entry.message}\nStack: ${entry.stack || 'N/A'}\nContext: ${JSON.stringify(entry.context || {}, null, 2)}\n${'-'.repeat(80)}\n`;
    }).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dubstudio_debug_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Clear logs (if needed manually, though they clear on reload).
   */
  clear: () => {
    logStore = [];
  }
};