import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function register(email, password, name, role) {
    try {
      // Create the user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's display name
      await updateProfile(userCredential.user, {
        displayName: name
      });

      // Create the user document in Firestore
      const userRef = doc(db, 'users', userCredential.user.uid);
      const userData = {
        name,
        email,
        role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        uid: userCredential.user.uid
      };

      // Try to create the user document
      try {
        await setDoc(userRef, userData);
      } catch (error) {
        console.error('Error creating user document:', error);
        // If document creation fails, delete the auth user
        await userCredential.user.delete();
        throw new Error('Failed to create user profile. Please try again.');
      }

      // Return the user object with additional data
      return {
        ...userCredential.user,
        ...userData
      };
    } catch (error) {
      console.error('Registration error:', error);
      // If there's an error, try to clean up any partially created data
      if (auth.currentUser) {
        try {
          await auth.currentUser.delete();
        } catch (deleteError) {
          console.error('Error cleaning up user:', deleteError);
        }
      }
      throw error;
    }
  }

  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async function logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get additional user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setCurrentUser({
              ...user,
              ...userDoc.data()
            });
          } else {
            // If user document doesn't exist, create it
            const userData = {
              name: user.displayName || '',
              email: user.email,
              role: 'front_packer', // Default role
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              uid: user.uid
            };

            try {
              await setDoc(doc(db, 'users', user.uid), userData);
              setCurrentUser({
                ...user,
                ...userData
              });
            } catch (error) {
              console.error('Error creating user document:', error);
              // If document creation fails, sign out the user
              await signOut(auth);
              setCurrentUser(null);
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // If there's a permission error, sign out the user
          if (error.code === 'permission-denied') {
            await signOut(auth);
            setCurrentUser(null);
          } else {
            setCurrentUser(user);
          }
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    register,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 