package com.varsityconnect.media;

import java.util.List;

/* upload result, one entry per stored file */
public record UploadResponse(List<StoredMedia> files) {}
