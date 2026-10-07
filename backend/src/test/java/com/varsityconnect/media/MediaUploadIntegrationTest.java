package com.varsityconnect.media;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/* upload doors against h2, files land in ./uploads-test (gitignored) */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MediaUploadIntegrationTest {

  @Autowired MockMvc mvc;
  @Autowired ObjectMapper mapper;
  @Autowired com.varsityconnect.user.UserRepository users;

  private String token;

  @BeforeEach
  void register() throws Exception {
    users.deleteAll();
    Map<String, Object> req =
        Map.of(
            "fullName", "media user",
            "email", "media@cput.ac.za",
            "password", "password123",
            "role", "STUDENT",
            "studentNumber", "225000001",
            "acceptedTerms", true);
    MvcResult result =
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andReturn();
    token = mapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
  }

  private MockMultipartFile image(String name, String type) {
    return new MockMultipartFile("files", name, type, new byte[] {1, 2, 3, 4});
  }

  private String uploadAndGetUrl(MockMultipartFile file, String purpose) throws Exception {
    MvcResult result =
        mvc.perform(
                multipart("/api/v1/media/uploads")
                    .file(file)
                    .param("purpose", purpose)
                    .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.files[0].url").exists())
            .andReturn();
    return mapper.readTree(result.getResponse().getContentAsString()).get("files").get(0).get("url").asText();
  }

  @Test
  void validJpgUploadSucceeds() throws Exception {
    String url = uploadAndGetUrl(image("photo.jpg", "image/jpeg"), "LISTING");
    assertThat(url).matches("/uploads/listing/[0-9a-f\\-]{36}\\.jpg");
  }

  @Test
  void validPngUploadSucceeds() throws Exception {
    String url = uploadAndGetUrl(image("photo.png", "image/png"), "PROFILE");
    assertThat(url).matches("/uploads/profile/[0-9a-f\\-]{36}\\.png");
  }

  @Test
  void validWebpUploadSucceeds() throws Exception {
    String url = uploadAndGetUrl(image("photo.webp", "image/webp"), "LISTING");
    assertThat(url).endsWith(".webp");
  }

  @Test
  void uploadedFileIsAccessibleThroughReturnedUrl() throws Exception {
    String url = uploadAndGetUrl(image("photo.jpg", "image/jpeg"), "LISTING");

    byte[] body =
        mvc.perform(get(url).header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsByteArray();
    assertThat(body).containsExactly(1, 2, 3, 4);
  }

  @Test
  void unsupportedTypeFails() throws Exception {
    mvc.perform(
            multipart("/api/v1/media/uploads")
                .file(new MockMultipartFile("files", "notes.txt", "text/plain", new byte[] {1}))
                .header("Authorization", "Bearer " + token))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("MEDIA_UPLOAD_FAILED"));
  }

  @Test
  void renamedExecutableFails() throws Exception {
    mvc.perform(
            multipart("/api/v1/media/uploads")
                .file(new MockMultipartFile("files", "run.exe", "image/png", new byte[] {1}))
                .header("Authorization", "Bearer " + token))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("MEDIA_UPLOAD_FAILED"));
  }

  @Test
  void oversizedFileFails() throws Exception {
    byte[] big = new byte[5 * 1024 * 1024 + 1];
    mvc.perform(
            multipart("/api/v1/media/uploads")
                .file(new MockMultipartFile("files", "huge.jpg", "image/jpeg", big))
                .header("Authorization", "Bearer " + token))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("MEDIA_UPLOAD_FAILED"));
  }

  @Test
  void moreThanFiveFilesFails() throws Exception {
    var builder = multipart("/api/v1/media/uploads");
    for (int i = 0; i < 6; i++) {
      builder.file(image("p" + i + ".jpg", "image/jpeg"));
    }
    mvc.perform(builder.param("purpose", "LISTING").header("Authorization", "Bearer " + token))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("MEDIA_UPLOAD_FAILED"));
  }

  @Test
  void traversalFilenameStaysSafe() throws Exception {
    String url = uploadAndGetUrl(image("../../evil.jpg", "image/jpeg"), "LISTING");
    assertThat(url).doesNotContain("..").matches("/uploads/listing/[0-9a-f\\-]{36}\\.jpg");
  }

  @Test
  void uploadWithoutTokenReturns401() throws Exception {
    mvc.perform(multipart("/api/v1/media/uploads").file(image("photo.jpg", "image/jpeg")))
        .andExpect(status().isUnauthorized());
  }
}
