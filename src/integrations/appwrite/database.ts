import { databases, DATABASE_ID, COLLECTIONS } from './client';
import { ID, Query } from 'appwrite';

export class AppwriteDatabase {
  // Generic methods for CRUD operations
  async create(collectionId: string, data: any, documentId?: string) {
    try {
      const document = await databases.createDocument(
        DATABASE_ID,
        collectionId,
        documentId || ID.unique(),
        data
      );
      return { data: document, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async get(collectionId: string, documentId: string) {
    try {
      const document = await databases.getDocument(DATABASE_ID, collectionId, documentId);
      return { data: document, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async list(collectionId: string, queries?: string[]) {
    try {
      const documents = await databases.listDocuments(DATABASE_ID, collectionId, queries);
      return { data: documents.documents, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async update(collectionId: string, documentId: string, data: any) {
    try {
      const document = await databases.updateDocument(DATABASE_ID, collectionId, documentId, data);
      return { data: document, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async delete(collectionId: string, documentId: string) {
    try {
      await databases.deleteDocument(DATABASE_ID, collectionId, documentId);
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  }

  // Specific methods for common operations
  
  // Profiles
  async getProfile(userId: string) {
    return this.list(COLLECTIONS.PROFILES, [Query.equal('user_id', userId)]);
  }

  async updateProfile(userId: string, data: any) {
    const { data: profiles } = await this.getProfile(userId);
    if (profiles && profiles.length > 0) {
      return this.update(COLLECTIONS.PROFILES, profiles[0].$id, data);
    }
    return { data: null, error: { message: 'Profile not found' } };
  }

  // Phases
  async getPhases() {
    return this.list(COLLECTIONS.PHASES, [Query.orderAsc('phase_number')]);
  }

  async getPhase(phaseId: string) {
    return this.get(COLLECTIONS.PHASES, phaseId);
  }

  // User Phase Progress
  async getUserPhaseProgress(userId: string) {
    return this.list(COLLECTIONS.USER_PHASE_PROGRESS, [Query.equal('user_id', userId)]);
  }

  async updateUserPhaseProgress(userId: string, phaseId: string, data: any) {
    const { data: progress } = await this.list(COLLECTIONS.USER_PHASE_PROGRESS, [
      Query.equal('user_id', userId),
      Query.equal('phase_id', phaseId)
    ]);
    
    if (progress && progress.length > 0) {
      return this.update(COLLECTIONS.USER_PHASE_PROGRESS, progress[0].$id, data);
    } else {
      return this.create(COLLECTIONS.USER_PHASE_PROGRESS, {
        user_id: userId,
        phase_id: phaseId,
        ...data
      });
    }
  }

  // Groups
  async getGroups() {
    return this.list(COLLECTIONS.GROUPS, [Query.orderDesc('$createdAt')]);
  }

  async getUserGroup(userId: string) {
    return this.list(COLLECTIONS.GROUP_MEMBERS, [Query.equal('user_id', userId)]);
  }

  async getGroupMembers(groupId: string) {
    return this.list(COLLECTIONS.GROUP_MEMBERS, [Query.equal('group_id', groupId)]);
  }

  // User Roles
  async getUserRole(userId: string) {
    return this.list(COLLECTIONS.USER_ROLES, [Query.equal('user_id', userId)]);
  }

  // Ranking
  async getRanking() {
    return this.list(COLLECTIONS.PROFILES, [Query.orderDesc('total_xp')]);
  }
}

export const database = new AppwriteDatabase();