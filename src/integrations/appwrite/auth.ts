import { account } from './client';
import { ID } from 'appwrite';

export interface User {
  $id: string;
  email: string;
  name: string;
  emailVerification: boolean;
}

export interface Session {
  $id: string;
  userId: string;
  expire: string;
}

export class AppwriteAuth {
  // Sign up with email and password
  async signUp(email: string, password: string, name?: string) {
    try {
      const user = await account.create(ID.unique(), email, password, name);
      return { user, error: null };
    } catch (error: any) {
      return { user: null, error };
    }
  }

  // Sign in with email and password
  async signIn(email: string, password: string) {
    try {
      const session = await account.createEmailSession(email, password);
      return { session, error: null };
    } catch (error: any) {
      return { session: null, error };
    }
  }

  // Sign out
  async signOut() {
    try {
      await account.deleteSession('current');
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  }

  // Get current user
  async getUser() {
    try {
      const user = await account.get();
      return { user, error: null };
    } catch (error: any) {
      return { user: null, error };
    }
  }

  // Get current session
  async getSession() {
    try {
      const session = await account.getSession('current');
      return { session, error: null };
    } catch (error: any) {
      return { session: null, error };
    }
  }

  // Update user profile
  async updateProfile(name?: string) {
    try {
      const user = await account.updateName(name || '');
      return { user, error: null };
    } catch (error: any) {
      return { user: null, error };
    }
  }

  // Send password recovery email
  async resetPassword(email: string) {
    try {
      await account.createRecovery(email, `${window.location.origin}/reset-password`);
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  }

  // Update password
  async updatePassword(password: string, oldPassword: string) {
    try {
      await account.updatePassword(password, oldPassword);
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  }
}

export const auth = new AppwriteAuth();