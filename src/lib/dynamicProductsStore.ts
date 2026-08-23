import { INITIAL_PRODUCTS, ProductItem } from "./initialProducts";

declare global {
  // eslint-disable-next-line no-var
  var dynamicProducts: ProductItem[] | undefined;
}

if (!global.dynamicProducts) {
  global.dynamicProducts = [...INITIAL_PRODUCTS];
}

export const getDynamicProducts = (): ProductItem[] => {
  if (!global.dynamicProducts || global.dynamicProducts.length === 0) {
    global.dynamicProducts = [...INITIAL_PRODUCTS];
  }
  return global.dynamicProducts;
};

export const addDynamicProduct = (product: any): ProductItem => {
  const products = getDynamicProducts();
  const newProduct: ProductItem = {
    _id: product._id || "prod_" + Date.now() + Math.random().toString(36).substring(2, 7),
    name: product.name,
    description: product.description || "",
    price: Number(product.price) || 0,
    category: product.category || "other",
    image: product.image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=450&fit=crop",
    rating: Number(product.rating) || 5,
    numReviews: Number(product.numReviews) || 1,
    inStock: product.inStock !== false,
    isAvailable: product.isAvailable !== false,
    featured: Boolean(product.featured),
    prepTime: product.prepTime || "15-20 min",
  };

  // Add to beginning of array
  global.dynamicProducts = [newProduct, ...products];
  return newProduct;
};

export const updateDynamicProduct = (id: string, updateData: any): ProductItem | null => {
  const products = getDynamicProducts();
  const index = products.findIndex((p) => p._id === id);
  if (index === -1) return null;

  const updated: ProductItem = {
    ...products[index],
    ...updateData,
    _id: id,
    price: updateData.price !== undefined ? Number(updateData.price) : products[index].price,
  };

  products[index] = updated;
  global.dynamicProducts = products;
  return updated;
};

export const deleteDynamicProduct = (id: string): boolean => {
  const products = getDynamicProducts();
  const initialLength = products.length;
  global.dynamicProducts = products.filter((p) => p._id !== id);
  return global.dynamicProducts.length < initialLength;
};
