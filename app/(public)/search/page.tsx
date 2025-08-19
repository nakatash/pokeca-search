'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SearchBar } from '@/components/search/search-bar'
import { CardTile } from '@/components/cards/card-tile'
import { Card } from '@/types/database'

interface SearchResponse {
  cards: (Card & { 最低価格?: number; 在庫数?: number })[]
  totalCount: number
  limit: number
  offset: number
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (query) {
      searchCards(query)
    }
  }, [query])

  const searchCards = async (searchQuery: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/cards?query=${encodeURIComponent(searchQuery)}`)
      if (!response.ok) {
        throw new Error('検索に失敗しました')
      }
      const data: SearchResponse = await response.json()
      
      // モックデータに価格と在庫を追加（実際はAPIから取得）
      const cardsWithPrices = data.cards.map(card => ({
        ...card,
        最低価格: Math.floor(Math.random() * 10000) + 100,
        在庫数: Math.floor(Math.random() * 20) + 1,
      }))
      
      setResults({
        ...data,
        cards: cardsWithPrices,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '検索エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 検索ヘッダー */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <SearchBar defaultValue={query} placeholder="カード名・型番で検索" />
          </div>
        </div>
      </section>

      {/* 検索結果 */}
      <section className="container mx-auto px-4 py-8">
        {query && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold">
              「{query}」の検索結果
              {results && (
                <span className="text-gray-600 text-lg ml-2">
                  ({results.totalCount}件)
                </span>
              )}
            </h1>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pokeca-primary mx-auto mb-4"></div>
              <p className="text-gray-600">検索中...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {results && results.cards.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {results.cards.map((card) => (
              <CardTile key={card.id} card={card} />
            ))}
          </div>
        )}

        {results && results.cards.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              「{query}」に一致するカードが見つかりませんでした
            </p>
            <p className="text-sm text-gray-500">
              別のキーワードで検索してみてください
            </p>
          </div>
        )}

        {!query && (
          <div className="text-center py-12">
            <p className="text-gray-600">
              カード名や型番を入力して検索してください
            </p>
          </div>
        )}
      </section>
    </main>
  )
}