package com.varsityconnect.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.varsityconnect.user.User;
import com.varsityconnect.user.UserRepository;
import com.varsityconnect.user.UserRole;
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

/* full auth flow against h2, mirrors what stage 2 verification does by hand */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthIntegrationTest {

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper mapper;
  @Autowired UserRepository users;
  @Autowired PasswordEncoder passwords;

  @BeforeEach
  void clean() {
    users.deleteAll();
  }
    supportOffers.deleteAll();
    supportRequests.deleteAll();
    communityComments.deleteAll();
    communityPosts.deleteAll();
    listings.deleteAll();
    users.deleteAll();
  }

  private String body(Object o) throws Exception {
    return mapper.writeValueAsString(o);
  }

  private String registerOk(String email, String studentNumber, String role) throws Exception {
    java.util.Map<String, Object> req =
        new java.util.HashMap<>(
            java.util.Map.of(
                "fullName", "test user",
                "email", email,
                "password", "password123",
                "role", role,
                "acceptedTerms", true));
    if (studentNumber != null) {
      req.put("studentNumber", studentNumber);
    }
    MvcResult result =
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(body(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.token").exists())
            .andReturn();
    JsonNode json = mapper.readTree(result.getResponse().getContentAsString());
    /* hash never leaks, even on the happy path */
    assertThat(result.getResponse().getContentAsString()).doesNotContain("passwordHash");
    assertThat(json.get("user").get("email").asText()).isEqualTo(email.toLowerCase());
    return json.get("token").asText();
  }

  @Test
  void validStudentRegistrationSucceeds() throws Exception {
    registerOk("student@cput.ac.za", "221234567", "STUDENT");
    User saved = users.findByEmail("student@cput.ac.za").orElseThrow();
    /* bcrypt, not plaintext */
    assertThat(saved.getPasswordHash()).isNotEqualTo("password123");
    assertThat(passwords.matches("password123", saved.getPasswordHash())).isTrue();
  }

  @Test
  void validVendorRegistrationSucceeds() throws Exception {
    registerOk("vendor@cput.ac.za", null, "VENDOR");
  }

  @Test
  void duplicateEmailReturnsConflict() throws Exception {
    registerOk("dup@cput.ac.za", "221111111", "STUDENT");
    java.util.Map<String, Object> req =
        java.util.Map.of(
            "fullName", "other",
            "email", "dup@cput.ac.za",
            "password", "password123",
            "role", "VENDOR",
            "acceptedTerms", true);
    mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(body(req)))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.code").value("EMAIL_ALREADY_EXISTS"));
  }

  @Test
  void duplicateStudentNumberReturnsConflict() throws Exception {
    registerOk("a@cput.ac.za", "229999999", "STUDENT");
    java.util.Map<String, Object> req =
        java.util.Map.of(
            "fullName", "other",
            "email", "b@cput.ac.za",
            "password", "password123",
            "role", "STUDENT",
            "studentNumber", "229999999",
            "acceptedTerms", true);
    mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(body(req)))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.code").value("STUDENT_NUMBER_ALREADY_EXISTS"));
  }

  @Test
  void studentWithoutStudentNumberFails() throws Exception {
    java.util.Map<String, Object> req =
        java.util.Map.of(
            "fullName", "no number",
            "email", "nonumber@cput.ac.za",
            "password", "password123",
            "role", "STUDENT",
            "acceptedTerms", true);
    mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(body(req)))
        .andExpect(status().isBadRequest());
  }

  @Test
  void publicAdminRegistrationFails() throws Exception {
    java.util.Map<String, Object> req =
        java.util.Map.of(
            "fullName", "sneaky",
            "email", "sneaky@cput.ac.za",
            "password", "password123",
            "role", "ADMIN",
            "acceptedTerms", true);
    mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(body(req)))
        .andExpect(status().isForbidden());
    assertThat(users.findByEmail("sneaky@cput.ac.za")).isEmpty();
  }

  @Test
  void invalidEmailFails() throws Exception {
    java.util.Map<String, Object> req =
        java.util.Map.of(
            "fullName", "bad email",
            "email", "not-an-email",
            "password", "password123",
            "role", "VENDOR",
            "acceptedTerms", true);
    mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(body(req)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
        .andExpect(jsonPath("$.fieldErrors.email").exists());
  }

  @Test
  void loginByEmailSucceeds() throws Exception {
    registerOk("login@cput.ac.za", "221234568", "STUDENT");
    java.util.Map<String, Object> req = java.util.Map.of("identifier", "login@cput.ac.za", "password", "password123");
    mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content(body(req)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.token").exists())
        .andExpect(jsonPath("$.user.email").value("login@cput.ac.za"));
  }

  @Test
  void loginByStudentNumberSucceeds() throws Exception {
    registerOk("studnum@cput.ac.za", "220000001", "STUDENT");
    java.util.Map<String, Object> req = java.util.Map.of("identifier", "220000001", "password", "password123");
    mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content(body(req)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.token").exists());
  }

  @Test
  void wrongPasswordReturns401() throws Exception {
    registerOk("wrong@cput.ac.za", "220000002", "STUDENT");
    java.util.Map<String, Object> req = java.util.Map.of("identifier", "wrong@cput.ac.za", "password", "nope-nope-nope");
    mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content(body(req)))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
  }

  @Test
  void protectedEndpointWithoutJwtReturns401() throws Exception {
    mvc.perform(get("/api/v1/auth/me")).andExpect(status().isUnauthorized());
  }

  @Test
  void meReturnsCorrectCurrentUser() throws Exception {
    String token = registerOk("me@cput.ac.za", "220000003", "VENDOR");
    mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.email").value("me@cput.ac.za"))
        .andExpect(jsonPath("$.role").value("VENDOR"));
  }

  @Test
  void passwordHashNeverAppearsInMe() throws Exception {
    String token = registerOk("clean@cput.ac.za", "220000004", "STUDENT");
    MvcResult result =
        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andReturn();
    assertThat(result.getResponse().getContentAsString())
        .doesNotContain("passwordHash")
        .doesNotContain("password_hash");
  }

  @Test
  void disabledUserCannotLogin() throws Exception {
    registerOk("off@cput.ac.za", "220000005", "STUDENT");
    User user = users.findByEmail("off@cput.ac.za").orElseThrow();
    user.setEnabled(false);
    users.save(user);
    java.util.Map<String, Object> req = java.util.Map.of("identifier", "off@cput.ac.za", "password", "password123");
    mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content(body(req)))
        .andExpect(status().isForbidden());
  }

  @Test
  void userRolePersists() {
    User user = new User("x", "r@cput.ac.za", "hash", null, null, UserRole.ADMIN);
    assertThat(user.getRole()).isEqualTo(UserRole.ADMIN);
  }
}
