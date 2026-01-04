export type CartItem = {
  product_id: number;
  name: string;
  unit_price: number;
  currency: string; // USD
  image_url?: string | null;
  qty: number;
};

const GUEST_KEY = "bakery_cart_guest";
const USER_KEY_PREFIX = "bakery_cart_user:";

function safeParse(json: string | null) {
  try {
    return json ? (JSON.parse(json) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function keyFor(userId?: string | null) {
  return userId ? `${USER_KEY_PREFIX}${userId}` : GUEST_KEY;
}

export function getCart(userId?: string | null): CartItem[] {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(keyFor(userId)));
}

export function saveCart(items: CartItem[], userId?: string | null) {
  localStorage.setItem(keyFor(userId), JSON.stringify(items));
  window.dispatchEvent(new Event("cart_updated"));
}

export function addToCart(
  item: Omit<CartItem, "qty">,
  qty = 1,
  userId?: string | null
) {
  const cart = getCart(userId);
  const idx = cart.findIndex((x) => x.product_id === item.product_id);
  if (idx >= 0) cart[idx].qty += qty;
  else cart.push({ ...item, qty });
  saveCart(cart, userId);
}

export function setQty(product_id: number, qty: number, userId?: string | null) {
  const cart = getCart(userId)
    .map((x) => (x.product_id === product_id ? { ...x, qty } : x))
    .filter((x) => x.qty > 0);
  saveCart(cart, userId);
}

export function clearCart(userId?: string | null) {
  saveCart([], userId);
}

export function cartCount(userId?: string | null) {
  return getCart(userId).reduce((sum, x) => sum + x.qty, 0);
}

export function cartTotal(userId?: string | null) {
  return getCart(userId).reduce((sum, x) => sum + x.unit_price * x.qty, 0);
}
