CREATE TABLE IF NOT EXISTS tbl_store_settings (
  id SERIAL PRIMARY KEY,
  store_name VARCHAR(100) NOT NULL DEFAULT 'Foodie.',
  tagline VARCHAR(200) NOT NULL DEFAULT 'Hot meals, right at your door',
  hero_image_url TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
  default_address TEXT NOT NULL DEFAULT 'San Francisco, CA • 25-35 min delivery',
  primary_color VARCHAR(10) NOT NULL DEFAULT '#2E7D32',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);