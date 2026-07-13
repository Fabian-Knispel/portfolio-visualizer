import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error !== null) {
      return (
        <div className="empty-state" role="alert" style={{ margin: '22px', padding: '24px' }}>
          <h2 style={{ marginBottom: '8px' }}>Etwas ist schiefgelaufen</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
            Beim Rendern ist ein Fehler aufgetreten. Die Anwendung wurde angehalten.
          </p>
          <details style={{ marginBottom: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <summary style={{ cursor: 'pointer' }}>Fehlerdetails</summary>
            <pre style={{ marginTop: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {this.state.error.message}
            </pre>
          </details>
          <button className="button button--primary" onClick={this.handleReset} type="button">
            Erneut versuchen
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
