package com.varsityconnect.community;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/* thread flows against h2, moderation is owner-or-admin */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CommunityIntegrationTest {

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
  @Autowired CommunityCommentRepository comments;
  @Autowired CommunityPostRepository posts;
  @Autowired com.varsityconnect.notification.NotificationRepository notifications;
  @Autowired PasswordEncoder passwords;

  private String authorToken;
  private String otherToken;
  private String adminToken;

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
    comments.deleteAll();
    posts.deleteAll();
    listings.deleteAll();
    users.deleteAll();
    authorToken = register("poster@cput.ac.za", "22D000001", "STUDENT").get("token").asText();
    otherToken = register("commenter@cput.ac.za", "22D000002", "STUDENT").get("token").asText();
    users.save(
        new com.varsityconnect.user.User(
            "admin", "communityadmin@cput.ac.za", passwords.encode("password123"), null, null,
            com.varsityconnect.user.UserRole.ADMIN));
    MvcResult login =
        mvc.perform(
                post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        mapper.writeValueAsString(
                            Map.of("identifier", "communityadmin@cput.ac.za", "password", "password123"))))
            .andExpect(status().isOk())
            .andReturn();
    adminToken = mapper.readTree(login.getResponse().getContentAsString()).get("token").asText();
  }

  private JsonNode register(String email, String studentNumber, String role) throws Exception {
    Map<String, Object> req =
        new java.util.HashMap<>(
            Map.of(
                "fullName", "community user",
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

  private String createPost(String token, String title, String body) throws Exception {
    MvcResult result =
        mvc.perform(
                post("/api/v1/community/posts")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(Map.of("title", title, "body", body))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.title").value(title))
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
  }

  private void comment(String token, String postId, String body) throws Exception {
    mvc.perform(
            post("/api/v1/community/posts/" + postId + "/comments")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("body", body))))
        .andExpect(status().isCreated());
  }

  private int count(String url, String token) throws Exception {
    MvcResult result =
        mvc.perform(get(url).header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString()).get("totalElements").asInt();
  }

  @Test
  void createAndSearchPost() throws Exception {
    createPost(authorToken, "nsfas allowance dates", "when do allowances drop this term");
    assertThat(count("/api/v1/community/posts?search=allowance", authorToken)).isEqualTo(1);
    assertThat(count("/api/v1/community/posts?search=residence", authorToken)).isEqualTo(0);
  }

  @Test
  void latestSortIsNewestFirst() throws Exception {
    createPost(authorToken, "older thread", "first body here");
    Thread.sleep(10);
    createPost(authorToken, "newer thread", "second body here");

    MvcResult result =
        mvc.perform(get("/api/v1/community/posts?sort=latest").header("Authorization", "Bearer " + authorToken))
            .andExpect(status().isOk())
            .andReturn();
    JsonNode content = mapper.readTree(result.getResponse().getContentAsString()).get("content");
    assertThat(content.get(0).get("title").asText()).isEqualTo("newer thread");
  }

  @Test
  void trendingSortCountsCommentsFirst() throws Exception {
    String quiet = createPost(authorToken, "quiet thread", "nobody replies here");
    String loud = createPost(authorToken, "loud thread", "everybody replies here");
    comment(otherToken, loud, "first!");
    comment(authorToken, loud, "second!");

    MvcResult result =
        mvc.perform(get("/api/v1/community/posts?sort=trending").header("Authorization", "Bearer " + authorToken))
            .andExpect(status().isOk())
            .andReturn();
    JsonNode content = mapper.readTree(result.getResponse().getContentAsString()).get("content");
    assertThat(content.get(0).get("id").asText()).isEqualTo(loud);
    assertThat(content.get(0).get("commentCount").asInt()).isEqualTo(2);
    assertThat(content.get(1).get("id").asText()).isEqualTo(quiet);
  }

  @Test
  void ownerEditSucceeds() throws Exception {
    String id = createPost(authorToken, "typo title", "body stays");

    mvc.perform(
            patch("/api/v1/community/posts/" + id)
                .header("Authorization", "Bearer " + authorToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("title", "fixed title"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.title").value("fixed title"));
  }

  @Test
  void otherUserEditFails() throws Exception {
    String id = createPost(authorToken, "my thread", "my body here");

    mvc.perform(
            patch("/api/v1/community/posts/" + id)
                .header("Authorization", "Bearer " + otherToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("title", "hijacked"))))
        .andExpect(status().isForbidden());
  }

  @Test
  void adminDeletionSucceeds() throws Exception {
    String id = createPost(authorToken, "remove me", "moderate this body");

    mvc.perform(delete("/api/v1/community/posts/" + id).header("Authorization", "Bearer " + adminToken))
        .andExpect(status().isNoContent());
    assertThat(count("/api/v1/community/posts?search=remove", adminToken)).isEqualTo(0);
  }

  @Test
  void commentLifecycle() throws Exception {
    String postId = createPost(authorToken, "help thread", "ask below please");
    comment(otherToken, postId, "here to help");

    MvcResult list =
        mvc.perform(get("/api/v1/community/posts/" + postId + "/comments").header("Authorization", "Bearer " + authorToken))
            .andExpect(status().isOk())
            .andReturn();
    JsonNode comments = mapper.readTree(list.getResponse().getContentAsString());
    assertThat(comments.size()).isEqualTo(1);
    String commentId = comments.get(0).get("id").asText();

    /* stranger cannot edit, author can */
    mvc.perform(
            patch("/api/v1/community/comments/" + commentId)
                .header("Authorization", "Bearer " + authorToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("body", "hacked"))))
        .andExpect(status().isForbidden());
    mvc.perform(
            patch("/api/v1/community/comments/" + commentId)
                .header("Authorization", "Bearer " + otherToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("body", "edited by me"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.body").value("edited by me"));
  }
}
