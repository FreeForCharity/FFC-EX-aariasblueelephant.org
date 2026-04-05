import { Metadata } from 'next';
import AboutContent from './AboutContent';

export const metadata: Metadata = {
  title: "About Us | Aaria's Blue Elephant",
  description: "Learn about Aaria's Blue Elephant, a California Nonprofit dedicated to fostering inclusive events for neurodivergent and neurotypical kids.",
  openGraph: {
    title: "About Us | Aaria's Blue Elephant",
    description: "Learn about our mission to foster inclusive events and build a new inclusive world for children of all abilities.",
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
