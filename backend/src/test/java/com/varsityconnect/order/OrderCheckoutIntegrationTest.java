package com.varsityconnect.order;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.varsityconnect.cart.Cart;
import com.varsityconnect.cart.CartItem;
import com.varsityconnect.cart.CartItemRepository;
import com.varsityconnect.cart.CartRepository;
import com.varsityconnect.marketplace.MarketplaceListing;
import com.varsityconnect.marketplace.MarketplaceListingRepository;
import com.varsityconnect.user.User;
import com.varsityconnect.user.UserRepository;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/* checkout flows against h2, one transaction per order */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OrderCheckoutIntegrationTest {

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper mapper;
  @Autowired UserRepository users;
  @Autowired MarketplaceListingRepository listings;
  @Autowired CartItemRepository cartItems;
  @Autowired CartRepository carts;
  @Autowired OrderRepository orders;

  private String sellerToken;
  private String buyerToken;
  private String buyerId;
  private String otherToken;
  private String listingId;

  @BeforeEach
  void seed() throws Exception {
    cartItems.deleteAll();
    carts.deleteAll();
    orders.deleteAll();
    listings.deleteAll();
    users.deleteAll();
    sellerToken = register("orderseller@cput.ac.za", "228000001", "STUDENT").get("token").asText();
    JsonNode buyer = register("orderbuyer@cput.ac.za", "228000002", "STUDENT");
    buyerToken = buyer.get("token").asText();
    buyerId = buyer.get("user").get("id").asText();
    otherToken = register("orderother@cput.ac.za", "228000003", "STUDENT").get("token").asText();
    listingId = createListing(sellerToken, "checkout textbook", "for the order", "350.00");
  }

  private JsonNode register(String email, String studentNumber, String role) throws Exception {
    Map<String, Object> req =
        new java.util.HashMap<>(
            Map.of(
                "fullName", "order user",
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

  private void addToCart(String token, String listing) throws Exception {
    mvc.perform(
            post("/api/v1/cart/items")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("listingId", listing))))
        .andExpect(status().isOk());
  }

  private MvcResult checkout(String token) throws Exception {
    return mvc.perform(
            post("/api/v1/orders")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    mapper.writeValueAsString(
                        Map.of("deliveryMethod", "CAMPUS_COLLECTION", "paymentMethod", "MOCK_CARD"))))
        .andReturn();
  }

  @Test
  void emptyCartCheckoutFails() throws Exception {
    mvc.perform(
            post("/api/v1/orders")
                .header("Authorization", "Bearer " + buyerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    mapper.writeValueAsString(
                        Map.of("deliveryMethod", "CAMPUS_COLLECTION", "paymentMethod", "MOCK_CARD"))))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("CART_EMPTY"));
  }

  @Test
  void checkoutSnapshotsAndReserves() throws Exception {
    addToCart(buyerToken, listingId);

    MvcResult result = checkout(buyerToken);
    assertThat(result.getResponse().getStatus()).isEqualTo(201);
    JsonNode order = mapper.readTree(result.getResponse().getContentAsString());

    assertThat(order.get("status").asText()).isEqualTo("PENDING_PAYMENT");
    assertThat(order.get("buyerId").asText()).isEqualTo(buyerId);
    assertThat(order.get("subtotal").asDouble()).isEqualTo(350.00);
    assertThat(order.get("total").asDouble()).isEqualTo(350.00);
    assertThat(order.get("items").get(0).get("title").asText()).isEqualTo("checkout textbook");
    assertThat(order.get("items").get(0).get("unitPrice").asDouble()).isEqualTo(350.00);
    assertThat(order.get("items").get(0).get("listingId").asText()).isEqualTo(listingId);

    /* off the shelf now */
    MvcResult detail =
        mvc.perform(
                get("/api/v1/marketplace/listings/" + listingId)
                    .header("Authorization", "Bearer " + sellerToken))
            .andExpect(status().isOk())
            .andReturn();
    assertThat(mapper.readTree(detail.getResponse().getContentAsString()).get("status").asText())
        .isEqualTo("RESERVED");
  }

  @Test
  void ownListingCannotBeCheckedOut() throws Exception {
    /* plant the forbidden row straight past the cart guard */
    User seller = users.findByEmail("orderseller@cput.ac.za").orElseThrow();
    MarketplaceListing listing = listings.findById(UUID.fromString(listingId)).orElseThrow();
    Cart cart = carts.save(new Cart(seller));
    cartItems.save(new CartItem(cart, listing, 1));

    mvc.perform(
            post("/api/v1/orders")
                .header("Authorization", "Bearer " + sellerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    mapper.writeValueAsString(
                        Map.of("deliveryMethod", "CAMPUS_COLLECTION", "paymentMethod", "MOCK_CARD"))))
        .andExpect(status().isForbidden());
  }

  @Test
  void archivedListingCannotBeCheckedOut() throws Exception {
    addToCart(buyerToken, listingId);
    mvc.perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete(
                    "/api/v1/marketplace/listings/" + listingId)
                .header("Authorization", "Bearer " + sellerToken))
        .andExpect(status().isOk());

    MvcResult result = checkout(buyerToken);
    assertThat(result.getResponse().getStatus()).isEqualTo(409);
    assertThat(mapper.readTree(result.getResponse().getContentAsString()).get("code").asText())
        .isEqualTo("LISTING_NOT_AVAILABLE");
  }

  @Test
  void orderBelongsToAuthenticatedBuyer() throws Exception {
    addToCart(buyerToken, listingId);
    JsonNode order = mapper.readTree(checkout(buyerToken).getResponse().getContentAsString());
    String orderId = order.get("id").asText();

    /* own receipt opens */
    mvc.perform(get("/api/v1/orders/" + orderId).header("Authorization", "Bearer " + buyerToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.buyerId").value(buyerId));

    /* mine lists it */
    MvcResult mine =
        mvc.perform(get("/api/v1/orders").header("Authorization", "Bearer " + buyerToken))
            .andExpect(status().isOk())
            .andReturn();
    assertThat(mapper.readTree(mine.getResponse().getContentAsString()).get("totalElements").asInt())
        .isEqualTo(1);
  }

  @Test
  void strangerCannotReadPrivateOrder() throws Exception {
    addToCart(buyerToken, listingId);
    String orderId = mapper.readTree(checkout(buyerToken).getResponse().getContentAsString()).get("id").asText();

    /* 404, never a hint it exists */
    mvc.perform(get("/api/v1/orders/" + orderId).header("Authorization", "Bearer " + otherToken))
        .andExpect(status().isNotFound());
  }

  @Test
  void racingCheckoutsReserveOnlyOnce() throws Exception {
    addToCart(buyerToken, listingId);
    addToCart(otherToken, listingId);

    CountDownLatch gun = new CountDownLatch(1);
    ExecutorService pool = Executors.newFixedThreadPool(2);
    Callable<Integer> forBuyer =
        () -> {
          gun.await(10, TimeUnit.SECONDS);
          return checkout(buyerToken).getResponse().getStatus();
        };
    Callable<Integer> forOther =
        () -> {
          gun.await(10, TimeUnit.SECONDS);
          return checkout(otherToken).getResponse().getStatus();
        };
    Future<Integer> first = pool.submit(forBuyer);
    Future<Integer> second = pool.submit(forOther);
    gun.countDown();

    int a = first.get(30, TimeUnit.SECONDS);
    int b = second.get(30, TimeUnit.SECONDS);
    pool.shutdownNow();

    /* exactly one basket wins, the other bounces */
    assertThat(java.util.List.of(a, b)).containsExactlyInAnyOrder(201, 409);
    assertThat(orders.count()).isEqualTo(1);
  }
}
