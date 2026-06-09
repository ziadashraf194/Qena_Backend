import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import Category from "./models/Category.js";
import Product from "./models/Product.js";
import User from "./models/User.js";
import Cart from "./models/Cart.js";
import Order from "./models/Order.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/e_commerce";
const UPLOADS_DIR = path.join(__dirname, "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// دوال تحميل آمنة مع إعادة المحاولة
async function downloadImage(url, filePath, retries = 3, delay = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const writer = fs.createWriteStream(filePath);
      const response = await axios({
        url,
        method: "GET",
        responseType: "stream",
        timeout: 15000, // 15 ثانية مهلة
      });
      response.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });
      return true;
    } catch (error) {
      console.warn(`  ⚠️ Attempt ${attempt} failed for ${url}: ${error.message}`);
      if (attempt === retries) return false;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
}

// صور المنتجات حسب الفئة (روابط عشوائية لتجنب المعرفات)
const imagesByCategory = {
  electronics: [
    "https://picsum.photos/500/500?random=10",
    "https://picsum.photos/500/500?random=11",
    "https://picsum.photos/500/500?random=12",
    "https://picsum.photos/500/500?random=13",
    "https://picsum.photos/500/500?random=14",
    "https://picsum.photos/500/500?random=15",
  ],
  fashion: [
    "https://picsum.photos/500/500?random=20",
    "https://picsum.photos/500/500?random=21",
    "https://picsum.photos/500/500?random=22",
    "https://picsum.photos/500/500?random=23",
    "https://picsum.photos/500/500?random=24",
    "https://picsum.photos/500/500?random=25",
  ],
  home: [
    "https://picsum.photos/500/500?random=30",
    "https://picsum.photos/500/500?random=31",
    "https://picsum.photos/500/500?random=32",
    "https://picsum.photos/500/500?random=33",
    "https://picsum.photos/500/500?random=34",
    "https://picsum.photos/500/500?random=35",
  ],
  sports: [
    "https://picsum.photos/500/500?random=40",
    "https://picsum.photos/500/500?random=41",
    "https://picsum.photos/500/500?random=42",
    "https://picsum.photos/500/500?random=43",
    "https://picsum.photos/500/500?random=44",
    "https://picsum.photos/500/500?random=45",
  ],
  books: [
    "https://picsum.photos/500/500?random=50",
    "https://picsum.photos/500/500?random=51",
    "https://picsum.photos/500/500?random=52",
    "https://picsum.photos/500/500?random=53",
    "https://picsum.photos/500/500?random=54",
    "https://picsum.photos/500/500?random=55",
  ],
  garden: [
    "https://picsum.photos/500/500?random=60",
    "https://picsum.photos/500/500?random=61",
    "https://picsum.photos/500/500?random=62",
    "https://picsum.photos/500/500?random=63",
    "https://picsum.photos/500/500?random=64",
    "https://picsum.photos/500/500?random=65",
  ],
};

// صور الفئات (روابط عشوائية أيضاً)
const categoryImages = {
  electronics: "https://picsum.photos/400/300?random=70",
  fashion: "https://picsum.photos/400/300?random=71",
  home: "https://picsum.photos/400/300?random=72",
  sports: "https://picsum.photos/400/300?random=73",
  books: "https://picsum.photos/400/300?random=74",
  garden: "https://picsum.photos/400/300?random=75",
};

const categoriesData = [
  { name: "Electronics", slug: "electronics", description: "Latest gadgets and accessories" },
  { name: "Fashion", slug: "fashion", description: "Trendy clothing and stylish wear" },
  { name: "Home", slug: "home", description: "Modern decor and furniture" },
  { name: "Sports", slug: "sports", description: "Sports equipment and gear" },
  { name: "Books", slug: "books", description: "A variety of books for reading and knowledge" },
  { name: "Garden", slug: "garden", description: "Tools and plants for your garden" },
];

const productsRaw = [
  { name: "Smartphone X200", category: "electronics", price: 499, stock: 50, numImages: 3, description: "Advanced phone with AMOLED screen." },
  { name: "Wireless Earbuds", category: "electronics", price: 89, stock: 120, numImages: 2, description: "Pure sound with noise cancelling." },
  { name: "Smart Watch", category: "electronics", price: 199, stock: 80, numImages: 3, description: "Fitness tracking and notifications." },
  { name: "Cotton T-Shirt", category: "fashion", price: 25, stock: 200, numImages: 2, description: "Comfortable and stylish." },
  { name: "Running Shoes", category: "fashion", price: 120, stock: 60, numImages: 3, description: "Modern design, ultimate comfort." },
  { name: "Leather Handbag", category: "fashion", price: 75, stock: 90, numImages: 2, description: "Genuine leather and elegance." },
  { name: "LED Smart Lamp", category: "home", price: 40, stock: 150, numImages: 2, description: "Smart lighting, energy efficient." },
  { name: "Bed Sheet Set", category: "home", price: 55, stock: 70, numImages: 2, description: "100% cotton, luxurious softness." },
  { name: "Modern Rug", category: "home", price: 130, stock: 40, numImages: 3, description: "Attractive geometric design." },
  { name: "Dumbbells 5kg", category: "sports", price: 30, stock: 100, numImages: 2, description: "Perfect for home workouts." },
  { name: "Yoga Mat", category: "sports", price: 25, stock: 130, numImages: 2, description: "Non-slip and easy to clean." },
  { name: "Exercise Bike", category: "sports", price: 350, stock: 25, numImages: 3, description: "Digital screen, magnetic resistance." },
  { name: "Mystery Novel", category: "books", price: 15, stock: 300, numImages: 2, description: "Bestselling thriller." },
  { name: "Cooking Guide", category: "books", price: 28, stock: 90, numImages: 2, description: "Easy and delicious recipes." },
  { name: "Self-Help Book", category: "books", price: 18, stock: 120, numImages: 2, description: "Change your life for the better." },
  { name: "Indoor Plant Set", category: "garden", price: 45, stock: 60, numImages: 2, description: "3 easy-care plants." },
  { name: "Garden Hose", category: "garden", price: 22, stock: 80, numImages: 2, description: "Flexible and long." },
  { name: "Pruning Tools", category: "garden", price: 35, stock: 70, numImages: 2, description: "5-piece tool set." },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    console.log("Deleting old data...");
    await Category.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
    await Cart.deleteMany({});
    await Order.deleteMany({});

    // 1. إنشاء الفئات مع صور (مع معالجة الفشل)
    const categoriesWithImages = [];
    for (const cat of categoriesData) {
      const imageUrl = categoryImages[cat.slug];
      let imageFileName = "";
      if (imageUrl) {
        const fileName = `category_${cat.slug}_${Date.now()}.jpg`;
        const filePath = path.join(UPLOADS_DIR, fileName);
        const success = await downloadImage(imageUrl, filePath);
        if (success) {
          imageFileName = `uploads/${fileName}`;
          console.log(`  ✅ Downloaded category image for ${cat.name}`);
        } else {
          console.warn(`  ⚠️ Using placeholder for category ${cat.name} due to download failure`);
          // يمكنك وضع رابط افتراضي ثابت هنا إن أردت
          imageFileName = ""; // سيظهر كصورة فارغة أو يمكن للواجهة استخدام placeholder
        }
      }
      categoriesWithImages.push({
        ...cat,
        image: imageFileName,
      });
    }

    const createdCategories = await Category.insertMany(categoriesWithImages, { ordered: false });
    console.log(`✅ Created ${createdCategories.length} categories`);

    // 2. إنشاء المنتجات (نفس الآلية)
    const productDocs = [];
    for (const prod of productsRaw) {
      const imagePool = imagesByCategory[prod.category] || [];
      const images = [];
      const num = Math.min(prod.numImages, imagePool.length);
      for (let i = 0; i < num; i++) {
        const url = imagePool[i];
        const fileName = `${prod.name.replace(/\s+/g, "_").toLowerCase()}_${Date.now()}_${i}.jpg`;
        const filePath = path.join(UPLOADS_DIR, fileName);
        const success = await downloadImage(url, filePath);
        if (success) {
          images.push(`uploads/${fileName}`);
          console.log(`  ✅ Downloaded ${fileName}`);
        } else {
          console.warn(`  ⚠️ Skipping image ${i+1} for ${prod.name} (download failed)`);
        }
      }
      productDocs.push({
        name: prod.name,
        slug: slugify(prod.name),
        description: prod.description,
        price: prod.price,
        category: prod.category,
        images,
        stock: prod.stock,
      });
    }

    const createdProducts = await Product.insertMany(productDocs);
    console.log(`✅ Created ${createdProducts.length} products`);

    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash("admin123", salt);
    const userPass = await bcrypt.hash("user123", salt);

    const usersData = [
      { firstName: "Admin", lastName: "Master", email: "admin@aura.com", password: adminPass, role: "admin", slug: "admin-master" },
      { firstName: "John", lastName: "Doe", email: "john@example.com", password: userPass, role: "user", slug: "john-doe" },
      { firstName: "Jane", lastName: "Smith", email: "jane@example.com", password: userPass, role: "user", slug: "jane-smith" },
      { firstName: "Bob", lastName: "Johnson", email: "bob@example.com", password: userPass, role: "user", slug: "bob-johnson" },
    ];

    const createdUsers = await User.insertMany(usersData);
    console.log(`✅ Created ${createdUsers.length} users`);

    for (const user of createdUsers) {
      if (user.role === "admin") {
        await Cart.create({ user: user.slug, items: [], totalPrice: 0, totalItems: 0 });
      } else {
        const randomProducts = createdProducts.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1);
        const items = randomProducts.map(p => ({
          productSlug: p.slug,
          price: p.price,
          quantity: Math.floor(Math.random() * 3) + 1,
        }));
        const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        await Cart.create({ user: user.slug, items, totalPrice, totalItems });
      }
    }
    console.log("✅ Created carts");

    const statuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
    const paymentStatuses = ["paid", "unpaid"];
    const paymentMethods = ["cash", "fawry"];
    const addresses = [
      { shippingAddress: "123 Main Street, Apt 4", city: "New York", phone: "+1 (555) 123-4567" },
      { shippingAddress: "456 Elm Avenue", city: "Los Angeles", phone: "+1 (555) 987-6543" },
      { shippingAddress: "789 Oak Road", city: "Chicago", phone: "+1 (555) 456-7890" },
      { shippingAddress: "321 Pine Lane", city: "Houston", phone: "+1 (555) 321-6789" },
      { shippingAddress: "654 Maple Drive", city: "Phoenix", phone: "+1 (555) 654-9870" },
    ];

    const orders = [];
    const regularUsers = createdUsers.filter(u => u.role === "user");

    for (let i = 0; i < 35; i++) {
      const user = regularUsers[Math.floor(Math.random() * regularUsers.length)];
      const numItems = Math.floor(Math.random() * 3) + 1;
      const items = [];
      const selectedProductSlugs = new Set();
      for (let j = 0; j < numItems; j++) {
        const product = createdProducts[Math.floor(Math.random() * createdProducts.length)];
        if (selectedProductSlugs.has(product.slug)) continue;
        selectedProductSlugs.add(product.slug);
        const quantity = Math.floor(Math.random() * 3) + 1;
        items.push({ productSlug: product.slug, price: product.price, quantity });
      }
      if (items.length === 0) continue;

      const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      const address = addresses[Math.floor(Math.random() * addresses.length)];
      const daysAgo = Math.floor(Math.random() * 60);
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      orders.push({
        userSlug: user.slug,
        items,
        totalPrice,
        status,
        address,
        paymentMethod,
        paymentStatus,
        createdAt,
        updatedAt: createdAt,
      });
    }

    await Order.insertMany(orders);
    console.log(`✅ Created ${orders.length} orders`);

    console.log("🎉 Database seeded successfully! You can now run the app.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();