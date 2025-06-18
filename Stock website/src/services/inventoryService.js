import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  getDoc,
  query,
  where
} from 'firebase/firestore';

export const inventoryService = {
  // Get all inventory items
  async getAllItems() {
    try {
      const querySnapshot = await getDocs(collection(db, 'inventory'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  },

  // Get items by location
  async getItemsByLocation(location) {
    try {
      const q = query(collection(db, 'inventory'), where('location', '==', location));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching inventory by location:', error);
      throw error;
    }
  },

  // Add new item
  async addItem(itemData) {
    try {
      const docRef = await addDoc(collection(db, 'inventory'), {
        ...itemData,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
      return { id: docRef.id, ...itemData };
    } catch (error) {
      console.error('Error adding inventory item:', error);
      throw error;
    }
  },

  // Update item
  async updateItem(itemId, itemData) {
    try {
      const itemRef = doc(db, 'inventory', itemId);
      await updateDoc(itemRef, {
        ...itemData,
        lastUpdated: new Date().toISOString()
      });
      return { id: itemId, ...itemData };
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  },

  // Delete item
  async deleteItem(itemId) {
    try {
      await deleteDoc(doc(db, 'inventory', itemId));
      return itemId;
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  },

  // Adjust stock quantity
  async adjustStock(itemId, adjustment, userId) {
    try {
      const itemRef = doc(db, 'inventory', itemId);
      const itemDoc = await getDoc(itemRef);
      
      if (!itemDoc.exists()) {
        throw new Error('Item not found');
      }

      const currentQuantity = itemDoc.data().quantity;
      const newQuantity = Math.max(0, currentQuantity + adjustment);

      await updateDoc(itemRef, {
        quantity: newQuantity,
        lastUpdated: new Date().toISOString(),
        lastUpdatedBy: userId
      });

      return {
        id: itemId,
        quantity: newQuantity
      };
    } catch (error) {
      console.error('Error adjusting stock:', error);
      throw error;
    }
  }
}; 