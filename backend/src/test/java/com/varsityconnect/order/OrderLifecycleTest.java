package com.varsityconnect.order;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.varsityconnect.cart.CartItemRepository;
import com.varsityconnect.cart.CartRepository;
import com.varsityconnect.marketplace.MarketplaceListingRepository;
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

/* paid -> ready -> completed, unpaid orders cancel back to the shelf */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OrderLifecycleTest {

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper mapper;
  @Autowired UserRepository users;
  @Autowired MarketplaceListingRepository listings;
  @Autowired CartItemRepository cartItems;
  @Autowired CartRepository carts;
  @Autowired OrderRepository orders;
  @Autowired com.varsityconnect.notification.NotificationRepository notifications;
  @Autowired com.varsityconnect.payment.PaymentRepository payments;
  @Autowired com.varsityconnect.lostfound.LostFoundMatchRepository matchRows;
  @Autowired com.varsityconnect.lostfound.LostFoundReportRepository reportRows;
  @Autowired com.varsityconnect.support.SupportOfferRepository supportOffers;
  @Autowired com.varsityconnect.support.SupportRequestRepository supportRequests;
  @Autowired com.varsityconnect.community.CommunityCommentRepository communityComments;
  @Autowired com.varsityconnect.community.CommunityPostRepository communityPosts;

  private String sellerToken;
  private String buyerToken;
  private String otherToken;
  private String listingId;

  @BeforeEach
  void seed() throws Exception {
    notifications.deleteAll();
    payments.deleteAll();
    orders.deleteAll();
    cartItems.deleteAll();
    carts.deleteAll();
    matchRows.deleteAll();
    reportRows.deleteAll();
    supportOffers.deleteAll();
    supportRequests.deleteAll();
    communityComments.deleteAll();
    communityPosts.deleteAll();
    listings.deleteAll();
    users.deleteAll();
    sellerToken = register("lifeseller@cput.ac.za", "22E000001", "STUDENT").get("token").asText();
    JsonNode buyer = register("lifebuyer@cput.ac.za", "22E000002", "STUDENT");
    buyerToken = buyer.get("token").asText();
    otherToken = register("lifeother@cput.ac.za", "22E000003", "STUDENT").get("token").asText();
    listingId = createListing(sellerToken, "lifecycle lamp", "for the full journey", "200.00");
  }

  private JsonNode register(String email, String studentNumber, String role) throws Exception {
    Map<String, Object> req =
        new java.util.HashMap<>(
            Map.of(
                "fullName", "life user",
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
                                "category", "TEXTBOOKS",
                                "condition", "GOOD"))))
            .andExpect(status().isCreated())
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
  }

  private String freshPaidOrder() throws Exception {
    mvc.perform(
            post("/api/v1/cart/items")
                .header("Authorization", "Bearer " + buyerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("listingId", listingId))))
        .andExpect(status().isOk());
    MvcResult checkout =
        mvc.perform(
                post("/api/v1/orders")
                    .header("Authorization", "Bearer " + buyerToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        mapper.writeValueAsString(
                            Map.of("deliveryMethod", "CAMPUS_COLLECTION", "paymentMethod", "MOCK_CARD"))))
            .andExpect(status().isCreated())
            .andReturn();
    String orderId = mapper.readTree(checkout.getResponse().getContentAsString()).get("id").asText();
    mvc.perform(
            post("/api/v1/orders/" + orderId + "/payments")
                .header("Authorization", "Bearer " + buyerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("simulate", "SUCCESS"))))
        .andExpect(status().isOk());
    return orderId;
  }

  private String statusOf(String orderId, String token) throws Exception {
    MvcResult result =
        mvc.perform(get("/api/v1/orders/" + orderId).header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString()).get("status").asText();
  }

  @Test
  void sellerMarksReadyThenBuyerCompletes() throws Exception {
    String orderId = freshPaidOrder();

    mvc.perform(post("/api/v1/orders/" + orderId + "/ready").header("Authorization", "Bearer " + sellerToken))
        .andExpect(status().isOk());
    assertThat(statusOf(orderId, buyerToken)).isEqualTo("READY_FOR_COLLECTION");

    mvc.perform(post("/api/v1/orders/" + orderId + "/complete").header("Authorization", "Bearer " + buyerToken))
        .andExpect(status().isOk());
    MvcResult done =
        mvc.perform(get("/api/v1/orders/" + orderId).header("Authorization", "Bearer " + buyerToken))
            .andExpect(status().isOk())
            .andReturn();
    JsonNode body = mapper.readTree(done.getResponse().getContentAsString());
    assertThat(body.get("status").asText()).isEqualTo("COMPLETED");
    assertThat(body.get("completedAt").isNull()).isFalse();
  }

  @Test
  void buyerCompletesStraightFromPaid() throws Exception {
    String orderId = freshPaidOrder();

    mvc.perform(post("/api/v1/orders/" + orderId + "/complete").header("Authorization", "Bearer " + buyerToken))
        .andExpect(status().isOk());
    assertThat(statusOf(orderId, buyerToken)).isEqualTo("COMPLETED");
  }

  @Test
  void strangerCannotMoveTheOrder() throws Exception {
    String orderId = freshPaidOrder();

    mvc.perform(post("/api/v1/orders/" + orderId + "/ready").header("Authorization", "Bearer " + otherToken))
        .andExpect(status().isForbidden());
    mvc.perform(post("/api/v1/orders/" + orderId + "/complete").header("Authorization", "Bearer " + otherToken))
        .andExpect(status().isNotFound());
    assertThat(statusOf(orderId, buyerToken)).isEqualTo("PAID");
  }

  @Test
  void buyerCannotMarkOwnOrderReady() throws Exception {
    String orderId = freshPaidOrder();

    mvc.perform(post("/api/v1/orders/" + orderId + "/ready").header("Authorization", "Bearer " + buyerToken))
        .andExpect(status().isForbidden());
  }

  @Test
  void unpaidOrderCancelsAndFreesStock() throws Exception {
    mvc.perform(
            post("/api/v1/cart/items")
                .header("Authorization", "Bearer " + buyerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("listingId", listingId))))
        .andExpect(status().isOk());
    MvcResult checkout =
        mvc.perform(
                post("/api/v1/orders")
                    .header("Authorization", "Bearer " + buyerToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        mapper.writeValueAsString(
                            Map.of("deliveryMethod", "CAMPUS_COLLECTION", "paymentMethod", "MOCK_CARD"))))
            .andExpect(status().isCreated())
            .andReturn();
    String orderId = mapper.readTree(checkout.getResponse().getContentAsString()).get("id").asText();

    mvc.perform(post("/api/v1/orders/" + orderId + "/cancel").header("Authorization", "Bearer " + buyerToken))
        .andExpect(status().isOk());
    assertThat(statusOf(orderId, buyerToken)).isEqualTo("CANCELLED");

    /* back on the shelf for the next buyer */
    MvcResult detail =
        mvc.perform(
                get("/api/v1/marketplace/listings/" + listingId)
                    .header("Authorization", "Bearer " + sellerToken))
            .andExpect(status().isOk())
            .andReturn();
    assertThat(mapper.readTree(detail.getResponse().getContentAsString()).get("status").asText())
        .isEqualTo("ACTIVE");
  }

  @Test
  void paidOrderCannotCancel() throws Exception {
    String orderId = freshPaidOrder();

    mvc.perform(post("/api/v1/orders/" + orderId + "/cancel").header("Authorization", "Bearer " + buyerToken))
        .andExpect(status().isBadRequest());
  }

  @Test
  void completedOrderCannotMoveAgain() throws Exception {
    String orderId = freshPaidOrder();
    mvc.perform(post("/api/v1/orders/" + orderId + "/complete").header("Authorization", "Bearer " + buyerToken))
        .andExpect(status().isOk());

    mvc.perform(post("/api/v1/orders/" + orderId + "/complete").header("Authorization", "Bearer " + buyerToken))
        .andExpect(status().isBadRequest());
    mvc.perform(post("/api/v1/orders/" + orderId + "/ready").header("Authorization", "Bearer " + sellerToken))
        .andExpect(status().isBadRequest());
  }
}
