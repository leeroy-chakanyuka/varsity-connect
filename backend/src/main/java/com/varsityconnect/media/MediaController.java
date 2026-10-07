package com.varsityconnect.media;

import com.varsityconnect.common.BadRequestException;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/* single upload door for every feature, thin by design */
@RestController
@RequestMapping("/api/v1/media")
public class MediaController {

  private static final int MAX_FILES = 5;

  private final MediaStorageService storage;

  public MediaController(MediaStorageService storage) {
    this.storage = storage;
  }

  @PostMapping(value = "/uploads", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public UploadResponse upload(
      @RequestParam("files") List<MultipartFile> files,
      @RequestParam(value = "purpose", defaultValue = "LISTING") MediaPurpose purpose) {
    if (files == null || files.isEmpty()) {
      throw new BadRequestException("VALIDATION_ERROR", "at least one file is required");
    }
    if (files.size() > MAX_FILES) {
      throw new BadRequestException("MEDIA_UPLOAD_FAILED", "maximum 5 files per request");
    }
    List<StoredMedia> stored = files.stream().map(file -> storage.store(file, purpose)).toList();
    return new UploadResponse(stored);
  }
}
