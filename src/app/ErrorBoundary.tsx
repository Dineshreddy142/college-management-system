import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          padding: '24px',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '680px',
            width: '100%',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '28px' }}>⚠️</span>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#ef4444' }}>
                Application Runtime Error
              </h2>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
              A React rendering error occurred. See details below to diagnose the issue:
            </p>
            <div style={{
              backgroundColor: '#0f172a',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontFamily: 'monospace',
              color: '#fca5a5',
              overflowX: 'auto',
              marginBottom: '20px',
              border: '1px solid #ef444433'
            }}>
              {this.state.error?.toString()}
            </div>
            {this.state.errorInfo && (
              <pre style={{
                backgroundColor: '#0f172a',
                padding: '16px',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#64748b',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {this.state.errorInfo.componentStack}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '16px',
                padding: '10px 20px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
