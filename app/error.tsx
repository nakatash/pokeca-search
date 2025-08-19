'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('グローバルエラー:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <span className="text-2xl">⚠️</span>
                システムエラー
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                申し訳ございません。システムで予期しないエラーが発生しました。
              </p>
              {error.digest && (
                <p className="text-sm text-gray-500 mb-4">
                  エラーID: {error.digest}
                </p>
              )}
              {process.env.NODE_ENV === 'development' && (
                <details className="mb-4">
                  <summary className="cursor-pointer text-sm text-gray-500 mb-2">
                    エラー詳細（開発者向け）
                  </summary>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto whitespace-pre-wrap">
                    {error.message}
                    {error.stack}
                  </pre>
                </details>
              )}
              <div className="flex gap-2">
                <Button onClick={reset} variant="primary">
                  再試行
                </Button>
                <Button 
                  onClick={() => window.location.href = '/'} 
                  variant="outline"
                >
                  ホームへ
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  )
}