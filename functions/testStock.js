const admin = require('firebase-admin');

// We use default application credentials (assuming authenticated via ADC)
admin.initializeApp({
  projectId: 'victor-shop-9445a'
});

const db = admin.firestore();

async function runTest() {
  try {
    const productId = "test_product_" + Date.now();
    const orderId = "test_order_" + Date.now();

    console.log(`\n--- CREATING DUMMY PRODUCT: ${productId} ---`);
    const productRef = db.collection("products").doc(productId);
    await productRef.set({
      title: "Stock Test Item",
      stock: 50,
      variants: [
        { color: "#8B4513", label: "Brown", stock: 10 },
        { color: "#FF0000", label: "Red", stock: 5 }
      ]
    });
    console.log("Product created with 10 Brown stock and 5 Red stock.");

    console.log(`\n--- CREATING PENDING ORDER: ${orderId} ---`);
    const orderRef = db.collection("orders").doc(orderId);
    await orderRef.set({
      status: "Processing",
      paymentStatus: "unpaid",
      stockDeducted: false,
      items: [
        {
          productId: productId,
          quantity: 2,
          selectedColor: "#8B4513"
        }
      ]
    });
    console.log("Order created requesting 2x #8B4513 (Brown) variants. Status: Processing / unpaid");

    console.log("\n--- TRIGGERING INVENTORY DEDUCTION ---");
    console.log("Updating order to Paid + Delivered...");
    await orderRef.update({
      status: "Delivered",
      paymentStatus: "paid"
    });
    console.log("Order updated! Waiting 7 seconds for Cloud Function to process...");

    await new Promise(resolve => setTimeout(resolve, 7000));

    // Verify
    const updatedOrder = await orderRef.get();
    console.log("\n--- VERIFICATION ---");
    console.log("Order stockDeducted state:", updatedOrder.data().stockDeducted);

    const updatedProduct = await productRef.get();
    const variants = updatedProduct.data().variants;
    const brownStock = variants.find(v => v.color === "#8B4513").stock;
    console.log("Brown Variant New Stock (Expected: 8):", brownStock);
    
    if (brownStock === 8 && updatedOrder.data().stockDeducted === true) {
      console.log("\n✅ SUCCESS: Inventory deduction executed flawlessly and atomically.");
    } else {
      console.error("\n❌ FAILED: Inventory did not deduct properly.");
    }

    process.exit(0);

  } catch (error) {
    console.error("Test Error:", error);
    process.exit(1);
  }
}

runTest();
