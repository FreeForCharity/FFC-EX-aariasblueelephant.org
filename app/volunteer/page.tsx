import { Metadata } from 'next';
import VolunteerForm from './VolunteerForm';

export const metadata: Metadata = {
  title: "Volunteer With Us | Aaria's Blue Elephant",
  description: "Join Aaria's Blue Elephant as a volunteer. Help us create inclusive spaces through events, events, and community support in California.",
  openGraph: {
    title: "Volunteer With Us | Aaria's Blue Elephant",
    description: "Your time and heart can make a difference. Sign up to volunteer and help us build a new inclusive world for children of all abilities.",
  },
};

export default function VolunteerPage() {
  return <VolunteerForm />;
}
