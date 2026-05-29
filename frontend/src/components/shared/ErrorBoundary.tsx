import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/dashboard';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center min-h-[400px] p-6">
                    <Card className="max-w-md w-full border-destructive/50">
                        <CardHeader className="text-destructive flex flex-row items-center gap-2">
                            <AlertCircle className="h-6 w-6" />
                            <CardTitle>Something went wrong</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                An unexpected error occurred in this part of the application.
                                Common causes include network timeouts or unexpected data formats.
                            </p>
                            {this.state.error && (
                                <pre className="bg-muted p-3 rounded text-[10px] overflow-auto max-h-[100px] font-mono">
                                    {this.state.error.message}
                                </pre>
                            )}
                            <Button
                                onClick={this.handleReset}
                                variant="outline"
                                className="w-full gap-2"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Return to Dashboard
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
