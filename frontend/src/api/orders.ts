import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import { cartKeys } from "./cart";
import { listingKeys } from "./marketplace";
import type { PageResponse } from "../types/page";

/* mirrors the backend order DTOs, snapshots frozen at checkout */
export type DeliveryMethod = "CAMPUS_COLLECTION" | "SELLER_ARRANGEMENT";
export type PaymentMethod = "MOCK_CARD" | "CASH_ON_COLLECTION";
export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "READY_FOR_COLLECTION"
  | "COMPLETED"
  | "CANCELLED"
  | "PAYMENT_FAILED";

export interface OrderItem {
  id: string;
  listingId: string;
  title: string;
  unitPrice: number;
  sellerId: string;
  sellerName: string;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  subtotal: number;
  total: number;
  status: OrderStatus;
  paidAt: string | null;
  completedAt: string | null;
  createdAt: string;
  items: OrderItem[];
}

export const orderKeys = {
  all: ["orders"] as const,
  list: ["orders", "list"] as const,
  detail: (id: string) => ["orders", "detail", id] as const,
};

export async function checkout(deliveryMethod: DeliveryMethod, paymentMethod: PaymentMethod): Promise<Order> {
  const { data } = await api.post<Order>("/orders", { deliveryMethod, paymentMethod });
  return data;
}

export async function fetchOrders(): Promise<PageResponse<Order>> {
  const { data } = await api.get<PageResponse<Order>>("/orders");
  return data;
}

export async function fetchOrder(id: string): Promise<Order> {
  const { data } = await api.get<Order>(`/orders/${id}`);
  return data;
}

export async function markOrderReady(id: string): Promise<Order> {
  const { data } = await api.post<Order>(`/orders/${id}/ready`);
  return data;
}

export async function completeOrder(id: string): Promise<Order> {
  const { data } = await api.post<Order>(`/orders/${id}/complete`);
  return data;
}

export async function cancelOrder(id: string): Promise<Order> {
  const { data } = await api.post<Order>(`/orders/${id}/cancel`);
  return data;
}

export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ deliveryMethod, paymentMethod }: { deliveryMethod: DeliveryMethod; paymentMethod: PaymentMethod }) =>
      checkout(deliveryMethod, paymentMethod),
    onSuccess: () => {
      /* listings flipped to reserved, basket stays until payment settles */
      queryClient.invalidateQueries({ queryKey: listingKeys.all });
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

export function useOrders() {
  return useQuery({
    queryKey: orderKeys.list,
    queryFn: fetchOrders,
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: orderKeys.detail(id ?? ""),
    queryFn: () => fetchOrder(id ?? ""),
    enabled: !!id,
    retry: false,
  });
}

export function useMarkOrderReady(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markOrderReady(id),
    onSuccess: (order) => {
      queryClient.setQueryData(orderKeys.detail(id), order);
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

export function useCompleteOrder(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => completeOrder(id),
    onSuccess: (order) => {
      queryClient.setQueryData(orderKeys.detail(id), order);
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

export function useCancelOrder(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cancelOrder(id),
    onSuccess: (order) => {
      /* cancelled stock returns, the shelf and receipt both move */
      queryClient.setQueryData(orderKeys.detail(id), order);
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: listingKeys.all });
    },
  });
}
