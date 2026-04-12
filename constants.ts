import { User, Event, Donation, Testimonial, EventRegistration } from './types';
import { RESILIENCE_EVENTS, RESILIENCE_REGISTRATIONS, RESILIENCE_TESTIMONIALS } from './data/resilience_data';

export const MOCK_USERS: User[] = [
  { id: "1", email: "liji@blueelephant.org", role: "BoardMember.Owner", name: "Liji Chalatil" },
  { id: "2", email: "ajith@blueelephant.org", role: "BoardMember.Owner", name: "Ajith Chandran" },
  { id: "3", email: "donor1@example.com", role: "Donor", name: "Sarah Doe" },
  { id: "4", email: "user1@example.com", role: "User", name: "Mike Smith" }
];

export const DEFAULT_EVENT_IMAGE = 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&q=80&w=1000';
export const DEFAULT_LOCAL_FALLBACK = '/outreach_workshop.png';

export const STOCK_INCLUSIVE_IMAGES = [
  'https://images.unsplash.com/photo-1594608661623-aa0bd3a69d98?auto=format&fit=crop&q=80&w=1000', // Inclusive learning
  'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&q=80&w=1000', // Children playing
  'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&q=80&w=1000', // Group activity
  'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=1000', // Sensory play
  'https://images.unsplash.com/photo-1472162072942-cd5147eb3902?auto=format&fit=crop&q=80&w=1000', // Community joy
];


export const ALL_EVENTS: Event[] = RESILIENCE_EVENTS;

export const SUPABASE_OVERRIDE_EVENTS: Event[] = [
  {
    id: '232079db-b73c-4f01-abf9-bea162cae7c3',
    title: 'Circle Of Friends - SUBMIT @ https://forms.gle/mCtYLoiJa3j1Ztqe9',
    date: '2026-04-24',
    time: '09:00 AM',
    location: 'MH School',
    description: '"Different, Yet Together" – Submit ideas in 50 words or less of how you want to see/engage inclusivity. Selection will be done by the Judging committee based on creativity. Grand Finale at MH School on April 27th!',
    capacity: 100,
    registered: 0,
    type: 'Event',
    initialLikes: 25,
    hours: 2,
    image: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&q=80&w=1000'
  }
];


export const MOCK_DONATIONS: Donation[] = [
  { id: 'd1', amount: 500, date: '2023-10-01', campaign: 'Fall Fundraiser' },
  { id: 'd2', amount: 100, date: '2023-09-15', campaign: 'General Support' },
  { id: 'd3', amount: 250, date: '2023-08-20', campaign: 'Art Supplies Drive' },
];

export const MOCK_TESTIMONIALS: Testimonial[] = RESILIENCE_TESTIMONIALS;

export const STATIC_REGISTRATIONS: EventRegistration[] = RESILIENCE_REGISTRATIONS;

export const BYLAWS_HIGHLIGHTS = [
  "Organized exclusively for charitable purposes under Section 501(c)(3).",
  "Specific purpose: Foster inclusive events for neurodivergent & neurotypical kids.",
  "Board members serve without compensation (volunteer-based).",
  "Non-discrimination policy on race, religion, disability, or gender."
];