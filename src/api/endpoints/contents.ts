import apiClient from "../client";

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


const buildFormData = (
  payload: ContentPayload
): FormData => {
  const formData = new FormData();

  formData.append(
    "title",
    payload.title || ""
  );

  formData.append(
    "status",
    payload.status || ""
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
        String(block.sort_order ?? 0)
      );

      if (
        block.existingImages &&
        block.existingImages.length > 0
      ) {
        block.existingImages.forEach(
          (
            image,
            existingImageIndex
          ) => {
            // Existing image ID
            if (
              image.id !== undefined &&
              image.id !== null
            ) {
              formData.append(
                `blocks[${blockIndex}][existing_images][${existingImageIndex}][id]`,
                String(image.id)
              );
            }

            // Existing image alt text
            if (
              image.alt_text !== undefined &&
              image.alt_text !== null
            ) {
              formData.append(
                `blocks[${blockIndex}][existing_images][${existingImageIndex}][alt_text]`,
                image.alt_text
              );
            }

            // Existing image primary status
            if (
              image.is_primary !== undefined
            ) {
              formData.append(
                `blocks[${blockIndex}][existing_images][${existingImageIndex}][is_primary]`,
                image.is_primary ? "1" : "0"
              );
            }
          }
        );
      }

      if (
        block.imageFiles &&
        block.imageFiles.length > 0
      ) {
        block.imageFiles.forEach(
          (
            file,
            imageIndex
          ) => {
            if (file instanceof File) {
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
      if (value instanceof File) {
        console.log(
          key,
          "=>",
          {
            name: value.name,
            type: value.type,
            size: value.size,
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


const contentsApi = {

  getAll: () =>
    apiClient.get<ContentsResponse>(
      "/contents"
    ),

  create: (
    payload: ContentPayload
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
      }
    );
  },


  update: (
    id: number,
    payload: ContentPayload
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
      }
    );
  },

 
  delete: (
    id: number
  ) =>
    apiClient.delete<ContentActionResponse>(
      `/contents/delete/${id}`
    ),


  deleteMedia: (
    mediaId: number
  ) =>
    apiClient.delete<ContentActionResponse>(
      `/content-media/${mediaId}`
    ),
};

export default contentsApi;