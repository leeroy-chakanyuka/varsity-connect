package com.varsityconnect.cart;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/* basket view, totals always come from the server side */
public record CartResponse(UUID id, List<CartItemResponse> items, int itemCount, BigDecimal subtotal) {

  public record CartItemResponse(
      UUID id, UUID listingId, String title, String sellerName, BigDecimal price, String imageUrl, int quantity, BigDecimal lineTotal) {}

  public static CartResponse from(Cart cart) {
    List<CartItemResponse> items =
        cart.getItems().stream()
            .map(
                item -> {
                  var listing = item.getListing();
                  String cover =
                      listing.getImages().isEmpty() ? null : listing.getImages().get(0).getImageUrl();
                  return new CartItemResponse(
                      item.getId(),
                      listing.getId(),
                      listing.getTitle(),
                      listing.getSeller().getFullName(),
                      listing.getPrice(),
                      cover,
                      item.getQuantity(),
                      listing.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
                })
            .toList();
    BigDecimal subtotal =
        items.stream().map(CartItemResponse::lineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
    return new CartResponse(cart.getId(), items, items.size(), subtotal);
  }
}
