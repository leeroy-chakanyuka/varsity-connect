package com.varsityconnect.common;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/* proves our error shape stays stable before auth tests lean on it */
class GlobalExceptionHandlerTest {

  /* tiny throwaway controller, one route per failure we promise */

  @RestController
  static class Probe {
    @GetMapping("/probe/missing")
    public String missing() {
      throw new NotFoundException("nothing here");
    }

    @GetMapping("/probe/conflict")
    public String conflict() {
      throw new ConflictException("EMAIL_ALREADY_EXISTS", "email is already registered");
    }

    @GetMapping("/probe/forbidden")
    public String forbidden() {
      throw new ForbiddenException("nope");
    }

    @GetMapping("/probe/boom")
    public String boom() {
      throw new RuntimeException("raw internals that must never leak");
    }

    record Body(@NotBlank(message = "name is required") String name) {}

    @PostMapping("/probe/validate")
    public String validate(@Valid @RequestBody Body body) {
      return "ok " + body.name();
    }
  }

  private final MockMvc mvc =
      MockMvcBuilders.standaloneSetup(new Probe())
          .setControllerAdvice(new GlobalExceptionHandler())
          .build();

  @Test
  void unknownResourceMapsTo404() throws Exception {
    mvc.perform(get("/probe/missing"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"))
        .andExpect(jsonPath("$.status").value(404))
        .andExpect(jsonPath("$.path").value("/probe/missing"));
  }

  @Test
  void conflictMapsTo409() throws Exception {
    mvc.perform(get("/probe/conflict"))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.code").value("EMAIL_ALREADY_EXISTS"));
  }

  @Test
  void forbiddenMapsTo403() throws Exception {
    mvc.perform(get("/probe/forbidden"))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("FORBIDDEN"));
  }

  @Test
  void genericErrorHidesInternals() throws Exception {
    mvc.perform(get("/probe/boom"))
        .andExpect(status().isInternalServerError())
        .andExpect(jsonPath("$.code").value("INTERNAL_ERROR"))
        .andExpect(jsonPath("$.message").value("something went wrong"));
  }

  @Test
  void validationErrorsReturnFieldMap() throws Exception {
    mvc.perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/probe/validate")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
        .andExpect(jsonPath("$.fieldErrors.name").value("name is required"));
  }
}
