import { Metadata } from 'next';
import React, { Suspense } from 'react';
import LoginContent from './LoginContent';

export const metadata: Metadata = {
  title: "Login | Aaria's Blue Elephant",
  description: "Sign in to your Aaria's Blue Elephant account to manage your event registrations, volunteer applications, and community contributions.",
  openGraph: {
      title: "Login | Aaria's Blue Elephant",
      description: "Access your personalized dashboard. Join our community and signify your impact today.",
  },
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
