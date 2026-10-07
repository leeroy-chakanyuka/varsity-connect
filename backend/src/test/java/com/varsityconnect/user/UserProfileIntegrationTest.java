package com.varsityconnect.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/* profile reads + edits against h2, ownership comes from the jwt only */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserProfileIntegrationTest {

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper mapper;
  @Autowired UserRepository users;

  @BeforeEach
  void clean() {
    users.deleteAll();
  }

  private JsonNode register(String email, String studentNumber, String role) throws Exception {
    Map<String, Object> req =
        new java.util.HashMap<>(
            Map.of(
                "fullName", "profile user",
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

  @Test
  void currentUserCanRetrieveOwnProfile() throws Exception {
    JsonNode reg = register("me@cput.ac.za", "221000001", "STUDENT");
    String token = reg.get("token").asText();

    mvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.email").value("me@cput.ac.za"))
        .andExpect(jsonPath("$.role").value("STUDENT"))
        .andExpect(jsonPath("$.averageRating").value(0.0))
        .andExpect(jsonPath("$.reviewCount").value(0));
  }

  @Test
  void publicProfileNeverExposesPasswordHash() throws Exception {
    JsonNode a = register("a@cput.ac.za", "221000002", "STUDENT");
    JsonNode b = register("b@cput.ac.za", "221000003", "VENDOR");
    String idB = b.get("user").get("id").asText();

    MvcResult result =
        mvc.perform(get("/api/v1/users/" + idB).header("Authorization", "Bearer " + a.get("token").asText()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("b@cput.ac.za"))
            .andReturn();
    assertThat(result.getResponse().getContentAsString())
        .doesNotContain("passwordHash")
        .doesNotContain("password_hash");
  }

  @Test
  void unknownProfileReturns404() throws Exception {
    JsonNode a = register("c@cput.ac.za", "221000004", "STUDENT");

    mvc.perform(
            get("/api/v1/users/" + UUID.randomUUID())
                .header("Authorization", "Bearer " + a.get("token").asText()))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"));
  }

  @Test
  void profileWithoutTokenReturns401() throws Exception {
    mvc.perform(get("/api/v1/users/me")).andExpect(status().isUnauthorized());
  }

  @Test
  void userCanEditAllowedFields() throws Exception {
    JsonNode reg = register("edit@cput.ac.za", "221000005", "STUDENT");
    String token = reg.get("token").asText();

    mvc.perform(
            patch("/api/v1/users/me")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"fullName":"new name","bio":"final year dev","faculty":"applied sciences","phoneNumber":"0123456789"}\
                    """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.fullName").value("new name"))
        .andExpect(jsonPath("$.bio").value("final year dev"));

    /* still there on a fresh read */
    mvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.fullName").value("new name"))
        .andExpect(jsonPath("$.faculty").value("applied sciences"));
  }

  @Test
  void protectedFieldsCannotChangeThroughProfileUpdate() throws Exception {
    JsonNode reg = register("locked@cput.ac.za", "221000006", "STUDENT");
    String token = reg.get("token").asText();

    /* role, email, number and enabled are not part of the patch dto,
     * whatever the client sends, they must not move (400 or ignored, both fine) */
    mvc.perform(
            patch("/api/v1/users/me")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"role":"ADMIN","email":"hacked@cput.ac.za",\
                    "studentNumber":"999999999","enabled":false}\
                    """))
        .andReturn();

    mvc.perform(get("/api/v1/users/me").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.role").value("STUDENT"))
        .andExpect(jsonPath("$.email").value("locked@cput.ac.za"))
        .andExpect(jsonPath("$.studentNumber").value("221000006"))
        .andExpect(jsonPath("$.enabled").value(true));
  }

  @Test
  void oversizedBioFailsValidation() throws Exception {
    JsonNode reg = register("big@cput.ac.za", "221000007", "STUDENT");
    String token = reg.get("token").asText();

    mvc.perform(
            patch("/api/v1/users/me")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"bio\":\"" + "x".repeat(1001) + "\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
  }
}
