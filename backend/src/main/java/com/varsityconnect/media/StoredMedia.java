package com.varsityconnect.media;

/* what the uploader hands back, the url is all later features store */
public record StoredMedia(String filename, String url, String contentType, long size) {}
