export type RoutePath =
  | '/'
  | '/services'
  | '/barbers'
  | '/gallery'
  | '/booking'
  | '/contacts'
  | '/admin';

export type ServiceCategory =
  | 'all'
  | 'haircuts'
  | 'beard'
  | 'complex'
  | 'care';

export type BookingStatus = 'confirmed' | 'completed' | 'cancelled';

export interface ServiceItem {
  id: string;
  number: string;
  title: string;
  category: Exclude<ServiceCategory, 'all'>;
  categoryLabel: string;
  priceUah: number;
  durationMin: number;
  shortDescription: string;
  includedSteps: string[];
  featured?: boolean;
}

export interface BarberProfile {
  id: string;
  name: string;
  role: string;
  experienceYears: number;
  image: string;
  shortBio: string;
  fullBio: string;
  specialties: string[];
  workingDays: string;
  serviceIds: string[];
}

export type GalleryCategory = 'all' | 'haircuts' | 'beard' | 'interior';

export interface GalleryItem {
  id: string;
  title: string;
  category: Exclude<GalleryCategory, 'all'>;
  categoryLabel: string;
  caption: string;
  barberName?: string;
  image: string;
  featuredSpan?: boolean;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}

export interface ConfirmedBooking {
  id: string;
  bookingCode: string;
  serviceId: string;
  serviceTitle: string;
  priceUah: number;
  durationMin: number;
  barberId: string;
  barberName: string;
  date: string;
  startTime: string;
  endTime: string;
  clientName: string;
  clientPhone: string;
  notes: string;
  status: BookingStatus;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
}

export interface AdminBookingItem extends ConfirmedBooking {}

export interface BlockedSlotItem {
  id: string;
  barberId: string;
  barberName: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  createdAt: string;
}
