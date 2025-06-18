import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';

export const reportsService = {
  // Get stock levels report
  async getStockLevelsReport() {
    try {
      const querySnapshot = await getDocs(collection(db, 'inventory'));
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        totalItems: items.length,
        lowStockItems: items.filter(item => item.quantity <= item.threshold),
        outOfStockItems: items.filter(item => item.quantity === 0),
        byLocation: {
          front: items.filter(item => item.location === 'Front Warehouse').length,
          back: items.filter(item => item.location === 'Back Warehouse').length
        }
      };
    } catch (error) {
      console.error('Error generating stock levels report:', error);
      throw error;
    }
  },

  // Get stock movements report
  async getStockMovementsReport(dateRange) {
    try {
      const startDate = new Date();
      switch (dateRange) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      const q = query(
        collection(db, 'stockMovements'),
        where('timestamp', '>=', startDate),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error generating stock movements report:', error);
      throw error;
    }
  },

  // Get low stock report
  async getLowStockReport() {
    try {
      const querySnapshot = await getDocs(collection(db, 'inventory'));
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return items.filter(item => item.quantity <= item.threshold);
    } catch (error) {
      console.error('Error generating low stock report:', error);
      throw error;
    }
  },

  // Get stock value report
  async getStockValueReport() {
    try {
      const querySnapshot = await getDocs(collection(db, 'inventory'));
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const totalValue = items.reduce((sum, item) => sum + (item.quantity * (item.price || 0)), 0);
      const valueByLocation = {
        front: items
          .filter(item => item.location === 'Front Warehouse')
          .reduce((sum, item) => sum + (item.quantity * (item.price || 0)), 0),
        back: items
          .filter(item => item.location === 'Back Warehouse')
          .reduce((sum, item) => sum + (item.quantity * (item.price || 0)), 0)
      };

      return {
        totalValue,
        valueByLocation
      };
    } catch (error) {
      console.error('Error generating stock value report:', error);
      throw error;
    }
  }
}; 