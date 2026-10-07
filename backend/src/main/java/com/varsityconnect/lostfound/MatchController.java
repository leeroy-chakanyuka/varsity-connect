package com.varsityconnect.lostfound;

import com.varsityconnect.security.UserPrincipal;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/* match doors, decisions always resolve to an involved owner */
@RestController
@RequestMapping("/api/v1/lost-found")
public class MatchController {

  private final MatchingService service;

  public MatchController(MatchingService service) {
    this.service = service;
  }

  @GetMapping("/reports/{reportId}/matches")
  public List<MatchResponse> matches(
      @PathVariable UUID reportId, @AuthenticationPrincipal UserPrincipal principal) {
    return service.matchesFor(reportId, principal);
  }

  @PostMapping("/matches/{matchId}/decision")
  public MatchResponse decide(
      @PathVariable UUID matchId,
      @AuthenticationPrincipal UserPrincipal principal,
      @Valid @RequestBody DecideMatchRequest request) {
    return service.decide(matchId, principal, request);
  }
}
