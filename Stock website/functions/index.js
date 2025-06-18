/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Function to update stock when a movement is completed
exports.updateStockOnMovement = functions.firestore
  .document("stockMovements/{movementId}")
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const previousData = change.before.data();
    const movementId = context.params.movementId;

    // Only proceed if status changed to completed
    if (newData.status === "completed" && previousData.status !== "completed") {
      const db = admin.firestore();
      const batch = db.batch();

      try {
        // Get the inventory item
        const inventoryRef = db.collection("inventory").doc(newData.itemId);
        const inventoryDoc = await inventoryRef.get();
        const inventoryItem = inventoryDoc.data();

        // Calculate new quantity based on movement type
        let newQuantity = inventoryItem.quantity;
        if (newData.type === "in") {
          newQuantity += newData.quantity;
        } else if (newData.type === "out") {
          newQuantity -= newData.quantity;
        } else if (newData.type === "transfer") {
          // For transfers, we need to update both source and destination locations
          if (newData.location === "Front Warehouse") {
            newQuantity -= newData.quantity;
          } else {
            newQuantity += newData.quantity;
          }
        }

        // Update inventory quantity
        batch.update(inventoryRef, {
          quantity: newQuantity,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update movement status
        const movementRef = db.collection("stockMovements").doc(movementId);
        batch.update(movementRef, {
          status: "completed",
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        // Commit the batch
        await batch.commit();

        console.log(`Successfully updated stock for movement ${movementId}`);
      } catch (error) {
        console.error(`Error updating stock for movement ${movementId}:`, error);
        throw error;
      }
    }
  });

// Function to check for low stock and send notifications
exports.checkLowStock = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async () => {
    const db = admin.firestore();
    const lowStockThreshold = 200;

    try {
      const inventorySnapshot = await db.collection("inventory").get();
      const lowStockItems = [];

      inventorySnapshot.forEach(doc => {
        const item = doc.data();
        if (item.quantity <= lowStockThreshold) {
          lowStockItems.push({
            id: doc.id,
            name: item.name,
            quantity: item.quantity,
            location: item.location
          });
        }
      });

      if (lowStockItems.length > 0) {
        // Create a notification document
        await db.collection("notifications").add({
          type: "low_stock",
          items: lowStockItems,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          read: false
        });

        console.log(`Created low stock notification for ${lowStockItems.length} items`);
      }

      return null;
    } catch (error) {
      console.error("Error checking low stock:", error);
      throw error;
    }
  });
