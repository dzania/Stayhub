/**
 * React Query keys constants
 * Centralized location for all query keys to avoid magic strings
 */

export const QUERY_KEYS = {
  // Auth queries
  AUTH: {
    CURRENT_USER: ['auth', 'currentUser'] as const,
  },

  // Listings queries
  LISTINGS: {
    ALL: ['listings'] as const,
    LIST: (params?: any) => ['listings', 'list', params] as const,
    DETAIL: (id: number) => ['listings', 'detail', id] as const,
    MY_LISTINGS: ['listings', 'my'] as const,
    HOST_LISTINGS: (hostId: number) => ['listings', 'host', hostId] as const,
  },

  // Bookings queries
  BOOKINGS: {
    ALL: ['bookings'] as const,
    MY_BOOKINGS: ['bookings', 'my'] as const,
    INCOMING: ['bookings', 'incoming'] as const,
    DETAIL: (id: number) => ['bookings', 'detail', id] as const,
    BY_LISTING: (listingId: number) => ['bookings', 'listing', listingId] as const,
  },

  // Reviews queries
  REVIEWS: {
    ALL: ['reviews'] as const,
    BY_LISTING: (listingId: number) => ['reviews', 'listing', listingId] as const,
    BY_HOST: (hostId: number) => ['reviews', 'host', hostId] as const,
    MY_REVIEWS: ['reviews', 'my'] as const,
  },

  // User queries
  USERS: {
    ALL: ['users'] as const,
    DETAIL: (id: number) => ['users', 'detail', id] as const,
    PROFILE: ['users', 'profile'] as const,
  },
} as const;

/**
 * Mutation keys for React Query mutations
 */
export const MUTATION_KEYS = {
  // Auth mutations
  AUTH: {
    LOGIN: 'auth.login',
    REGISTER: 'auth.register',
    LOGOUT: 'auth.logout',
    UPDATE_PROFILE: 'auth.updateProfile',
  },

  // Listings mutations
  LISTINGS: {
    CREATE: 'listings.create',
    UPDATE: 'listings.update',
    DELETE: 'listings.delete',
    UPLOAD_IMAGES: 'listings.uploadImages',
  },

  // Bookings mutations
  BOOKINGS: {
    CREATE: 'bookings.create',
    UPDATE_STATUS: 'bookings.updateStatus',
    CANCEL: 'bookings.cancel',
  },

  // Reviews mutations
  REVIEWS: {
    CREATE: 'reviews.create',
    UPDATE: 'reviews.update',
    DELETE: 'reviews.delete',
  },
} as const; 