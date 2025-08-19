'use client'

import { Component, ReactNode } from 'react'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <span className="text-2xl">⚠️</span>
                エラーが発生しました
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                申し訳ございません。予期しないエラーが発生しました。
              </p>
              {this.state.error && process.env.NODE_ENV === 'development' && (
                <details className="mb-4">
                  <summary className="cursor-pointer text-sm text-gray-500 mb-2">
                    エラー詳細（開発者向け）
                  </summary>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {this.state.error.message}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              <div className="flex gap-2">
                <Button onClick={this.handleRetry} variant="primary">
                  再試行
                </Button>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                >
                  ページを再読み込み
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// エラー表示コンポーネント
interface ErrorDisplayProps {
  title?: string
  message: string
  onRetry?: () => void
  showReload?: boolean
}

export function ErrorDisplay({ 
  title = 'エラーが発生しました', 
  message, 
  onRetry, 
  showReload = true 
}: ErrorDisplayProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <div className="flex items-start gap-3">
        <span className="text-2xl text-red-600">⚠️</span>
        <div className="flex-1">
          <h3 className="font-semibold text-red-800 mb-2">{title}</h3>
          <p className="text-red-700 mb-4">{message}</p>
          <div className="flex gap-2">
            {onRetry && (
              <Button onClick={onRetry} variant="outline" size="sm">
                再試行
              </Button>
            )}
            {showReload && (
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                size="sm"
              >
                ページを再読み込み
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 404エラー専用
export function NotFoundError({ 
  title = 'ページが見つかりません',
  message = 'お探しのページは存在しないか、移動した可能性があります。'
}: { title?: string; message?: string }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-2 justify-center">
          <Button onClick={() => window.history.back()} variant="outline">
            戻る
          </Button>
          <Button onClick={() => window.location.href = '/'} variant="primary">
            ホームへ
          </Button>
        </div>
      </div>
    </div>
  )
}