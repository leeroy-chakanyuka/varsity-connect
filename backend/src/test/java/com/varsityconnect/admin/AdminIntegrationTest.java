package com.varsityconnect.admin;

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
import com.varsityconnect.user.User;
import com.varsityconnect.user.UserRepository;
import com.varsityconnect.user.UserRole;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/* the admin desk, backend role checks on every door */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminIntegrationTest {

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
  @Autowired com.varsityconnect.review.ReviewRepository reviews;
  @Autowired PasswordEncoder passwords;

  private String adminToken;
  private String studentToken;
  private String vendorToken;

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
    users.save(
        new User("admin", "deskadmin@cput.ac.za", passwords.encode("password123"), null, null, UserRole.ADMIN));
    adminToken = login("deskadmin@cput.ac.za");
    studentToken = register("deskstudent@cput.ac.za", "22H000001", "STUDENT");
    vendorToken = register("deskvendor@cput.ac.za", null, "VENDOR");
  }

  private String register(String email, String studentNumber, String role) throws Exception {
    Map<String, Object> req =
        new java.util.HashMap<>(
            Map.of(
                "fullName", "desk user",
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
    return mapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
  }

  private String login(String email) throws Exception {
    MvcResult result =
        mvc.perform(
                post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(Map.of("identifier", email, "password", "password123"))))
            .andExpect(status().isOk())
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
  }

  @Test
  void studentsAndVendorsAreRefused() throws Exception {
    mvc.perform(get("/api/v1/admin/users").header("Authorization", "Bearer " + studentToken))
        .andExpect(status().isForbidden());
    mvc.perform(get("/api/v1/admin/users").header("Authorization", "Bearer " + vendorToken))
        .andExpect(status().isForbidden());
    mvc.perform(get("/api/v1/admin/listings").header("Authorization", "Bearer " + studentToken))
        .andExpect(status().isForbidden());
  }

  @Test
  void adminListsUsers() throws Exception {
    MvcResult result =
        mvc.perform(get("/api/v1/admin/users").header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andReturn();
    JsonNode body = mapper.readTree(result.getResponse().getContentAsString());
    assertThat(body.get("totalElements").asInt()).isEqualTo(3);
  }

  @Test
  void disableAndEnableRoundTrip() throws Exception {
    String victimId = users.findByEmail("deskstudent@cput.ac.za").orElseThrow().getId().toString();

    mvc.perform(post("/api/v1/admin/users/" + victimId + "/disable").header("Authorization", "Bearer " + adminToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.enabled").value(false));

    /* locked out immediately, even with the right password */
    mvc.perform(
            post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("identifier", "deskstudent@cput.ac.za", "password", "password123"))))
        .andExpect(status().isForbidden());

    mvc.perform(post("/api/v1/admin/users/" + victimId + "/enable").header("Authorization", "Bearer " + adminToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.enabled").value(true));
    assertThat(login("deskstudent@cput.ac.za")).isNotBlank();
  }

  @Test
  void adminArchivesListing() throws Exception {
    MvcResult created =
        mvc.perform(
                post("/api/v1/marketplace/listings")
                    .header("Authorization", "Bearer " + vendorToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        mapper.writeValueAsString(
                            Map.of(
                                "title", "desk chair",
                                "description", "for moderation",
                                "price", new java.math.BigDecimal("250.00"),
                                "category", "FURNITURE",
                                "condition", "GOOD"))))
            .andExpect(status().isCreated())
            .andReturn();
    String listingId = mapper.readTree(created.getResponse().getContentAsString()).get("id").asText();

    mvc.perform(get("/api/v1/admin/listings").header("Authorization", "Bearer " + adminToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalElements").value(1));

    mvc.perform(delete("/api/v1/admin/listings/" + listingId).header("Authorization", "Bearer " + adminToken))
        .andExpect(status().isNoContent());

    /* gone from the shelf, visible to the seller as archived */
    mvc.perform(
            get("/api/v1/marketplace/listings/" + listingId)
                .header("Authorization", "Bearer " + vendorToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("ARCHIVED"));
  }

  @Test
  void adminRemovesPost() throws Exception {
    MvcResult created =
        mvc.perform(
                post("/api/v1/community/posts")
                    .header("Authorization", "Bearer " + studentToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(Map.of("title", "desk thread", "body", "for moderation"))))
            .andExpect(status().isCreated())
            .andReturn();
    String postId = mapper.readTree(created.getResponse().getContentAsString()).get("id").asText();

    mvc.perform(get("/api/v1/admin/community/posts").header("Authorization", "Bearer " + adminToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalElements").value(1));

    mvc.perform(delete("/api/v1/admin/community/posts/" + postId).header("Authorization", "Bearer " + adminToken))
        .andExpect(status().isNoContent());

    mvc.perform(get("/api/v1/community/posts/" + postId).header("Authorization", "Bearer " + studentToken))
        .andExpect(status().isNotFound());
  }

  @Test
  void adminSeesSupportRequests() throws Exception {
    mvc.perform(
            post("/api/v1/support/requests")
                .header("Authorization", "Bearer " + studentToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    mapper.writeValueAsString(
                        Map.of(
                            "type", "FOOD",
                            "title", "desk dinner",
                            "description", "oversight check",
                            "location", "res",
                            "urgency", "LOW"))))
        .andExpect(status().isCreated());

    mvc.perform(get("/api/v1/admin/support/requests").header("Authorization", "Bearer " + adminToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalElements").value(1));
  }
}
