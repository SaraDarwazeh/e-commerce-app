import { collection, doc, addDoc, getDocs, updateDoc, serverTimestamp, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION_NAME = 'orders';

export const createOrder = async (orderData) => {
  try {
    const payload = {
      ...orderData,
      status: 'Processing',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
    return docRef.id;
  } catch (error) {
    console.error("Error creating order:", error);
    throw new Error("Failed to create order");
  }
};

/**
 * Normalizes a raw Firestore order document into a consistent shape.
 * Guarantees flat fields so consumers never need fallback chains.
 */
const normalizeOrder = (id, data) => {
  const total = Number(data.total ?? data.totals?.total ?? 0);
  const subtotal = Number(data.subtotal ?? data.totals?.subtotal ?? 0);
  const deliveryCost = Number(data.deliveryCost ?? data.totals?.deliveryCost ?? data.shippingCost ?? data.totals?.shipping ?? 0);
  const discountAmount = Number(data.discountAmount ?? data.totals?.discountAmount ?? 0);

  const date = data.createdAt?.toDate
    ? data.createdAt.toDate().toISOString()
    : (data.date || new Date().toISOString());

  const items = Array.isArray(data.items) ? data.items : [];
  const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 1), 0);

  return {
    id,
    ...data,
    // Guaranteed flat financial fields
    total,
    subtotal,
    deliveryCost,
    discountAmount,
    // Guaranteed metadata
    date,
    items,
    itemCount,
    status: data.status || 'Processing',
    paymentStatus: data.paymentStatus || (data.paymentMethod === 'cod' ? 'unpaid' : 'pending_verification'),
    paymentMethod: data.paymentMethod || 'unknown',
    customerName: data.customerName || 'Guest',
    customerEmail: data.customerEmail || 'N/A',
    customerPhone: data.customerPhone || data.phone || 'N/A',
    deliveryRegion: data.deliveryRegion || data.shippingRegion || data.shippingAddress?.region || 'N/A',
    address: data.address || data.shippingAddress?.address || 'N/A',
    notes: data.notes || data.shippingAddress?.notes || '',
    couponCode: data.couponCode || null
  };
};

export const getOrders = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME));
    const snapshot = await getDocs(q);

    const orders = snapshot.docs.map(docSnap => normalizeOrder(docSnap.id, docSnap.data()));

    // Sort descending by date
    orders.sort((a, b) => new Date(b.date) - new Date(a.date));
    return orders;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw new Error("Failed to fetch orders");
  }
};

export const updateOrderStatus = async (orderId, newStatus) => {
  try {
    const orderRef = doc(db, COLLECTION_NAME, orderId);
    await updateDoc(orderRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    throw new Error("Failed to update order status");
  }
};

export const updatePaymentStatus = async (orderId, newStatus) => {
  try {
    const orderRef = doc(db, COLLECTION_NAME, orderId);
    await updateDoc(orderRef, {
      paymentStatus: newStatus,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    throw new Error("Failed to update payment status");
  }
};

export const cancelOrder = async (orderId) => {
  try {
    const orderRef = doc(db, COLLECTION_NAME, orderId);
    await updateDoc(orderRef, {
      status: 'Cancelled',
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    throw new Error("Failed to cancel order");
  }
};
