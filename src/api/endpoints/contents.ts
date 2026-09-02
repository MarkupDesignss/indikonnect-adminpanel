import apiClient from "../client";

// =====================================================
// TYPES
// =====================================================

export interface ContentImage {
  id?: number;
  url: string;
  alt_text?: string | null;
  is_primary?: boolean;
}

export interface ContentVideo {
  id?: number;
  url: string;
  thumbnail?: string | null;
  alt_text?: string | null;
}

export interface ContentBlock {
  id?: number;
  heading?: string | null;
  short_description?: string | null;
  description?: string | null;
  sort_order: number;
  images: ContentImage[];
  videos: ContentVideo[];
}

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

export interface ContentBlockPayload {
  heading: string;
  short_description: string;
  description: string;
  sort_order: number;

  /**
   * Newly selected files for this block only.
   *
   * Example:
   *
   * blocks[0].imageFiles = [image1]
   * blocks[1].imageFiles = [image2, image3]
   * blocks[2].imageFiles = [image4]
   */
  imageFiles?: File[];

  /**
   * Existing images that are still kept for this block.
   *
   * This is especially useful while editing.
   */
  existingImages?: ContentImage[];
}

export interface ContentPayload {
  title: string;
  status: string;
  blocks: ContentBlockPayload[];
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Builds multipart/form-data payload.
 *
 * IMPORTANT:
 *
 * Every block gets its own image index starting from 0.
 *
 * Example:
 *
 * Block 0:
 * blocks[0][images][0]
 *
 * Block 1:
 * blocks[1][images][0]
 * blocks[1][images][1]
 *
 * Block 2:
 * blocks[2][images][0]
 *
 * Image indexes NEVER continue globally between blocks.
 */
const buildFormData = (
  payload: ContentPayload
): FormData => {
  const formData =
    new FormData();

  // ===================================================
  // PAGE DATA
  // ===================================================

  formData.append(
    "title",
    payload.title || ""
  );

  formData.append(
    "status",
    payload.status || ""
  );

  // ===================================================
  // BLOCKS
  // ===================================================

  payload.blocks.forEach(
    (
      block,
      blockIndex
    ) => {
      // -------------------------------------------------
      // BASIC BLOCK FIELDS
      // -------------------------------------------------

      formData.append(
        `blocks[${blockIndex}][heading]`,
        block.heading || ""
      );

      formData.append(
        `blocks[${blockIndex}][short_description]`,
        block.short_description || ""
      );

      formData.append(
        `blocks[${blockIndex}][description]`,
        block.description || ""
      );

      formData.append(
        `blocks[${blockIndex}][sort_order]`,
        String(
          block.sort_order ?? 0
        )
      );

      // -------------------------------------------------
      // EXISTING IMAGES
      // -------------------------------------------------
      //
      // Existing images are sent separately from newly
      // uploaded files.
      //
      // If user removes an existing image from the UI,
      // it won't be present in this array.
      //
      // Example:
      //
      // blocks[1][existing_images][0][id] = 10
      // blocks[1][existing_images][1][id] = 11
      //
      // -------------------------------------------------

      if (
        block.existingImages &&
        block.existingImages.length >
          0
      ) {
        block.existingImages.forEach(
          (
            image,
            existingImageIndex
          ) => {
            if (
              image.id !==
              undefined &&
              image.id !==
              null
            ) {
              formData.append(
                `blocks[${blockIndex}][existing_images][${existingImageIndex}][id]`,
                String(
                  image.id
                )
              );
            }

            if (
              image.alt_text !==
              undefined &&
              image.alt_text !==
              null
            ) {
              formData.append(
                `blocks[${blockIndex}][existing_images][${existingImageIndex}][alt_text]`,
                image.alt_text
              );
            }

            if (
              image.is_primary !==
              undefined
            ) {
              formData.append(
                `blocks[${blockIndex}][existing_images][${existingImageIndex}][is_primary]`,
                image.is_primary
                  ? "1"
                  : "0"
              );
            }
          }
        );
      }

      // -------------------------------------------------
      // NEW IMAGES
      // -------------------------------------------------
      //
      // THIS IS THE MOST IMPORTANT PART.
      //
      // imageIndex starts from ZERO for every block.
      //
      // Block 0:
      // blocks[0][images][0]
      //
      // Block 1:
      // blocks[1][images][0]
      // blocks[1][images][1]
      //
      // Block 2:
      // blocks[2][images][0]
      //
      // -------------------------------------------------

      if (
        block.imageFiles &&
        block.imageFiles.length >
          0
      ) {
        block.imageFiles.forEach(
          (
            file,
            imageIndex
          ) => {
            if (
              file instanceof File
            ) {
              formData.append(
                `blocks[${blockIndex}][images][${imageIndex}]`,
                file
              );
            }
          }
        );
      }
    }
  );

  return formData;
};

// =====================================================
// DEBUG HELPER
// =====================================================

/**
 * Logs FormData in development so you can verify the
 * exact block/image indexes being sent.
 */
const logFormData = (
  formData: FormData
) => {
  if (
    import.meta.env.MODE !==
    "development"
  ) {
    return;
  }

  console.group(
    "Content FormData"
  );

  formData.forEach(
    (
      value,
      key
    ) => {
      if (
        value instanceof File
      ) {
        console.log(
          key,
          "=>",
          {
            name:
              value.name,
            type:
              value.type,
            size:
              value.size,
          }
        );
      } else {
        console.log(
          key,
          "=>",
          value
        );
      }
    }
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
      "/contents"
    ),

  // ===================================================
  // CREATE
  // ===================================================

  create: (
    payload: ContentPayload
  ) => {
    const formData =
      buildFormData(
        payload
      );

    logFormData(
      formData
    );

    return apiClient.post<ContentActionResponse>(
      "/contents/add",
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      }
    );
  },

  // ===================================================
  // UPDATE
  // ===================================================

  update: (
    id: number,
    payload: ContentPayload
  ) => {
    const formData =
      buildFormData(
        payload
      );

    logFormData(
      formData
    );

    return apiClient.post<ContentActionResponse>(
      `/contents/update/${id}`,
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      }
    );
  },

  // ===================================================
  // DELETE
  // ===================================================

  delete: (
    id: number
  ) =>
    apiClient.delete<ContentActionResponse>(
      `/contents/delete/${id}`
    ),
};

export default contentsApi;