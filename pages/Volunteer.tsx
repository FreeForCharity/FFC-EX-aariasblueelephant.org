import React, { useState } from 'react';
import { Heart, CheckCircle, Send } from 'lucide-react';
import Button from '../components/Button';
import { useData } from '../context/DataContext';

const Volunteer: React.FC = () => {
  const { submitVolunteerApp } = useData();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    interest: 'Event Support',
    message: ''
  });

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
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Application Received!</h2>
        <p className="text-slate-400 max-w-md mb-8">
          Thank you for offering your time and heart to Aaria's Blue Elephant. 
          Our team will review your application and reach out to you at <strong>{formData.email}</strong> shortly.
        </p>
        <Button onClick={() => setSubmitted(false)}>Submit Another</Button>
      </div>
    );
  }

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-brand-purple/20 mb-6">
           <Heart className="h-8 w-8 text-brand-purple" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Volunteer With Us</h1>
        <p className="text-xl text-slate-300">
          Help us create inclusive spaces. We need compassionate individuals for playgroups, events, and administrative support.
        </p>
      </div>

      <div className="bg-brand-card border border-slate-700 rounded-2xl p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
              <input 
                type="text" 
                id="name"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand-cyan focus:border-transparent"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <input 
                type="email" 
                id="email"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand-cyan focus:border-transparent"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
              <input 
                type="tel" 
                id="phone"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand-cyan focus:border-transparent"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div>
              <label htmlFor="interest" className="block text-sm font-medium text-slate-300 mb-2">Area of Interest</label>
              <select 
                id="interest"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand-cyan focus:border-transparent"
                value={formData.interest}
                onChange={(e) => setFormData({...formData, interest: e.target.value})}
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
            <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">Why do you want to volunteer?</label>
            <textarea 
              id="message"
              rows={4}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand-cyan focus:border-transparent"
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
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