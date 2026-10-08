package com.varsityconnect.seed;

import com.varsityconnect.marketplace.ListingCategory;
import com.varsityconnect.marketplace.ListingCondition;
import com.varsityconnect.marketplace.MarketplaceListing;
import com.varsityconnect.marketplace.MarketplaceListingRepository;
import com.varsityconnect.user.User;
import com.varsityconnect.user.UserRepository;
import com.varsityconnect.user.UserRole;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/* dev shelf stocking, tops the market up to a lively count on every boot.
 * test and prod profiles never load this — demos stay out of real data. */
@Component
@Profile("dev")
public class DevDataSeeder implements ApplicationRunner {

  private static final Logger log = LoggerFactory.getLogger(DevDataSeeder.class);

  /* about four hundred listings, spread across everything students trade */
  private static final int TARGET_LISTINGS = 400;

  private static final String[] SELLERS = {
    "seed-amahle", "seed-bongani", "seed-chen", "seed-dineo", "seed-eliers"
  };

  private static final Object[][] SHELF = {
    {"calculus textbook", ListingCategory.TEXTBOOKS, 350},
    {"physics textbook", ListingCategory.TEXTBOOKS, 280},
    {"accounting textbook", ListingCategory.TEXTBOOKS, 420},
    {"isizulu dictionary", ListingCategory.TEXTBOOKS, 150},
    {"dell laptop", ListingCategory.ELECTRONICS, 4500},
    {"hp printer", ListingCategory.ELECTRONICS, 1200},
    {"jbl speaker", ListingCategory.ELECTRONICS, 800},
    {"samsung monitor", ListingCategory.ELECTRONICS, 1800},
    {"scientific calculator", ListingCategory.ELECTRONICS, 350},
    {"desk lamp", ListingCategory.ELECTRONICS, 200},
    {"winter jacket", ListingCategory.CLOTHING, 600},
    {"lab coat", ListingCategory.CLOTHING, 250},
    {"sneakers", ListingCategory.CLOTHING, 700},
    {"backpack", ListingCategory.CLOTHING, 450},
    {"study desk", ListingCategory.FURNITURE, 900},
    {"bookshelf", ListingCategory.FURNITURE, 650},
    {"desk chair", ListingCategory.FURNITURE, 550},
    {"bedside lamp", ListingCategory.FURNITURE, 200},
    {"past papers bundle", ListingCategory.STUDY_MATERIALS, 100},
    {"lab manual set", ListingCategory.STUDY_MATERIALS, 180},
    {"drawing kit", ListingCategory.STUDY_MATERIALS, 320},
    {"tutoring hour", ListingCategory.SERVICES, 150},
    {"poster printing", ListingCategory.SERVICES, 60},
    {"bike lock", ListingCategory.OTHER, 120},
    {"umbrella", ListingCategory.OTHER, 90},
    {"water bottle", ListingCategory.OTHER, 70},
  };

  private static final ListingCondition[] CONDITIONS = {
    ListingCondition.NEW,
    ListingCondition.LIKE_NEW,
    ListingCondition.GOOD,
    ListingCondition.GOOD,
    ListingCondition.FAIR
  };

  private static final String[] SPOTS = {
    "bellville campus", "cbt", "res block c", "library steps", "engineering lab 3", "res lobby"
  };

  private final UserRepository users;
  private final PasswordEncoder passwords;
  private final MarketplaceListingRepository listings;

  public DevDataSeeder(
      UserRepository users,
      PasswordEncoder passwords,
      MarketplaceListingRepository listings) {
    this.users = users;
    this.passwords = passwords;
    this.listings = listings;
  }

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    backfillImages();
    long missing = TARGET_LISTINGS - listings.count();
    if (missing <= 0) {
      return;
    }
    List<User> sellers = sellers();
    List<MarketplaceListing> batch = new ArrayList<>();
    for (int i = 0; i < missing; i++) {
      Object[] row = SHELF[i % SHELF.length];
      int round = i / SHELF.length;
      String title = row[0] + (round == 0 ? "" : " " + (round + 1));
      int base = (int) row[2];
      BigDecimal price = BigDecimal.valueOf(Math.max(20, base - (i % 5) * 15));
      MarketplaceListing listing =
          new MarketplaceListing(
              sellers.get(i % sellers.size()),
              title,
              "seed listing, priced to move",
              price,
              (ListingCategory) row[1],
              CONDITIONS[i % CONDITIONS.length],
              SPOTS[i % SPOTS.length]);
      listing.setImages(List.of(photoFor(title)));
      batch.add(listing);
    }
    listings.saveAll(batch);
    log.info("seeded {} marketplace listings", batch.size());
  }

  /* older rows went in imageless, give them the same deterministic photos */
  private void backfillImages() {
    List<MarketplaceListing> bare =
        listings.findAll().stream().filter(row -> row.getImages().isEmpty()).toList();
    for (MarketplaceListing row : bare) {
      row.setImages(List.of(photoFor(row.getTitle())));
    }
    if (!bare.isEmpty()) {
      listings.saveAll(bare);
      log.info("backfilled photos for {} marketplace listings", bare.size());
    }
  }

  /* deterministic placeholder photo per title, stable across reboots */
  private static String photoFor(String title) {
    String slug = title.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    return "https://picsum.photos/seed/" + slug + "/600";
  }

  private List<User> sellers() {
    List<User> sellers = new ArrayList<>();
    for (int i = 0; i < SELLERS.length; i++) {
      final int slot = i;
      String email = SELLERS[slot] + "@cput.ac.za";
      User seller =
          users
              .findByEmail(email)
              .orElseGet(
                  () ->
                      users.save(
                          new User(
                              SELLERS[slot].replace("seed-", "") + " seller",
                              email,
                              passwords.encode("password123"),
                              freeStudentNumber(slot),
                              null,
                              slot % 2 == 0 ? UserRole.STUDENT : UserRole.VENDOR)));
      sellers.add(seller);
    }
    return sellers;
  }

  /* dev databases already hold years of test users, probe for a free number */
  private String freeStudentNumber(int slot) {
    int candidate = 22991000 + slot;
    while (users.findByStudentNumber(String.valueOf(candidate)).isPresent()) {
      candidate++;
    }
    return String.valueOf(candidate);
  }
}
