import bcrypt from "bcryptjs";
import User from "@/models/User";
import Product from "@/models/Product";
import Order from "@/models/Order";
import connectDB from "@/lib/dbConnect";
import { CryptoService } from "@/lib/crypto/cryptoService";
import { KeyManager } from "@/lib/crypto/keyManager";

const DEMO_PASSWORD = "Password123!";

const demoUsers = [
  {
    _id: DEMO_IDS.CUSTOMER,
    firstName: "Niloy",
    lastName: "Farhan",
    email: "customer@biterush.com",
    contactNumber: "+8801700000001",
    role: "customer" as const,
    bio: "Food enthusiast & regular BiteRush customer.",
    isEmailVerified: true,
    isPhoneVerified: true,
    status: "Online" as const,
    themePreference: "light" as const,
  },
  {
    _id: DEMO_IDS.RESTAURANT,
    firstName: "BiteRush",
    lastName: "Kitchen",
    email: "restaurant@biterush.com",
    contactNumber: "+8801700000002",
    role: "restaurant" as const,
    bio: "Official BiteRush Gourmet Kitchen.",
    restaurantName: "BiteRush Kitchen",
    restaurantAddress: "House 42, Road 11, Dhanmondi, Dhaka 1205",
    isEmailVerified: true,
    isPhoneVerified: true,
    status: "Online" as const,
    themePreference: "light" as const,
  },
  {
    _id: DEMO_IDS.RIDER,
    firstName: "Zayed",
    lastName: "Masum",
    email: "rider@biterush.com",
    contactNumber: "+8801700000003",
    role: "rider" as const,
    bio: "Top rated express delivery rider.",
    vehicleType: "Motorcycle",
    activeStatus: true,
    isEmailVerified: true,
    isPhoneVerified: true,
    status: "Online" as const,
    themePreference: "light" as const,
  },
];

// Exactly 6 ready-made testing menu items covering all key categories
const demoProducts = [
  {
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

import mongoose from "mongoose";
import { DEMO_USERS, DEMO_IDS } from "@/lib/demoData";

export async function seedDemoData() {
  const conn = await connectDB();
  if (!conn || mongoose.connection.readyState !== 1) {
    return {
      users: DEMO_USERS.map((u) => ({ email: u.email, role: u.role, name: `${u.firstName} ${u.lastName}` })),
      productsCount: 6,
      ordersCount: 6,
      fallbackMode: true,
    };
  }

  // 1. Seed or Update Demo Users
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const createdUsers: Record<string, any> = {};

  for (const userData of demoUsers) {
    const emailLookupHmac = CryptoService.createEmailLookupHmac(userData.email);
    const contactNumberLookupHmac = CryptoService.createPhoneLookupHmac(userData.contactNumber);

    const cryptoFields = {
      firstNameEncrypted: CryptoService.encryptProfile(userData.firstName),
      lastNameEncrypted: CryptoService.encryptProfile(userData.lastName),
      emailEncrypted: CryptoService.encryptProfile(userData.email),
      contactNumberEncrypted: CryptoService.encryptProfile(userData.contactNumber),
      bioEncrypted: userData.bio ? CryptoService.encryptProfile(userData.bio) : undefined,
      restaurantNameEncrypted: userData.restaurantName ? CryptoService.encryptProfile(userData.restaurantName) : undefined,
      restaurantAddressEncrypted: userData.restaurantAddress ? CryptoService.encryptProfile(userData.restaurantAddress) : undefined,
      vehicleTypeEncrypted: userData.vehicleType ? CryptoService.encryptProfile(userData.vehicleType) : undefined,
      emailLookupHmac,
      contactNumberLookupHmac,
      isTwoFactorEnabled: true,
      isTwoFactorVerified: true,
      cryptoVersion: KeyManager.getActiveVersion(),
    };

    let user = await User.findOne({
      $or: [{ emailLookupHmac }, { email: userData.email }],
    });

    if (!user) {
      user = await User.create({
        ...userData,
        ...cryptoFields,
        passwordHash,
      });
    } else {
      user.firstName = userData.firstName;
      user.lastName = userData.lastName;
      user.role = userData.role;
      user.passwordHash = passwordHash;
      user.isEmailVerified = true;
      user.isPhoneVerified = true;
      Object.assign(user, cryptoFields);
      if (userData.restaurantName) user.restaurantName = userData.restaurantName;
      if (userData.restaurantAddress) user.restaurantAddress = userData.restaurantAddress;
      if (userData.vehicleType) user.vehicleType = userData.vehicleType;
      if (userData.activeStatus !== undefined) user.activeStatus = userData.activeStatus;
      await user.save();
    }
    createdUsers[userData.role] = user;
  }

  // 2. Seed Initial Products only if collection is empty
  const productCount = await Product.countDocuments();
  let products;
  if (productCount === 0) {
    products = await Product.insertMany(demoProducts);
  } else {
    products = await Product.find().sort({ createdAt: 1 });
  }

  // 3. Seed Realistic Multi-State Orders for all test profiles if empty
  const customer = createdUsers["customer"];
  const restaurant = createdUsers["restaurant"];
  const rider = createdUsers["rider"];

  const existingOrders = await Order.countDocuments({ user: customer._id });

  if (existingOrders === 0) {
    const now = new Date();

    // Order 1: Out for Delivery (Live Active delivery with Assigned Rider & 2-Way Chat)
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
          product: products[5]._id,
          name: products[5].name,
          quantity: 2,
          image: products[5].image,
          price: products[5].price,
        },
      ],
      shippingAddress: {
        address: "House 15, Road 5, Block C",
        city: "Dhaka",
        postalCode: "1212",
        area: "Gulshan",
        details: "4th Floor, Apt 4B. Near Gulshan Lake Park",
      },
      paymentMethod: "Bkash",
      deliveryMethod: "Priority",
      deliveryInstructions: "Please call when you reach the security gate.",
      itemsPrice: 1060,
      taxPrice: 0,
      shippingPrice: 60,
      tipAmount: 30,
      totalPrice: 1150,
      isPaid: true,
      paidAt: new Date(now.getTime() - 25 * 60 * 1000),
      isDelivered: false,
      status: "out_for_delivery",
      rider: rider._id,
      estimatedDeliveryMinutes: 20,
      acceptedAt: new Date(now.getTime() - 22 * 60 * 1000),
      dispatchedAt: new Date(now.getTime() - 8 * 60 * 1000),
      messages: [
        {
          senderRole: "customer",
          senderName: "Alex Customer",
          text: "Hi Rahim, could you please ensure the drinks are packed upright?",
          createdAt: new Date(now.getTime() - 7 * 60 * 1000),
        },
        {
          senderRole: "rider",
          senderName: "Rahim Rider",
          text: "Hello! Yes, drinks are safely placed in my insulated thermal bag. Approaching your street now! 🛵",
          createdAt: new Date(now.getTime() - 5 * 60 * 1000),
        },
      ],
    });

    // Order 2: Preparing in Kitchen (Accepted by restaurant, active cooking)
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
          product: products[3]._id,
          name: products[3].name,
          quantity: 1,
          image: products[3].image,
          price: products[3].price,
        },
      ],
      shippingAddress: {
        address: "Apartment 7A, Green Tower",
        city: "Dhaka",
        postalCode: "1205",
        area: "Dhanmondi",
        details: "Opposite to City College",
      },
      paymentMethod: "Cash on Delivery",
      deliveryMethod: "Standard",
      deliveryInstructions: "Leave with security if I don't answer right away.",
      itemsPrice: 1100,
      taxPrice: 0,
      shippingPrice: 45,
      tipAmount: 0,
      totalPrice: 1145,
      isPaid: false,
      isDelivered: false,
      status: "preparing",
      estimatedDeliveryMinutes: 30,
      acceptedAt: new Date(now.getTime() - 12 * 60 * 1000),
    });

    // Order 3: Pending Confirmation (Incoming order for restaurant to Accept/Decline, or customer Cancel)
    await Order.create({
      user: customer._id,
      orderItems: [
        {
          product: products[1]._id,
          name: products[1].name,
          quantity: 1,
          image: products[1].image,
          price: products[1].price,
        },
        {
          product: products[4]._id,
          name: products[4].name,
          quantity: 1,
          image: products[4].image,
          price: products[4].price,
        },
      ],
      shippingAddress: {
        address: "House 28, Road 4",
        city: "Dhaka",
        postalCode: "1213",
        area: "Banani",
      },
      paymentMethod: "Card or Debit Card",
      deliveryMethod: "Standard",
      itemsPrice: 580,
      taxPrice: 0,
      shippingPrice: 45,
      tipAmount: 20,
      totalPrice: 645,
      isPaid: true,
      paidAt: new Date(),
      isDelivered: false,
      status: "pending",
    });

    // Order 4: Delivered Order with 5-Star Rating & Review (Shows completed revenue & rider tip)
    await Order.create({
      user: customer._id,
      orderItems: [
        {
          product: products[0]._id,
          name: products[0].name,
          quantity: 1,
          image: products[0].image,
          price: products[0].price,
        },
        {
          product: products[4]._id,
          name: products[4].name,
          quantity: 1,
          image: products[4].image,
          price: products[4].price,
        },
      ],
      shippingAddress: {
        address: "House 15, Road 5, Block C",
        city: "Dhaka",
        postalCode: "1212",
        area: "Gulshan",
      },
      paymentMethod: "Bkash",
      deliveryMethod: "Priority",
      itemsPrice: 610,
      taxPrice: 0,
      shippingPrice: 60,
      tipAmount: 50,
      totalPrice: 720,
      isPaid: true,
      paidAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      isDelivered: true,
      deliveredAt: new Date(now.getTime() - 23 * 60 * 60 * 1000),
      status: "delivered",
      rider: rider._id,
      rating: 5,
      review: "The burger was exceptionally juicy and the lava cake was still warm and gooey. Super speedy delivery by Rahim!",
      ratedAt: new Date(now.getTime() - 22 * 60 * 60 * 1000),
    });

    // Order 5: Delivered Order with Active Customer Support Ticket (For testing support resolver)
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
          product: products[5]._id,
          name: products[5].name,
          quantity: 2,
          image: products[5].image,
          price: products[5].price,
        },
      ],
      shippingAddress: {
        address: "House 15, Road 5, Block C",
        city: "Dhaka",
        postalCode: "1212",
        area: "Gulshan",
      },
      paymentMethod: "Card or Debit Card",
      deliveryMethod: "Standard",
      itemsPrice: 1010,
      taxPrice: 0,
      shippingPrice: 45,
      tipAmount: 0,
      totalPrice: 1055,
      isPaid: true,
      paidAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      isDelivered: true,
      deliveredAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      status: "delivered",
      rider: rider._id,
      supportTickets: [
        {
          issueType: "Missing extra dip sauces",
          message: "Hi, I ordered extra garlic ranch dips with the pizza but they were not in the parcel bag.",
          status: "open",
          createdAt: new Date(now.getTime() - 90 * 60 * 1000),
        },
      ],
    });

    // Order 6: Cancelled Order (For testing history filters)
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
      ],
      shippingAddress: {
        address: "House 15, Road 5, Block C",
        city: "Dhaka",
        postalCode: "1212",
        area: "Gulshan",
      },
      paymentMethod: "Cash on Delivery",
      deliveryMethod: "Saver",
      itemsPrice: 450,
      taxPrice: 0,
      shippingPrice: 30,
      tipAmount: 0,
      totalPrice: 480,
      isPaid: false,
      isDelivered: false,
      status: "cancelled",
      createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
    });
  }

  return {
    users: Object.values(createdUsers).map((u: any) => ({
      email: u.email,
      role: u.role,
      name: `${u.firstName} ${u.lastName}`,
    })),
    productsCount: products.length,
    ordersCount: await Order.countDocuments(),
  };
}
