import { Client, Account, Databases, Storage } from 'appwrite';

const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_PUBLIC_ENDPOINT;

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

// Initialize services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Export client for direct access if needed
export { client };

// Database and collection IDs (these should match your Appwrite setup)
export const DATABASE_ID = 'main';
export const COLLECTIONS = {
  PROFILES: 'profiles',
  PHASES: 'phases',
  USER_PHASE_PROGRESS: 'user_phase_progress',
  GROUPS: 'groups',
  GROUP_MEMBERS: 'group_members',
  GROUP_POSTS: 'group_posts',
  GROUP_POST_LIKES: 'group_post_likes',
  GROUP_POST_REPLIES: 'group_post_replies',
  USER_ROLES: 'user_roles'
};