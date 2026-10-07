package com.varsityconnect.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.varsityconnect.cart.CartItemRepository;
import com.varsityconnect.cart.CartRepository;
import com.varsityconnect.community.CommunityCommentRepository;
import com.varsityconnect.community.CommunityPostRepository;
import com.varsityconnect.lostfound.LostFoundMatchRepository;
import com.varsityconnect.lostfound.LostFoundReportRepository;
import com.varsityconnect.marketplace.MarketplaceListingRepository;
import com.varsityconnect.order.OrderRepository;
import com.varsityconnect.payment.PaymentRepository;
import com.varsityconnect.support.SupportOfferRepository;
import com.varsityconnect.support.SupportRequestRepository;
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

/* inbox flows against h2, events land after their transactions commit */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NotificationIntegrationTest {

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper mapper;
  @Autowired UserRepository users;
  @Autowired MarketplaceListingRepository listings;
  @Autowired CartItemRepository cartItems;
  @Autowired CartRepository carts;
  @Autowired OrderRepository orders;
  @Autowired PaymentRepository payments;
  @Autowired LostFoundMatchRepository matchRows;
  @Autowired LostFoundReportRepository reportRows;
  @Autowired SupportOfferRepository supportOffers;
  @Autowired SupportRequestRepository supportRequests;
  @Autowired CommunityCommentRepository communityComments;
  @Autowired CommunityPostRepository communityPosts;
  @Autowired NotificationRepository notifications;

  private String userAToken;
  private String userBToken;

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
    userAToken = register("notifya@cput.ac.za", "22E000001").get("token").asText();
    userBToken = register("notifyb@cput.ac.za", "22E000002").get("token").asText();
  }

  private JsonNode register(String email, String studentNumber) throws Exception {
    Map<String, Object> req =
        new java.util.HashMap<>(
            Map.of(
                "fullName", "notify user",
                "email", email,
                "password", "password123",
                "role", "STUDENT",
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

  private long unread(String token) throws Exception {
    MvcResult result =
        mvc.perform(get("/api/v1/notifications/unread-count").header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString()).get("count").asLong();
  }

  private JsonNode list(String token) throws Exception {
    MvcResult result =
        mvc.perform(get("/api/v1/notifications").header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString());
  }

  @Test
  void supportOfferCreatesNotification() throws Exception {
    String requestId = createSupportRequest(userAToken);
    offerOn(userBToken, requestId, "i can help");

    assertThat(unread(userAToken)).isEqualTo(1);
    JsonNode page = list(userAToken);
    assertThat(page.get("content").get(0).get("type").asText()).isEqualTo("SUPPORT_OFFER_RECEIVED");
    assertThat(page.get("content").get(0).get("entityType").asText()).isEqualTo("support-request");
  }

  @Test
  void supportAcceptanceNotifiesResponder() throws Exception {
    String requestId = createSupportRequest(userAToken);
    String offerId = offerOn(userBToken, requestId, "i can help");

    mvc.perform(post("/api/v1/support/offers/" + offerId + "/accept").header("Authorization", "Bearer " + userAToken))
        .andExpect(status().isOk());

    assertThat(unread(userBToken)).isEqualTo(1);
    assertThat(list(userBToken).get("content").get(0).get("type").asText())
        .isEqualTo("SUPPORT_OFFER_ACCEPTED");
  }

  @Test
  void communityCommentNotifiesAuthor() throws Exception {
    String postId = createPost(userAToken, "thread here", "body here");
    commentOn(userBToken, postId, "replying here");

    assertThat(unread(userAToken)).isEqualTo(1);
    assertThat(list(userAToken).get("content").get(0).get("type").asText())
        .isEqualTo("COMMUNITY_COMMENT_RECEIVED");
  }

  @Test
  void ownCommentNotifiesNobody() throws Exception {
    String postId = createPost(userAToken, "thread here", "body here");
    commentOn(userAToken, postId, "talking to myself");

    assertThat(unread(userAToken)).isEqualTo(0);
  }

  @Test
  void matchCreatesTwoNotifications() throws Exception {
    createReport(userAToken, "LOST", "black wallet", "leather wallet", "library", "2026-10-01");
    createReport(userBToken, "FOUND", "black wallet", "leather wallet", "library", "2026-10-01");

    assertThat(unread(userAToken)).isEqualTo(1);
    assertThat(unread(userBToken)).isEqualTo(1);
    assertThat(list(userAToken).get("content").get(0).get("type").asText()).isEqualTo("LOST_FOUND_MATCH");
  }

  @Test
  void paymentNotifiesBuyer() throws Exception {
    String listingId = createListing(userBToken, "pay item", "for notify", "100.00");
    addToCart(userAToken, listingId);
    String orderId = checkout(userAToken);
    pay(userAToken, orderId, "SUCCESS");

    assertThat(unread(userAToken)).isEqualTo(1);
    assertThat(list(userAToken).get("content").get(0).get("type").asText()).isEqualTo("ORDER_PAID");
  }

  @Test
  void markReadAndAllRead() throws Exception {
    createSupportRequest(userAToken);
    String requestId = createSupportRequest(userAToken);
    offerOn(userBToken, requestId, "helping");
    assertThat(unread(userAToken)).isEqualTo(1);

    String id = list(userAToken).get("content").get(0).get("id").asText();
    mvc.perform(post("/api/v1/notifications/" + id + "/read").header("Authorization", "Bearer " + userAToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.readAt").exists());
    assertThat(unread(userAToken)).isEqualTo(0);

    /* second round, all-read clears in one call */
    String request2 = createSupportRequest(userAToken);
    offerOn(userBToken, request2, "helping again");
    assertThat(unread(userAToken)).isEqualTo(1);
    mvc.perform(post("/api/v1/notifications/read-all").header("Authorization", "Bearer " + userAToken))
        .andExpect(status().isNoContent());
    assertThat(unread(userAToken)).isEqualTo(0);
  }

  @Test
  void strangerCannotTouchInbox() throws Exception {
    String requestId = createSupportRequest(userAToken);
    offerOn(userBToken, requestId, "helping");
    String id = list(userAToken).get("content").get(0).get("id").asText();

    mvc.perform(post("/api/v1/notifications/" + id + "/read").header("Authorization", "Bearer " + userBToken))
        .andExpect(status().isNotFound());
    mvc.perform(delete("/api/v1/notifications/" + id).header("Authorization", "Bearer " + userBToken))
        .andExpect(status().isNotFound());
    assertThat(unread(userAToken)).isEqualTo(1);

    mvc.perform(delete("/api/v1/notifications/" + id).header("Authorization", "Bearer " + userAToken))
        .andExpect(status().isNoContent());
    assertThat(list(userAToken).get("totalElements").asInt()).isEqualTo(0);
  }

  /* small builders below */

  private String createSupportRequest(String token) throws Exception {
    MvcResult result =
        mvc.perform(
                post("/api/v1/support/requests")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        mapper.writeValueAsString(
                            Map.of(
                                "type", "FOOD",
                                "title", "need dinner",
                                "description", "stipend late",
                                "location", "res block c",
                                "urgency", "HIGH"))))
            .andExpect(status().isCreated())
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
  }

  private String offerOn(String token, String requestId, String message) throws Exception {
    MvcResult result =
        mvc.perform(
                post("/api/v1/support/requests/" + requestId + "/offers")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(Map.of("message", message))))
            .andExpect(status().isCreated())
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
  }

  private String createPost(String token, String title, String body) throws Exception {
    MvcResult result =
        mvc.perform(
                post("/api/v1/community/posts")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(Map.of("title", title, "body", body))))
            .andExpect(status().isCreated())
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
  }

  private void commentOn(String token, String postId, String body) throws Exception {
    mvc.perform(
            post("/api/v1/community/posts/" + postId + "/comments")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("body", body))))
        .andExpect(status().isCreated());
  }

  private void createReport(
      String token, String type, String name, String description, String location, String date)
      throws Exception {
    mvc.perform(
            post("/api/v1/lost-found/reports")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    mapper.writeValueAsString(
                        Map.of(
                            "type", type,
                            "itemName", name,
                            "category", "OTHER",
                            "description", description,
                            "location", location,
                            "incidentDate", date))))
        .andExpect(status().isCreated());
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
                                "category", "OTHER",
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

  private void pay(String token, String orderId, String simulate) throws Exception {
    mvc.perform(
            post("/api/v1/orders/" + orderId + "/payments")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("simulate", simulate))))
        .andExpect(status().isOk());
  }
}
