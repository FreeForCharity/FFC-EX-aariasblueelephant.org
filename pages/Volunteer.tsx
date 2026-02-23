import React, { useState, useEffect } from 'react';
import { Heart, CheckCircle, Send, ArrowRight, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

const Volunteer: React.FC = () => {
  const { submitVolunteerApp, volunteerApplications } = useData();
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);

  const pendingApp = volunteerApplications.find(app => app.email === user?.email && app.status === 'Pending');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    interest: 'Event Support',
    message: ''
  });

  // Re-sync if the user logs in after the component loads
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email
      }));
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitVolunteerApp({
      name: formData.name,
      email: formData.email,
      interest: formData.interest,
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center max-w-2xl mx-auto">
        <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center mb-8 animate-bounce">
          <Heart className="h-10 w-10 text-green-500" />
        </div>
        <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Application Received!</h2>
        <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed mb-10">
          Thank you for offering your time and heart to Aaria's Blue Elephant.
          Your commitment to building inclusive communities is what makes our mission possible.
          Our team will review your application and reach out to you at <strong>{formData.email}</strong> to discuss how we can best signify your impact together.
        </p>

        <div className="w-full bg-sky-50 dark:bg-sky-900/20 rounded-2xl p-8 mb-8 border border-sky-100 dark:border-sky-800/50">
          <h3 className="text-sky-900 dark:text-sky-300 font-bold mb-3">While you wait...</h3>
          <p className="text-sky-700 dark:text-sky-400 mb-6">
            Help us fund the very programs you'll be supporting. Every donation directly creates more inclusive spaces for children through our playgroups.
          </p>
          <Link
            to="/#join-herd"
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand-cyan text-white rounded-full font-bold hover:bg-sky-500 transition-all shadow-lg hover:shadow-sky-500/25"
          >
            Signify Impact with a Donation <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex gap-4">
          <Button variant="ghost" onClick={() => setSubmitted(false)}>Back to Form</Button>
          <Link to="/dashboard">
            <Button variant="outline">Go to My Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (pendingApp) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center max-w-xl mx-auto">
        <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
          <Send className="h-8 w-8 text-amber-500" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Application Under Review</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          You already have an active volunteer application being processed. To provide the best experience for our community, we limit active applications to one at a time.
        </p>
        <div className="bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2 border border-slate-200 dark:border-slate-700 mb-8">
          <p className="text-slate-500 dark:text-slate-400 text-sm italic">
            Currently interested in: <span className="font-bold text-slate-700 dark:text-slate-200">{pendingApp.interest}</span>
          </p>
        </div>
        <Link to="/dashboard">
          <Button variant="outline">Check Status in Dashboard</Button>
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center max-w-xl mx-auto">
        <div className="h-16 w-16 rounded-full bg-sky-100 dark:bg-sky-900/20 flex items-center justify-center mb-6">
          <Users className="h-8 w-8 text-sky-600 dark:text-sky-400" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Want to Collaborate?</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
          To submit a volunteer application and get involved with our playgroups and events, please sign in or create an account first. This helps us stay connected!
        </p>
        <Link to="/auth">
          <Button size="lg" className="flex items-center gap-2 shadow-lg shadow-sky-500/25">
            Sign In to Volunteer <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-sky-100 dark:bg-sky-900/20 mb-6">
          <Heart className="h-8 w-8 text-sky-600 dark:text-sky-400" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Volunteer With Us</h1>
        <p className="text-xl text-slate-600 dark:text-slate-300">
          Help us create inclusive spaces. We need compassionate individuals for playgroups, events, and administrative support.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.01] transition-all duration-300">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
              <input
                type="text"
                id="name"
                required
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
              <input
                type="email"
                id="email"
                required
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Phone Number</label>
              <input
                type="tel"
                id="phone"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="interest" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Area of Interest</label>
              <select
                id="interest"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                value={formData.interest}
                onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
              >
                <option>Event Support</option>
                <option>Playgroup Facilitator</option>
                <option>Administrative Help</option>
                <option>Fundraising</option>
                <option>Professional Services (Therapy/Legal)</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Why do you want to volunteer?</label>
            <textarea
              id="message"
              rows={4}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            ></textarea>
          </div>

          <Button type="submit" fullWidth size="lg" className="flex items-center justify-center gap-2">
            Submit Application <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Volunteer;