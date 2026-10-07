package com.varsityconnect.marketplace;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

/* marketplace flows against h2, seller always comes from the jwt */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MarketplaceIntegrationTest {

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper mapper;
  @Autowired UserRepository users;
  @Autowired MarketplaceListingRepository listings;
  @Autowired com.varsityconnect.cart.CartItemRepository cartItems;
  @Autowired com.varsityconnect.cart.CartRepository carts;
  @Autowired com.varsityconnect.order.OrderRepository orderRows;
  @Autowired com.varsityconnect.notification.NotificationRepository notifications;
  @Autowired com.varsityconnect.payment.PaymentRepository paymentRows;
  @Autowired com.varsityconnect.lostfound.LostFoundMatchRepository matchRows;
  @Autowired com.varsityconnect.lostfound.LostFoundReportRepository reportRows;
  @Autowired com.varsityconnect.support.SupportOfferRepository supportOffers;
  @Autowired com.varsityconnect.support.SupportRequestRepository supportRequests;
  @Autowired com.varsityconnect.community.CommunityCommentRepository communityComments;
  @Autowired com.varsityconnect.community.CommunityPostRepository communityPosts;
  @Autowired PasswordEncoder passwords;

  private String sellerToken;
  private String sellerId;
  private String buyerToken;
  private String buyerId;

  @BeforeEach
  void seed() throws Exception {
    /* basket rows first, they point at listings (shared h2 across test classes) */
    notifications.deleteAll();
    paymentRows.deleteAll();
    orderRows.deleteAll();
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
    /* second user doubles as the stranger for ownership tests */
    JsonNode seller = register("seller@cput.ac.za", "226000001", "STUDENT");
    sellerToken = seller.get("token").asText();
    sellerId = seller.get("user").get("id").asText();
    JsonNode buyer = register("buyer@cput.ac.za", "226000002", "STUDENT");
    buyerToken = buyer.get("token").asText();
    buyerId = buyer.get("user").get("id").asText();
    users.save(
        new User("admin", "admin@cput.ac.za", passwords.encode("password123"), null, null, UserRole.ADMIN));
  }

  private JsonNode register(String email, String studentNumber, String role) throws Exception {
    Map<String, Object> req =
        new java.util.HashMap<>(
            Map.of(
                "fullName", "market user",
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

  private String create(String token, String title, String description, String price, String category, String condition) throws Exception {
    Map<String, Object> req =
        Map.of(
            "title", title,
            "description", description,
            "price", new java.math.BigDecimal(price),
            "category", category,
            "condition", condition,
            "location", "bellville campus");
    MvcResult result =
        mvc.perform(
                post("/api/v1/marketplace/listings")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.title").value(title))
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
  }

  private void seedFive() throws Exception {
    create(sellerToken, "calculus textbook", "barely used stewart calculus", "350.00", "TEXTBOOKS", "LIKE_NEW");
    create(sellerToken, "physics textbook", "university physics volume one", "280.00", "TEXTBOOKS", "GOOD");
    create(sellerToken, "dell laptop", "i5 with fresh battery", "4500.00", "ELECTRONICS", "GOOD");
    create(sellerToken, "desk lamp", "bright led lamp for res rooms", "150.00", "FURNITURE", "NEW");
    create(sellerToken, "winter jacket", "warm jacket size medium", "600.00", "CLOTHING", "FAIR");
  }

  private int count(String url, String token) throws Exception {
    MvcResult result =
        mvc.perform(get(url).header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString()).get("totalElements").asInt();
  }

  private int countSearch(String q, String token) throws Exception {
    MvcResult result =
        mvc.perform(
                get("/api/v1/marketplace/listings")
                    .queryParam("search", q)
                    .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString()).get("totalElements").asInt();
  }

  @Test
  void createListingSucceeds() throws Exception {
    String id =
        create(sellerToken, "chemistry textbook", "organic chemistry guide", "320.00", "TEXTBOOKS", "GOOD");
    assertThat(id).isNotBlank();
  }

  @Test
  void sellerComesFromJwt() throws Exception {
    MvcResult result =
        mvc.perform(
                post("/api/v1/marketplace/listings")
                    .header("Authorization", "Bearer " + buyerToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        mapper.writeValueAsString(
                            Map.of(
                                "title", "buyer item",
                                "description", "buyer sells this",
                                "price", new java.math.BigDecimal("100.00"),
                                "category", "OTHER",
                                "condition", "GOOD"))))
            .andExpect(status().isCreated())
            .andReturn();
    JsonNode json = mapper.readTree(result.getResponse().getContentAsString());
    /* no seller id was sent, yet the buyer owns it — identity came from the jwt */
    assertThat(json.get("seller").get("id").asText()).isEqualTo(buyerId);
  }

  @Test
  void missingTitleFails() throws Exception {
    mvc.perform(
            post("/api/v1/marketplace/listings")
                .header("Authorization", "Bearer " + sellerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    mapper.writeValueAsString(
                        Map.of(
                            "description", "no title here",
                            "price", new java.math.BigDecimal("100.00"),
                            "category", "OTHER",
                            "condition", "GOOD"))))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
  }

  @Test
  void negativePriceFails() throws Exception {
    mvc.perform(
            post("/api/v1/marketplace/listings")
                .header("Authorization", "Bearer " + sellerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    mapper.writeValueAsString(
                        Map.of(
                            "title", "negative item",
                            "description", "price below zero",
                            "price", new java.math.BigDecimal("-5.00"),
                            "category", "OTHER",
                            "condition", "GOOD"))))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
  }

  @Test
  void titleSearchWorks() throws Exception {
    seedFive();
    assertThat(count("/api/v1/marketplace/listings?search=calculus", sellerToken)).isEqualTo(1);
  }

  @Test
  void descriptionSearchWorks() throws Exception {
    seedFive();
    assertThat(countSearch("volume one", sellerToken)).isEqualTo(1);
  }

  @Test
  void categoryFilterWorks() throws Exception {
    seedFive();
    assertThat(count("/api/v1/marketplace/listings?category=TEXTBOOKS", sellerToken)).isEqualTo(2);
  }

  @Test
  void priceFilterWorks() throws Exception {
    seedFive();
    assertThat(count("/api/v1/marketplace/listings?minPrice=300&maxPrice=700", sellerToken)).isEqualTo(2);
  }

  @Test
  void conditionFilterWorks() throws Exception {
    seedFive();
    assertThat(count("/api/v1/marketplace/listings?condition=GOOD", sellerToken)).isEqualTo(2);
  }

  @Test
  void paginationWorks() throws Exception {
    seedFive();
    MvcResult result =
        mvc.perform(get("/api/v1/marketplace/listings?size=2").header("Authorization", "Bearer " + sellerToken))
            .andExpect(status().isOk())
            .andReturn();
    JsonNode json = mapper.readTree(result.getResponse().getContentAsString());
    assertThat(json.get("totalElements").asInt()).isEqualTo(5);
    assertThat(json.get("totalPages").asInt()).isEqualTo(3);
    assertThat(json.get("content").size()).isEqualTo(2);
  }

  @Test
  void sortingWorks() throws Exception {
    seedFive();
    MvcResult result =
        mvc.perform(
                get("/api/v1/marketplace/listings?sort=price,asc&size=5")
                    .header("Authorization", "Bearer " + sellerToken))
            .andExpect(status().isOk())
            .andReturn();
    JsonNode content = mapper.readTree(result.getResponse().getContentAsString()).get("content");
    assertThat(content.get(0).get("price").asDouble()).isEqualTo(150.00);
    assertThat(content.get(4).get("price").asDouble()).isEqualTo(4500.00);
  }

  @Test
  void nonOwnerUpdateReturns403() throws Exception {
    String id = create(sellerToken, "owned item", "seller owns this", "100.00", "OTHER", "GOOD");

    mvc.perform(
            patch("/api/v1/marketplace/listings/" + id)
                .header("Authorization", "Bearer " + buyerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"hijacked\"}"))
        .andExpect(status().isForbidden());
  }

  @Test
  void ownerUpdateSucceeds() throws Exception {
    String id = create(sellerToken, "old title", "seller owns this", "100.00", "OTHER", "GOOD");

    mvc.perform(
            patch("/api/v1/marketplace/listings/" + id)
                .header("Authorization", "Bearer " + sellerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"new title\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.title").value("new title"));
  }

  @Test
  void adminUpdateSucceeds() throws Exception {
    String id = create(sellerToken, "admin edits this", "seller owns this", "100.00", "OTHER", "GOOD");
    MvcResult login =
        mvc.perform(
                post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        mapper.writeValueAsString(Map.of("identifier", "admin@cput.ac.za", "password", "password123"))))
            .andExpect(status().isOk())
            .andReturn();
    String adminToken = mapper.readTree(login.getResponse().getContentAsString()).get("token").asText();

    mvc.perform(
            patch("/api/v1/marketplace/listings/" + id)
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"moderated title\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.title").value("moderated title"));
  }

  @Test
  void archiveRemovesListingFromActiveSearch() throws Exception {
    String id = create(sellerToken, "going away", "will be archived", "100.00", "OTHER", "GOOD");
    assertThat(countSearch("going away", sellerToken)).isEqualTo(1);

    mvc.perform(delete("/api/v1/marketplace/listings/" + id).header("Authorization", "Bearer " + sellerToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("ARCHIVED"));

    assertThat(countSearch("going away", sellerToken)).isEqualTo(0);
    /* strangers can no longer open it either */
    mvc.perform(get("/api/v1/marketplace/listings/" + id).header("Authorization", "Bearer " + buyerToken))
        .andExpect(status().isNotFound());
  }

  @Test
  void sellerFilterWorks() throws Exception {
    seedFive();
    assertThat(
            count("/api/v1/marketplace/listings?sellerId=" + sellerId, sellerToken))
        .isEqualTo(5);
    assertThat(count("/api/v1/marketplace/listings?sellerId=" + sellerId + "&status=ARCHIVED", sellerToken))
        .isEqualTo(0);
  }
}
