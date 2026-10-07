package com.varsityconnect.support;

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
import com.varsityconnect.payment.PaymentRepository;
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

/* two-user help flows against h2, every move checks its side */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SupportIntegrationTest {

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
  @Autowired SupportOfferRepository offers;
  @Autowired SupportRequestRepository requests;
  @Autowired com.varsityconnect.notification.NotificationRepository notifications;
  @Autowired com.varsityconnect.community.CommunityCommentRepository communityComments;
  @Autowired com.varsityconnect.community.CommunityPostRepository communityPosts;

  private String requesterToken;
  private String helperToken;

  @BeforeEach
  void seed() throws Exception {
    notifications.deleteAll();
    payments.deleteAll();
    orders.deleteAll();
    cartItems.deleteAll();
    carts.deleteAll();
    matchRows.deleteAll();
    reportRows.deleteAll();
    offers.deleteAll();
    requests.deleteAll();
    communityComments.deleteAll();
    communityPosts.deleteAll();
    listings.deleteAll();
    users.deleteAll();
    requesterToken = register("helpee@cput.ac.za", "22C000001").get("token").asText();
    helperToken = register("helper@cput.ac.za", "22C000002").get("token").asText();
  }

  private JsonNode register(String email, String studentNumber) throws Exception {
    Map<String, Object> req =
        new java.util.HashMap<>(
            Map.of(
                "fullName", "support user",
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

  private String createRequest(String token) throws Exception {
    MvcResult result =
        mvc.perform(
                post("/api/v1/support/requests")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        mapper.writeValueAsString(
                            Map.of(
                                "type", "FOOD",
                                "title", "need dinner tonight",
                                "description", "stipend late, one meal please",
                                "location", "res block c",
                                "urgency", "HIGH"))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("OPEN"))
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
  }

  private String offer(String token, String requestId) throws Exception {
    MvcResult result =
        mvc.perform(
                post("/api/v1/support/requests/" + requestId + "/offers")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(Map.of("message", "i can bring pap and stew"))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("PENDING"))
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
  }

  private String requestStatus(String requestId) throws Exception {
    MvcResult result =
        mvc.perform(get("/api/v1/support/requests/" + requestId).header("Authorization", "Bearer " + requesterToken))
            .andExpect(status().isOk())
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString()).get("status").asText();
  }

  @Test
  void fullLifecycle() throws Exception {
    String requestId = createRequest(requesterToken);
    String offerId = offer(helperToken, requestId);
    assertThat(requestStatus(requestId)).isEqualTo("OFFER_RECEIVED");

    /* requester accepts, both sides move */
    mvc.perform(post("/api/v1/support/offers/" + offerId + "/accept").header("Authorization", "Bearer " + requesterToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("ACCEPTED"));
    assertThat(requestStatus(requestId)).isEqualTo("IN_PROGRESS");

    /* requester resolves, accepted hand completes */
    mvc.perform(post("/api/v1/support/requests/" + requestId + "/resolve").header("Authorization", "Bearer " + requesterToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("RESOLVED"));

    MvcResult list =
        mvc.perform(get("/api/v1/support/requests/" + requestId + "/offers").header("Authorization", "Bearer " + requesterToken))
            .andExpect(status().isOk())
            .andReturn();
    assertThat(mapper.readTree(list.getResponse().getContentAsString()).get(0).get("status").asText())
        .isEqualTo("COMPLETED");
  }

  @Test
  void userCannotOfferOnOwnRequest() throws Exception {
    String requestId = createRequest(requesterToken);

    mvc.perform(
            post("/api/v1/support/requests/" + requestId + "/offers")
                .header("Authorization", "Bearer " + requesterToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("message", "helping myself"))))
        .andExpect(status().isForbidden());
  }

  @Test
  void nonRequesterCannotAccept() throws Exception {
    String requestId = createRequest(requesterToken);
    String offerId = offer(helperToken, requestId);

    mvc.perform(post("/api/v1/support/offers/" + offerId + "/accept").header("Authorization", "Bearer " + helperToken))
        .andExpect(status().isForbidden());
    assertThat(requestStatus(requestId)).isEqualTo("OFFER_RECEIVED");
  }

  @Test
  void resolvedRequestsRefuseNewOffers() throws Exception {
    String requestId = createRequest(requesterToken);
    mvc.perform(post("/api/v1/support/requests/" + requestId + "/resolve").header("Authorization", "Bearer " + requesterToken))
        .andExpect(status().isOk());

    mvc.perform(
            post("/api/v1/support/requests/" + requestId + "/offers")
                .header("Authorization", "Bearer " + helperToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("message", "too late"))))
        .andExpect(status().isBadRequest());
  }

  @Test
  void doubleAcceptFails() throws Exception {
    String requestId = createRequest(requesterToken);
    String offerId = offer(helperToken, requestId);

    mvc.perform(post("/api/v1/support/offers/" + offerId + "/accept").header("Authorization", "Bearer " + requesterToken))
        .andExpect(status().isOk());
    mvc.perform(post("/api/v1/support/offers/" + offerId + "/accept").header("Authorization", "Bearer " + requesterToken))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("INVALID_STATE_TRANSITION"));
  }

  @Test
  void responderCanWithdraw() throws Exception {
    String requestId = createRequest(requesterToken);
    String offerId = offer(helperToken, requestId);

    mvc.perform(post("/api/v1/support/offers/" + offerId + "/withdraw").header("Authorization", "Bearer " + helperToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("WITHDRAWN"));

    /* requester cannot withdraw someone else's hand */
    String offer2 = offer(helperToken, requestId);
    mvc.perform(post("/api/v1/support/offers/" + offer2 + "/withdraw").header("Authorization", "Bearer " + requesterToken))
        .andExpect(status().isForbidden());
  }
}
