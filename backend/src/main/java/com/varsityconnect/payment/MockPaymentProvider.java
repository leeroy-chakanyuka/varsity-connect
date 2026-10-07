package com.varsityconnect.payment;

import com.varsityconnect.order.Order;
import java.math.BigDecimal;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/* honest demo: approves or declines on request, touches no real money.
 * gated behind app.payment.mock-enabled so prod config can switch it off. */
@Component
@ConditionalOnProperty(name = "app.payment.mock-enabled", havingValue = "true", matchIfMissing = true)
public class MockPaymentProvider implements PaymentProvider {

  @Override
  public String name() {
    return "mock";
  }

  @Override
  public boolean charge(Order order, BigDecimal amount, SimulatePayment simulation) {
    return simulation == SimulatePayment.SUCCESS;
  }
}
