type OrderItem = {
  productId: number | null
  quantity: number
  price: number
}

type InMemoryOrder = {
  reference: string
  orderId?: number | null
  status: string
  total: number
  currency: string
  customer_phone?: string | null
  items: OrderItem[]
  created_at: string
}

const store = new Map<string, InMemoryOrder>()
let seq = 1

export function saveOrderInMemory(payload: {
  reference: string
  total: number
  currency?: string
  customer_phone?: string | null
  items: Array<{ productId?: number; qty?: number; price?: number; id?: number; title?: string }>
}) {
  const id = seq++
  const order: InMemoryOrder = {
    reference: payload.reference,
    orderId: id,
    status: 'pending',
    total: payload.total,
    currency: payload.currency || 'USD',
    customer_phone: payload.customer_phone || null,
    items: payload.items.map(i => ({ productId: i.productId ?? i.id ?? null, quantity: i.qty ?? 1, price: i.price ?? 0 })),
    created_at: new Date().toISOString()
  }
  store.set(payload.reference, order)
  return order
}

export function getOrderInMemory(reference: string) {
  return store.get(reference) || null
}

export function clearInMemoryOrders() {
  store.clear()
}

export function listInMemoryOrders() {
  return Array.from(store.values())
}
