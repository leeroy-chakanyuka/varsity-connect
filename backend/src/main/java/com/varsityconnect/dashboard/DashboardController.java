package com.varsityconnect.dashboard;

import com.varsityconnect.security.UserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/* one home call, identity always comes from the jwt */
@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

  private final DashboardService service;

  public DashboardController(DashboardService service) {
    this.service = service;
  }

  @GetMapping
  public DashboardResponse get(@AuthenticationPrincipal UserPrincipal principal) {
    return service.get(principal);
  }
}
