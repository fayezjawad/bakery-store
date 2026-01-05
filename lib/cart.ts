export type CartItem = {
  product_id: number;
  name: string;
  unit_price: number;
  currency: string;
  image_url: string | null;
  qty: number;
};

const CART_KEY = "bakery_cart_v1";
const CART_OWNER_KEY = "bakery_cart_owner_v1";

function isBrowser() {
  return typeof window !== "undefined";
}

function read(): CartItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  if (!isBrowser()) return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart_updated"));
}

export function getCart(): CartItem[] {
  return read();
}

export function cartCount(): number {
  return read().reduce((sum, it) => sum + (it.qty || 0), 0);
}

export function addToCart(input: Omit<CartItem, "qty"> & { qty?: number }) {
  const items = read();
  const idx = items.findIndex((x) => x.product_id === input.product_id);
  const qtyToAdd = input.qty ?? 1;

  if (idx >= 0) {
    items[idx] = { ...items[idx], qty: (items[idx].qty || 0) + qtyToAdd };
  } else {
    items.push({ ...input, qty: qtyToAdd });
  }
  write(items);
}

export function setQty(product_id: number, qty: number) {
  const items = read().map((x) => (x.product_id === product_id ? { ...x, qty } : x));
  const cleaned = items.filter((x) => (x.qty || 0) > 0);
  write(cleaned);
}

export function clearCart() {
  if (!isBrowser()) return;
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event("cart_updated"));
}

/**
 * ✅ اربط السلة بالمستخدم:
 * - لو نفس المستخدم رجع دخل: السلة بتضل.
 * - لو مستخدم مختلف دخل: نمسح السلة تلقائيًا.
 */
export function bindCartToUser(userId: string | null) {
  if (!isBrowser()) return;

  const owner = localStorage.getItem(CART_OWNER_KEY);

  if (!userId) {
    // مش مسجل دخول: لا نمسح السلة
    return;
  }

  if (owner && owner !== userId) {
    // مستخدم مختلف => امسح السلة
    localStorage.removeItem(CART_KEY);
  }

  localStorage.setItem(CART_OWNER_KEY, userId);
  window.dispatchEvent(new Event("cart_updated"));
}
