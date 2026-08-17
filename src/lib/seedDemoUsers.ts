import bcrypt from "bcryptjs";
import User from "@/models/User";
import Product from "@/models/Product";
import Order from "@/models/Order";
import connectDB from "@/lib/dbConnect";

const DEMO_PASSWORD = "Password123!";

const demoUsers = [
  {
    firstName: "Alex",
    lastName: "Customer",
    email: "customer@biterush.com",
    contactNumber: "+8801700000001",
    role: "customer" as const,
    bio: "Love trying new food! BiteRush is my go-to delivery app.",
    isEmailVerified: true,
    isPhoneVerified: true,
    status: "Online" as const,
    themePreference: "light" as const,
  },
  {
    firstName: "BiteRush",
    lastName: "Kitchen",
    email: "restaurant@biterush.com",
    contactNumber: "+8801700000002",
    role: "restaurant" as const,
    bio: "Official BiteRush Kitchen — Serving the best burgers, pizzas & more!",
    restaurantName: "BiteRush Kitchen",
    restaurantAddress: "House 42, Road 11, Dhanmondi, Dhaka 1205",
    isEmailVerified: true,
    isPhoneVerified: true,
    status: "Online" as const,
    themePreference: "light" as const,
  },
  {
    firstName: "Rahim",
    lastName: "Rider",
    email: "rider@biterush.com",
    contactNumber: "+8801700000003",
    role: "rider" as const,
    bio: "Fast & reliable delivery rider. I know every shortcut in Dhaka!",
    vehicleType: "Motorcycle",
    activeStatus: true,
    isEmailVerified: true,
    isPhoneVerified: true,
    status: "Online" as const,
    themePreference: "light" as const,
  },
];

const demoProducts = [
  // Burgers
  {
    name: "Classic Beef Burger",
    description: "Juicy hand-pressed beef patty with fresh lettuce, tomato, pickles, and our signature sauce in a toasted sesame bun.",
    price: 350,
    category: "burger",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=400&fit=crop",
    rating: 4.5,
    numReviews: 128,
    inStock: true,
    isAvailable: true,
    featured: true,
    prepTime: "12-15 min",
  },
  {
    name: "Spicy Chicken Burger",
    description: "Crispy fried chicken fillet with spicy mayo, jalapeños, coleslaw, and melted pepper jack cheese.",
    price: 320,
    category: "burger",
    image: "https://images.unsplash.com/photo-1525164286253-04e68b9d94c6?w=500&h=400&fit=crop",
    rating: 4.3,
    numReviews: 95,
    inStock: true,
    isAvailable: true,
    featured: false,
    prepTime: "15-18 min",
  },
  {
    name: "Double Smash Burger",
    description: "Two thin smashed beef patties with American cheese, caramelized onions, and special smash sauce.",
    price: 450,
    category: "burger",
    image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500&h=400&fit=crop",
    rating: 4.8,
    numReviews: 203,
    inStock: true,
    isAvailable: true,
    featured: true,
    prepTime: "10-12 min",
  },
  // Pizzas
  {
    name: "Margherita Pizza",
    description: "Classic Italian pizza with San Marzano tomato sauce, fresh mozzarella, basil, and extra virgin olive oil.",
    price: 550,
    category: "pizza",
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&h=400&fit=crop",
    rating: 4.6,
    numReviews: 167,
    inStock: true,
    isAvailable: true,
    featured: true,
    prepTime: "18-22 min",
  },
  {
    name: "Pepperoni Supreme",
    description: "Loaded with pepperoni, mozzarella, parmesan, and oregano on a crispy thin crust.",
    price: 650,
    category: "pizza",
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&h=400&fit=crop",
    rating: 4.7,
    numReviews: 189,
    inStock: true,
    isAvailable: true,
    featured: true,
    prepTime: "20-25 min",
  },
  {
    name: "BBQ Chicken Pizza",
    description: "Smoky BBQ sauce base with grilled chicken, red onions, cilantro, and gouda cheese.",
    price: 620,
    category: "pizza",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&h=400&fit=crop",
    rating: 4.4,
    numReviews: 134,
    inStock: true,
    isAvailable: true,
    featured: false,
    prepTime: "20-25 min",
  },
  // Pasta
  {
    name: "Creamy Alfredo Pasta",
    description: "Fettuccine tossed in a rich and creamy parmesan alfredo sauce with grilled chicken and broccoli.",
    price: 420,
    category: "pasta",
    image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=500&h=400&fit=crop",
    rating: 4.5,
    numReviews: 112,
    inStock: true,
    isAvailable: true,
    featured: false,
    prepTime: "15-20 min",
  },
  {
    name: "Spicy Arrabbiata Penne",
    description: "Penne pasta in a fiery tomato sauce with garlic, red chili flakes, and fresh parsley.",
    price: 380,
    category: "pasta",
    image: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=500&h=400&fit=crop",
    rating: 4.2,
    numReviews: 78,
    inStock: true,
    isAvailable: true,
    featured: false,
    prepTime: "12-15 min",
  },
  {
    name: "Carbonara Spaghetti",
    description: "Traditional Roman carbonara with crispy pancetta, egg yolk, pecorino romano, and black pepper.",
    price: 480,
    category: "pasta",
    image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500&h=400&fit=crop",
    rating: 4.6,
    numReviews: 145,
    inStock: true,
    isAvailable: true,
    featured: true,
    prepTime: "15-18 min",
  },
  // Desserts
  {
    name: "Chocolate Lava Cake",
    description: "Warm chocolate cake with a gooey molten center, served with vanilla ice cream and chocolate drizzle.",
    price: 280,
    category: "dessert",
    image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=500&h=400&fit=crop",
    rating: 4.9,
    numReviews: 234,
    inStock: true,
    isAvailable: true,
    featured: true,
    prepTime: "10-12 min",
  },
  {
    name: "New York Cheesecake",
    description: "Classic creamy cheesecake on a buttery graham cracker crust, topped with fresh strawberry compote.",
    price: 320,
    category: "dessert",
    image: "https://images.unsplash.com/photo-1567171466295-4afa63d45416?w=500&h=400&fit=crop",
    rating: 4.7,
    numReviews: 156,
    inStock: true,
    isAvailable: true,
    featured: false,
    prepTime: "5 min",
  },
  {
    name: "Tiramisu",
    description: "Italian layered dessert with espresso-soaked ladyfingers, mascarpone cream, and cocoa dusting.",
    price: 350,
    category: "dessert",
    image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&h=400&fit=crop",
    rating: 4.8,
    numReviews: 178,
    inStock: true,
    isAvailable: true,
    featured: false,
    prepTime: "5 min",
  },
  // Drinks
  {
    name: "Mango Lassi",
    description: "Refreshing blend of ripe Alphonso mangoes, creamy yogurt, and a hint of cardamom.",
    price: 150,
    category: "drink",
    image: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=500&h=400&fit=crop",
    rating: 4.4,
    numReviews: 89,
    inStock: true,
    isAvailable: true,
    featured: false,
    prepTime: "3-5 min",
  },
  {
    name: "Iced Caramel Latte",
    description: "Double espresso with cold milk, caramel syrup, and a swirl of whipped cream over ice.",
    price: 220,
    category: "drink",
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&h=400&fit=crop",
    rating: 4.5,
    numReviews: 112,
    inStock: true,
    isAvailable: true,
    featured: true,
    prepTime: "3-5 min",
  },
  {
    name: "Fresh Lime Soda",
    description: "Sparkling soda water with fresh lime juice, mint leaves, and a touch of sugar.",
    price: 100,
    category: "drink",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&h=400&fit=crop",
    rating: 4.1,
    numReviews: 67,
    inStock: true,
    isAvailable: true,
    featured: false,
    prepTime: "2-3 min",
  },
  {
    name: "Chocolate Milkshake",
    description: "Thick and creamy chocolate milkshake blended with premium chocolate ice cream and whole milk.",
    price: 200,
    category: "drink",
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&h=400&fit=crop",
    rating: 4.6,
    numReviews: 134,
    inStock: true,
    isAvailable: true,
    featured: false,
    prepTime: "3-5 min",
  },
];

export async function seedDemoData() {
  await connectDB();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const createdUsers: Record<string, any> = {};

  // Seed users
  for (const userData of demoUsers) {
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      createdUsers[userData.role] = existing;
      continue;
    }
    const user = await User.create({ ...userData, passwordHash });
    createdUsers[userData.role] = user;
  }

  // Seed products (clear and re-create for consistency)
  const existingProducts = await Product.countDocuments();
  let products;
  if (existingProducts === 0) {
    products = await Product.insertMany(demoProducts);
  } else {
    products = await Product.find();
  }

  // Seed sample orders if none exist
  const existingOrders = await Order.countDocuments();
  if (existingOrders === 0 && products.length > 0) {
    const customer = createdUsers["customer"];
    const rider = createdUsers["rider"];

    // Order 1: Delivered with rating
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);

    await Order.create({
      user: customer._id,
      orderItems: [
        {
          product: products[0]._id,
          name: products[0].name,
          quantity: 2,
          image: products[0].image,
          price: products[0].price,
        },
        {
          product: products[9]._id,
          name: products[9].name,
          quantity: 1,
          image: products[9].image,
          price: products[9].price,
        },
      ],
      shippingAddress: {
        address: "House 15, Road 5, Gulshan",
        city: "Dhaka",
        postalCode: "1212",
        area: "Gulshan",
        details: "Gate code: 4521",
      },
      paymentMethod: "Bkash",
      deliveryMethod: "Standard",
      deliveryInstructions: "Please ring the bell twice",
      itemsPrice: 980,
      taxPrice: 0,
      shippingPrice: 45,
      tipAmount: 20,
      totalPrice: 1045,
      isPaid: true,
      paidAt: twoHoursAgo,
      isDelivered: true,
      deliveredAt: oneHourAgo,
      status: "delivered",
      rider: rider._id,
      rating: 5,
      review: "Amazing burgers and the lava cake was heavenly! Rider was super fast.",
      ratedAt: oneHourAgo,
      estimatedDeliveryMinutes: 35,
      acceptedAt: new Date(twoHoursAgo.getTime() + 5 * 60 * 1000),
      dispatchedAt: new Date(twoHoursAgo.getTime() + 25 * 60 * 1000),
      messages: [
        {
          senderRole: "rider",
          senderName: "Rahim Rider",
          text: "Hi! I've picked up your order and heading to you now.",
          createdAt: new Date(twoHoursAgo.getTime() + 26 * 60 * 1000),
        },
        {
          senderRole: "customer",
          senderName: "Alex Customer",
          text: "Great, thanks! I'm at the main gate.",
          createdAt: new Date(twoHoursAgo.getTime() + 28 * 60 * 1000),
        },
        {
          senderRole: "rider",
          senderName: "Rahim Rider",
          text: "Almost there, 2 minutes!",
          createdAt: new Date(twoHoursAgo.getTime() + 32 * 60 * 1000),
        },
      ],
      createdAt: twoHoursAgo,
    });

    // Order 2: Currently being prepared
    await Order.create({
      user: customer._id,
      orderItems: [
        {
          product: products[3]._id,
          name: products[3].name,
          quantity: 1,
          image: products[3].image,
          price: products[3].price,
        },
        {
          product: products[13]._id,
          name: products[13].name,
          quantity: 2,
          image: products[13].image,
          price: products[13].price,
        },
      ],
      shippingAddress: {
        address: "House 15, Road 5, Gulshan",
        city: "Dhaka",
        postalCode: "1212",
        area: "Gulshan",
      },
      paymentMethod: "Cash on Delivery",
      deliveryMethod: "Priority",
      deliveryInstructions: "Leave at reception desk, apartment 5B",
      itemsPrice: 990,
      taxPrice: 0,
      shippingPrice: 60,
      tipAmount: 0,
      totalPrice: 1050,
      isPaid: false,
      isDelivered: false,
      status: "preparing",
      estimatedDeliveryMinutes: 25,
      acceptedAt: new Date(now.getTime() - 10 * 60 * 1000),
    });

    // Order 3: Pending (new order)
    await Order.create({
      user: customer._id,
      orderItems: [
        {
          product: products[4]._id,
          name: products[4].name,
          quantity: 1,
          image: products[4].image,
          price: products[4].price,
        },
        {
          product: products[8]._id,
          name: products[8].name,
          quantity: 1,
          image: products[8].image,
          price: products[8].price,
        },
        {
          product: products[12]._id,
          name: products[12].name,
          quantity: 1,
          image: products[12].image,
          price: products[12].price,
        },
      ],
      shippingAddress: {
        address: "House 15, Road 5, Gulshan",
        city: "Dhaka",
        postalCode: "1212",
        area: "Gulshan",
      },
      paymentMethod: "Card or Debit Card",
      deliveryMethod: "Standard",
      itemsPrice: 1280,
      taxPrice: 0,
      shippingPrice: 45,
      tipAmount: 30,
      totalPrice: 1355,
      isPaid: true,
      paidAt: new Date(),
      isDelivered: false,
      status: "pending",
    });

    // Order 4: Out for delivery (assigned to rider)
    await Order.create({
      user: customer._id,
      orderItems: [
        {
          product: products[2]._id,
          name: products[2].name,
          quantity: 1,
          image: products[2].image,
          price: products[2].price,
        },
        {
          product: products[15]._id,
          name: products[15].name,
          quantity: 1,
          image: products[15].image,
          price: products[15].price,
        },
      ],
      shippingAddress: {
        address: "House 15, Road 5, Gulshan",
        city: "Dhaka",
        postalCode: "1212",
        area: "Gulshan",
        details: "Near Gulshan Lake Park",
      },
      paymentMethod: "Bkash",
      deliveryMethod: "Priority",
      deliveryInstructions: "Call when you arrive, don't ring the bell",
      itemsPrice: 650,
      taxPrice: 0,
      shippingPrice: 60,
      tipAmount: 15,
      totalPrice: 725,
      isPaid: true,
      paidAt: new Date(now.getTime() - 30 * 60 * 1000),
      isDelivered: false,
      status: "out_for_delivery",
      rider: rider._id,
      estimatedDeliveryMinutes: 20,
      acceptedAt: new Date(now.getTime() - 25 * 60 * 1000),
      dispatchedAt: new Date(now.getTime() - 10 * 60 * 1000),
      messages: [
        {
          senderRole: "rider",
          senderName: "Rahim Rider",
          text: "On my way with your order! 🏍️",
          createdAt: new Date(now.getTime() - 9 * 60 * 1000),
        },
      ],
    });
  }

  return {
    users: Object.values(createdUsers).map((u: any) => ({
      email: u.email,
      role: u.role,
      name: `${u.firstName} ${u.lastName}`,
    })),
    productsCount: products.length,
    ordersCreated: existingOrders === 0,
  };
}
