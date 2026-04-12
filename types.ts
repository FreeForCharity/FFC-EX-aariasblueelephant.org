export type Role = 'BoardMember.Owner' | 'BoardMember' | 'Donor' | 'User' | 'Member';

export interface User {
  id: string;
  email: string;
  role: Role;
  name: string;
  avatar?: string;
  isBoard?: boolean;
  isDonor?: boolean;
  donatedAmount?: number;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  capacity: number;
  registered: number;
  type: 'Class' | 'Event' | 'Fundraiser' | 'Outreach' | 'Advocacy';
  image?: string;
  initialLikes: number;
  mediaLink?: string;
  hours?: number;
}

export interface Stat {
  label: string;
  value: string | number;
  change?: string;
  icon: any;
  color: string;
}

export interface Donation {
  id: string;
  amount: number;
  date: string;
  campaign: string;
}

export interface Testimonial {
  id: string;
  author: string;
  authorEmail?: string;
  role: string;
  title?: string;
  content: string;
  date: string;
  avatar?: string;
  status: 'Pending' | 'Approved';
  rating?: number;
  rank?: number;
  media?: string;
  userId?: string;
}

export interface VolunteerApplication {
  id: string;
  name: string;
  email: string;
  interest: string;
  status: 'Pending' | 'Approved';
  userId?: string;
  phone?: string;
  experience?: string;
  date?: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  specialNeeds?: boolean;
  status: 'Pending' | 'Approved' | 'Rejected';
  date: string;
}

export interface NewsletterSubscription {
  id: string;
  email: string;
  date: string;
  userId?: string;
}