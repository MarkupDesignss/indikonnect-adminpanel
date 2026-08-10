import {
    Category,
    CategoryPayload,
  } from "../types/category";

  
  let categories: Category[] = [
    {
      id: 1,
      title: "Coffee Beans",
      description:
        "Premium coffee beans collection.",
      image:
        "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=300",
      status: "active",
      parentCategory: null,
      sortOrder: 1,
    },
  
    {
      id: 2,
      title: "Single Origin",
      description:
        "Single origin coffee collection.",
      image:
        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300",
      status: "active",
      parentCategory: "Coffee Beans",
      sortOrder: 1.1,
    },
  
    {
      id: 3,
      title: "Brewing Equipment",
      description:
        "Coffee brewing equipment.",
      image: "",
      status: "draft",
      parentCategory: null,
      sortOrder: 2,
    },
  
    {
      id: 4,
      title: "Espresso Machines",
      description:
        "Professional espresso machines.",
      image:
        "https://images.unsplash.com/photo-1516224498413-84ecf3a1c8e5?w=300",
      status: "active",
      parentCategory: "Brewing Equipment",
      sortOrder: 2.1,
    },
  
    {
      id: 5,
      title: "Coffee Grinders",
      description:
        "Manual and electric coffee grinders.",
      image:
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300",
      status: "active",
      parentCategory: "Brewing Equipment",
      sortOrder: 2.2,
    },
  
    {
      id: 6,
      title: "Tea",
      description:
        "Premium tea collection.",
      image:
        "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300",
      status: "active",
      parentCategory: null,
      sortOrder: 3,
    },
  
    {
      id: 7,
      title: "Green Tea",
      description:
        "Organic green tea collection.",
      image:
        "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300",
      status: "active",
      parentCategory: "Tea",
      sortOrder: 3.1,
    },
  
    {
      id: 8,
      title: "Black Tea",
      description:
        "Premium black tea collection.",
      image:
        "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=300",
      status: "inactive",
      parentCategory: "Tea",
      sortOrder: 3.2,
    },
  
    {
      id: 9,
      title: "Cups & Mugs",
      description:
        "Coffee cups and mugs.",
      image: "",
      status: "active",
      parentCategory: null,
      sortOrder: 4,
    },
  
    {
      id: 10,
      title: "Accessories",
      description:
        "Coffee and tea accessories.",
      image: "",
      status: "draft",
      parentCategory: null,
      sortOrder: 5,
    },
  
    {
      id: 11,
      title: "French Press",
      description:
        "French press coffee makers.",
      image: "",
      status: "active",
      parentCategory: "Brewing Equipment",
      sortOrder: 2.3,
    },
  
    {
      id: 12,
      title: "Pour Over",
      description:
        "Pour over coffee equipment.",
      image: "",
      status: "active",
      parentCategory: "Brewing Equipment",
      sortOrder: 2.4,
    },
  ];
  
  /* =========================================================
     GET CATEGORIES
  ========================================================= */
  
  export const getCategories = (): Promise<Category[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...categories]);
      }, 500);
    });
  };
  
  /* =========================================================
     ADD CATEGORY
  ========================================================= */
  
  export const addCategory = (
    payload: CategoryPayload
  ): Promise<Category> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newCategory: Category = {
          id: Date.now(),
          title: payload.title,
          description: payload.description,
          image: payload.image
            ? URL.createObjectURL(payload.image)
            : "",
          status: payload.status,
          parentCategory: null,
          sortOrder: categories.length + 1,
        };
  
        categories = [newCategory, ...categories];
  
        resolve(newCategory);
      }, 600);
    });
  };
  
  /* =========================================================
     UPDATE CATEGORY
  ========================================================= */
  
  export const updateCategory = (
    id: number,
    payload: CategoryPayload
  ): Promise<Category> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = categories.findIndex(
          (item) => item.id === id
        );
  
        if (index === -1) {
          reject(new Error("Category not found"));
          return;
        }
  
        const oldCategory = categories[index];
  
        const updatedCategory: Category = {
          ...oldCategory,
          title: payload.title,
          description: payload.description,
          status: payload.status,
          image: payload.image
            ? URL.createObjectURL(payload.image)
            : oldCategory.image,
        };
  
        categories[index] = updatedCategory;
  
        resolve(updatedCategory);
      }, 600);
    });
  };
  
  /* =========================================================
     DELETE CATEGORY
  ========================================================= */
  
  export const deleteCategory = (
    id: number
  ): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const exists = categories.some(
          (item) => item.id === id
        );
  
        if (!exists) {
          reject(new Error("Category not found"));
          return;
        }
  
        categories = categories.filter(
          (item) => item.id !== id
        );
  
        resolve(true);
      }, 600);
    });
  };