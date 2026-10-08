import apiClient from "../client";

// =====================================================
// CONTENT IMAGE
// =====================================================

export interface ContentImage {
  id?: number;
  url: string;
  alt_text?: string | null;
  is_primary?: boolean;
}

// =====================================================
// CONTENT VIDEO
// =====================================================

export interface ContentVideo {
  id?: number;
  url: string;
  thumbnail?: string | null;
  alt_text?: string | null;
  is_primary?: boolean;
}

// =====================================================
// CONTENT BLOCK
// =====================================================

export interface ContentBlock {
  id?: number;

  heading?: string | null;

  short_description?: string | null;

  description?: string | null;

  sort_order: number;

  images: ContentImage[];

  videos: ContentVideo[];
}

// =====================================================
// CONTENT PAGE
// =====================================================

export interface ContentPage {
  id: number;

  title: string;

  slug: string;

  status: string;

  version: string;

  created_at: string;

  updated_at: string;

  blocks: ContentBlock[];
}

// =====================================================
// RESPONSE TYPES
// =====================================================

export interface ContentsResponse {
  success: boolean;

  message?: string;

  data: ContentPage[];
}

export interface ContentActionResponse {
  success: boolean;

  message?: string;

  data?: ContentPage;
}

// =====================================================
// EXISTING IMAGE PAYLOAD
// =====================================================

export interface ExistingImagePayload {
  id?: number;

  alt_text?: string | null;

  is_primary?: boolean;
}

// =====================================================
// EXISTING VIDEO PAYLOAD
// =====================================================

export interface ExistingVideoPayload {
  id?: number;

  alt_text?: string | null;

  thumbnail?: string | null;

  is_primary?: boolean;
}

// =====================================================
// CONTENT BLOCK PAYLOAD
// =====================================================

export interface ContentBlockPayload {
  heading: string;

  short_description: string;

  description: string;

  sort_order?: number;

  /**
   * Existing frontend is already using imageFiles
   * for both images and videos.
   *
   * The buildFormData function below will automatically
   * detect the MIME type and send:
   *
   * image -> blocks[x][images][y]
   * video -> blocks[x][videos][y]
   */
  imageFiles?: File[];

  /**
   * Optional explicit video files.
   *
   * Use this when frontend wants to keep images
   * and videos in separate arrays.
   */
  videoFiles?: File[];

  existingImages?: ExistingImagePayload[];

  existingVideos?: ExistingVideoPayload[];
}

// =====================================================
// CONTENT PAYLOAD
// =====================================================

export interface ContentPayload {
  title: string;

  status: string;

  blocks: ContentBlockPayload[];
}

// =====================================================
// FILE HELPERS
// =====================================================

const isVideoFile = (file: File) => {
  return file?.type
    ?.toLowerCase()
    .startsWith("video/");
};

const isImageFile = (file: File) => {
  return file?.type
    ?.toLowerCase()
    .startsWith("image/");
};

// =====================================================
// APPEND EXISTING IMAGE
// =====================================================

const appendExistingImage = (
  formData: FormData,
  blockIndex: number,
  imageIndex: number,
  image: ExistingImagePayload,
) => {
  if (
    image.id !== undefined &&
    image.id !== null
  ) {
    formData.append(
      `blocks[${blockIndex}][existing_images][${imageIndex}][id]`,
      String(image.id),
    );
  }

  if (
    image.alt_text !== undefined &&
    image.alt_text !== null
  ) {
    formData.append(
      `blocks[${blockIndex}][existing_images][${imageIndex}][alt_text]`,
      image.alt_text,
    );
  }

  if (
    image.is_primary !== undefined
  ) {
    formData.append(
      `blocks[${blockIndex}][existing_images][${imageIndex}][is_primary]`,
      image.is_primary ? "1" : "0",
    );
  }
};

// =====================================================
// APPEND EXISTING VIDEO
// =====================================================

const appendExistingVideo = (
  formData: FormData,
  blockIndex: number,
  videoIndex: number,
  video: ExistingVideoPayload,
) => {
  if (
    video.id !== undefined &&
    video.id !== null
  ) {
    formData.append(
      `blocks[${blockIndex}][existing_videos][${videoIndex}][id]`,
      String(video.id),
    );
  }

  if (
    video.alt_text !== undefined &&
    video.alt_text !== null
  ) {
    formData.append(
      `blocks[${blockIndex}][existing_videos][${videoIndex}][alt_text]`,
      video.alt_text,
    );
  }

  if (
    video.thumbnail !== undefined &&
    video.thumbnail !== null
  ) {
    formData.append(
      `blocks[${blockIndex}][existing_videos][${videoIndex}][thumbnail]`,
      video.thumbnail,
    );
  }

  if (
    video.is_primary !== undefined
  ) {
    formData.append(
      `blocks[${blockIndex}][existing_videos][${videoIndex}][is_primary]`,
      video.is_primary ? "1" : "0",
    );
  }
};

// =====================================================
// BUILD FORM DATA
// =====================================================

const buildFormData = (
  payload: ContentPayload,
): FormData => {
  const formData = new FormData();

  // ===================================================
  // PAGE DATA
  // ===================================================

  formData.append(
    "title",
    payload.title || "",
  );

  formData.append(
    "status",
    payload.status || "",
  );

  // ===================================================
  // BLOCKS
  // ===================================================

  payload.blocks.forEach(
    (block, blockIndex) => {
      // -------------------------------------------------
      // BASIC BLOCK FIELDS
      // -------------------------------------------------

      formData.append(
        `blocks[${blockIndex}][heading]`,
        block.heading || "",
      );

      formData.append(
        `blocks[${blockIndex}][short_description]`,
        block.short_description || "",
      );

      formData.append(
        `blocks[${blockIndex}][description]`,
        block.description || "",
      );

      formData.append(
        `blocks[${blockIndex}][sort_order]`,
        String(
          block.sort_order ??
            blockIndex + 1,
        ),
      );

      // -------------------------------------------------
      // EXISTING IMAGES
      // -------------------------------------------------

      if (
        block.existingImages &&
        block.existingImages.length > 0
      ) {
        block.existingImages.forEach(
          (image, existingImageIndex) => {
            appendExistingImage(
              formData,
              blockIndex,
              existingImageIndex,
              image,
            );
          },
        );
      }

      // -------------------------------------------------
      // EXISTING VIDEOS
      // -------------------------------------------------

      if (
        block.existingVideos &&
        block.existingVideos.length > 0
      ) {
        block.existingVideos.forEach(
          (video, existingVideoIndex) => {
            appendExistingVideo(
              formData,
              blockIndex,
              existingVideoIndex,
              video,
            );
          },
        );
      }

      // -------------------------------------------------
      // NEW IMAGES
      // -------------------------------------------------

      let imageIndex = 0;

      // -------------------------------------------------
      // NEW VIDEOS
      // -------------------------------------------------

      let videoIndex = 0;

      // =================================================
      // BACKWARD COMPATIBILITY
      //
      // Existing frontend sends everything inside
      // block.imageFiles.
      //
      // So detect MIME type here:
      //
      // image -> images
      // video -> videos
      // =================================================

      if (
        block.imageFiles &&
        block.imageFiles.length > 0
      ) {
        block.imageFiles.forEach(
          (file) => {
            if (!(file instanceof File)) {
              return;
            }

            if (isVideoFile(file)) {
              formData.append(
                `blocks[${blockIndex}][videos][${videoIndex}]`,
                file,
              );

              videoIndex += 1;

              return;
            }

            if (isImageFile(file)) {
              formData.append(
                `blocks[${blockIndex}][images][${imageIndex}]`,
                file,
              );

              imageIndex += 1;

              return;
            }

            console.warn(
              "Unsupported content media type:",
              {
                name: file.name,
                type: file.type,
              },
            );
          },
        );
      }

      // =================================================
      // EXPLICIT VIDEO FILES
      //
      // If frontend uses videoFiles separately,
      // append them to videos.
      // =================================================

      if (
        block.videoFiles &&
        block.videoFiles.length > 0
      ) {
        block.videoFiles.forEach(
          (file) => {
            if (!(file instanceof File)) {
              return;
            }

            formData.append(
              `blocks[${blockIndex}][videos][${videoIndex}]`,
              file,
            );

            videoIndex += 1;
          },
        );
      }
    },
  );

  return formData;
};

// =====================================================
// LOG FORMDATA
// =====================================================

const logFormData = (
  formData: FormData,
) => {
  if (
    import.meta.env.MODE !==
    "development"
  ) {
    return;
  }

  console.group(
    "Content FormData",
  );

  formData.forEach(
    (value, key) => {
      if (value instanceof File) {
        console.log(
          key,
          "=>",
          {
            name: value.name,

            type: value.type,

            size: value.size,

            sizeMB: (
              value.size /
              1024 /
              1024
            ).toFixed(2),
          },
        );
      } else {
        console.log(
          key,
          "=>",
          value,
        );
      }
    },
  );

  console.groupEnd();
};

// =====================================================
// API
// =====================================================

const contentsApi = {
  // ===================================================
  // GET ALL
  // ===================================================

  getAll: () =>
    apiClient.get<ContentsResponse>(
      "/contents",
    ),

  // ===================================================
  // CREATE
  // ===================================================

  create: (
    payload: ContentPayload,
  ) => {
    const formData =
      buildFormData(payload);

    logFormData(formData);

    return apiClient.post<ContentActionResponse>(
      "/contents/add",
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      },
    );
  },

  // ===================================================
  // UPDATE
  // ===================================================

  update: (
    id: number,
    payload: ContentPayload,
  ) => {
    const formData =
      buildFormData(payload);

    logFormData(formData);

    return apiClient.post<ContentActionResponse>(
      `/contents/update/${id}`,
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      },
    );
  },

  // ===================================================
  // DELETE PAGE
  // ===================================================

  delete: (
    id: number,
  ) =>
    apiClient.delete<ContentActionResponse>(
      `/contents/delete/${id}`,
    ),

  // ==================================================
  // DELETE MEDIA
  // ===================================================

  deleteMedia: (
    mediaId: number,
  ) =>
    apiClient.delete<ContentActionResponse>(
      `/contents/content-media/${mediaId}`,
    ),
};

export default contentsApi;