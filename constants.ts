import { User, Event, Donation } from './types';

export const MOCK_USERS: User[] = [
  { email: "liji@blueelephant.org", role: "BoardMember.Owner", name: "Liji Chalatil" },
  { email: "ajith@blueelephant.org", role: "BoardMember.Owner", name: "Ajith Chandran" },
  { email: "donor1@example.com", role: "Donor", name: "Sarah Doe" },
  { email: "user1@example.com", role: "User", name: "Mike Smith" }
];

export const ALL_EVENTS: Event[] = [
  // Upcoming Events
  {
    id: '1',
    title: 'Sensory-Friendly Art Class',
    date: '2025-11-15',
    time: '10:00 AM',
    location: '101 Felicia Avenue, Tracy, CA',
    description: 'A creative session designed for sensory seekers and avoiders alike. All materials provided. We focus on texture, color, and self-expression in a calm environment.',
    capacity: 15,
    registered: 8,
    type: 'Class',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=1000',
    initialLikes: 42
  },
  {
    id: '2',
    title: 'Inclusive Weekend Playgroup',
    date: '2025-12-18',
    time: '02:00 PM',
    location: 'Mountain House Community Park',
    description: 'Open play for neurodivergent and neurotypical kids to foster friendship and understanding. Guided activities included to help children connect.',
    capacity: 30,
    registered: 22,
    type: 'Event',
    image: 'https://images.unsplash.com/photo-1502086223501-87db9e9cc358?auto=format&fit=crop&q=80&w=1000',
    initialLikes: 89
  },
  {
    id: '3',
    title: 'Parent Support Circle',
    date: '2026-01-20',
    time: '06:00 PM',
    location: 'Online (Zoom)',
    description: 'A safe space for parents to share experiences and resources regarding early intervention. Led by a certified family therapist.',
    capacity: 50,
    registered: 45,
    type: 'Event',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=1000',
    initialLikes: 156
  },
  // Past Events
  {
    id: '4',
    title: 'Summer Splash Day',
    date: '2024-07-15',
    time: '11:00 AM',
    location: 'Tracy Aquatic Center',
    description: 'Our annual water play event! A fun, sensory-rich experience with water tables, sprinklers, and safe swimming areas.',
    capacity: 40,
    registered: 38,
    type: 'Event',
    image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&q=80&w=1000',
    initialLikes: 124
  },
  {
    id: '5',
    title: 'Holiday Gala Fundraiser',
    date: '2023-12-10',
    time: '05:00 PM',
    location: 'Grand Ballroom, Tracy',
    description: 'An elegant evening of fundraising, silent auctions, and celebrating our achievements in inclusive community building.',
    capacity: 100,
    registered: 100,
    type: 'Fundraiser',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=1000',
    initialLikes: 210
  }
];

export const MOCK_DONATIONS: Donation[] = [
  { id: 'd1', amount: 500, date: '2023-10-01', campaign: 'Fall Fundraiser' },
  { id: 'd2', amount: 100, date: '2023-09-15', campaign: 'General Support' },
  { id: 'd3', amount: 250, date: '2023-08-20', campaign: 'Art Supplies Drive' },
];

export const BYLAWS_HIGHLIGHTS = [
  "Organized exclusively for charitable purposes under Section 501(c)(3).",
  "Specific purpose: Foster inclusive playgroups for neurodivergent & neurotypical kids.",
  "Board members serve without compensation (volunteer-based).",
  "Non-discrimination policy on race, religion, disability, or gender."
];