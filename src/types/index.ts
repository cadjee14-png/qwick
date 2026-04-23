export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
export type PaymentStatus = 'unpaid' | 'paid_cash' | 'paid_tpe'

export interface Shop {
  id: string
  name: string
  slug: string
  owner_id: string
  is_open: boolean
  logo_url: string | null
  brand_color: string | null
  welcome_message: string | null
  created_at: string
}

export interface Category {
  id: string
  shop_id: string
  name: string
  position: number
  is_visible: boolean
}

export interface Product {
  id: string
  shop_id: string
  category_id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_available: boolean
  position: number
  created_at: string
}

export interface Order {
  id: string
  shop_id: string
  order_number: number
  customer_name: string
  status: OrderStatus
  payment_status: PaymentStatus
  total_amount: number
  notes: string | null
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  unit_price: number
  quantity: number
  item_notes: string | null
}

export interface CartItem {
  product: Product
  quantity: number
  notes: string
}
