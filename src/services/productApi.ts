import {
    Product,
    ProductPayload,
    SelectOption,
  } from "../types/product";
  
  /* =========================================================
     DUMMY CATEGORIES
  ========================================================= */
  
  export const dummyCategories: SelectOption[] = [
    {
      id: 1,
      name: "Coffee Beans",
    },
    {
      id: 2,
      name: "Brewing Equipment",
    },
    {
      id: 3,
      name: "Tea",
    },
    {
      id: 4,
      name: "Cups & Mugs",
    },
  ];
  
  /* =========================================================
     DUMMY TAX CATEGORIES
  ========================================================= */
  
  export const dummyTaxCategories: SelectOption[] = [
    {
      id: 1,
      name: "GST 5%",
    },
    {
      id: 2,
      name: "GST 12%",
    },
    {
      id: 3,
      name: "GST 18%",
    },
    {
      id: 4,
      name: "GST 28%",
    },
  ];
  
  /* =========================================================
     DUMMY BRANDS
  ========================================================= */
  
  export const dummyBrands: SelectOption[] = [
    {
      id: 1,
      name: "Titan",
    },
    {
      id: 2,
      name: "Fossil",
    },
    {
      id: 3,
      name: "Casio",
    },
    {
      id: 4,
      name: "Timex",
    },
  ];
  
  /* =========================================================
     DUMMY PRODUCTS
  ========================================================= */
  
  let products: Product[] = [
    {
      id: 1,
  
      product_code: "2",
  
      name: "Titan",
  
      slug: "titanm",
  
      description: "titan",
  
      specification: "analog",
  
      category_id: 1,
  
      tax_category_id: 1,
  
      brand_id: 1,
  
      retail_price: 10000,
  
      distributor_price: 8000,
  
      stock_quantity: 100,
  
      low_stock_threshold: 10,
  
      is_published: 1,
  
      status: "active",
  
      product_images: [
        {
          id: 1,
          image:
            "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400",
          sort_order: 1,
          is_primary: 1,
        },
  
        {
          id: 2,
          image:
            "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400",
          sort_order: 2,
          is_primary: 0,
        },
      ],
    },
  
    {
      id: 2,
  
      product_code: "3",
  
      name: "Fossil Watch",
  
      slug: "fossil-watch",
  
      description:
        "Premium Fossil watch collection.",
  
      specification:
        "Stainless steel, Analog",
  
      category_id: 1,
  
      tax_category_id: 2,
  
      brand_id: 2,
  
      retail_price: 15000,
  
      distributor_price: 12000,
  
      stock_quantity: 50,
  
      low_stock_threshold: 5,
  
      is_published: 1,
  
      status: "active",
  
      product_images: [
        {
          id: 3,
          image:
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
          sort_order: 1,
          is_primary: 1,
        },
      ],
    },
  
    {
      id: 3,
  
      product_code: "4",
  
      name: "Casio Analog",
  
      slug: "casio-analog",
  
      description:
        "Classic Casio analog watch.",
  
      specification:
        "Analog",
  
      category_id: 1,
  
      tax_category_id: 1,
  
      brand_id: 3,
  
      retail_price: 7500,
  
      distributor_price: 6000,
  
      stock_quantity: 20,
  
      low_stock_threshold: 5,
  
      is_published: 1,
  
      status: "draft",
  
      product_images: [],
    },
  ];
  
  /* =========================================================
     GET PRODUCTS
  ========================================================= */
  
  export const getProducts = (): Promise<
    Product[]
  > => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...products]);
      }, 500);
    });
  };
  
  /* =========================================================
     GET OPTIONS
  ========================================================= */
  
  export const getCategories =
    (): Promise<SelectOption[]> => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([...dummyCategories]);
        }, 200);
      });
    };
  
  export const getTaxCategories =
    (): Promise<SelectOption[]> => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([...dummyTaxCategories]);
        }, 200);
      });
    };
  
  export const getBrands =
    (): Promise<SelectOption[]> => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([...dummyBrands]);
        }, 200);
      });
    };
  
  /* =========================================================
     BUILD FORM DATA
  ========================================================= */
  
  export const buildProductFormData = (
    payload: ProductPayload
  ) => {
    const formData = new FormData();
  
    formData.append(
      "product_code",
      payload.product_code
    );
  
    formData.append(
      "name",
      payload.name
    );
  
    formData.append(
      "slug",
      payload.slug
    );
  
    formData.append(
      "description",
      payload.description
    );
  
    formData.append(
      "specification",
      payload.specification
    );
  
    formData.append(
      "category_id",
      String(payload.category_id)
    );
  
    formData.append(
      "tax_category_id",
      String(payload.tax_category_id)
    );
  
    formData.append(
      "brand_id",
      String(payload.brand_id)
    );
  
    formData.append(
      "retail_price",
      String(payload.retail_price)
    );
  
    formData.append(
      "distributor_price",
      String(payload.distributor_price)
    );
  
    formData.append(
      "stock_quantity",
      String(payload.stock_quantity)
    );
  
    formData.append(
      "low_stock_threshold",
      String(
        payload.low_stock_threshold
      )
    );
  
    formData.append(
      "is_published",
      String(payload.is_published)
    );
  
    payload.product_images.forEach(
      (item, index) => {
        formData.append(
          `product_images[${index}][image]`,
          item.file
        );
  
        formData.append(
          `product_images[${index}][sort_order]`,
          String(item.sort_order)
        );
  
        formData.append(
          `product_images[${index}][is_primary]`,
          String(item.is_primary)
        );
      }
    );

    payload.existing_images?.forEach(
      (item, index) => {
        formData.append(
          `existing_images[${index}][id]`,
          String(item.id)
        );

        formData.append(
          `existing_images[${index}][sort_order]`,
          String(item.sort_order)
        );

        formData.append(
          `existing_images[${index}][is_primary]`,
          String(item.is_primary)
        );
      }
    );
  
    return formData;
  };
  
  /* =========================================================
     ADD PRODUCT
  ========================================================= */
  
  export const addProduct = (
    payload: ProductPayload
  ): Promise<Product> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const formData =
          buildProductFormData(payload);
  
        console.log(
          "ADD PRODUCT FORMDATA"
        );
  
        for (const [key, value] of formData.entries()) {
          console.log(key, value);
        }
  
        const newProduct: Product = {
          id: Date.now(),
  
          product_code:
            payload.product_code,
  
          name: payload.name,
  
          slug: payload.slug,
  
          description:
            payload.description,
  
          specification:
            payload.specification,
  
          category_id:
            payload.category_id,
  
          tax_category_id:
            payload.tax_category_id,
  
          brand_id:
            payload.brand_id,
  
          retail_price:
            payload.retail_price,
  
          distributor_price:
            payload.distributor_price,
  
          stock_quantity:
            payload.stock_quantity,
  
          low_stock_threshold:
            payload.low_stock_threshold,
  
          is_published:
            payload.is_published,
  
          status: payload.is_published
            ? "active"
            : "draft",
  
          product_images:
            payload.product_images.map(
              (item, index) => ({
                id:
                  Date.now() + index,
  
                image:
                  URL.createObjectURL(
                    item.file
                  ),
  
                sort_order:
                  item.sort_order,
  
                is_primary:
                  item.is_primary,
              })
            ),
        };
  
        products = [
          newProduct,
          ...products,
        ];
  
        resolve(newProduct);
      }, 700);
    });
  };
  
  /* =========================================================
     UPDATE PRODUCT
  ========================================================= */
  
  export const updateProduct = (
    id: number,
    payload: ProductPayload
  ): Promise<Product> => {
    return new Promise(
      (resolve, reject) => {
        setTimeout(() => {
          const index =
            products.findIndex(
              (item) => item.id === id
            );
  
          if (index === -1) {
            reject(
              new Error(
                "Product not found"
              )
            );
  
            return;
          }
  
          const oldProduct =
            products[index];
  
          const formData =
            buildProductFormData(payload);
  
          console.log(
            "UPDATE PRODUCT FORMDATA"
          );
  
          for (const [key, value] of formData.entries()) {
            console.log(key, value);
          }
  
          const updatedProduct: Product =
            {
              ...oldProduct,
  
              product_code:
                payload.product_code,
  
              name: payload.name,
  
              slug: payload.slug,
  
              description:
                payload.description,
  
              specification:
                payload.specification,
  
              category_id:
                payload.category_id,
  
              tax_category_id:
                payload.tax_category_id,
  
              brand_id:
                payload.brand_id,
  
              retail_price:
                payload.retail_price,
  
              distributor_price:
                payload.distributor_price,
  
              stock_quantity:
                payload.stock_quantity,
  
              low_stock_threshold:
                payload.low_stock_threshold,
  
              is_published:
                payload.is_published,
  
              status:
                payload.is_published
                  ? "active"
                  : "draft",
  
              product_images:
                payload.product_images.length
                  ? payload.product_images.map(
                      (item, index) => ({
                        id:
                          Date.now() +
                          index,
  
                        image:
                          URL.createObjectURL(
                            item.file
                          ),
  
                        sort_order:
                          item.sort_order,
  
                        is_primary:
                          item.is_primary,
                      })
                    )
                  : oldProduct.product_images,
            };
  
          products[index] =
            updatedProduct;
  
          resolve(updatedProduct);
        }, 700);
      }
    );
  };
  
  /* =========================================================
     DELETE PRODUCT
  ========================================================= */
  
  export const deleteProduct = (
    id: number
  ): Promise<boolean> => {
    return new Promise(
      (resolve, reject) => {
        setTimeout(() => {
          const exists =
            products.some(
              (item) =>
                item.id === id
            );
  
          if (!exists) {
            reject(
              new Error(
                "Product not found"
              )
            );
  
            return;
          }
  
          products =
            products.filter(
              (item) =>
                item.id !== id
            );
  
          resolve(true);
        }, 600);
      }
    );
  };
