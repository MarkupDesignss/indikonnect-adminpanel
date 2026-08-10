export type CategoryStatus = "active" | "inactive" | "draft";

export interface Category {
  id: number;
  title: string;
  description: string;
  image: string;
  status: CategoryStatus;
  parentCategory: string | null;
  sortOrder: number;
}

export interface CategoryPayload {
  title: string;
  description: string;
  image: File | null;
  status: CategoryStatus;
}