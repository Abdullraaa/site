"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveOrderInMemory = saveOrderInMemory;
exports.getOrderInMemory = getOrderInMemory;
exports.clearInMemoryOrders = clearInMemoryOrders;
exports.listInMemoryOrders = listInMemoryOrders;
const store = new Map();
let seq = 1;
function saveOrderInMemory(payload) {
    const id = seq++;
    const order = {
        reference: payload.reference,
        orderId: id,
        status: 'pending',
        total: payload.total,
        currency: payload.currency || 'USD',
        customer_phone: payload.customer_phone || null,
        items: payload.items.map(i => ({ productId: i.productId ?? i.id ?? null, quantity: i.qty ?? 1, price: i.price ?? 0 })),
        created_at: new Date().toISOString()
    };
    store.set(payload.reference, order);
    return order;
}
function getOrderInMemory(reference) {
    return store.get(reference) || null;
}
function clearInMemoryOrders() {
    store.clear();
}
function listInMemoryOrders() {
    return Array.from(store.values());
}
