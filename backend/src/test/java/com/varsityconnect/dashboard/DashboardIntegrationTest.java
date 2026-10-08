package com.varsityconnect.dashboard;

import static org.assertj.core.api.Assertions.assertThat;
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

/* home aggregate reflects the database, capped and scoped to the caller */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DashboardIntegrationTest {

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
  @Autowired com.varsityconnect.notification.NotificationRepository notifications;

  private String userToken;
  private String userId;
  private String otherToken;

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
    JsonNode user = register("dashuser@cput.ac.za", "22G000001", "STUDENT");
    userToken = user.get("token").asText();
    userId = user.get("user").get("id").asText();
    otherToken = register("dashother@cput.ac.za", "22G000002", "STUDENT").get("token").asText();
  }

  private JsonNode register(String email, String studentNumber, String role) throws Exception {
    Map<String, Object> req =
        new java.util.HashMap<>(
            Map.of(
                "fullName", "dash user",
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

  private void createListing(String token, String title) throws Exception {
    mvc.perform(
            post("/api/v1/marketplace/listings")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    mapper.writeValueAsString(
                        Map.of(
                            "title", title,
                            "description", "for the dashboard",
                            "price", new java.math.BigDecimal("100.00"),
                            "category", "TEXTBOOKS",
                            "condition", "GOOD"))))
        .andExpect(status().isCreated());
  }

  private void createPost(String token, String title) throws Exception {
    mvc.perform(
            post("/api/v1/community/posts")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("title", title, "body", "dashboard body"))))
        .andExpect(status().isCreated());
  }

  private void createSupportRequest(String token, String title) throws Exception {
    mvc.perform(
            post("/api/v1/support/requests")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    mapper.writeValueAsString(
                        Map.of(
                            "type", "FOOD",
                            "title", title,
                            "description", "dashboard help",
                            "location", "res",
                            "urgency", "LOW"))))
        .andExpect(status().isCreated());
  }

  private void createReport(String token, String type, String name) throws Exception {
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
                            "description", "black leather wallet with student card",
                            "location", "library steps",
                            "incidentDate", "2026-10-01"))))
        .andExpect(status().isCreated());
  }

  private JsonNode dashboard(String token) throws Exception {
    MvcResult result =
        mvc.perform(get("/api/v1/dashboard").header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString());
  }

  @Test
  void dashboardReflectsModuleState() throws Exception {
    createListing(userToken, "dash textbook");
    createListing(otherToken, "other textbook");
    createPost(userToken, "dash thread");
    createSupportRequest(otherToken, "dash dinner");
    createReport(userToken, "LOST", "dash wallet");
    createReport(otherToken, "FOUND", "dash wallet");

    JsonNode lonely =
        mapper.readTree(
            mvc.perform(
                    post("/api/v1/lost-found/reports")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(
                            mapper.writeValueAsString(
                                Map.of(
                                    "type", "LOST",
                                    "itemName", "lonely keys",
                                    "category", "OTHER",
                                    "description", "a single brass key",
                                    "location", "bus stop",
                                    "incidentDate", "2026-09-01"))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString());
    assertThat(lonely.get("status").asText()).isEqualTo("OPEN");

    JsonNode home = dashboard(userToken);

    /* current user summary */
    assertThat(home.get("user").get("id").asText()).isEqualTo(userId);
    /* counts across the modules */
    assertThat(home.get("activeListingCount").asLong()).isEqualTo(2);
    /* the paired wallets moved on, only the keys stay open */
    assertThat(home.get("openLostReportCount").asLong()).isEqualTo(1);
    assertThat(home.get("openSupportRequestCount").asLong()).isEqualTo(1);
    /* capped collections */
    assertThat(home.get("latestListings").size()).isEqualTo(2);
    assertThat(home.get("latestPosts").size()).isEqualTo(1);
    assertThat(home.get("openSupportRequests").size()).isEqualTo(1);
    /* my lost wallet paired with their found one */
    assertThat(home.get("myMatches").size()).isGreaterThanOrEqualTo(1);
    /* the pairing pinged me exactly once */
    assertThat(home.get("unreadNotifications").asLong()).isEqualTo(1);
  }

  @Test
  void matchesAreScopedToCaller() throws Exception {
    createReport(userToken, "LOST", "my wallet");
    createReport(otherToken, "FOUND", "my wallet");

    JsonNode mine = dashboard(userToken);
    JsonNode theirs = dashboard(otherToken);

    assertThat(mine.get("myMatches").size()).isGreaterThanOrEqualTo(1);
    assertThat(theirs.get("myMatches").size()).isGreaterThanOrEqualTo(1);
  }

  @Test
  void anonymousDashboardIsRejected() throws Exception {
    mvc.perform(get("/api/v1/dashboard")).andExpect(status().isUnauthorized());
  }

  @Test
  void collectionsStayCapped() throws Exception {
    for (int i = 0; i < 7; i++) {
      createListing(userToken, "bulk item " + i);
    }

    JsonNode home = dashboard(userToken);

    assertThat(home.get("latestListings").size()).isEqualTo(4);
    assertThat(home.get("activeListingCount").asLong()).isEqualTo(7);
  }
}
