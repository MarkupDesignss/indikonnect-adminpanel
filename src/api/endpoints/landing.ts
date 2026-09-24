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
  imageFiles?: File[];
  existingImages?: ContentImage[];
}

export interface ContentPayload {
  title: string;
  status: string;
  blocks: ContentBlockPayload[];
}

// =====================================================
// BUILD FORM DATA
// =====================================================

const buildFormData = (payload: ContentPayload): FormData => {
  const formData = new FormData();

  formData.append("title", payload.title || "");
  formData.append("status", payload.status || "");
  formData.append("type", "landing_page");

  payload.blocks.forEach((block, blockIndex) => {
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
      String(block.sort_order ?? 0),
    );

    // =================================================
    // EXISTING IMAGES
    // =================================================

    if (block.existingImages?.length) {
      block.existingImages.forEach((image, existingImageIndex) => {
        if (image.id !== undefined && image.id !== null) {
          formData.append(
            `blocks[${blockIndex}][existing_images][${existingImageIndex}][id]`,
            String(image.id),
          );
        }

        if (
          image.alt_text !== undefined &&
          image.alt_text !== null
        ) {
          formData.append(
            `blocks[${blockIndex}][existing_images][${existingImageIndex}][alt_text]`,
            image.alt_text,
          );
        }

        if (image.is_primary !== undefined) {
          formData.append(
            `blocks[${blockIndex}][existing_images][${existingImageIndex}][is_primary]`,
            image.is_primary ? "1" : "0",
          );
        }
      });
    }

    // =================================================
    // NEW IMAGES
    // =================================================

    if (block.imageFiles?.length) {
      block.imageFiles.forEach((file, imageIndex) => {
        if (file instanceof File) {
          formData.append(
            `blocks[${blockIndex}][images][${imageIndex}]`,
            file,
          );
        }
      });
    }
  });

  return formData;
};

// =====================================================
// DEBUG FORM DATA
// =====================================================

const logFormData = (formData: FormData) => {
  if (import.meta.env.MODE !== "development") {
    return;
  }

  console.group("Content FormData");

  formData.forEach((value, key) => {
    if (value instanceof File) {
      console.log(key, "=>", {
        name: value.name,
        type: value.type,
        size: value.size,
      });
    } else {
      console.log(key, "=>", value);
    }
  });

  console.groupEnd();
};

// =====================================================
// LANDING PAGE API
// =====================================================

const landingApi = {
  // GET ALL LANDING PAGES
  getAll: () =>
    apiClient.get<ContentsResponse>(
      "/contents/landing-page",
    ),

  // CREATE LANDING PAGE
  create: (payload: ContentPayload) => {
    const formData = buildFormData(payload);

    logFormData(formData);

    return apiClient.post<ContentActionResponse>(
      "/contents/add",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
  },

  // UPDATE LANDING PAGE
  update: (
    id: number,
    payload: ContentPayload,
  ) => {
    const formData = buildFormData(payload);

    logFormData(formData);

    return apiClient.post<ContentActionResponse>(
      `/contents/update/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
  },

  // DELETE PAGE / VERSION
  delete: (id: number) =>
    apiClient.delete<ContentActionResponse>(
      `/contents/delete/${id}`,
    ),

  // DELETE INDIVIDUAL MEDIA
  deleteMedia: (mediaId: number) =>
    apiClient.delete<ContentActionResponse>(
      `/content-media/${mediaId}`,
    ),
};

export default landingApi;