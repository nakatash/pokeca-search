-- ポケカサーチ データベーススキーマ
-- PostgreSQL用

-- ショップテーブル
CREATE TABLE shops (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  affiliate_program TEXT,
  affiliate_id TEXT,
  shipping_policy JSONB,
  return_policy JSONB,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- セット（シリーズ）テーブル
CREATE TABLE sets (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name_jp TEXT NOT NULL,
  name_en TEXT,
  release_date DATE,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- カードテーブル
CREATE TABLE cards (
  id TEXT PRIMARY KEY,
  set_id TEXT REFERENCES sets(id),
  number TEXT NOT NULL,
  name_jp TEXT NOT NULL,
  name_en TEXT,
  rarity TEXT,
  image_url TEXT,
  release_date DATE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(set_id, number)
);

-- カード価格テーブル
CREATE TABLE card_prices (
  id BIGSERIAL PRIMARY KEY,
  card_id TEXT REFERENCES cards(id),
  shop_id INTEGER REFERENCES shops(id),
  condition TEXT DEFAULT 'NM', -- NM(Near Mint), LP(Lightly Played), MP(Moderately Played), HP(Heavily Played)
  grade_type TEXT, -- PSA, BGS
  grade_value TEXT, -- 10, 9.5, 9, etc
  price_jpy INTEGER NOT NULL,
  shipping_jpy INTEGER DEFAULT 0,
  stock_qty INTEGER DEFAULT 0,
  eta_days INTEGER,
  url TEXT NOT NULL,
  collected_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 価格スナップショットテーブル（時系列集計データ）
CREATE TABLE price_snapshots (
  id BIGSERIAL PRIMARY KEY,
  card_id TEXT REFERENCES cards(id),
  ts TIMESTAMP NOT NULL,
  min_jpy INTEGER,
  median_jpy INTEGER,
  max_jpy INTEGER,
  shop_count INTEGER,
  created_at TIMESTAMP DEFAULT now()
);

-- ユーザーテーブル
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  password_hash TEXT,
  line_uid TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- お気に入りテーブル
CREATE TABLE favorites (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  card_id TEXT REFERENCES cards(id),
  created_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY(user_id, card_id)
);

-- アラートテーブル
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  card_id TEXT REFERENCES cards(id),
  threshold_jpy INTEGER NOT NULL,
  direction TEXT CHECK(direction IN ('up','down')) NOT NULL,
  channel TEXT CHECK(channel IN ('email','line')) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ブログ記事テーブル
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  body TEXT NOT NULL,
  author_id UUID REFERENCES users(id),
  published_at TIMESTAMP,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ランキングテーブル
CREATE TABLE rankings (
  id BIGSERIAL PRIMARY KEY,
  card_id TEXT REFERENCES cards(id),
  type TEXT NOT NULL, -- spike_24h, drop_24h, spike_7d, drop_7d, low_stock
  delta_percent_24h FLOAT,
  delta_percent_7d FLOAT,
  rank INTEGER NOT NULL,
  updated_at TIMESTAMP DEFAULT now()
);

-- インデックス
CREATE INDEX idx_card_prices_card_id ON card_prices(card_id);
CREATE INDEX idx_card_prices_shop_id ON card_prices(shop_id);
CREATE INDEX idx_card_prices_collected_at ON card_prices(collected_at);
CREATE INDEX idx_price_snapshots_card_id ON price_snapshots(card_id);
CREATE INDEX idx_price_snapshots_ts ON price_snapshots(ts);
CREATE INDEX idx_rankings_type_rank ON rankings(type, rank);
CREATE INDEX idx_alerts_user_id_active ON alerts(user_id, is_active);

-- 更新日時自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sets_updated_at BEFORE UPDATE ON sets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_card_prices_updated_at BEFORE UPDATE ON card_prices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();