import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import { useAuth } from "../auth/AuthContext";

/* mirrors the backend basket DTOs, totals always arrive server-made */
export interface CartItem {
  id: string;
  listingId: string;
  title: string;
  sellerName: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  lineTotal: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
}

export const cartKeys = {
  all: ["cart"] as const,
  detail: ["cart", "detail"] as const,
};

export async function fetchCart(): Promise<Cart> {
  const { data } = await api.get<Cart>("/cart");
  return data;
}

export async function addToCart(listingId: string): Promise<Cart> {
  const { data } = await api.post<Cart>("/cart/items", { listingId });
  return data;
}

export async function updateCartItem(itemId: string, quantity: number): Promise<Cart> {
  const { data } = await api.patch<Cart>(`/cart/items/${itemId}`, { quantity });
  return data;
}

export async function removeCartItem(itemId: string): Promise<Cart> {
  const { data } = await api.delete<Cart>(`/cart/items/${itemId}`);
  return data;
}

export async function clearCart(): Promise<Cart> {
  const { data } = await api.delete<Cart>("/cart");
  return data;
}

/* basket only exists for sessions, strangers get no query */
export function useCart() {
  const { token } = useAuth();
  return useQuery({
    queryKey: cartKeys.detail,
    queryFn: fetchCart,
    enabled: !!token,
  });
}

function useInvalidateCart() {
  const queryClient = useQueryClient();
  return {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  };
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addToCart,
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKeys.detail, cart);
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

export function useUpdateCartItem() {
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      updateCartItem(itemId, quantity),
    ...useInvalidateCart(),
  });
}

export function useRemoveCartItem() {
  return useMutation({
    mutationFn: removeCartItem,
    ...useInvalidateCart(),
  });
}

export function useClearCart() {
  return useMutation({
    mutationFn: clearCart,
    ...useInvalidateCart(),
  });
}
