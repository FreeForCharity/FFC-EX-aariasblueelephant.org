import { Client, Account, Databases, Storage, Avatars, Query, ID, OAuthProvider, ImageGravity, ImageFormat } from 'appwrite';
import { IDatabaseProvider } from './types';
import { APPWRITE_CONFIG } from './config';
import { Event, Testimonial, VolunteerApplication, EventRegistration } from '../../types';

export class AppwriteProvider implements IDatabaseProvider {
  private client: Client;
  private account: Account;
  private databases: Databases;
  private storage: Storage;
  private avatars: Avatars;

  constructor() {
    this.client = new Client()
      .setEndpoint(APPWRITE_CONFIG.ENDPOINT)
      .setProject(APPWRITE_CONFIG.PROJECT_ID);
    
    this.account = new Account(this.client);
    this.databases = new Databases(this.client);
    this.storage = new Storage(this.client);
    this.avatars = new Avatars(this.client);
  }

  async getSession() {
    try {
      const session = await this.account.getSession('current');
      if (!session) return null;
      
      // Enriched: Get full user details for role recognition
      const user = await this.account.get();
      return {
        ...session,
        user
      };
    } catch (e: any) {
      // Diagnostic: Only alert if we're actually coming back from Google and it fails
      if (e.code && e.code !== 401 && window.location.search.includes('userId')) {
        alert(`Auth Diagnostic: Error ${e.code} - ${e.message}. Please check if your domain is added to Appwrite Platforms.`);
      }
      return null;
    }
  }

  onAuthStateChange(callback: (session: any) => void) {
    // Only subscribe to real-time events for session changes.
    // Do NOT call getSession() here — the initial check is handled 
    // by AuthContext's checkSession() to avoid a race condition.
    const unsubscribe = this.client.subscribe(['account', 'sessions'], () => {
       this.getSession().then(callback);
    });

    return { unsubscribe };
  }

  async signInWithGoogle() {
    // Standardized Root Redirect: Most reliable for GitHub Pages cookie persistence
    let redirectUrl = window.location.origin;
    if (window.location.hostname.includes('github.io')) {
      redirectUrl += '/FFC-EX-aariasblueelephant.org';
    }
    
    // Ensure no trailing slashes to match Appwrite platform definitions exactly
    if (redirectUrl.endsWith('/')) {
        redirectUrl = redirectUrl.slice(0, -1);
    }
    
    // Appwrite redirects the whole page for OAuth
    this.account.createOAuth2Session(
      OAuthProvider.Google,
      redirectUrl,
      redirectUrl
    );
  }

  async signOut() {
    await this.account.deleteSession('current');
  }

  async updateUser(data: { full_name?: string }) {
    if (data.full_name) {
      await this.account.updateName(data.full_name);
    }
  }

  async getUserCount() {
    try {
      const response = await this.databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTIONS.PROFILES,
        [Query.limit(1)]
      );
      return response.total;
    } catch (e) {
      return 0;
    }
  }

  getUserAvatar(name: string) {
    // Generate a high-quality initials avatar from Appwrite's cloud service
    return this.avatars.getInitials(name).toString();
  }

  // Events
  async getEvents() {
    const response = await this.databases.listDocuments(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTIONS.EVENTS,
      [Query.orderAsc('date')]
    );
    return response.documents.map((doc: any) => ({
      id: doc.$id,
      title: doc.title,
      date: doc.date,
      time: doc.time,
      location: doc.location,
      description: doc.description,
      type: doc.type,
      capacity: doc.capacity,
      registered: doc.registered || 0,
      initialLikes: doc.initialLikes || 0,
      image: doc.image,
      mediaLink: doc.mediaLink,
      hours: doc.hours || 0
    }));
  }

  async createEvent(event: Partial<Event>) {
    await this.databases.createDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTIONS.EVENTS,
      ID.unique(),
      event
    );
  }

  async updateEvent(id: string, data: Partial<Event>) {
    await this.databases.updateDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTIONS.EVENTS,
      id,
      data
    );
  }

  async deleteEvent(id: string) {
    await this.databases.deleteDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTIONS.EVENTS,
      id
    );
  }

  async getEventById(id: string) {
    try {
      const doc: any = await this.databases.getDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.COLLECTIONS.EVENTS,
        id
      );
      return {
        id: doc.$id,
        ...doc
      };
    } catch (e) {
      return null;
    }
  }

  // Testimonials
  async getTestimonials() {
    const response = await this.databases.listDocuments(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTIONS.TESTIMONIALS,
      [Query.orderDesc('date')]
    );
    return response.documents.map((doc: any) => ({
      id: doc.$id,
      author: doc.author,
      authorEmail: doc.authorEmail,
      role: doc.role,
      title: doc.title,
      content: doc.content,
      date: doc.date,
      avatar: doc.avatar,
      status: doc.status,
      rating: doc.rating,
      rank: doc.rank,
      media: doc.media,
      userId: doc.userId
    }));
  }

  async createTestimonial(testimonial: Partial<Testimonial>) {
    await this.databases.createDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTIONS.TESTIMONIALS,
      ID.unique(),
      testimonial
    );
  }

  async updateTestimonial(id: string, data: Partial<Testimonial>) {
    await this.databases.updateDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTIONS.TESTIMONIALS,
      id,
      data
    );
  }

  async deleteTestimonial(id: string) {
    await this.databases.deleteDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTIONS.TESTIMONIALS,
      id
    );
  }

  async getTestimonialMedia(id: string) {
    const doc: any = await this.databases.getDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTIONS.TESTIMONIALS,
      id
    );
    return doc.media || null;
  }

  // Applications
  async getVolunteerApplications(userId?: string) {
    const queries = [Query.orderDesc('$createdAt')];
    if (userId) queries.push(Query.equal('userId', userId));
    
    const response = await this.databases.listDocuments(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTIONS.VOLUNTEERS,
      queries
    );
    return response.documents.map((doc: any) => ({
      id: doc.$id,
      ...doc
    }));
  }

  async createVolunteerApplication(app: Partial<VolunteerApplication>) {
    await this.databases.createDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTIONS.VOLUNTEERS,
      ID.unique(),
      app
    );
  }

  async updateVolunteerApplication(id: string, data: Partial<VolunteerApplication>) {
    await this.databases.updateDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTIONS.VOLUNTEERS,
      id,
      data
    );
  }

  async deleteVolunteerApplication(id: string) {
    await this.databases.deleteDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTIONS.VOLUNTEERS,
      id
    );
  }

  // Registrations
  async getEventRegistrations(userId?: string) {
    const queries = [Query.orderDesc('$createdAt')];
    if (userId) queries.push(Query.equal('userId', userId));

    const response = await this.databases.listDocuments(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTIONS.REGISTRATIONS,
      queries
    );
    return response.documents.map((doc: any) => ({
      id: doc.$id,
      ...doc
    }));
  }

  async createEventRegistration(reg: Partial<EventRegistration>) {
    await this.databases.createDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTIONS.REGISTRATIONS,
      ID.unique(),
      reg
    );
  }

  async updateEventRegistration(id: string, data: Partial<EventRegistration>) {
    await this.databases.updateDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTIONS.REGISTRATIONS,
      id,
      data
    );
  }

  async deleteEventRegistration(id: string) {
    await this.databases.deleteDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.COLLECTIONS.REGISTRATIONS,
      id
    );
  }

  // Storage optimization: Fetch compressed previews to stay within Free Tier limits
  async getMediaUrl(path: string, width = 800, quality = 80) {
    if (path.startsWith('http')) return path;
    if (!path) return '';
    
    try {
      // getFilePreview(bucketId, fileId, width, height, gravity, quality, borderWidth, borderColor, borderRadius, opacity, rotation, background, output)
      const result = this.storage.getFilePreview(
        APPWRITE_CONFIG.BUCKETS.MEDIA, 
        path, 
        width, 
        0, // height 0 to auto-scale
        ImageGravity.Center, // gravity
        quality,
        0, // borderWidth
        '', // borderColor
        0, // borderRadius
        1, // opacity
        0, // rotation
        '', // background
        ImageFormat.Webp // output format (smaller & faster)
      );
      return result.toString();
    } catch (e) {
      console.error("Failed to generate optimized preview:", e);
      return '';
    }
  }
}
