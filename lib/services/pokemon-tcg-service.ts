import { TCGCard, TCGAPIResponse, TCGSearchParams } from '@/types/pokemon-tcg-api'
import { ServerError } from '@/lib/utils/error'

const BASE_URL = 'https://api.pokemontcg.io/v2'
const DEFAULT_PAGE_SIZE = 12

export class PokemonTCGService {
  private apiKey?: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (this.apiKey) {
      headers['X-Api-Key'] = this.apiKey
    }
    
    return headers
  }

  private async fetchAPI<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: this.getHeaders(),
        next: { revalidate: 3600 } // 1時間キャッシュ
      })

      if (!response.ok) {
        throw new ServerError(`Pokemon TCG API error: ${response.status} ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      if (error instanceof ServerError) {
        throw error
      }
      throw new ServerError('Pokemon TCG APIへの接続に失敗しました')
    }
  }

  /**
   * カードを検索
   */
  async searchCards(params: TCGSearchParams = {}): Promise<TCGAPIResponse<TCGCard>> {
    const searchParams = new URLSearchParams()
    
    if (params.q) searchParams.set('q', params.q)
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString())
    if (params.orderBy) searchParams.set('orderBy', params.orderBy)
    if (params.select) searchParams.set('select', params.select)

    // デフォルトページサイズ
    if (!params.pageSize) {
      searchParams.set('pageSize', DEFAULT_PAGE_SIZE.toString())
    }

    const endpoint = `/cards?${searchParams.toString()}`
    return this.fetchAPI<TCGAPIResponse<TCGCard>>(endpoint)
  }

  /**
   * カード名で検索
   */
  async searchCardsByName(name: string, page = 1): Promise<TCGAPIResponse<TCGCard>> {
    return this.searchCards({
      q: `name:${name}`,
      page,
      pageSize: DEFAULT_PAGE_SIZE,
      orderBy: 'set.releaseDate'
    })
  }

  /**
   * セットIDとナンバーで検索
   */
  async getCardBySetAndNumber(setId: string, number: string): Promise<TCGCard | null> {
    const response = await this.searchCards({
      q: `set.id:${setId} number:${number}`,
      pageSize: 1
    })
    
    return response.data.length > 0 ? response.data[0] : null
  }

  /**
   * カードIDで取得
   */
  async getCardById(id: string): Promise<TCGCard> {
    const endpoint = `/cards/${id}`
    const response = await this.fetchAPI<{ data: TCGCard }>(endpoint)
    return response.data
  }

  /**
   * 人気のカードを取得（価格の高い順）
   */
  async getPopularCards(limit = 20): Promise<TCGCard[]> {
    const response = await this.searchCards({
      q: 'tcgplayer.prices.market:[10 TO *]', // 価格が$10以上
      pageSize: limit,
      orderBy: '-tcgplayer.prices.market'
    })
    
    return response.data
  }

  /**
   * 特定のポケモンのカード一覧
   */
  async getCardsByPokemon(pokemonName: string, page = 1): Promise<TCGAPIResponse<TCGCard>> {
    return this.searchCards({
      q: `name:${pokemonName} supertype:Pokémon`,
      page,
      pageSize: DEFAULT_PAGE_SIZE,
      orderBy: 'set.releaseDate'
    })
  }

  /**
   * 最新のカード（発売日順）
   */
  async getLatestCards(limit = 20): Promise<TCGCard[]> {
    const response = await this.searchCards({
      pageSize: limit,
      orderBy: '-set.releaseDate'
    })
    
    return response.data
  }
}

// シングルトンインスタンス
export const pokemonTCGService = new PokemonTCGService(process.env.POKEMON_TCG_API_KEY)