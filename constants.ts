import { User, Event, Donation, Testimonial } from './types';

export const MOCK_USERS: User[] = [
  { id: "1", email: "liji@blueelephant.org", role: "BoardMember.Owner", name: "Liji Chalatil" },
  { id: "2", email: "ajith@blueelephant.org", role: "BoardMember.Owner", name: "Ajith Chandran" },
  { id: "3", email: "donor1@example.com", role: "Donor", name: "Sarah Doe" },
  { id: "4", email: "user1@example.com", role: "User", name: "Mike Smith" }
];

export const DEFAULT_EVENT_IMAGE = 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&q=80&w=1000';
export const DEFAULT_LOCAL_FALLBACK = '/outreach_workshop.png';

export const STOCK_INCLUSIVE_IMAGES = [
  'https://images.unsplash.com/photo-1472162072942-cd5147eb3902?auto=format&fit=crop&q=80&w=1000', // Kids play
  'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&q=80&w=1000', // Inclusive play
  'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=1000', // Sensory
  'https://images.unsplash.com/photo-1497911270199-1c552ee64aa4?auto=format&fit=crop&q=80&w=1000', // Calm blue
  'https://images.unsplash.com/photo-1502086223501-7ea2970dcb46?auto=format&fit=crop&q=80&w=1000', // Group
];

export const ALL_EVENTS: Event[] = [
  // Upcoming Events
  {
    id: '1',
    title: 'Sensory-Friendly Art Class',
    date: '2035-11-15',
    time: '10:00 AM',
    location: 'Tracy/Mountain House, CA',
    description: 'A creative session designed for sensory seekers and avoiders alike. All materials provided. We focus on texture, color, and self-expression in a calm environment.',
    capacity: 15,
    registered: 8,
    type: 'Class',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=1000',
    initialLikes: 42,
    hours: 2
  },
  {
    id: '2',
    title: 'Inclusive Weekend Event',
    date: '2035-12-18',
    time: '02:00 PM',
    location: 'Mountain House Community Park',
    description: 'Open play for neurodivergent and neurotypical kids to foster friendship and understanding. Guided activities included to help children connect.',
    capacity: 30,
    registered: 22,
    type: 'Event',
    image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=1000',
    initialLikes: 89,
    hours: 3
  },
  {
    id: '3',
    title: 'Parent Support Circle',
    date: '2036-01-20',
    time: '06:00 PM',
    location: 'Online (Zoom)',
    description: 'A safe space for parents to share experiences and resources regarding early intervention. Led by a certified family therapist.',
    capacity: 50,
    registered: 45,
    type: 'Event',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=1000',
    initialLikes: 156,
    hours: 1
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
    initialLikes: 124,
    hours: 4
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
    initialLikes: 210,
    hours: 5
  }
];

export const MOCK_DONATIONS: Donation[] = [
  { id: 'd1', amount: 500, date: '2023-10-01', campaign: 'Fall Fundraiser' },
  { id: 'd2', amount: 100, date: '2023-09-15', campaign: 'General Support' },
  { id: 'd3', amount: 250, date: '2023-08-20', campaign: 'Art Supplies Drive' },
];

export const MOCK_TESTIMONIALS: Testimonial[] = [
  {
    id: 'mock-1',
    author: 'Sarah Jenkins',
    role: 'Parent of 2',
    content: 'The sensory-friendly workshops have been a game-changer for my son. Finding a space where he is not just tolerated but celebrated is everything to our family. The patience of the volunteers is unmatched.',
    date: '2024-03-15',
    status: 'Approved',
    rating: 5,
    rank: 1
  },
  {
    id: 'mock-2',
    author: 'David Rivera',
    role: 'Local Educator',
    content: "Observing the 'Fun Without Barriers' events has shown me how inclusive play should actually look. They've built more than just a playground; they've built a blueprint for community empathy.",
    date: '2024-02-28',
    status: 'Approved',
    rating: 5,
    rank: 2
  },
  {
    id: 'mock-3',
    author: 'Elena Rossi',
    role: 'Monthly Donor',
    content: 'I support Aaria\'s Blue Elephant because every child deserves a childhood full of joy and connection. Seeing the direct impact of my donations through these smiles is incredibly rewarding.',
    date: '2024-04-01',
    status: 'Approved',
    rating: 5,
    rank: 3
  },
  {
    id: 'mock-4',
    author: 'Michael Thompson',
    role: 'Community Volunteer',
    content: 'Volunteering here has changed my perspective on accessibility. It is not just about ramps and rails; it is about the warmth of the community and the effort to make everyone feel seen.',
    date: '2024-01-20',
    status: 'Approved',
    rating: 5,
    rank: 4
  },
  {
    id: 'mock-5',
    author: 'Aria M.',
    role: 'Youth Participant',
    content: 'I love the art classes! I get to paint and make a mess, and no one tells me I am being too loud. It is my favorite place to visit every month.',
    date: '2024-03-10',
    status: 'Approved',
    rating: 5,
    rank: 5
  }
];

export const BYLAWS_HIGHLIGHTS = [
  "Organized exclusively for charitable purposes under Section 501(c)(3).",
  "Specific purpose: Foster inclusive events for neurodivergent & neurotypical kids.",
  "Board members serve without compensation (volunteer-based).",
  "Non-discrimination policy on race, religion, disability, or gender."
];