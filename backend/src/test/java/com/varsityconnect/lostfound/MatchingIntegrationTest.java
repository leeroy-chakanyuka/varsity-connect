package com.varsityconnect.lostfound;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.varsityconnect.cart.CartItemRepository;
import com.varsityconnect.cart.CartRepository;
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

/* pairing flows against h2, people decide — never the algorithm alone */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MatchingIntegrationTest {

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper mapper;
  @Autowired UserRepository users;
  @Autowired MarketplaceListingRepository listings;
  @Autowired CartItemRepository cartItems;
  @Autowired CartRepository carts;
  @Autowired OrderRepository orders;
  @Autowired PaymentRepository payments;
  @Autowired com.varsityconnect.notification.NotificationRepository notifications;
  @Autowired LostFoundReportRepository reports;
  @Autowired LostFoundMatchRepository matches;
  @Autowired com.varsityconnect.support.SupportOfferRepository supportOffers;
  @Autowired com.varsityconnect.support.SupportRequestRepository supportRequests;
  @Autowired com.varsityconnect.community.CommunityCommentRepository communityComments;
  @Autowired com.varsityconnect.community.CommunityPostRepository communityPosts;

  private String lostOwnerToken;
  private String foundOwnerToken;
  private String strangerToken;

  @BeforeEach
  void seed() throws Exception {
    notifications.deleteAll();
    payments.deleteAll();
    orders.deleteAll();
    cartItems.deleteAll();
    carts.deleteAll();
    matches.deleteAll();
    reports.deleteAll();
    supportOffers.deleteAll();
    supportRequests.deleteAll();
    communityComments.deleteAll();
    communityPosts.deleteAll();
    listings.deleteAll();
    users.deleteAll();
    lostOwnerToken = register("lostowner@cput.ac.za", "22B000001").get("token").asText();
    foundOwnerToken = register("foundowner@cput.ac.za", "22B000002").get("token").asText();
    strangerToken = register("matchstranger@cput.ac.za", "22B000003").get("token").asText();
  }

  private void reportRowsCleanup() {
    /* reports cleared above, hook for later children */
  }

  private JsonNode register(String email, String studentNumber) throws Exception {
    Map<String, Object> req =
        new java.util.HashMap<>(
            Map.of(
                "fullName", "match user",
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

  private JsonNode create(
      String token, String type, String name, String category, String description, String location, String date)
      throws Exception {
    MvcResult result =
        mvc.perform(
                post("/api/v1/lost-found/reports")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        mapper.writeValueAsString(
                            Map.of(
                                "type", type,
                                "itemName", name,
                                "category", category,
                                "description", description,
                                "location", location,
                                "incidentDate", date))))
            .andExpect(status().isCreated())
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString());
  }

  private JsonNode matchesOf(String token, String reportId) throws Exception {
    MvcResult result =
        mvc.perform(
                get("/api/v1/lost-found/reports/" + reportId + "/matches")
                    .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString());
  }

  private JsonNode decide(String token, String matchId, String decision) throws Exception {
    MvcResult result =
        mvc.perform(
                post("/api/v1/lost-found/matches/" + matchId + "/decision")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(Map.of("decision", decision))))
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString());
  }

  private String statusOf(String reportId) throws Exception {
    MvcResult result =
        mvc.perform(get("/api/v1/lost-found/reports/" + reportId).header("Authorization", "Bearer " + lostOwnerToken))
            .andExpect(status().isOk())
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString()).get("status").asText();
  }

  @Test
  void sameTypeReportsAreIgnored() throws Exception {
    JsonNode lost =
        create(lostOwnerToken, "LOST", "black wallet", "OTHER", "lost near the library", "library", "2026-10-01");
    create(lostOwnerToken, "LOST", "black wallet", "OTHER", "lost near the library", "library", "2026-10-01");

    assertThat(matchesOf(lostOwnerToken, lost.get("id").asText()).size()).isEqualTo(0);
  }

  @Test
  void similarPairGeneratesMatch() throws Exception {
    JsonNode lost =
        create(lostOwnerToken, "LOST", "black wallet", "OTHER", "leather wallet with student card", "library steps", "2026-10-01");
    create(foundOwnerToken, "FOUND", "black wallet", "OTHER", "leather wallet holding a student card", "library steps", "2026-10-01");

    JsonNode pair = matchesOf(lostOwnerToken, lost.get("id").asText());
    assertThat(pair.size()).isEqualTo(1);
    assertThat(pair.get(0).get("score").asDouble()).isGreaterThanOrEqualTo(55.0);
    assertThat(lost.get("status").asText()).isEqualTo("OPEN");
    assertThat(statusOf(lost.get("id").asText())).isEqualTo("MATCH_PENDING");
  }

  @Test
  void unrelatedReportsStayUnmatched() throws Exception {
    JsonNode lost =
        create(lostOwnerToken, "LOST", "black wallet", "OTHER", "leather wallet with student card", "library steps", "2026-10-01");
    create(foundOwnerToken, "FOUND", "red bicycle", "OTHER", "mountain bike by the gate", "sports field", "2026-09-01");

    assertThat(matchesOf(lostOwnerToken, lost.get("id").asText()).size()).isEqualTo(0);
    assertThat(statusOf(lost.get("id").asText())).isEqualTo("OPEN");
  }

  @Test
  void thresholdIsRespected() throws Exception {
    /* same category + same day only: 0.35 + 0.10 = 0.45, below 0.55 */
    JsonNode lost =
        create(lostOwnerToken, "LOST", "wallet", "ELECTRONICS", "alpha beta gamma", "north hall", "2026-10-01");
    create(foundOwnerToken, "FOUND", "bicycle", "ELECTRONICS", "delta epsilon zeta", "south field", "2026-10-01");

    assertThat(matchesOf(lostOwnerToken, lost.get("id").asText()).size()).isEqualTo(0);
  }

  @Test
  void ownerCanDecideButNotTwice() throws Exception {
    JsonNode lost =
        create(lostOwnerToken, "LOST", "black wallet", "OTHER", "leather wallet with student card", "library steps", "2026-10-01");
    create(foundOwnerToken, "FOUND", "black wallet", "OTHER", "leather wallet holding a student card", "library steps", "2026-10-01");
    String matchId = matchesOf(lostOwnerToken, lost.get("id").asText()).get(0).get("id").asText();

    mvc.perform(
            post("/api/v1/lost-found/matches/" + matchId + "/decision")
                .header("Authorization", "Bearer " + lostOwnerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("decision", "ACCEPT"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.myDecision").value("ACCEPTED"));

    /* same side twice is a conflict */
    mvc.perform(
            post("/api/v1/lost-found/matches/" + matchId + "/decision")
                .header("Authorization", "Bearer " + lostOwnerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("decision", "REJECT"))))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.code").value("MATCH_ALREADY_DECIDED"));

    /* one accept is not confirmation */
    assertThat(statusOf(lost.get("id").asText())).isEqualTo("MATCH_PENDING");
  }

  @Test
  void matchedPairResolves() throws Exception {
    JsonNode lost =
        create(lostOwnerToken, "LOST", "black wallet", "OTHER", "leather wallet with student card", "library steps", "2026-10-01");
    JsonNode found =
        create(foundOwnerToken, "FOUND", "black wallet", "OTHER", "leather wallet holding a student card", "library steps", "2026-10-01");
    String matchId = matchesOf(lostOwnerToken, lost.get("id").asText()).get(0).get("id").asText();
    decide(lostOwnerToken, matchId, "ACCEPT");
    decide(foundOwnerToken, matchId, "ACCEPT");
    assertThat(statusOf(lost.get("id").asText())).isEqualTo("MATCHED");

    /* owner resolves, stranger may not */
    mvc.perform(
            post("/api/v1/lost-found/reports/" + found.get("id").asText() + "/resolve")
                .header("Authorization", "Bearer " + strangerToken))
        .andExpect(status().isForbidden());
    mvc.perform(
            post("/api/v1/lost-found/reports/" + lost.get("id").asText() + "/resolve")
                .header("Authorization", "Bearer " + lostOwnerToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("RESOLVED"));
    assertThat(statusOf(lost.get("id").asText())).isEqualTo("RESOLVED");
  }

  @Test
  void openReportCannotResolve() throws Exception {
    JsonNode lost =
        create(lostOwnerToken, "LOST", "lonely keys", "OTHER", "a single brass key", "bus stop", "2026-09-01");

    mvc.perform(
            post("/api/v1/lost-found/reports/" + lost.get("id").asText() + "/resolve")
                .header("Authorization", "Bearer " + lostOwnerToken))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("INVALID_STATE_TRANSITION"));
  }

  @Test
  void unrelatedUserCannotDecide() throws Exception {
    JsonNode lost =
        create(lostOwnerToken, "LOST", "black wallet", "OTHER", "leather wallet with student card", "library steps", "2026-10-01");
    create(foundOwnerToken, "FOUND", "black wallet", "OTHER", "leather wallet holding a student card", "library steps", "2026-10-01");
    String matchId = matchesOf(lostOwnerToken, lost.get("id").asText()).get(0).get("id").asText();

    mvc.perform(
            post("/api/v1/lost-found/matches/" + matchId + "/decision")
                .header("Authorization", "Bearer " + strangerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("decision", "ACCEPT"))))
        .andExpect(status().isForbidden());
  }

  @Test
  void dualAcceptanceMatchesBoth() throws Exception {
    JsonNode lost =
        create(lostOwnerToken, "LOST", "black wallet", "OTHER", "leather wallet with student card", "library steps", "2026-10-01");
    JsonNode found =
        create(foundOwnerToken, "FOUND", "black wallet", "OTHER", "leather wallet holding a student card", "library steps", "2026-10-01");
    String matchId = matchesOf(lostOwnerToken, lost.get("id").asText()).get(0).get("id").asText();

    decide(lostOwnerToken, matchId, "ACCEPT");
    decide(foundOwnerToken, matchId, "ACCEPT");

    assertThat(statusOf(lost.get("id").asText())).isEqualTo("MATCHED");
    MvcResult detail =
        mvc.perform(get("/api/v1/lost-found/reports/" + found.get("id").asText()).header("Authorization", "Bearer " + foundOwnerToken))
            .andExpect(status().isOk())
            .andReturn();
    assertThat(mapper.readTree(detail.getResponse().getContentAsString()).get("status").asText())
        .isEqualTo("MATCHED");
  }

  @Test
  void rejectionKeepsReportsAvailable() throws Exception {
    JsonNode lost =
        create(lostOwnerToken, "LOST", "black wallet", "OTHER", "leather wallet with student card", "library steps", "2026-10-01");
    JsonNode first =
        create(foundOwnerToken, "FOUND", "black wallet", "OTHER", "leather wallet holding a student card", "library steps", "2026-10-01");
    JsonNode second =
        create(foundOwnerToken, "FOUND", "black wallet", "OTHER", "black leather wallet student card inside", "library steps", "2026-10-02");
    JsonNode pair = matchesOf(lostOwnerToken, lost.get("id").asText());
    assertThat(pair.size()).isEqualTo(2);

    String firstMatchId = null;
    for (JsonNode match : pair) {
      if (match.get("otherReportId").asText().equals(first.get("id").asText())) {
        firstMatchId = match.get("id").asText();
      }
    }
    assertThat(firstMatchId).isNotNull();

    /* lost side rejects the first pair */
    decide(lostOwnerToken, firstMatchId, "REJECT");

    /* first found report drops back to open, lost still has the second pair */
    MvcResult detail =
        mvc.perform(get("/api/v1/lost-found/reports/" + first.get("id").asText()).header("Authorization", "Bearer " + foundOwnerToken))
            .andExpect(status().isOk())
            .andReturn();
    assertThat(mapper.readTree(detail.getResponse().getContentAsString()).get("status").asText())
        .isEqualTo("OPEN");
    assertThat(statusOf(lost.get("id").asText())).isEqualTo("MATCH_PENDING");
    assertThat(statusOf(second.get("id").asText())).isEqualTo("MATCH_PENDING");
  }
}
