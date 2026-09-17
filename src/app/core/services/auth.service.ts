import { Injectable, signal } from '@angular/core';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<FirebaseUser | null>(null);
  /** True until the initial auth state is known, to avoid a flash of the login screen. */
  readonly resolved = signal(false);

  constructor() {
    onAuthStateChanged(auth, async (firebaseUser) => {
      this.user.set(firebaseUser);
      this.resolved.set(true);
      if (firebaseUser) {
        await this.ensureUserDoc(firebaseUser);
      }
    });
  }

  async signInWithGoogle(): Promise<void> {
    await signInWithPopup(auth, new GoogleAuthProvider());
  }

  async signOut(): Promise<void> {
    await signOut(auth);
  }

  private async ensureUserDoc(firebaseUser: FirebaseUser): Promise<void> {
    const ref = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        displayName: firebaseUser.displayName ?? '',
        email: firebaseUser.email ?? '',
        photoURL: firebaseUser.photoURL ?? null,
        fcmTokens: [],
        createdAt: serverTimestamp(),
      });
    }
  }
}
