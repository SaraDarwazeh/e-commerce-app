import { db } from '../firebase/config';
import { collection, writeBatch, doc } from 'firebase/firestore';

const BAG_CATEGORIES = [
  { slug: 'hand-bags', name: 'Hand Bags', description: 'Classic and modern handbags for everyday wear.' },
  { slug: 'shoulder-bags', name: 'Shoulder Bags', description: 'Comfortable and stylish over-the-shoulder bags.' },
  { slug: 'crossbody-bags', name: 'Crossbody Bags', description: 'Convenient hands-free crossbody bags.' },
  { slug: 'tote-bags', name: 'Tote Bags', description: 'Spacious totes for work and travel.' },
  { slug: 'backpacks', name: 'Backpacks', description: 'Chic and functional fashion backpacks.' },
  { slug: 'evening-bags', name: 'Evening Bags', description: 'Elegant clutches and mini bags for nights out.' },
  { slug: 'mini-bags', name: 'Mini Bags', description: 'Compact and trendy mini proportion bags.' },
  { slug: 'travel-bags', name: 'Travel Bags', description: 'Durable travel and weekender bags.' }
];

const SEED_PRODUCTS = [
  {
    title: 'Classic Quilted Hand Bag',
    slug: 'classic-quilted-hand-bag',
    description: 'A timeless quilted hand bag featuring gold-tone hardware, a secure turn-lock closure, and a spacious interior for your daily essentials.',
    price: 1250,
    comparePrice: 1500,
    category: 'hand-bags',
    brand: 'Luxe Collection',
    stock: 12,
    isFeatured: true,
    isActive: true,
    images: ['https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=800&q=80'],
    options: [
      { name: 'Color', values: ['Black', 'Beige', 'Red'] },
      { name: 'Material', values: ['Caviar Leather', 'Lambskin'] }
    ]
  },
  {
    title: 'Premium Mini Shoulder Bag',
    slug: 'premium-mini-shoulder-bag',
    description: 'A structural masterpiece scaled down to mini proportions. Features a sleek chain strap and smooth leather finish.',
    price: 850,
    comparePrice: 0,
    category: 'mini-bags',
    brand: 'Milano Designs',
    stock: 5,
    isFeatured: true,
    isActive: true,
    images: ['https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=800&q=80'],
    options: [
      { name: 'Color', values: ['White', 'Black'] }
    ]
  },
  {
    title: 'Elegant Leather Tote',
    slug: 'elegant-leather-tote',
    description: 'The ultimate work-to-weekend bag. Crafted from textured Italian leather with an open top and interior zip pouch.',
    price: 495,
    comparePrice: 650,
    category: 'tote-bags',
    brand: 'Atelier Maison',
    stock: 24,
    isFeatured: false,
    isActive: true,
    images: ['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80'],
    options: [
      { name: 'Color', values: ['Tan', 'Black', 'Olive'] }
    ]
  },
  {
    title: 'Soft Crossbody Bag',
    slug: 'soft-crossbody-bag',
    description: 'Supple full-grain leather forms this relaxed crossbody bag, designed with an adjustable strap and external zip pocket.',
    price: 320,
    comparePrice: 0,
    category: 'crossbody-bags',
    brand: 'Urban Chic',
    stock: 15,
    isFeatured: false,
    isActive: true,
    images: ['https://images.unsplash.com/photo-1548036328-c1e138ae3445?w=800&q=80', 'https://images.unsplash.com/photo-1559563458-527698bf5295?w=800&q=80'],
    options: [
      { name: 'Color', values: ['Navy', 'Burgundy'] }
    ]
  },
  {
    title: 'Luxury Chain Evening Bag',
    slug: 'luxury-chain-evening-bag',
    description: 'Dazzle at any event with this crystal-embellished evening clutch featuring a detachable chain strap.',
    price: 680,
    comparePrice: 850,
    category: 'evening-bags',
    brand: 'Glamour Co',
    stock: 8,
    isFeatured: true,
    isActive: true,
    images: ['https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&q=80'],
    options: []
  },
  {
    title: 'Structured Leather Top Handle',
    slug: 'structured-leather-top-handle',
    description: 'Vintage-inspired structured bag featuring a prominent top handle, brass push-lock, and protective metal feet.',
    price: 1100,
    comparePrice: 0,
    category: 'hand-bags',
    brand: 'Heritage Paris',
    stock: 3,
    isFeatured: true,
    isActive: true,
    images: ['https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&q=80'],
    options: [
      { name: 'Color', values: ['Burgundy', 'Emerald'] },
      { name: 'Material', values: ['Smooth Leather', 'Croc-Embossed'] }
    ]
  },
  {
    title: 'Woven Summer Tote',
    slug: 'woven-summer-tote',
    description: 'Hand-woven raffia tote bag perfect for beach days or summer markets, detailed with leather top handles.',
    price: 240,
    comparePrice: 300,
    category: 'tote-bags',
    brand: 'Isla Collection',
    stock: 45,
    isFeatured: false,
    isActive: true,
    images: ['https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&q=80'],
    options: []
  },
  {
    title: 'Convertible Fashion Backpack',
    slug: 'convertible-fashion-backpack',
    description: 'A sleek leather backpack that easily converts into a shoulder bag. Perfect for city commuting.',
    price: 450,
    comparePrice: 0,
    category: 'backpacks',
    brand: 'Urban Chic',
    stock: 18,
    isFeatured: false,
    isActive: true,
    images: ['https://images.unsplash.com/photo-1620835560946-b6b5d9bcba33?w=800&q=80'],
    options: [
      { name: 'Color', values: ['Black', 'Grey'] }
    ]
  },
  {
    title: 'Satin Bow Mini Bag',
    slug: 'satin-bow-mini-bag',
    description: 'A charming satin mini bag decorated with a large statement bow. Just big enough for lipstick and keys.',
    price: 380,
    comparePrice: 450,
    category: 'mini-bags',
    brand: 'Glamour Co',
    stock: 9,
    isFeatured: false,
    isActive: true,
    images: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80'],
    options: [
      { name: 'Color', values: ['Pink', 'Black'] }
    ]
  },
  {
    title: 'Chevron Quilted Shoulder Bag',
    slug: 'chevron-quilted-shoulder-bag',
    description: 'Medium shoulder bag defined by its chevron quilting and antique gold-toned logo hardware.',
    price: 1800,
    comparePrice: 0,
    category: 'shoulder-bags',
    brand: 'Luxe Collection',
    stock: 4,
    isFeatured: true,
    isActive: true,
    images: ['https://images.unsplash.com/photo-1616034177309-17d5c5a083a2?w=800&q=80'],
    options: [
      { name: 'Color', values: ['Dusty Rose', 'Black', 'White'] }
    ]
  },
  {
    title: 'Saddle Crossbody',
    slug: 'saddle-crossbody',
    description: 'Equestrian-inspired saddle bag made from vegetable-tanned leather that ages beautifully over time.',
    price: 520,
    comparePrice: 600,
    category: 'crossbody-bags',
    brand: 'Heritage Paris',
    stock: 14,
    isFeatured: false,
    isActive: true,
    images: ['https://images.unsplash.com/photo-1581048671565-df04e8d388e6?w=800&q=80'],
    options: [
      { name: 'Color', values: ['Cognac', 'Espresso'] }
    ]
  },
  {
    title: 'Canvas Weekender Bag',
    slug: 'canvas-weekender-bag',
    description: 'Heavy-duty canvas weekender featuring reinforced leather corners, brass feet, and a removable shoulder strap.',
    price: 390,
    comparePrice: 0,
    category: 'travel-bags',
    brand: 'Atelier Maison',
    stock: 22,
    isFeatured: false,
    isActive: true,
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80'],
    options: [
      { name: 'Color', values: ['Cream/Cognac', 'Navy/Black'] }
    ]
  },
  {
    title: 'Nylon Puffer Tote',
    slug: 'nylon-puffer-tote',
    description: 'Ultra-lightweight nylon tote with plush puffer styling. Water-resistant and easy to clean.',
    price: 185,
    comparePrice: 220,
    category: 'tote-bags',
    brand: 'Urban Chic',
    stock: 30,
    isFeatured: false,
    isActive: true,
    images: ['https://images.unsplash.com/photo-1614179689702-df94770ce6be?w=800&q=80'],
    options: [
      { name: 'Color', values: ['Black', 'Olive', 'Neon Pink'] }
    ]
  },
  {
    title: 'Crystal Mesh Pouch',
    slug: 'crystal-mesh-pouch',
    description: 'A slouchy evening pouch constructed entirely from slinky crystal mesh with a knot handle.',
    price: 750,
    comparePrice: 900,
    category: 'evening-bags',
    brand: 'Glamour Co',
    stock: 6,
    isFeatured: false,
    isActive: true,
    images: ['https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&q=80'],
    options: [
      { name: 'Color', values: ['Silver', 'Gold', 'Iridescent'] }
    ]
  },
  {
    title: 'Micro City Bag',
    slug: 'micro-city-bag',
    description: 'Edge meets elegance in this micro moto-style bag with stud detailing, tassels, and a compact mirror.',
    price: 1450,
    comparePrice: 0,
    category: 'mini-bags',
    brand: 'Milano Designs',
    stock: 2,
    isFeatured: false,
    isActive: true,
    images: ['https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=800&q=80'],
    options: [
      { name: 'Color', values: ['Black', 'Graphite'] }
    ]
  },
  {
    title: 'Matelassé Chain Wallet',
    slug: 'matelasse-chain-wallet',
    description: 'Wallet on a chain featuring signature matelassé stitching. Fits cards, cash, and a smartphone.',
    price: 980,
    comparePrice: 1100,
    category: 'crossbody-bags',
    brand: 'Luxe Collection',
    stock: 11,
    isFeatured: false,
    isActive: true,
    images: ['https://images.unsplash.com/photo-1616034177309-17d5c5a083a2?w=800&q=80'],
    options: [
      { name: 'Color', values: ['Black', 'Powder Pink'] }
    ]
  }
];

export const seedBagsToFirestore = async () => {
  try {
    const batch = writeBatch(db);

    // 1. Seed Categories
    console.log("Seeding Categories...");
    const catsRef = collection(db, 'categories');
    BAG_CATEGORIES.forEach((cat, index) => {
      // Use purely the slug as the document ID for cleaner references if preferred, 
      // but auto-IDs work fine. Let's use auto-IDs to stay consistent with earlier logic,
      // but we will manually set the document ID to the slug so it's clean and predictable for routing.
      const docRef = doc(catsRef, cat.slug); 
      batch.set(docRef, {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        isActive: true,
        sortOrder: index,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    // 2. Seed Products
    console.log("Seeding Products...");
    const productsRef = collection(db, 'products');
    SEED_PRODUCTS.forEach(prod => {
      const docRef = doc(productsRef); // Auto ID
      batch.set(docRef, {
        ...prod,
        defaultSelections: {},
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    // Commit batch
    await batch.commit();
    console.log("Seeding complete!");
    return true;
  } catch (error) {
    console.error("Error seeding data:", error);
    throw error;
  }
};
