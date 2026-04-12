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
    // Step 1: Convert any pending OAuth tokens into a session (from createOAuth2Token flow)
    const payload = sessionStorage.getItem('abe_auth_payload');
    if (payload) {
      try {
        const { userId, secret } = JSON.parse(payload);
        if (userId && secret) {
          console.info("[SENTRY] PROVIDER: Converting OAuth token to session...");
          await this.account.createSession(userId, secret);
          console.info("%c [SENTRY] PROVIDER: Session created from OAuth token! ", 'background: #10b981; color: white; font-weight: bold; border-radius: 3px;');
        }
      } catch (e: any) {
        console.warn("[SENTRY] PROVIDER: Token→Session conversion failed:", e.message);
      }
      // Always clear consumed payload (tokens are single-use)
      sessionStorage.removeItem('abe_auth_payload');
    }

    // Step 2: Check for existing session (cookie or just-created)
    try {
      const session = await this.account.getSession('current');
      if (!session) return null;

      console.info("[SENTRY] PROVIDER: Session verified.");
      const user = await this.account.get();
      return {
        ...session,
        user
      };
    } catch (e: any) {
      if (e.code && e.code !== 401) {
        console.warn(`[SENTRY] PROVIDER: Session check failed (${e.code}).`);
      }
      return null;
    }
  }

  onAuthStateChange(callback: (session: any) => void) {
    // Appwrite doesn't have a direct equivalent to onAuthStateChange with a subscription 
    // that returns the session immediately in the Web SDK in the same way.
    // We'll simulate it by checking session.
    this.getSession().then(callback);
    
    // For real-time updates and to catch OAuth arrivals, subscribe to multiple channels
    const unsubscribe = this.client.subscribe(['account', 'sessions'], (response) => {
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
    
    // Token flow: Appwrite redirects to Google, then returns to our URL with userId & secret params.
    // The SENTRY landing pad in index.html snares them, and getSession() converts them to a session.
    this.account.createOAuth2Token(
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
      const result = this.storage.getFilePreview(
        APPWRITE_CONFIG.BUCKETS.MEDIA, 
        path, 
        width, 
        0, 
        ImageGravity.Center,
        quality,
        0, 
        '', 
        0, 
        1, 
        0, 
        '', 
        ImageFormat.Webp
      );
      return result.toString();
    } catch (e) {
      return '';
    }
  }

  // JWT Support for Incognito/Safari resilience
  setJWT(jwt: string | null): void {
    if (jwt) {
      console.info("%c [PASSPORT] Injecting Passport (JWT) into Client... ", 'background: #10b981; color: white; font-weight: bold; border-radius: 3px;');
      this.client.setJWT(jwt);
    } else {
      // Clear JWT if null (resetting the connection)
      this.client.setJWT(null as any);
    }
  }

  async createJWT(): Promise<string | null> {
    try {
      console.info("%c [PASSPORT] Requesting New Passport (JWT)... ", 'background: #f59e0b; color: white; font-weight: bold; border-radius: 3px;');
      const jwt = await this.account.createJWT();
      console.info("%c [PASSPORT] Passport Created Successfully! ", 'background: #10b981; color: white; font-weight: bold; border-radius: 3px;');
      return jwt.jwt;
    } catch (e) {
      console.error("%c [PASSPORT] Failed to generate Passport (JWT): ", 'background: #ef4444; color: white; font-weight: bold; border-radius: 3px;', e);
      return null;
    }
  }
}
