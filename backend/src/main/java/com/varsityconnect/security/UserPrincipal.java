package com.varsityconnect.security;

import com.varsityconnect.user.UserRole;
import java.util.UUID;

/* what lives inside the security context, just identity, no secrets */
public record UserPrincipal(UUID id, String email, UserRole role) {}
