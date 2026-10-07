package com.varsityconnect.user;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/* persistence only, no business rules in here */
public interface UserRepository extends JpaRepository<User, UUID> {

  Optional<User> findByEmail(String email);

  Optional<User> findByStudentNumber(String studentNumber);

  boolean existsByEmail(String email);

  boolean existsByStudentNumber(String studentNumber);
}
