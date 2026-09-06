import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

const HISTORY_KEY = 'sticker_maker_history_v2';

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public props: Props;

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const summary = error?.message ? error.message.split('\n')[0] : 'unknown';
    console.warn('[ErrorBoundary]', summary);
  }

  private handleReset = (): void => {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // ignore storage failures; reload still resets in-memory state
    }
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-red-100 max-w-md w-full text-center">
            <h2 className="text-xl font-bold text-red-600 mb-2">應用程式發生錯誤</h2>
            <p className="text-sm text-gray-600 mb-4">
              請重新整理頁面或重設並回到首頁。
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                重新整理
              </button>
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition-colors"
              >
                重設並回到首頁
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
