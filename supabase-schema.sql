-- ============================================
-- QWICK — Schéma Supabase complet
-- Coller dans l'éditeur SQL de Supabase
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- TABLE: shops
-- ============================================
create table shops (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  owner_id uuid references auth.users(id) on delete cascade not null,
  is_open boolean default true,
  logo_url text,
  brand_color text default '#000000',
  welcome_message text default 'Bienvenue ! Passez votre commande.',
  created_at timestamptz default now()
);

-- ============================================
-- TABLE: categories
-- ============================================
create table categories (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid references shops(id) on delete cascade not null,
  name text not null,
  position integer default 0,
  is_visible boolean default true
);

-- ============================================
-- TABLE: products
-- ============================================
create table products (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid references shops(id) on delete cascade not null,
  category_id uuid references categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10,2) not null,
  image_url text,
  is_available boolean default true,
  position integer default 0,
  created_at timestamptz default now()
);

-- ============================================
-- TABLE: orders
-- ============================================
create type order_status as enum ('pending', 'preparing', 'ready', 'completed', 'cancelled');
create type payment_status as enum ('unpaid', 'paid_cash', 'paid_tpe');

create table orders (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid references shops(id) on delete cascade not null,
  order_number integer not null,
  customer_name text not null,
  status order_status default 'pending',
  payment_status payment_status default 'unpaid',
  total_amount numeric(10,2) not null default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- TABLE: order_items
-- ============================================
create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade not null,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  unit_price numeric(10,2) not null,
  quantity integer not null check (quantity > 0),
  item_notes text
);

-- ============================================
-- FUNCTION: auto order_number par jour et par shop
-- ============================================
create or replace function set_order_number()
returns trigger as $$
begin
  select coalesce(max(order_number), 0) + 1
  into new.order_number
  from orders
  where shop_id = new.shop_id
    and created_at::date = current_date;
  return new;
end;
$$ language plpgsql;

create trigger trigger_set_order_number
before insert on orders
for each row execute function set_order_number();

-- ============================================
-- FUNCTION: updated_at automatique
-- ============================================
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_orders_updated_at
before update on orders
for each row execute function handle_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table shops enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- SHOPS
create policy "Public can read shops by slug"
  on shops for select using (true);

create policy "Owner can manage their shop"
  on shops for all using (auth.uid() = owner_id);

-- CATEGORIES
create policy "Public can read visible categories"
  on categories for select using (is_visible = true);

create policy "Owner can manage categories"
  on categories for all using (
    exists (select 1 from shops where id = categories.shop_id and owner_id = auth.uid())
  );

-- PRODUCTS
create policy "Public can read available products"
  on products for select using (is_available = true);

create policy "Owner can manage products"
  on products for all using (
    exists (select 1 from shops where id = products.shop_id and owner_id = auth.uid())
  );

-- ORDERS: le client peut créer, le gérant peut tout voir/modifier
create policy "Anyone can create an order"
  on orders for insert with check (true);

create policy "Owner can read and update orders"
  on orders for select using (
    exists (select 1 from shops where id = orders.shop_id and owner_id = auth.uid())
  );

create policy "Owner can update orders"
  on orders for update using (
    exists (select 1 from shops where id = orders.shop_id and owner_id = auth.uid())
  );

-- ORDER_ITEMS
create policy "Anyone can insert order items"
  on order_items for insert with check (true);

create policy "Owner can read order items"
  on order_items for select using (
    exists (
      select 1 from orders o
      join shops s on s.id = o.shop_id
      where o.id = order_items.order_id and s.owner_id = auth.uid()
    )
  );

-- ============================================
-- REALTIME: activer les tables nécessaires
-- ============================================
alter publication supabase_realtime add table orders;

-- ============================================
-- SEED: données de démo
-- ============================================
-- À exécuter APRÈS avoir créé un compte gérant dans Supabase Auth
-- Remplace 'VOTRE_USER_ID' par l'UUID de ton compte

/*
insert into shops (name, slug, owner_id, welcome_message) values
  ('Snack Chez Mario', 'snack-chez-mario', 'VOTRE_USER_ID', 'Bienvenue chez Mario ! 🍔');

insert into categories (shop_id, name, position) values
  ((select id from shops where slug = 'snack-chez-mario'), 'Burgers', 1),
  ((select id from shops where slug = 'snack-chez-mario'), 'Boissons', 2),
  ((select id from shops where slug = 'snack-chez-mario'), 'Desserts', 3);

insert into products (shop_id, category_id, name, description, price, position) values
  ((select id from shops where slug = 'snack-chez-mario'),
   (select id from categories where name = 'Burgers' and shop_id = (select id from shops where slug = 'snack-chez-mario')),
   'Classic Burger', 'Steak haché, cheddar, salade, tomate', 8.50, 1),
  ((select id from shops where slug = 'snack-chez-mario'),
   (select id from categories where name = 'Burgers' and shop_id = (select id from shops where slug = 'snack-chez-mario')),
   'Chicken Burger', 'Poulet croustillant, mayo maison', 9.00, 2),
  ((select id from shops where slug = 'snack-chez-mario'),
   (select id from categories where name = 'Boissons' and shop_id = (select id from shops where slug = 'snack-chez-mario')),
   'Coca-Cola', '33cl', 2.50, 1),
  ((select id from shops where slug = 'snack-chez-mario'),
   (select id from categories where name = 'Boissons' and shop_id = (select id from shops where slug = 'snack-chez-mario')),
   'Eau minérale', '50cl', 1.50, 2);
*/
