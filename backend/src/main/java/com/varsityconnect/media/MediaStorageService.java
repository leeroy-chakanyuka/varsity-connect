package com.varsityconnect.media;

import org.springframework.web.multipart.MultipartFile;

/* seam for storage, local disk in dev, something else later without touching callers */
public interface MediaStorageService {

  StoredMedia store(MultipartFile file, MediaPurpose purpose);
}
