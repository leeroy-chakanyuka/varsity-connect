package com.varsityconnect.payment;

import com.varsityconnect.order.Order;
import java.math.BigDecimal;

/* seam for charging, the mock below is the only implementation in v1 */
public interface PaymentProvider {

  String name();

  /* demo decision comes from the caller, a real gateway would ask the network */
  boolean charge(Order order, BigDecimal amount, SimulatePayment simulation);
}
