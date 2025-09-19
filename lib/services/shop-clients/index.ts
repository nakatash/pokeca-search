// ショップクライアント統合エクスポート

export { BaseShopClient } from './base-client'
export { PokemonTCGClient } from './pokemontcg-client'

// 型のエクスポート
export type {
  IShopClient,
  ShopCard,
  SearchParams,
  SearchResult,
  ShopClientError,
  RateLimitError,
} from '@/types/shop-client'

export {
  CardCondition,
  CardLanguage,
  StockStatus,
  SortOption,
} from '@/types/shop-client'

// ショップクライアントファクトリー
import { PokemonTCGClient } from './pokemontcg-client'
import { IShopClient } from '@/types/shop-client'

export enum ShopType {
  POKEMON_TCG = 'pokemontcg',
  // 今後追加予定
  // SURUGAYA = 'surugaya',
  // RAKUMA = 'rakuma',
  // HARERUYA = 'hareruya',
}

export class ShopClientFactory {
  private static clients = new Map<ShopType, IShopClient>()

  static getClient(type: ShopType): IShopClient {
    // キャッシュされたクライアントがあれば返す
    if (this.clients.has(type)) {
      return this.clients.get(type)!
    }

    // 新しいクライアントを作成
    let client: IShopClient

    switch (type) {
      case ShopType.POKEMON_TCG:
        client = new PokemonTCGClient(process.env.POKEMON_TCG_API_KEY)
        break
      default:
        throw new Error(`Unsupported shop type: ${type}`)
    }

    // キャッシュに保存
    this.clients.set(type, client)
    return client
  }

  // すべての利用可能なクライアントを取得
  static getAllClients(): IShopClient[] {
    return Object.values(ShopType).map((type) => this.getClient(type as ShopType))
  }

  // クライアントのリセット（テスト用）
  static reset(): void {
    this.clients.clear()
  }
}