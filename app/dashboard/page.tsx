import React from 'react';
import type { Metadata } from 'next';
import DashboardContent from './DashboardContent';

export const metadata: Metadata = {
  title: 'Dashboard | Aaria\'s Blue Elephant',
  description: 'Manage your activities, view reports, and stay connected with Aaria\'s Blue Elephant community.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardPage() {
  return <DashboardContent />;
}
