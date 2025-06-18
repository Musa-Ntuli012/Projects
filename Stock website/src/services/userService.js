import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where
} from 'firebase/firestore';

const COLLECTION_NAME = 'users';

export const userService = {
  // Get all users
  getAllUsers: async () => {
    try {
      const usersRef = collection(db, COLLECTION_NAME);
      const querySnapshot = await getDocs(usersRef);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    try {
      const userRef = doc(db, COLLECTION_NAME, userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        return {
          id: userDoc.id,
          ...userDoc.data()
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  },

  // Create new user
  createUser: async (userData) => {
    try {
      // Check if user with same email already exists
      const usersRef = collection(db, COLLECTION_NAME);
      const q = query(usersRef, where('email', '==', userData.email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw new Error('User with this email already exists');
      }

      // Create new user document
      const newUserRef = doc(collection(db, COLLECTION_NAME));
      await setDoc(newUserRef, {
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return {
        id: newUserRef.id,
        ...userData
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Update user
  updateUser: async (userId, userData) => {
    try {
      const userRef = doc(db, COLLECTION_NAME, userId);
      await updateDoc(userRef, {
        ...userData,
        updatedAt: new Date()
      });

      return {
        id: userId,
        ...userData
      };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      const userRef = doc(db, COLLECTION_NAME, userId);
      await deleteDoc(userRef);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Get users by role
  getUsersByRole: async (role) => {
    try {
      const usersRef = collection(db, COLLECTION_NAME);
      const q = query(usersRef, where('role', '==', role));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting users by role:', error);
      throw error;
    }
  }
}; 