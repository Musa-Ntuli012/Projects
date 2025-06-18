import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy,
  runTransaction,
  where,
  limit,
  serverTimestamp,
  onSnapshot,
  startAfter
} from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION_NAME = 'stock_movements';
const INVENTORY_COLLECTION = 'inventory';
const LOW_STOCK_THRESHOLD = 200;

export const stockMovementService = {
  // Subscribe to real-time updates with pagination
  subscribeToMovements(callback, pageSize = 20) {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('timestamp', 'desc'),
      limit(pageSize)
    );
    return onSnapshot(q, (snapshot) => {
      const movements = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(movements);
    });
  },

  // Subscribe to inventory updates
  subscribeToInventory(callback) {
    const q = query(collection(db, INVENTORY_COLLECTION));
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(items);
    });
  },

  // Get paginated movements
  async getPaginatedMovements(pageSize = 20, lastDoc = null) {
    try {
      let q = query(
        collection(db, COLLECTION_NAME),
        orderBy('timestamp', 'desc'),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const movements = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        movements,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
        hasMore: querySnapshot.docs.length === pageSize
      };
    } catch (error) {
      console.error('Error getting paginated movements:', error);
      throw new Error('Failed to fetch movements. Please try again later.');
    }
  },

  async getAllMovements() {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting movements:', error);
      throw error;
    }
  },

  async createMovement(movementData) {
    try {
      const { itemId, type, quantity, location, transferToLocation, notes, userId } = movementData;
      const numericQuantity = Number(quantity);

      // Start a transaction
      await runTransaction(db, async (transaction) => {
        // Get the item document
        const itemRef = doc(db, 'inventory', itemId);
        const itemDoc = await transaction.get(itemRef);

        if (!itemDoc.exists()) {
          throw new Error('Item not found');
        }

        const itemData = itemDoc.data();
        let newQuantity = itemData.quantity;

        // Handle different movement types
        switch (type) {
          case 'stock_in':
            newQuantity += numericQuantity;
            break;
          case 'stock_sold':
            if (newQuantity < numericQuantity) {
              throw new Error('Insufficient stock available');
            }
            newQuantity -= numericQuantity;
            break;
          case 'transfer':
            if (newQuantity < numericQuantity) {
              throw new Error('Insufficient stock available for transfer');
            }
            // For transfers, we don't change the total quantity
            // We just update the location
            break;
          default:
            throw new Error('Invalid movement type');
        }

        // Update the item's quantity and location if it's a transfer
        const updateData = {
          quantity: newQuantity,
          lastUpdated: serverTimestamp()
        };

        if (type === 'transfer') {
          updateData.location = transferToLocation;
        }

        transaction.update(itemRef, updateData);

        // Create the movement record
        const movementRef = doc(collection(db, COLLECTION_NAME));
        transaction.set(movementRef, {
          itemId,
          type,
          quantity: numericQuantity,
          location,
          transferToLocation,
          notes,
          timestamp: serverTimestamp(),
          createdAt: serverTimestamp(),
          status: 'completed',
          createdBy: userId
        });
      });

      return true;
    } catch (error) {
      console.error('Error creating movement:', error);
      throw new Error(error.message || 'Failed to create movement. Please try again later.');
    }
  },

  async updateMovement(id, movementData) {
    try {
      const { itemId, type, quantity, location, transferToLocation, notes } = movementData;
      const numericQuantity = Number(quantity);

      // Start a transaction
      await runTransaction(db, async (transaction) => {
        // Get the movement document
        const movementRef = doc(db, COLLECTION_NAME, id);
        const movementDoc = await transaction.get(movementRef);

        if (!movementDoc.exists()) {
          throw new Error('Movement not found');
        }

        const oldMovement = movementDoc.data();
        const itemRef = doc(db, 'inventory', itemId);
        const itemDoc = await transaction.get(itemRef);

        if (!itemDoc.exists()) {
          throw new Error('Item not found');
        }

        const itemData = itemDoc.data();
        let newQuantity = itemData.quantity;

        // Revert the old movement's effect on quantity
        if (oldMovement.type === 'stock_in') {
          newQuantity -= oldMovement.quantity;
        } else if (oldMovement.type === 'stock_sold') {
          newQuantity += oldMovement.quantity;
        }

        // Apply the new movement's effect on quantity
        switch (type) {
          case 'stock_in':
            newQuantity += numericQuantity;
            break;
          case 'stock_sold':
            if (newQuantity < numericQuantity) {
              throw new Error('Insufficient stock available');
            }
            newQuantity -= numericQuantity;
            break;
          case 'transfer':
            // For transfers, we don't change the total quantity
            break;
          default:
            throw new Error('Invalid movement type');
        }

        // Update the item's quantity and location if it's a transfer
        const updateData = {
          quantity: newQuantity,
          lastUpdated: serverTimestamp()
        };

        if (type === 'transfer') {
          updateData.location = transferToLocation;
        }

        transaction.update(itemRef, updateData);

        // Update the movement record
        transaction.update(movementRef, {
          itemId,
          type,
          quantity: numericQuantity,
          location,
          transferToLocation,
          notes,
          timestamp: serverTimestamp(),
          updatedAt: serverTimestamp(),
          status: 'completed'
        });
      });

      return true;
    } catch (error) {
      console.error('Error updating movement:', error);
      throw error;
    }
  },

  async deleteMovement(id) {
    try {
      // Start a transaction
      await runTransaction(db, async (transaction) => {
        // Get the movement document
        const movementRef = doc(db, COLLECTION_NAME, id);
        const movementDoc = await transaction.get(movementRef);

        if (!movementDoc.exists()) {
          throw new Error('Movement not found');
        }

        const movement = movementDoc.data();
        const itemRef = doc(db, 'inventory', movement.itemId);
        const itemDoc = await transaction.get(itemRef);

        if (!itemDoc.exists()) {
          throw new Error('Item not found');
        }

        const itemData = itemDoc.data();
        let newQuantity = itemData.quantity;

        // Revert the movement's effect on quantity
        if (movement.type === 'stock_in') {
          newQuantity -= movement.quantity;
        } else if (movement.type === 'stock_sold') {
          newQuantity += movement.quantity;
        }

        // Update the item's quantity
        transaction.update(itemRef, {
          quantity: newQuantity,
          lastUpdated: serverTimestamp()
        });

        // Delete the movement record
        transaction.delete(movementRef);
      });

      return true;
    } catch (error) {
      console.error('Error deleting movement:', error);
      throw error;
    }
  },

  async updateMovementStatus(id, newStatus) {
    try {
      const movementRef = doc(db, COLLECTION_NAME, id);
      const movementDoc = await movementRef.get();
      const movement = movementDoc.data();

      // Only update inventory if status is changing to completed
      if (newStatus === 'completed' && movement.status !== 'completed') {
        await runTransaction(db, async (transaction) => {
          // Get the inventory item
          const inventoryRef = doc(db, INVENTORY_COLLECTION, movement.itemId);
          const inventoryDoc = await transaction.get(inventoryRef);
          const inventoryItem = inventoryDoc.data();

          // Calculate new quantity based on movement type
          let newQuantity = inventoryItem.quantity;
          if (movement.type === 'in') {
            newQuantity += movement.quantity;
          } else if (movement.type === 'out') {
            newQuantity -= movement.quantity;
          } else if (movement.type === 'transfer') {
            // For transfers, we need to update both source and destination locations
            if (movement.location === 'Front Warehouse') {
              newQuantity -= movement.quantity;
            } else {
              newQuantity += movement.quantity;
            }
          }

          // Check for low stock after update
          const isLowStock = newQuantity <= LOW_STOCK_THRESHOLD;
          
          // Update inventory quantity and low stock status
          transaction.update(inventoryRef, {
            quantity: newQuantity,
            lastUpdated: new Date(),
            isLowStock: isLowStock
          });

          // Update movement status
          transaction.update(movementRef, {
            status: newStatus,
            timestamp: new Date()
          });
        });
      } else {
        // Just update the status if not completing the movement
        await updateDoc(movementRef, {
          status: newStatus,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error updating movement status:', error);
      throw error;
    }
  },

  // New method to check for low stock items
  async checkLowStock() {
    try {
      const q = query(collection(db, INVENTORY_COLLECTION));
      const querySnapshot = await getDocs(q);
      const lowStockItems = [];

      querySnapshot.forEach(doc => {
        const item = doc.data();
        if (item.quantity <= LOW_STOCK_THRESHOLD) {
          lowStockItems.push({
            id: doc.id,
            name: item.name,
            quantity: item.quantity,
            location: item.location,
            price: item.price
          });
        }
      });

      return lowStockItems;
    } catch (error) {
      console.error('Error checking low stock:', error);
      throw error;
    }
  },

  // Get recent movements
  getRecentMovements: async (limitCount = 5) => {
    try {
      const movementsRef = collection(db, COLLECTION_NAME);
      const q = query(
        movementsRef, 
        orderBy('timestamp', 'desc'), 
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting recent movements:', error);
      throw error;
    }
  },

  // Get movements by date range
  getMovementsByDateRange: async (startDate, endDate) => {
    try {
      const movementsRef = collection(db, COLLECTION_NAME);
      const q = query(
        movementsRef,
        where('timestamp', '>=', startDate),
        where('timestamp', '<=', endDate),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting movements by date range:', error);
      throw error;
    }
  }
}; 