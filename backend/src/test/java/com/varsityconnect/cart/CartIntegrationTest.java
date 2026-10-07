package com.varsityconnect.cart;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

/* basket flows against h2, totals always come back from the server */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CartIntegrationTest {

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper mapper;
  @Autowired UserRepository users;
  @Autowired MarketplaceListingRepository listings;
  @Autowired CartItemRepository cartItems;
  @Autowired CartRepository carts;
  @Autowired com.varsityconnect.order.OrderRepository orders;
  @Autowired com.varsityconnect.notification.NotificationRepository notifications;
  @Autowired com.varsityconnect.payment.PaymentRepository paymentRows;
  @Autowired com.varsityconnect.lostfound.LostFoundMatchRepository matchRows;
  @Autowired com.varsityconnect.lostfound.LostFoundReportRepository reportRows;
  @Autowired com.varsityconnect.support.SupportOfferRepository supportOffers;
  @Autowired com.varsityconnect.support.SupportRequestRepository supportRequests;
  @Autowired com.varsityconnect.community.CommunityCommentRepository communityComments;
  @Autowired com.varsityconnect.community.CommunityPostRepository communityPosts;

  private String sellerToken;
  private String buyerToken;
  private String buyerId;
  private String listingId;
  private String listing2Id;

  @BeforeEach
  void seed() throws Exception {
    notifications.deleteAll();
    paymentRows.deleteAll();
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
    JsonNode seller = register("cartseller@cput.ac.za", "227000001", "STUDENT");
    sellerToken = seller.get("token").asText();
    JsonNode buyer = register("cartbuyer@cput.ac.za", "227000002", "STUDENT");
    buyerToken = buyer.get("token").asText();
    buyerId = buyer.get("user").get("id").asText();
    listingId = createListing(sellerToken, "cart textbook", "for the basket", "350.00");
    listing2Id = createListing(sellerToken, "cart lamp", "bright led", "150.00");
  }

  private JsonNode register(String email, String studentNumber, String role) throws Exception {
    Map<String, Object> req =
        new java.util.HashMap<>(
            Map.of(
                "fullName", "cart user",
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

  private JsonNode addItem(String token, String listing) throws Exception {
    MvcResult result =
        mvc.perform(
                post("/api/v1/cart/items")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(Map.of("listingId", listing))))
            .andExpect(status().isOk())
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString());
  }

  private JsonNode getCart(String token) throws Exception {
    MvcResult result =
        mvc.perform(get("/api/v1/cart").header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString());
  }

  @Test
  void addActiveListingSucceeds() throws Exception {
    JsonNode cart = addItem(buyerToken, listingId);
    assertThat(cart.get("itemCount").asInt()).isEqualTo(1);
    assertThat(cart.get("subtotal").asDouble()).isEqualTo(350.00);
    assertThat(cart.get("items").get(0).get("title").asText()).isEqualTo("cart textbook");
  }

  @Test
  void addOwnListingFails() throws Exception {
    mvc.perform(
            post("/api/v1/cart/items")
                .header("Authorization", "Bearer " + sellerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("listingId", listingId))))
        .andExpect(status().isForbidden());
  }

  @Test
  void addUnavailableListingFails() throws Exception {
    mvc.perform(
            delete("/api/v1/marketplace/listings/" + listingId)
                .header("Authorization", "Bearer " + sellerToken))
        .andExpect(status().isOk());

    mvc.perform(
            post("/api/v1/cart/items")
                .header("Authorization", "Bearer " + buyerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("listingId", listingId))))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.code").value("LISTING_NOT_AVAILABLE"));
  }

  @Test
  void duplicateAddIsHandled() throws Exception {
    addItem(buyerToken, listingId);
    JsonNode cart = addItem(buyerToken, listingId);
    assertThat(cart.get("itemCount").asInt()).isEqualTo(1);
  }

  @Test
  void subtotalIsServerCalculated() throws Exception {
    addItem(buyerToken, listingId);
    JsonNode cart = addItem(buyerToken, listing2Id);
    assertThat(cart.get("itemCount").asInt()).isEqualTo(2);
    /* 350 + 150, no client totals anywhere in the request */
    assertThat(cart.get("subtotal").asDouble()).isEqualTo(500.00);
  }

  @Test
  void updateQuantityRecalculates() throws Exception {
    JsonNode cart = addItem(buyerToken, listingId);
    String itemId = cart.get("items").get(0).get("id").asText();

    MvcResult result =
        mvc.perform(
                patch("/api/v1/cart/items/" + itemId)
                    .header("Authorization", "Bearer " + buyerToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(Map.of("quantity", 2))))
            .andExpect(status().isOk())
            .andReturn();
    JsonNode updated = mapper.readTree(result.getResponse().getContentAsString());
    assertThat(updated.get("items").get(0).get("quantity").asInt()).isEqualTo(2);
    assertThat(updated.get("subtotal").asDouble()).isEqualTo(700.00);
  }

  @Test
  void removeWorks() throws Exception {
    JsonNode cart = addItem(buyerToken, listingId);
    String itemId = cart.get("items").get(0).get("id").asText();

    MvcResult result =
        mvc.perform(
                delete("/api/v1/cart/items/" + itemId).header("Authorization", "Bearer " + buyerToken))
            .andExpect(status().isOk())
            .andReturn();
    assertThat(mapper.readTree(result.getResponse().getContentAsString()).get("itemCount").asInt()).isEqualTo(0);
  }

  @Test
  void clearEmptiesTheCart() throws Exception {
    addItem(buyerToken, listingId);
    addItem(buyerToken, listing2Id);

    MvcResult result =
        mvc.perform(delete("/api/v1/cart").header("Authorization", "Bearer " + buyerToken))
            .andExpect(status().isOk())
            .andReturn();
    assertThat(mapper.readTree(result.getResponse().getContentAsString()).get("itemCount").asInt()).isEqualTo(0);
  }

  @Test
  void cartPersistsForTheBuyer() throws Exception {
    addItem(buyerToken, listingId);
    /* fresh read, same basket */
    JsonNode cart = getCart(buyerToken);
    assertThat(cart.get("itemCount").asInt()).isEqualTo(1);
    assertThat(cart.get("items").get(0).get("listingId").asText()).isEqualTo(listingId);
  }

  @Test
  void strangersCannotTouchAnotherCart() throws Exception {
    JsonNode cart = addItem(buyerToken, listingId);
    String itemId = cart.get("items").get(0).get("id").asText();
    JsonNode stranger = register("cartstranger@cput.ac.za", "227000003", "STUDENT");
    String strangerToken = stranger.get("token").asText();

    mvc.perform(
            patch("/api/v1/cart/items/" + itemId)
                .header("Authorization", "Bearer " + strangerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("quantity", 3))))
        .andExpect(status().isNotFound());

    /* buyer's basket untouched */
    assertThat(getCart(buyerToken).get("items").get(0).get("quantity").asInt()).isEqualTo(1);
    assertThat(buyerId).isNotBlank();
  }

  @Test
  void cartWithoutTokenReturns401() throws Exception {
    mvc.perform(get("/api/v1/cart")).andExpect(status().isUnauthorized());
  }
}
