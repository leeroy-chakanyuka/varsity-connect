package com.varsityconnect.media;

import com.varsityconnect.common.BadRequestException;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/* disk storage, strict about what lands on it */
@Service
public class LocalMediaStorageService implements MediaStorageService {

  private static final long MAX_BYTES = 5L * 1024 * 1024;

  /* extension comes from the mime type, never from the client filename */
  private static final Map<String, String> TYPE_TO_EXT =
      Map.of("image/jpeg", "jpg", "image/png", "png", "image/webp", "webp");

  /* original filename must also look like an image, catches renamed executables */
  private static final Set<String> ALLOWED_EXT = Set.of("jpg", "jpeg", "png", "webp");

  private final Path root;

  public LocalMediaStorageService(@Value("${app.media.upload-dir:./uploads}") String dir) {
    this.root = Paths.get(dir).toAbsolutePath().normalize();
  }

  @PostConstruct
  void init() {
    try {
      Files.createDirectories(root);
    } catch (IOException e) {
      throw new IllegalStateException("could not create upload dir " + root, e);
    }
  }

  @Override
  public StoredMedia store(MultipartFile file, MediaPurpose purpose) {
    if (file == null || file.isEmpty()) {
      throw new BadRequestException("MEDIA_UPLOAD_FAILED", "file is empty");
    }
    if (file.getSize() > MAX_BYTES) {
      throw new BadRequestException("MEDIA_UPLOAD_FAILED", "file exceeds 5 MB");
    }

    String contentType = mimeOf(file.getContentType());
    String ext = TYPE_TO_EXT.get(contentType);
    if (ext == null || !ALLOWED_EXT.contains(extensionOf(file.getOriginalFilename()))) {
      throw new BadRequestException("MEDIA_UPLOAD_FAILED", "unsupported file type");
    }

    /* uuid name, no client text survives into the path */
    String filename = UUID.randomUUID() + "." + ext;
    Path dir = root.resolve(purpose.name().toLowerCase());
    try {
      Files.createDirectories(dir);
      Path target = dir.resolve(filename).normalize();
      if (!target.startsWith(root)) {
        throw new BadRequestException("MEDIA_UPLOAD_FAILED", "invalid file path");
      }
      try (var in = file.getInputStream()) {
        Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
      }
    } catch (IOException e) {
      throw new BadRequestException("MEDIA_UPLOAD_FAILED", "could not store file");
    }
    String url = "/uploads/" + purpose.name().toLowerCase() + "/" + filename;
    return new StoredMedia(filename, url, contentType, file.getSize());
  }

  private static String mimeOf(String raw) {
    if (raw == null) {
      return "";
    }
    return raw.toLowerCase().split(";")[0].trim();
  }

  private static String extensionOf(String filename) {
    if (filename == null) {
      return "";
    }
    /* strip any client path, we only want the tail */
    String tail = filename.replace('\\', '/');
    int slash = tail.lastIndexOf('/');
    tail = slash >= 0 ? tail.substring(slash + 1) : tail;
    int dot = tail.lastIndexOf('.');
    return dot >= 0 ? tail.substring(dot + 1).toLowerCase() : "";
  }
}
