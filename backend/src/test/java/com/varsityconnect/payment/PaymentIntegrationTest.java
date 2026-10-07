package com.varsityconnect.payment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.varsityconnect.cart.CartItemRepository;
import com.varsityconnect.cart.CartRepository;
import com.varsityconnect.marketplace.MarketplaceListingRepository;
import com.varsityconnect.order.OrderRepository;
import com.varsityconnect.user.UserRepository;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/* demo settlement against h2, success and failure move different pieces */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PaymentIntegrationTest {

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper mapper;
  @Autowired UserRepository users;
  @Autowired MarketplaceListingRepository listings;
  @Autowired CartItemRepository cartItems;
  @Autowired CartRepository carts;
  @Autowired OrderRepository orders;
  @Autowired PaymentRepository payments;

  private String sellerToken;
  private String buyerToken;
  private String listingId;

  @BeforeEach
  void seed() throws Exception {
    payments.deleteAll();
    orders.deleteAll();
    cartItems.deleteAll();
    carts.deleteAll();
    listings.deleteAll();
    users.deleteAll();
    sellerToken = register("payseller@cput.ac.za", "229000001", "STUDENT").get("token").asText();
    buyerToken = register("paybuyer@cput.ac.za", "229000002", "STUDENT").get("token").asText();
    listingId = createListing(sellerToken, "pay laptop", "for settlement", "4500.00");
  }

  private JsonNode register(String email, String studentNumber, String role) throws Exception {
    Map<String, Object> req =
        new java.util.HashMap<>(
            Map.of(
                "fullName", "pay user",
                "email", email,
                "password", "password123",
                "role", role,
                "acceptedTerms", true));
    if (studentNumber != null) {
      req.put("studentNumber", studentNumber);
    }
    MvcResult result =
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString());
  }

  private String createListing(String token, String title, String description, String price) throws Exception {
    MvcResult result =
        mvc.perform(
                post("/api/v1/marketplace/listings")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        mapper.writeValueAsString(
                            Map.of(
                                "title", title,
                                "description", description,
                                "price", new java.math.BigDecimal(price),
                                "category", "ELECTRONICS",
                                "condition", "GOOD"))))
            .andExpect(status().isCreated())
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
  }

  private void addToCart(String token, String listing) throws Exception {
    mvc.perform(
            post("/api/v1/cart/items")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("listingId", listing))))
        .andExpect(status().isOk());
  }

  private String checkout(String token) throws Exception {
    MvcResult result =
        mvc.perform(
                post("/api/v1/orders")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        mapper.writeValueAsString(
                            Map.of("deliveryMethod", "CAMPUS_COLLECTION", "paymentMethod", "MOCK_CARD"))))
            .andExpect(status().isCreated())
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
  }

  private JsonNode pay(String token, String orderId, String simulate) throws Exception {
    MvcResult result =
        mvc.perform(
                post("/api/v1/orders/" + orderId + "/payments")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(Map.of("simulate", simulate))))
            .andExpect(status().isOk())
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString());
  }

  private int cartCount(String token) throws Exception {
    MvcResult result =
        mvc.perform(get("/api/v1/cart").header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString()).get("itemCount").asInt();
  }

  private String listingStatus(String token, String id) throws Exception {
    MvcResult result =
        mvc.perform(get("/api/v1/marketplace/listings/" + id).header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString()).get("status").asText();
  }

  @Test
  void successfulPaymentSettlesEverything() throws Exception {
    addToCart(buyerToken, listingId);
    String orderId = checkout(buyerToken);

    JsonNode result = pay(buyerToken, orderId, "SUCCESS");
    assertThat(result.get("status").asText()).isEqualTo("SUCCEEDED");
    assertThat(result.get("provider").asText()).isEqualTo("mock");
    assertThat(result.get("order").get("status").asText()).isEqualTo("PAID");

    /* stock sold, basket empty */
    assertThat(listingStatus(sellerToken, listingId)).isEqualTo("SOLD");
    assertThat(cartCount(buyerToken)).isEqualTo(0);
    assertThat(payments.count()).isEqualTo(1);
  }

  @Test
  void failedPaymentReleasesTheReservation() throws Exception {
    addToCart(buyerToken, listingId);
    String orderId = checkout(buyerToken);

    JsonNode result = pay(buyerToken, orderId, "FAILURE");
    assertThat(result.get("status").asText()).isEqualTo("FAILED");
    assertThat(result.get("order").get("status").asText()).isEqualTo("PAYMENT_FAILED");

    /* back on the shelf, basket kept for a retry */
    assertThat(listingStatus(sellerToken, listingId)).isEqualTo("ACTIVE");
    assertThat(cartCount(buyerToken)).isEqualTo(1);
  }

  @Test
  void failedOrderCanRetryToSuccess() throws Exception {
    addToCart(buyerToken, listingId);
    String orderId = checkout(buyerToken);
    pay(buyerToken, orderId, "FAILURE");

    JsonNode retry = pay(buyerToken, orderId, "SUCCESS");
    assertThat(retry.get("order").get("status").asText()).isEqualTo("PAID");
    assertThat(listingStatus(sellerToken, listingId)).isEqualTo("SOLD");
    assertThat(payments.count()).isEqualTo(2);
  }

  @Test
  void strangerCannotPayAnotherOrder() throws Exception {
    addToCart(buyerToken, listingId);
    String orderId = checkout(buyerToken);

    mvc.perform(
            post("/api/v1/orders/" + orderId + "/payments")
                .header("Authorization", "Bearer " + sellerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("simulate", "SUCCESS"))))
        .andExpect(status().isNotFound());
  }

  @Test
  void doublePaymentIsPrevented() throws Exception {
    addToCart(buyerToken, listingId);
    String orderId = checkout(buyerToken);
    pay(buyerToken, orderId, "SUCCESS");

    mvc.perform(
            post("/api/v1/orders/" + orderId + "/payments")
                .header("Authorization", "Bearer " + buyerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("simulate", "SUCCESS"))))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("ORDER_INVALID"));
  }
}
