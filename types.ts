export type Role = 'BoardMember.Owner' | 'Donor' | 'User';

export interface User {
  email: string;
  role: Role;
  name: string;
  avatar?: string;
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
  type: 'Class' | 'Event' | 'Fundraiser';
  image: string;
  initialLikes: number;
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
  role: string;
  content: string;
  date: string;
  avatar?: string;
}

export interface VolunteerApplication {
  id: string;
  name: string;
  email: string;
  interest: string;
  status: 'Pending' | 'Approved';
}