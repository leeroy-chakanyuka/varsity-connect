package com.varsityconnect.auth;

/* login/register response, token + who you are in one round trip */
public record AuthResponse(String token, MeResponse user) {}
