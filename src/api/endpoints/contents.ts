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
// HELPERS
// =====================================================

const buildFormData = (
  payload: ContentPayload
) => {
  const formData = new FormData();

  formData.append(
    "title",
    payload.title
  );

  formData.append(
    "status",
    payload.status
  );

  payload.blocks.forEach(
    (block, blockIndex) => {
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
          block.sort_order
        )
      );

      if (
        block.imageFiles &&
        block.imageFiles.length > 0
      ) {
        block.imageFiles.forEach(
          (
            file,
            imageIndex
          ) => {
            formData.append(
              `blocks[${blockIndex}][images][${imageIndex}]`,
              file
            );
          }
        );
      }
    }
  );

  return formData;
};

// =====================================================
// API
// =====================================================

const contentsApi = {
  getAll: () =>
    apiClient.get<ContentsResponse>(
      "/contents"
    ),

  create: (
    payload: ContentPayload
  ) =>
    apiClient.post<ContentActionResponse>(
      "/contents/add",
      buildFormData(payload),
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      }
    ),

  update: (
    id: number,
    payload: ContentPayload
  ) =>
    apiClient.post<ContentActionResponse>(
      `/contents/update/${id}`,
      buildFormData(payload),
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      }
    ),

  delete: (id: number) =>
    apiClient.delete<ContentActionResponse>(
      `/contents/delete/${id}`
    ),
};

export default contentsApi;