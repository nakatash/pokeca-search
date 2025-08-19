#!/usr/bin/env tsx

import { db, testConnection } from '@/lib/db/client'

// シードデータ
const seedData = {
  shops: [
    {
      name: '晴れる屋',
      url: 'https://www.hareruyamtg.com',
      is_verified: true,
      affiliate_program: 'hareruyamtg',
      affiliate_id: 'pokeca-search',
      shipping_policy: { free_over: 3000, base_fee: 200 },
      return_policy: { days: 7, condition: '未開封のみ' }
    },
    {
      name: '駿河屋',
      url: 'https://www.suruga-ya.jp',
      is_verified: true,
      affiliate_program: 'surugaya',
      affiliate_id: 'pokeca-search-01',
      shipping_policy: { free_over: 1500, base_fee: 0 },
      return_policy: { days: 14, condition: '不良品のみ' }
    },
    {
      name: 'カードラッシュ',
      url: 'https://www.cardrush-pokemon.jp',
      is_verified: true,
      affiliate_program: 'cardrush',
      affiliate_id: 'pokeca001',
      shipping_policy: { free_over: 2000, base_fee: 300 },
      return_policy: { days: 7, condition: '未開封のみ' }
    }
  ],
  
  sets: [
    {
      id: 'sv4a',
      code: 'SV4a',
      name_jp: 'シャイニートレジャーex',
      name_en: 'Shiny Treasure ex',
      release_date: '2023-10-27',
      image_url: 'https://images.pokemontcg.io/sv4a/logo.png'
    },
    {
      id: 'sv3a',
      code: 'SV3a',
      name_jp: 'レイジングサーフ',
      name_en: 'Raging Surf',
      release_date: '2023-09-22',
      image_url: 'https://images.pokemontcg.io/sv3a/logo.png'
    }
  ],

  cards: [
    {
      id: 'sv4a-205',
      set_id: 'sv4a',
      number: '205',
      name_jp: 'リザードンex',
      name_en: 'Charizard ex',
      rarity: 'RR',
      image_url: 'https://images.pokemontcg.io/sv4a/205.png',
      release_date: '2023-10-27'
    },
    {
      id: 'sv4a-190',
      set_id: 'sv4a',
      number: '190',
      name_jp: 'ミュウex',
      name_en: 'Mew ex',
      rarity: 'RR',
      image_url: 'https://images.pokemontcg.io/sv4a/190.png',
      release_date: '2023-10-27'
    },
    {
      id: 'sv4a-025',
      set_id: 'sv4a',
      number: '025',
      name_jp: 'ピカチュウ',
      name_en: 'Pikachu',
      rarity: 'C',
      image_url: 'https://images.pokemontcg.io/sv4a/25.png',
      release_date: '2023-10-27'
    },
    {
      id: 'sv3a-158',
      set_id: 'sv3a',
      number: '158',
      name_jp: 'ガブリアスex',
      name_en: 'Garchomp ex',
      rarity: 'RR',
      image_url: 'https://images.pokemontcg.io/sv3a/158.png',
      release_date: '2023-09-22'
    },
    {
      id: 'sv3a-123',
      set_id: 'sv3a',
      number: '123',
      name_jp: 'ルギアVSTAR',
      name_en: 'Lugia VSTAR',
      rarity: 'RRR',
      image_url: 'https://images.pokemontcg.io/sv3a/123.png',
      release_date: '2023-09-22'
    }
  ]
}

// カード価格のサンプルデータを生成
function generateCardPrices() {
  const prices = []
  const cards = seedData.cards
  const shops = [1, 2, 3] // shop_id

  for (const card of cards) {
    for (const shopId of shops) {
      // 各ショップでランダムな価格を生成
      const basePrice = Math.floor(Math.random() * 15000) + 500
      const shippingPrice = shopId === 2 ? 0 : Math.floor(Math.random() * 500) + 100 // 駿河屋は送料無料
      
      prices.push({
        card_id: card.id,
        shop_id: shopId,
        condition: 'NM',
        price_jpy: basePrice,
        shipping_jpy: shippingPrice,
        stock_qty: Math.floor(Math.random() * 20) + 1,
        eta_days: Math.floor(Math.random() * 7) + 1,
        url: `https://example.com/shop${shopId}/${card.id}`,
        collected_at: new Date().toISOString()
      })
    }
  }
  
  return prices
}

// 価格スナップショットのサンプルデータを生成
function generatePriceSnapshots() {
  const snapshots = []
  const cards = seedData.cards

  for (const card of cards) {
    // 過去7日分のデータを生成
    for (let i = 7; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      const baseMin = Math.floor(Math.random() * 10000) + 500
      const baseMax = baseMin + Math.floor(Math.random() * 5000) + 1000
      const baseMedian = Math.floor((baseMin + baseMax) / 2)
      
      snapshots.push({
        card_id: card.id,
        ts: date.toISOString(),
        min_jpy: baseMin,
        median_jpy: baseMedian,
        max_jpy: baseMax,
        shop_count: 3
      })
    }
  }
  
  return snapshots
}

async function seedDatabase() {
  console.log('🌱 データベースにシードデータを投入します...')

  // 接続テスト
  const isConnected = await testConnection()
  if (!isConnected) {
    console.error('❌ データベースに接続できません')
    process.exit(1)
  }

  try {
    // ショップデータ投入
    console.log('🏪 ショップデータを投入中...')
    for (const shop of seedData.shops) {
      await db`
        INSERT INTO shops (name, url, is_verified, affiliate_program, affiliate_id, shipping_policy, return_policy)
        VALUES (${shop.name}, ${shop.url}, ${shop.is_verified}, ${shop.affiliate_program}, 
                ${shop.affiliate_id}, ${JSON.stringify(shop.shipping_policy)}, ${JSON.stringify(shop.return_policy)})
        ON CONFLICT (name) DO NOTHING
      `
    }
    console.log(`✅ ${seedData.shops.length}件のショップを投入しました`)

    // セットデータ投入
    console.log('📦 セットデータを投入中...')
    for (const set of seedData.sets) {
      await db`
        INSERT INTO sets (id, code, name_jp, name_en, release_date, image_url)
        VALUES (${set.id}, ${set.code}, ${set.name_jp}, ${set.name_en}, ${set.release_date}, ${set.image_url})
        ON CONFLICT (id) DO NOTHING
      `
    }
    console.log(`✅ ${seedData.sets.length}件のセットを投入しました`)

    // カードデータ投入
    console.log('🎴 カードデータを投入中...')
    for (const card of seedData.cards) {
      await db`
        INSERT INTO cards (id, set_id, number, name_jp, name_en, rarity, image_url, release_date)
        VALUES (${card.id}, ${card.set_id}, ${card.number}, ${card.name_jp}, ${card.name_en}, 
                ${card.rarity}, ${card.image_url}, ${card.release_date})
        ON CONFLICT (id) DO NOTHING
      `
    }
    console.log(`✅ ${seedData.cards.length}件のカードを投入しました`)

    // 価格データ投入
    console.log('💰 価格データを投入中...')
    const prices = generateCardPrices()
    for (const price of prices) {
      await db`
        INSERT INTO card_prices (card_id, shop_id, condition, price_jpy, shipping_jpy, 
                                stock_qty, eta_days, url, collected_at)
        VALUES (${price.card_id}, ${price.shop_id}, ${price.condition}, ${price.price_jpy}, 
                ${price.shipping_jpy}, ${price.stock_qty}, ${price.eta_days}, ${price.url}, ${price.collected_at})
        ON CONFLICT (card_id, shop_id, condition) DO UPDATE SET
          price_jpy = EXCLUDED.price_jpy,
          shipping_jpy = EXCLUDED.shipping_jpy,
          stock_qty = EXCLUDED.stock_qty,
          updated_at = NOW()
      `
    }
    console.log(`✅ ${prices.length}件の価格データを投入しました`)

    // スナップショットデータ投入
    console.log('📊 価格スナップショットを投入中...')
    const snapshots = generatePriceSnapshots()
    for (const snapshot of snapshots) {
      await db`
        INSERT INTO price_snapshots (card_id, ts, min_jpy, median_jpy, max_jpy, shop_count)
        VALUES (${snapshot.card_id}, ${snapshot.ts}, ${snapshot.min_jpy}, 
                ${snapshot.median_jpy}, ${snapshot.max_jpy}, ${snapshot.shop_count})
        ON CONFLICT (card_id, ts) DO NOTHING
      `
    }
    console.log(`✅ ${snapshots.length}件のスナップショットを投入しました`)

    console.log('✅ シードデータの投入が完了しました!')
  } catch (error) {
    console.error('❌ シードデータ投入中にエラーが発生しました:', error)
    process.exit(1)
  }
}

// スクリプトが直接実行された場合
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🎉 シードデータの投入が完了しました!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 シードデータ投入が失敗しました:', error)
      process.exit(1)
    })
}

export { seedDatabase }