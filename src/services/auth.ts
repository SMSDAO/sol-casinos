import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App instance safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/userinfo.email');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');

export type UserRole = 'owner' | 'super_admin' | 'risk_operator' | 'auditor' | 'player';

export interface AdminUserSession {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  isOwner: boolean;
  isAdmin: boolean;
  authenticatedViaGoogle: boolean;
}

// Configured Admin Email Whitelist
export const ADMIN_WHITELIST = ['gxqstudio@gmail.com'];

let cachedAccessToken: string | null = null;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (session: AdminUserSession) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && user.email) {
      const isOwner = user.email.toLowerCase() === 'gxqstudio@gmail.com';
      const isWhitelisted = ADMIN_WHITELIST.includes(user.email.toLowerCase());

      const session: AdminUserSession = {
        email: user.email,
        displayName: user.displayName || 'Admin Owner',
        photoURL: user.photoURL,
        role: isOwner ? 'owner' : isWhitelisted ? 'super_admin' : 'player',
        isOwner,
        isAdmin: isOwner || isWhitelisted,
        authenticatedViaGoogle: true,
      };

      if (onAuthSuccess) onAuthSuccess(session);
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google Popup
export const signInWithGoogle = async (): Promise<AdminUserSession | null> => {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }

    const user = result.user;
    if (!user || !user.email) return null;

    const emailLower = user.email.toLowerCase();
    const isOwner = emailLower === 'gxqstudio@gmail.com';
    const isWhitelisted = ADMIN_WHITELIST.includes(emailLower);

    return {
      email: user.email,
      displayName: user.displayName || 'Admin Owner',
      photoURL: user.photoURL,
      role: isOwner ? 'owner' : isWhitelisted ? 'super_admin' : 'player',
      isOwner,
      isAdmin: isOwner || isWhitelisted,
      authenticatedViaGoogle: true,
    };
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
};

// Logout
export const logoutAuth = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// Helper for local simulation of Owner Mode for testing/demo
export const getOwnerDemoSession = (): AdminUserSession => ({
  email: 'gxqstudio@gmail.com',
  displayName: 'Super Admin Owner (GXQ Studio)',
  photoURL: null,
  role: 'owner',
  isOwner: true,
  isAdmin: true,
  authenticatedViaGoogle: true,
});
