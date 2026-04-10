import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, onSnapshot, orderBy, limit, deleteDoc, serverTimestamp, Timestamp, updateDoc, addDoc, writeBatch } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Movie } from './types';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

// Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: Timestamp;
  link?: string;
}

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  isKids: boolean;
  createdAt?: Timestamp;
}

// Auth Helpers
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

// Firestore Error Handler
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// User Profile Helpers
export const syncUserProfile = async (user: User) => {
  const userRef = doc(db, 'users', user.uid);
  try {
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        role: user.email === "fabricio.lopes.a@gmail.com" ? 'admin' : 'user',
        points: 0
      });
      
      // Create welcome notification
      await addNotification(user.uid, {
        title: 'Bem-vindo ao GoFlix!',
        message: 'Obrigado por se juntar a nós. Explore nosso catálogo e divirta-se!',
        type: 'success',
        read: false,
        timestamp: serverTimestamp() as Timestamp
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }
};

// Profile Helpers
export const getProfiles = async (userId: string): Promise<Profile[]> => {
  try {
    const profilesRef = collection(db, 'users', userId, 'profiles');
    const q = query(profilesRef, orderBy('createdAt', 'asc'));
    return new Promise((resolve, reject) => {
      onSnapshot(q, (snapshot) => {
        const profiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Profile));
        resolve(profiles);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${userId}/profiles`);
        reject(error);
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `users/${userId}/profiles`);
    return [];
  }
};

export const createProfile = async (userId: string, profile: Omit<Profile, 'id' | 'createdAt'>) => {
  try {
    const profilesRef = collection(db, 'users', userId, 'profiles');
    const newProfileRef = doc(profilesRef);
    await setDoc(newProfileRef, {
      ...profile,
      id: newProfileRef.id,
      createdAt: serverTimestamp()
    });
    return newProfileRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${userId}/profiles`);
  }
};

export const deleteProfile = async (userId: string, profileId: string) => {
  try {
    const profileRef = doc(db, 'users', userId, 'profiles', profileId);
    await deleteDoc(profileRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/profiles/${profileId}`);
  }
};

// Notification Helpers
export const addNotification = async (userId: string, notification: Omit<Notification, 'id'>) => {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    await addDoc(notificationsRef, {
      ...notification,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${userId}/notifications`);
  }
};

export const markNotificationAsRead = async (userId: string, notificationId: string) => {
  try {
    const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/notifications/${notificationId}`);
  }
};

export const deleteNotification = async (userId: string, notificationId: string) => {
  try {
    const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
    await deleteDoc(notificationRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/notifications/${notificationId}`);
  }
};

// Movie Interaction Helpers
export const addToFavorites = async (userId: string, profileId: string, movie: Movie) => {
  try {
    const favoriteRef = doc(db, 'users', userId, 'profiles', profileId, 'favorites', movie.id.toString());
    await setDoc(favoriteRef, {
      movieId: movie.id.toString(),
      title: movie.title,
      posterUrl: movie.posterUrl,
      mediaType: movie.mediaType || 'movie',
      addedAt: serverTimestamp()
    });
    
    await addNotification(userId, {
      title: 'Adicionado à Lista',
      message: `"${movie.title}" foi adicionado à sua lista de favoritos.`,
      type: 'info',
      read: false,
      timestamp: serverTimestamp() as Timestamp
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/profiles/${profileId}/favorites/${movie.id}`);
  }
};

export const removeFromFavorites = async (userId: string, profileId: string, movieId: string) => {
  try {
    const favoriteRef = doc(db, 'users', userId, 'profiles', profileId, 'favorites', movieId);
    await deleteDoc(favoriteRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/profiles/${profileId}/favorites/${movieId}`);
  }
};

export const updateRecentlyWatched = async (userId: string, profileId: string, movie: Movie, progress: number = 0) => {
  try {
    const recentRef = doc(db, 'users', userId, 'profiles', profileId, 'recentlyWatched', movie.id.toString());
    await setDoc(recentRef, {
      movieId: movie.id.toString(),
      title: movie.title,
      posterUrl: movie.posterUrl,
      mediaType: movie.mediaType || 'movie',
      lastWatched: serverTimestamp(),
      progress
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/profiles/${profileId}/recentlyWatched/${movie.id}`);
  }
};

// Issue Reporting
export const reportIssue = async (movieId: string, title: string, mediaType: string) => {
  const reportRef = doc(collection(db, 'reports'));
  const userEmail = auth.currentUser?.email || 'anonymous';
  
  try {
    // 1. Save to Firestore
    await setDoc(reportRef, {
      movieId,
      title,
      mediaType,
      reportedBy: auth.currentUser?.uid || 'anonymous',
      userEmail,
      timestamp: serverTimestamp(),
      status: 'pending'
    });

    // 2. Trigger Email Notification via Backend
    await fetch('/api/reports/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        movieId,
        title,
        mediaType,
        userEmail
      })
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'reports');
  }
};

// Rating Helpers
export const saveRating = async (userId: string, movieId: string, rating: number, genreIds?: number[], movieTitle?: string) => {
  try {
    const ratingRef = doc(db, 'ratings', `${userId}_${movieId}`);
    await setDoc(ratingRef, {
      userId,
      userName: auth.currentUser?.displayName || 'Usuário GoFlix',
      userPhoto: auth.currentUser?.photoURL || '',
      movieId,
      movieTitle: movieTitle || 'Título Desconhecido',
      rating,
      genreIds: genreIds || [],
      timestamp: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `ratings/${userId}_${movieId}`);
  }
};

// Review Helpers
export const saveReview = async (movieId: string, movieTitle: string, content: string) => {
  if (!auth.currentUser) return;
  
  try {
    const reviewRef = doc(collection(db, 'reviews'));
    await setDoc(reviewRef, {
      movieId,
      movieTitle,
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || 'Usuário GoFlix',
      userPhoto: auth.currentUser.photoURL,
      content,
      timestamp: serverTimestamp(),
      likes: 0
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'reviews');
  }
};

export const toggleReviewLike = async (reviewId: string, currentLikes: number, isLiked: boolean) => {
  if (!auth.currentUser) return;
  
  try {
    const batch = writeBatch(db);
    const reviewRef = doc(db, 'reviews', reviewId);
    const likeRef = doc(db, 'reviews', reviewId, 'likes', auth.currentUser.uid);

    if (isLiked) {
      batch.delete(likeRef);
      batch.update(reviewRef, { likes: Math.max(0, currentLikes - 1) });
    } else {
      batch.set(likeRef, {
        userId: auth.currentUser.uid,
        timestamp: serverTimestamp()
      });
      batch.update(reviewRef, { likes: currentLikes + 1 });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `reviews/${reviewId}/likes`);
  }
};

// Rewards Helpers
export const addPoints = async (userId: string, amount: number) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const currentPoints = userDoc.data().points || 0;
      await updateDoc(userRef, { points: currentPoints + amount });
      
      await addNotification(userId, {
        title: 'Pontos Adicionados!',
        message: `Você ganhou ${amount} pontos por assistir a um anúncio.`,
        type: 'success',
        read: false,
        timestamp: serverTimestamp() as Timestamp
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
};

export const spendPoints = async (userId: string, amount: number) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const currentPoints = userDoc.data().points || 0;
      if (currentPoints >= amount) {
        await updateDoc(userRef, { points: currentPoints - amount });
        return true;
      }
    }
    return false;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    return false;
  }
};

export const buyVip = async (userId: string, durationHours: number, cost: number) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const currentPoints = userDoc.data().points || 0;
      if (currentPoints >= cost) {
        const data = userDoc.data();
        const currentVipUntil = data.vipUntil?.toDate() || new Date();
        const baseDate = currentVipUntil > new Date() ? currentVipUntil : new Date();
        const newVipUntil = new Date(baseDate.getTime() + durationHours * 60 * 60 * 1000);
        
        await updateDoc(userRef, { 
          points: currentPoints - cost,
          vipUntil: Timestamp.fromDate(newVipUntil)
        });
        
        await addNotification(userId, {
          title: 'VIP Ativado!',
          message: `Você agora é VIP por mais ${durationHours} horas. Aproveite sem anúncios!`,
          type: 'success',
          read: false,
          timestamp: serverTimestamp() as Timestamp
        });
        
        return true;
      }
    }
    return false;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    return false;
  }
};

// Admin Helpers
export const updateUserRole = async (userId: string, role: 'user' | 'admin') => {
  try {
    await updateDoc(doc(db, 'users', userId), { role });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    return false;
  }
};

export const updateUserVip = async (userId: string, days: number) => {
  try {
    const vipUntil = new Date();
    vipUntil.setDate(vipUntil.getDate() + days);
    await updateDoc(doc(db, 'users', userId), { 
      vipUntil: Timestamp.fromDate(vipUntil) 
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    return false;
  }
};

export const updateUserPoints = async (userId: string, points: number) => {
  try {
    await updateDoc(doc(db, 'users', userId), { points });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    return false;
  }
};

export const setCustomHighlights = async (movies: Movie[]) => {
  try {
    await setDoc(doc(db, 'config', 'highlights'), { 
      movies,
      updatedAt: serverTimestamp() 
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'config/highlights');
    return false;
  }
};

export const getCustomHighlights = async () => {
  try {
    const snap = await getDoc(doc(db, 'config', 'highlights'));
    if (snap.exists()) {
      return snap.data().movies as Movie[];
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'config/highlights');
    return null;
  }
};

export const sendUserNotification = async (userId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
  try {
    await addDoc(collection(db, 'users', userId, 'notifications'), {
      title,
      message,
      type,
      read: false,
      timestamp: serverTimestamp()
    });
    return true;
  } catch (error) {
    return false;
  }
};

export const grantBadge = async (userId: string, badgeId: string, name: string, icon: string, description: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const badges = userData.badges || [];
      
      if (!badges.find((b: any) => b.id === badgeId)) {
        const newBadge = {
          id: badgeId,
          name,
          icon,
          description,
          unlockedAt: serverTimestamp()
        };
        
        await updateDoc(userRef, {
          badges: [...badges, newBadge]
        });
        
        await sendUserNotification(
          userId,
          'Nova Conquista Desbloqueada! 🏆',
          `Você ganhou a medalha: ${name}`,
          'success'
        );
        
        return true;
      }
    }
    return false;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    return false;
  }
};
