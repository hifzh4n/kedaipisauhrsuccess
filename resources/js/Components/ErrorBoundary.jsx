import React from 'react';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo,
        });

        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Error caught by boundary:', error, errorInfo);
        }

        // Log error to server in production
        fetch('/api/v1/errors', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('[name="csrf-token"]')?.content,
            },
            body: JSON.stringify({
                message: error.toString(),
                stack: errorInfo.componentStack,
                timestamp: new Date().toISOString(),
            }),
        }).catch(err => {
            console.error('Failed to log error to server:', err);
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center min-h-screen bg-red-50 dark:bg-red-900/20">
                    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-red-100 dark:bg-red-900 mx-auto">
                            <svg
                                className="h-6 w-6 text-red-600 dark:text-red-200"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4v2m0 4v2M6.228 6.228a9 9 0 010 12.728M18.228 6.228a9 9 0 010 12.728M9 9a3 3 0 016 0"
                                />
                            </svg>
                        </div>

                        <div className="mt-4 text-center">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Something went wrong
                            </h3>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                We're sorry for the inconvenience. Please try refreshing the page or contact support if the problem persists.
                            </p>
                        </div>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 rounded text-xs font-mono text-red-700 dark:text-red-300 overflow-auto max-h-32">
                                <p className="font-bold">Error Details:</p>
                                <p>{this.state.error.toString()}</p>
                                {this.state.errorInfo && (
                                    <>
                                        <p className="font-bold mt-2">Component Stack:</p>
                                        <pre className="whitespace-pre-wrap break-words">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    </>
                                )}
                            </div>
                        )}

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition"
                            >
                                Refresh Page
                            </button>
                            <button
                                onClick={() => window.history.back()}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-medium py-2 px-4 rounded transition"
                            >
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
