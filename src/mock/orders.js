export const mockOrders = [
  {
    id: 'o1001',
    userId: 'u1',
    customerName: 'Alice Johnson',
    date: '2025-12-01T10:30:00Z',
    status: 'Delivered',
    total: 349.49,
    items: [
      { productId: 'p1', title: 'Wireless Noise-Canceling Headphones', quantity: 1, price: 299.99 },
      { productId: 'p2', title: 'Minimalist Leather Wallet', quantity: 1, price: 49.50 }
    ],
    shippingAddress: '123 Maple Street, Springfield, IL 62701'
  },
  {
    id: 'o1002',
    userId: 'u2',
    customerName: 'Bob Smith',
    date: '2025-12-05T15:45:00Z',
    status: 'Processing',
    total: 199.00,
    items: [
      { productId: 'p3', title: 'Smart Fitness Watch', quantity: 1, price: 199.00 }
    ],
    shippingAddress: '456 Oak Avenue, Metropolis, NY 10001'
  },
  {
    id: 'o1003',
    userId: 'u1',
    customerName: 'Alice Johnson',
    date: '2025-12-10T09:15:00Z',
    status: 'Shipped',
    total: 84.99,
    items: [
      { productId: 'p5', title: 'Stainless Steel Water Bottle', quantity: 1, price: 34.99 },
      { productId: 'p12', title: 'Cast Iron Skillet', quantity: 1, price: 49.99 }
    ],
    shippingAddress: '123 Maple Street, Springfield, IL 62701'
  },
  {
    id: 'o1004',
    userId: 'u2',
    customerName: 'Bob Smith',
    date: '2025-12-12T11:20:00Z',
    status: 'Pending',
    total: 74.98,
    items: [
      { productId: 'p4', title: 'Organic Cotton T-Shirt', quantity: 2, price: 24.99 },
      { productId: 'p6', title: 'Ceramic Coffee Mug Set', quantity: 1, price: 25.00 } // discounted
    ],
    shippingAddress: '456 Oak Avenue, Metropolis, NY 10001'
  }
];
