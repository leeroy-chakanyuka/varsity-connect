import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import { cartKeys } from "./cart";
import { listingKeys } from "./marketplace";
import { orderKeys, type Order } from "./orders";

/* demo till, nothing real ever moves */
export interface Payment {
  id: string;
  amount: number;
  status: "SUCCEEDED" | "FAILED";
  provider: string;
  createdAt: string;
}

export interface PaymentResult {
  id: string;
  amount: number;
  status: Payment["status"];
  provider: string;
  createdAt: string;
  order: Order;
}

export async function payOrder(orderId: string, simulate: "SUCCESS" | "FAILURE"): Promise<PaymentResult> {
  const { data } = await api.post<PaymentResult>(`/orders/${orderId}/payments`, { simulate });
  return data;
}

export function usePayOrder(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (simulate: "SUCCESS" | "FAILURE") => payOrder(orderId, simulate),
    onSuccess: (result) => {
      /* receipt, shelf and basket all changed shape */
      queryClient.setQueryData(orderKeys.detail(orderId), result.order);
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: listingKeys.all });
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}
