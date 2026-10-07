package com.varsityconnect.cart;

import com.varsityconnect.security.UserPrincipal;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/* thin basket doors, the jwt picks the basket */
@RestController
@RequestMapping("/api/v1/cart")
public class CartController {

  private final CartService service;

  public CartController(CartService service) {
    this.service = service;
  }

  @GetMapping
  public CartResponse get(@AuthenticationPrincipal UserPrincipal principal) {
    return service.getCart(principal);
  }

  @PostMapping("/items")
  public CartResponse add(
      @AuthenticationPrincipal UserPrincipal principal,
      @Valid @RequestBody AddCartItemRequest request) {
    return service.addItem(principal, request);
  }

  @PatchMapping("/items/{cartItemId}")
  public CartResponse update(
      @AuthenticationPrincipal UserPrincipal principal,
      @PathVariable UUID cartItemId,
      @Valid @RequestBody UpdateCartItemRequest request) {
    return service.updateQuantity(principal, cartItemId, request);
  }

  @DeleteMapping("/items/{cartItemId}")
  public CartResponse remove(
      @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID cartItemId) {
    return service.removeItem(principal, cartItemId);
  }

  @DeleteMapping
  public CartResponse clear(@AuthenticationPrincipal UserPrincipal principal) {
    return service.clear(principal);
  }
}
