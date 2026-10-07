package com.varsityconnect.lostfound;

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

/* report flows against h2, ownership comes from the jwt only */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class LostFoundIntegrationTest {

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper mapper;
  @Autowired UserRepository users;
  @Autowired LostFoundReportRepository reports;

  private String ownerToken;
  private String strangerToken;

  @BeforeEach
  void seed() throws Exception {
    reports.deleteAll();
    users.deleteAll();
    ownerToken = register("reportowner@cput.ac.za", "22A000001", "STUDENT").get("token").asText();
    strangerToken = register("reportstranger@cput.ac.za", "22A000002", "STUDENT").get("token").asText();
  }

  private JsonNode register(String email, String studentNumber, String role) throws Exception {
    Map<String, Object> req =
        new java.util.HashMap<>(
            Map.of(
                "fullName", "report user",
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

  private String create(
      String token, String type, String name, String description, String location) throws Exception {
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
                                "category", "ELECTRONICS",
                                "description", description,
                                "location", location,
                                "incidentDate", "2026-10-01"))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("OPEN"))
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
  }

  private int count(String url, String token) throws Exception {
    MvcResult result =
        mvc.perform(get(url).header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString()).get("totalElements").asInt();
  }

  @Test
  void createLostReport() throws Exception {
    String id = create(ownerToken, "LOST", "black wallet", "lost near the library steps", "library");
    assertThat(id).isNotBlank();
  }

  @Test
  void createFoundReport() throws Exception {
    String id = create(ownerToken, "FOUND", "silver laptop", "found in lab 3, sticker on lid", "engineering building");
    MvcResult result =
        mvc.perform(get("/api/v1/lost-found/reports/" + id).header("Authorization", "Bearer " + ownerToken))
            .andExpect(status().isOk())
            .andReturn();
    assertThat(mapper.readTree(result.getResponse().getContentAsString()).get("type").asText())
        .isEqualTo("FOUND");
  }

  @Test
  void searchWorks() throws Exception {
    create(ownerToken, "LOST", "black wallet", "lost near the library steps", "library");
    create(ownerToken, "FOUND", "silver laptop", "found in lab 3", "engineering building");

    assertThat(count("/api/v1/lost-found/reports?search=wallet", ownerToken)).isEqualTo(1);
  }

  @Test
  void typeFilterWorks() throws Exception {
    create(ownerToken, "LOST", "black wallet", "lost near the library", "library");
    create(ownerToken, "LOST", "red scarf", "lost on the bus", "bus stop");
    create(ownerToken, "FOUND", "silver laptop", "found in lab 3", "engineering building");

    assertThat(count("/api/v1/lost-found/reports?type=LOST", ownerToken)).isEqualTo(2);
    assertThat(count("/api/v1/lost-found/reports?type=FOUND", ownerToken)).isEqualTo(1);
  }

  @Test
  void ownershipRestrictionsWork() throws Exception {
    String id = create(ownerToken, "LOST", "black wallet", "lost near the library", "library");

    mvc.perform(
            patch("/api/v1/lost-found/reports/" + id)
                .header("Authorization", "Bearer " + strangerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"location\":\"moved\"}"))
        .andExpect(status().isForbidden());

    mvc.perform(delete("/api/v1/lost-found/reports/" + id).header("Authorization", "Bearer " + strangerToken))
        .andExpect(status().isForbidden());

    /* owner edit lands */
    mvc.perform(
            patch("/api/v1/lost-found/reports/" + id)
                .header("Authorization", "Bearer " + ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"location\":\"lost at cafeteria\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.location").value("lost at cafeteria"));

    /* owner close hides it from the default browse */
    mvc.perform(delete("/api/v1/lost-found/reports/" + id).header("Authorization", "Bearer " + ownerToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("CLOSED"));
    assertThat(count("/api/v1/lost-found/reports?search=wallet", ownerToken)).isEqualTo(0);
  }

  @Test
  void missingNameFailsValidation() throws Exception {
    mvc.perform(
            post("/api/v1/lost-found/reports")
                .header("Authorization", "Bearer " + ownerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    mapper.writeValueAsString(
                        Map.of(
                            "type", "LOST",
                            "category", "ELECTRONICS",
                            "description", "no name given",
                            "location", "library",
                            "incidentDate", "2026-10-01"))))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
  }
}
