import React, { Component, type ReactNode } from 'react';

interface Props {
  name?: string;
  fallbackTitle?: string;
  onReset?: () => void;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.name || 'Component'}] Caught error:`, error, errorInfo);
  }

  handleRecover = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 m-2 bg-red-950/80 border border-red-700 rounded-xl text-red-100 flex flex-col gap-3 shadow-xl">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <div className="font-bold text-sm">
              {this.props.fallbackTitle || `Đã xảy ra sự cố trong khu vực: ${this.props.name || 'Giao diện'}`}
            </div>
          </div>
          <p className="text-xs text-red-300 font-mono bg-black/40 p-2 rounded border border-red-900/60 break-words">
            {this.state.error?.message || 'Lỗi không xác định.'}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={this.handleRecover}
              className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition shadow min-h-[40px] flex items-center gap-1.5 cursor-pointer"
            >
              <span>↺</span> Khôi phục giao diện
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
