import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught: ", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-lg w-full rounded-2xl bg-white/70 backdrop-blur-md border border-white/30 p-6 shadow">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-slate-700 text-sm mb-4">The page encountered an error. You can try reloading the page.</p>
            <pre className="text-xs text-red-600 whitespace-pre-wrap bg-red-50 border border-red-200 rounded p-3 overflow-auto max-h-40">{String(this.state.error)}</pre>
            <div className="mt-4">
              <button onClick={() => window.location.reload()} className="px-3 py-2 text-sm rounded bg-slate-900 text-white hover:bg-slate-800">Reload</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
