export interface ProductItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  rating: number;
  numReviews: number;
  inStock: boolean;
  isAvailable: boolean;
  featured: boolean;
  prepTime: string;
  createdAt?: string;
  updatedAt?: string;
}

export const INITIAL_PRODUCTS: ProductItem[] = [
  {
    _id: "prod_001_beef_burger",
    name: "Classic Flame-Grilled Beef Burger",
    description: "Juicy hand-pressed prime beef patty with crisp lettuce, ripe tomatoes, cheddar cheese, and signature smoky relish in a toasted brioche bun.",
    price: 350,
    category: "burger",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=450&fit=crop",
    rating: 4.8,
    numReviews: 142,
    inStock: true,
    isAvailable: true,
    featured: true,
    prepTime: "12-15 min",
  },
  {
    _id: "prod_002_zinger_burger",
    name: "Spicy Crispy Zinger Chicken Burger",
    description: "Golden fried crunchy chicken breast fillet tossed in spicy seasoning, topped with jalapeño slaw and melted pepper jack cheese.",
    price: 320,
    category: "burger",
    image: "https://images.unsplash.com/photo-1525164286253-04e68b9d94c6?w=600&h=450&fit=crop",
    rating: 4.7,
    numReviews: 98,
    inStock: true,
    isAvailable: true,
    featured: false,
    prepTime: "15 min",
  },
  {
    _id: "prod_003_pepperoni_pizza",
    name: "Artisanal Pepperoni Passion Pizza",
    description: "Stone-baked Italian sourdough crust loaded with premium beef pepperoni, roasted garlic tomato sauce, and molten mozzarella.",
    price: 650,
    category: "pizza",
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&h=450&fit=crop",
    rating: 4.9,
    numReviews: 215,
    inStock: true,
    isAvailable: true,
    featured: true,
    prepTime: "20-25 min",
  },
  {
    _id: "prod_004_alfredo_pasta",
    name: "Creamy Truffle Mushroom Alfredo Pasta",
    description: "Fettuccine pasta tossed in velvety parmesan alfredo sauce infused with black truffle oil and pan-sautéed cremini mushrooms.",
    price: 450,
    category: "pasta",
    image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&h=450&fit=crop",
    rating: 4.6,
    numReviews: 87,
    inStock: true,
    isAvailable: true,
    featured: true,
    prepTime: "15-18 min",
  },
  {
    _id: "prod_005_lava_cake",
    name: "Warm Belgian Chocolate Lava Cake",
    description: "Decadent dark chocolate cake with a rich molten center, served warm with vanilla cream and chocolate shavings.",
    price: 260,
    category: "dessert",
    image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600&h=450&fit=crop",
    rating: 4.9,
    numReviews: 180,
    inStock: true,
    isAvailable: true,
    featured: false,
    prepTime: "8-10 min",
  },
  {
    _id: "prod_006_macchiato_drink",
    name: "Iced Caramel Macchiato Cooler",
    description: "Rich espresso layered over fresh chilled milk and vanilla, topped with buttery caramel drizzle and crushed ice.",
    price: 180,
    category: "drink",
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&h=450&fit=crop",
    rating: 4.5,
    numReviews: 110,
    inStock: true,
    isAvailable: true,
    featured: false,
    prepTime: "5 min",
  },
];
