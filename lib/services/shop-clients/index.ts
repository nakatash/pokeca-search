// ショップクライアント統合エクスポート

export { BaseShopClient } from './base-client'
export { PokemonTCGClient } from './pokemontcg-client'
export { CardRushClient } from './cardrush-client'
export { Hareruya2Client } from './hareruya2-client'
export { CardLaboClient } from './cardlabo-client'

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
import { CardRushClient } from './cardrush-client'
import { Hareruya2Client } from './hareruya2-client'
import { CardLaboClient } from './cardlabo-client'
import { IShopClient } from '@/types/shop-client'

export enum ShopType {
  POKEMON_TCG = 'pokemontcg',
  CARDRUSH = 'cardrush',
  HARERUYA2 = 'hareruya2',
  CARDLABO = 'cardlabo',
  // 今後追加予定
  // SURUGAYA = 'surugaya',
  // RAKUMA = 'rakuma',
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
      case ShopType.CARDRUSH:
        client = new CardRushClient()
        break
      case ShopType.HARERUYA2:
        client = new Hareruya2Client()
        break
      case ShopType.CARDLABO:
        client = new CardLaboClient()
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