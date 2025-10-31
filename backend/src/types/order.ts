import type { Request } from 'express'

export interface OrderItem {
  productId: number
  qty: number
  price: number
  title: string
}

export interface Customer {
  phone?: string
  name?: string
  email?: string
}

export interface CreateOrderRequest extends Request {
  body: {
    items: OrderItem[]
    total: number
    customer?: Customer
  }
}

export interface Order {
  id: number
  reference: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  total: number
  currency: string
  customer_phone?: string
  created_at: Date
  updated_at: Date
  items: OrderItem[]
}