export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone?: string;
  is_host: boolean;
  profile_image?: string;
  created_at: string;
  updated_at?: string;
}

export interface UserCreate {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone?: string;
  is_host: boolean;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface Listing {
  id: number;
  title: string;
  description?: string;
  price_per_night: number;
  location: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  amenities?: string[];
  images?: string[];
  is_active: boolean;
  host_id: number;
  created_at: string;
  updated_at?: string;
  host: User;
}

export interface ListingCreate {
  title: string;
  description?: string;
  price_per_night: number;
  location: string;
  address: string;
  latitude?: number;
  longitude?: number;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  amenities?: string[];
}

export interface ListingWithReviews extends Listing {
  reviews: Review[];
  average_rating?: number;
}

export interface Booking {
  id: number;
  listing_id: number;
  customer_id: number;
  check_in_date: string;
  check_out_date: string;
  total_price: number;
  guest_count: number;
  status: string;
  special_requests?: string;
  stripe_payment_intent_id?: string;
  payment_status: string;
  payment_method?: string;
  refund_amount: number;
  created_at: string;
  updated_at?: string;
  listing: Listing;
  customer: User;
}

export interface BookingCreate {
  listing_id: number;
  check_in_date: string;
  check_out_date: string;
  guest_count: number;
  special_requests?: string;
}

export interface Review {
  id: number;
  listing_id: number;
  reviewer_id: number;
  host_id: number;
  rating: number;
  comment?: string;
  created_at: string;
  reviewer: User;
}

export interface ReviewCreate {
  listing_id: number;
  rating: number;
  comment?: string;
}

export interface ListingSearch {
  location?: string;
  check_in_date?: string;
  check_out_date?: string;
  guests?: number;
  min_price?: number;
  max_price?: number;
  amenities?: string[];
}

// Payment types
export interface PaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
}

export interface PaymentConfirmation {
  payment_intent_id: string;
  payment_method?: string;
}

export interface RefundRequest {
  booking_id: number;
  amount?: number;
  reason?: string;
}

export interface RefundResponse {
  refund_id: string;
  status: string;
  amount: number;
}

export interface PaymentStatus {
  booking_id: number;
  payment_status: string;
  payment_method?: string;
  total_price: number;
  refund_amount: number;
  stripe_payment_intent_id?: string;
} 