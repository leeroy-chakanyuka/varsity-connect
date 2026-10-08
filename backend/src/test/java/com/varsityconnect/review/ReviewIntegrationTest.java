package com.varsityconnect.review;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.varsityconnect.cart.CartItemRepository;
import com.varsityconnect.cart.CartRepository;
import com.varsityconnect.lostfound.LostFoundMatchRepository;
import com.varsityconnect.lostfound.LostFoundReportRepository;
import com.varsityconnect.marketplace.MarketplaceListingRepository;
import com.varsityconnect.order.OrderRepository;
import com.varsityconnect.support.SupportOfferRepository;
import com.varsityconnect.support.SupportRequestRepository;
import com.varsityconnect.community.CommunityCommentRepository;
import com.varsityconnect.community.CommunityPostRepository;
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

/* verified voices only — completed orders, real sellers, no self-praise */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ReviewIntegrationTest {

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper mapper;
  @Autowired UserRepository users;
  @Autowired MarketplaceListingRepository listings;
  @Autowired CartItemRepository cartItems;
  @Autowired CartRepository carts;
  @Autowired OrderRepository orders;
  @Autowired ReviewRepository reviews;
  @Autowired com.varsityconnect.notification.NotificationRepository notifications;
  @Autowired com.varsityconnect.payment.PaymentRepository payments;
  @Autowired LostFoundMatchRepository matchRows;
  @Autowired LostFoundReportRepository reportRows;
  @Autowired SupportOfferRepository supportOffers;
  @Autowired SupportRequestRepository supportRequests;
  @Autowired CommunityCommentRepository communityComments;
  @Autowired CommunityPostRepository communityPosts;

  private String sellerToken;
  private String sellerId;
  private String buyerToken;
  private String buyerId;
  private String strangerToken;
  private String listingId;

  @BeforeEach
  void seed() throws Exception {
    notifications.deleteAll();
    reviews.deleteAll();
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
    JsonNode seller = register("reviewseller@cput.ac.za", "22F000001", "STUDENT");
    sellerToken = seller.get("token").asText();
    sellerId = seller.get("user").get("id").asText();
    JsonNode buyer = register("reviewbuyer@cput.ac.za", "22F000002", "STUDENT");
    buyerToken = buyer.get("token").asText();
    buyerId = buyer.get("user").get("id").asText();
    strangerToken = register("reviewstranger@cput.ac.za", "22F000003", "STUDENT").get("token").asText();
    listingId = createListing(sellerToken, "review lamp", "for trust", "300.00");
  }

  private JsonNode register(String email, String studentNumber, String role) throws Exception {
    Map<String, Object> req =
        new java.util.HashMap<>(
            Map.of(
                "fullName", "review user",
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

  /* full journey to a completed order, returns its id */
  private String completedOrder() throws Exception {
    return completedOrderFor(listingId);
  }

  private String completedOrderFor(String listing) throws Exception {
    mvc.perform(
            post("/api/v1/cart/items")
                .header("Authorization", "Bearer " + buyerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("listingId", listing))))
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
    mvc.perform(post("/api/v1/orders/" + orderId + "/complete").header("Authorization", "Bearer " + buyerToken))
        .andExpect(status().isOk());
    return orderId;
  }

  private MvcResult review(String token, String revieweeId, String orderId, Integer rating, String comment) throws Exception {
    java.util.Map<String, Object> body = new java.util.HashMap<>();
    body.put("orderId", orderId);
    body.put("rating", rating);
    body.put("comment", comment);
    return mvc.perform(
            post("/api/v1/users/" + revieweeId + "/reviews")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(body)))
        .andReturn();
  }

  @Test
  void ratingBoundsEnforced() throws Exception {
    String orderId = completedOrder();

    mvc.perform(
            post("/api/v1/users/" + sellerId + "/reviews")
                .header("Authorization", "Bearer " + buyerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("orderId", orderId, "rating", 1, "comment", "ok"))))
        .andExpect(status().isCreated());

    String listing2 = createListing(sellerToken, "second lamp", "for bounds", "100.00");
    String order2 = completedOrderFor(listing2);
    mvc.perform(
            post("/api/v1/users/" + sellerId + "/reviews")
                .header("Authorization", "Bearer " + buyerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("orderId", order2, "rating", 5, "comment", "great"))))
        .andExpect(status().isCreated());

    String listing3 = createListing(sellerToken, "third lamp", "for bounds", "100.00");
    String order3 = completedOrderFor(listing3);
    assertThat(review(buyerToken, sellerId, order3, 0, "bad").getResponse().getStatus()).isEqualTo(400);
    assertThat(review(buyerToken, sellerId, order3, 6, "bad").getResponse().getStatus()).isEqualTo(400);
  }

  @Test
  void selfReviewFails() throws Exception {
    String orderId = completedOrder();

    /* seller never buys, so they review through nobody — direct attempt still fails */
    MvcResult result = review(sellerToken, sellerId, orderId, 5, "myself");
    assertThat(result.getResponse().getStatus()).isEqualTo(403);
  }

  @Test
  void unrelatedUserCannotReview() throws Exception {
    String orderId = completedOrder();

    MvcResult result = review(strangerToken, sellerId, orderId, 5, "stranger");
    assertThat(result.getResponse().getStatus()).isEqualTo(403);
  }

  @Test
  void uncompletedOrderCannotBeReviewed() throws Exception {
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

    MvcResult result = review(buyerToken, sellerId, orderId, 5, "too soon");
    assertThat(result.getResponse().getStatus()).isEqualTo(400);
    assertThat(mapper.readTree(result.getResponse().getContentAsString()).get("code").asText())
        .isEqualTo("ORDER_NOT_COMPLETED");
  }

  @Test
  void duplicateReviewFails() throws Exception {
    String orderId = completedOrder();

    assertThat(review(buyerToken, sellerId, orderId, 5, "first").getResponse().getStatus()).isEqualTo(201);
    MvcResult again = review(buyerToken, sellerId, orderId, 4, "second");
    assertThat(again.getResponse().getStatus()).isEqualTo(409);
  }

  @Test
  void averageIsCorrectAndNewestFirst() throws Exception {
    String order1 = completedOrder();
    assertThat(review(buyerToken, sellerId, order1, 5, "great").getResponse().getStatus()).isEqualTo(201);

    String listing2 = createListing(sellerToken, "avg lamp", "for average", "150.00");
    String order2 = completedOrderFor(listing2);
    Thread.sleep(10);
    assertThat(review(buyerToken, sellerId, order2, 1, "poor").getResponse().getStatus()).isEqualTo(201);

    /* profile carries the real numbers now */
    mvc.perform(get("/api/v1/users/" + sellerId).header("Authorization", "Bearer " + buyerToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.averageRating").value(3.0))
        .andExpect(jsonPath("$.reviewCount").value(2));

    /* newest first */
    MvcResult list =
        mvc.perform(get("/api/v1/users/" + sellerId + "/reviews").header("Authorization", "Bearer " + buyerToken))
            .andExpect(status().isOk())
            .andReturn();
    JsonNode rows = mapper.readTree(list.getResponse().getContentAsString());
    assertThat(rows.size()).isEqualTo(2);
    assertThat(rows.get(0).get("comment").asText()).isEqualTo("poor");
    assertThat(rows.get(1).get("comment").asText()).isEqualTo("great");
  }

  @Test
  void unknownRevieweeIs404() throws Exception {
    String orderId = completedOrder();

    MvcResult result = review(buyerToken, java.util.UUID.randomUUID().toString(), orderId, 5, "ghost");
    assertThat(result.getResponse().getStatus()).isEqualTo(404);
  }
}
