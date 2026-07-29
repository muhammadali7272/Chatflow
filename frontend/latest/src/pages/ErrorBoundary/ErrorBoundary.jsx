import { Component } from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-animated flex items-center justify-center p-4 relative overflow-hidden">
          <div className="absolute top-20 left-20 w-64 h-64 bg-[var(--c-danger)]/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-1.5s' }} />

          <div className="glass-card rounded-2xl max-w-md w-full p-8 relative z-10 animate-scale-in">
            <div className="text-center">
              <div className="w-20 h-20 bg-[var(--c-danger)]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[var(--c-danger)]/20">
                <FiAlertTriangle className="text-4xl text-[var(--c-danger-text)]" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--c-text)] mb-2">Something went wrong</h2>
              <p className="text-[var(--c-text-muted)] mb-6">
                An unexpected error occurred. Please try again.
              </p>
              {this.state.error && (
                <div className="bg-[var(--c-surface-2)]/80 rounded-xl p-4 mb-6 text-left border border-[var(--c-border)]">
                  <p className="text-sm font-mono text-[var(--c-danger-text)] break-all">
                    {this.state.error.message || 'Unknown error'}
                  </p>
                </div>
              )}
              <button
                onClick={this.handleReset}
                className="w-full py-3.5 bg-gradient-to-r from-[var(--c-primary)] to-[var(--c-primary-hover)] hover:brightness-110 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-[var(--c-primary)]/20 hover:shadow-[var(--c-primary)]/40 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <FiRefreshCw size={16} />
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
