import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Activity, 
  DollarSign, 
  FileText, 
  MessageSquare, 
  Heart, 
  Clock, 
  Camera, 
  Plus, 
  Download, 
  CheckCircle, 
  MapPin, 
  ChevronRight,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { MOCK_DONATIONS } from '../constants';
import Button from '../components/Button';

const chartData = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 500 },
  { name: 'Jun', value: 900 },
  { name: 'Jul', value: 1200 },
];

type ViewState = 'overview' | 'events' | 'volunteers' | 'analytics' | 'history' | 'receipts' | 'my-events' | 'testimonial';

const Dashboard: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { events, addEvent, volunteerApplications, approveVolunteer, addTestimonial } = useData();
  
  const [activeView, setActiveView] = useState<ViewState>('overview');
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', date: '', time: '', location: '', description: '', type: 'Event', image: '', capacity: 20 });
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const [testimonialContent, setTestimonialContent] = useState('');

  if (!user) {
    return <Navigate to="/login" />;
  }

  const isBoard = user.role === 'BoardMember.Owner';
  const isDonor = user.role === 'Donor';
  const isUser = user.role === 'User';

  // --- Handlers ---

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
            updateProfile({ avatar: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEventImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setEventForm(prev => ({ ...prev, image: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    addEvent({
        title: eventForm.title,
        date: eventForm.date,
        time: eventForm.time,
        location: eventForm.location,
        description: eventForm.description,
        type: eventForm.type as any,
        image: eventForm.image || 'https://images.unsplash.com/photo-1502086223501-87db9e9cc358?auto=format&fit=crop&q=80&w=1000',
        capacity: Number(eventForm.capacity)
    });
    setShowEventForm(false);
    setEventForm({ title: '', date: '', time: '', location: '', description: '', type: 'Event', image: '', capacity: 20 });
  };

  const handleSubmitTestimonial = (e: React.FormEvent) => {
      e.preventDefault();
      addTestimonial({
          author: user.name,
          role: user.role,
          content: testimonialContent,
          avatar: user.avatar
      });
      setShowTestimonialForm(false);
      setTestimonialContent('');
      alert("Thank you! Your testimonial has been submitted and is now live on the homepage.");
  };

  const handleDownloadTaxReceipt = (id: string) => {
      alert(`Downloading Tax Receipt for donation #${id}... (Mock PDF Download)`);
  };

  // --- Navigation Configuration ---

  const navItems = [
    // Board Items
    ...(isBoard ? [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'events', label: 'Manage Events', icon: Calendar },
      { id: 'volunteers', label: 'Volunteers', icon: Users },
      { id: 'analytics', label: 'Analytics', icon: Activity },
    ] : []),
    // Donor Items
    ...(isDonor ? [
      { id: 'overview', label: 'Impact Overview', icon: LayoutDashboard },
      { id: 'history', label: 'Donation History', icon: Clock },
      { id: 'receipts', label: 'Tax Receipts', icon: FileText },
    ] : []),
    // User Items
    ...(isUser ? [
      { id: 'overview', label: 'My Dashboard', icon: LayoutDashboard },
      { id: 'my-events', label: 'My Events', icon: Calendar },
      { id: 'testimonial', label: 'Share Story', icon: MessageSquare },
    ] : []),
  ];

  // --- Render Sections ---

  const renderStatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
       {isBoard && (
         <>
           <div className="bg-brand-card p-6 rounded-xl border border-slate-700 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-slate-400 text-sm font-medium">Upcoming Classes</h3>
                 <Calendar className="h-5 w-5 text-brand-cyan" />
              </div>
              <p className="text-3xl font-bold text-white">{events.length}</p>
           </div>
           <div className="bg-brand-card p-6 rounded-xl border border-slate-700 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-slate-400 text-sm font-medium">Pending Approvals</h3>
                 <CheckCircle className="h-5 w-5 text-brand-amber" />
              </div>
              <p className="text-3xl font-bold text-white">{volunteerApplications.filter(v => v.status === 'Pending').length}</p>
           </div>
           <div className="bg-brand-card p-6 rounded-xl border border-slate-700 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-slate-400 text-sm font-medium">Total Donations</h3>
                 <DollarSign className="h-5 w-5 text-brand-purple" />
              </div>
              <p className="text-3xl font-bold text-white">$24,500</p>
           </div>
           <div className="bg-brand-card p-6 rounded-xl border border-slate-700 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-slate-400 text-sm font-medium">Active Members</h3>
                 <Users className="h-5 w-5 text-brand-pink" />
              </div>
              <p className="text-3xl font-bold text-white">142</p>
           </div>
         </>
       )}
       {isDonor && (
          <div className="bg-brand-card p-6 rounded-xl border border-slate-700 shadow-lg col-span-full md:col-span-2">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-400 text-sm font-medium">Your Total Contributions</h3>
                <Heart className="h-5 w-5 text-brand-pink" />
             </div>
             <p className="text-4xl font-bold text-white">$850.00</p>
             <p className="text-slate-400 text-sm mt-2">Thank you for making a difference.</p>
          </div>
       )}
       {isUser && (
          <div className="bg-brand-card p-6 rounded-xl border border-slate-700 shadow-lg col-span-full md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-400 text-sm font-medium">Registered Events</h3>
              <Calendar className="h-5 w-5 text-brand-cyan" />
            </div>
            <p className="text-3xl font-bold text-white">2</p>
          </div>
       )}
    </div>
  );

  const renderEventsSection = () => (
    <div className="bg-brand-card rounded-xl border border-slate-700 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Manage Events</h2>
            <Button size="sm" onClick={() => setShowEventForm(!showEventForm)}>
                <Plus className="h-4 w-4 mr-2" /> {showEventForm ? 'Cancel' : 'Add Event'}
            </Button>
        </div>

        {showEventForm && (
            <form onSubmit={handleAddEvent} className="bg-slate-800/50 p-6 rounded-xl mb-8 border border-slate-700 space-y-4 animate-in fade-in slide-in-from-top-4">
                <h3 className="text-white font-medium mb-2">New Event Details</h3>
                <input type="text" placeholder="Event Title" className="w-full bg-slate-900 rounded-lg p-3 text-white border border-slate-700 focus:ring-2 focus:ring-brand-cyan focus:border-transparent" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} required />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="date" className="w-full bg-slate-900 rounded-lg p-3 text-white border border-slate-700 focus:ring-2 focus:ring-brand-cyan focus:border-transparent" value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} required />
                    <input type="time" className="w-full bg-slate-900 rounded-lg p-3 text-white border border-slate-700 focus:ring-2 focus:ring-brand-cyan focus:border-transparent" value={eventForm.time} onChange={e => setEventForm({...eventForm, time: e.target.value})} required />
                    <input type="number" placeholder="Capacity" className="w-full bg-slate-900 rounded-lg p-3 text-white border border-slate-700 focus:ring-2 focus:ring-brand-cyan focus:border-transparent" value={eventForm.capacity} onChange={e => setEventForm({...eventForm, capacity: Number(e.target.value)})} required />
                </div>
                <input type="text" placeholder="Location" className="w-full bg-slate-900 rounded-lg p-3 text-white border border-slate-700 focus:ring-2 focus:ring-brand-cyan focus:border-transparent" value={eventForm.location} onChange={e => setEventForm({...eventForm, location: e.target.value})} required />
                
                {/* Event Image Upload */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Event Image</label>
                  <div className="mt-1 flex justify-center rounded-lg border border-dashed border-slate-700 px-6 py-10 hover:bg-slate-800/50 transition-colors relative group bg-slate-900/30">
                    <div className="text-center w-full">
                      {eventForm.image ? (
                         <div className="relative h-48 w-full mx-auto rounded-lg overflow-hidden group-hover:opacity-90 transition-opacity">
                             <img 
                               src={eventForm.image} 
                               alt="Preview" 
                               className="h-full w-full object-cover" 
                             />
                             <button 
                                type="button"
                                onClick={() => setEventForm({...eventForm, image: ''})}
                                className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full text-white hover:bg-red-500 transition-colors backdrop-blur-sm"
                             >
                                <X className="h-4 w-4" />
                             </button>
                         </div>
                      ) : (
                        <div className="space-y-2">
                            <div className="mx-auto h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-slate-400" aria-hidden="true" />
                            </div>
                            <div className="flex text-sm leading-6 text-slate-400 justify-center">
                                <label
                                htmlFor="event-image-upload"
                                className="relative cursor-pointer rounded-md font-semibold text-brand-cyan focus-within:outline-none hover:text-brand-cyan/80"
                                >
                                <span>Upload a file</span>
                                <input id="event-image-upload" name="event-image-upload" type="file" className="sr-only" accept="image/*" onChange={handleEventImageChange} />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-slate-500">PNG, JPG, GIF up to 5MB</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <textarea placeholder="Description" className="w-full bg-slate-900 rounded-lg p-3 text-white border border-slate-700 focus:ring-2 focus:ring-brand-cyan focus:border-transparent min-h-[100px]" value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} required />
                <div className="flex justify-end pt-2">
                    <Button type="submit">Create Event</Button>
                </div>
            </form>
        )}

        <div className="space-y-3">
            {events.map(evt => (
                <div key={evt.id} className="flex flex-col sm:flex-row sm:items-center p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors group">
                    <div className="flex items-center">
                        <div className="h-12 w-12 rounded-xl overflow-hidden bg-brand-cyan/10 flex items-center justify-center text-brand-cyan font-bold text-sm flex-shrink-0 border border-slate-700">
                            {evt.image ? (
                                <img src={evt.image} alt={evt.title} className="h-full w-full object-cover" />
                            ) : (
                                evt.type.charAt(0)
                            )}
                        </div>
                        <div className="ml-4">
                            <h4 className="text-white font-bold">{evt.title}</h4>
                            <div className="flex items-center text-slate-400 text-xs mt-1 gap-3">
                                <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> {evt.date}</span>
                                <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {evt.time}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 sm:mt-0 sm:ml-auto flex items-center gap-4">
                        <div className="text-right mr-4">
                            <span className="text-xs text-slate-500 uppercase font-bold">Capacity</span>
                            <p className="text-white font-mono">{evt.registered} / {evt.capacity}</p>
                        </div>
                        <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">Edit</Button>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderVolunteersSection = () => (
    <div className="bg-brand-card rounded-xl border border-slate-700 p-6 shadow-lg">
        <h2 className="text-xl font-bold text-white mb-6">Volunteer Applications</h2>
        <div className="space-y-4">
            {volunteerApplications.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">No pending applications.</p>
            ) : (
                volunteerApplications.map(app => (
                    <div key={app.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                        <div className="mb-4 sm:mb-0">
                            <div className="flex items-center gap-3">
                                <h4 className="text-white font-bold">{app.name}</h4>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                                    app.status === 'Pending' 
                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                                    : 'bg-green-500/10 text-green-500 border-green-500/20'
                                }`}>
                                    {app.status}
                                </span>
                            </div>
                            <p className="text-slate-300 text-sm mt-1">Interested in: <span className="text-brand-cyan">{app.interest}</span></p>
                            <p className="text-slate-500 text-xs mt-1">{app.email}</p>
                        </div>
                        {app.status === 'Pending' && (
                            <Button size="sm" variant="outline" onClick={() => approveVolunteer(app.id)} className="shrink-0">
                                Approve Application
                            </Button>
                        )}
                    </div>
                ))
            )}
        </div>
    </div>
  );

  const renderAnalyticsSection = () => (
    <div className="bg-brand-card rounded-xl border border-slate-700 p-6 shadow-lg h-[500px] flex flex-col">
        <h2 className="text-xl font-bold text-white mb-6">Growth Analytics</h2>
        <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} dy={10} />
                    <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} dx={-10} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', color: '#fff', borderRadius: '8px' }}
                        cursor={{ stroke: '#475569', strokeWidth: 2 }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#06B6D4" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    </div>
  );

  const renderHistorySection = () => (
    <div className="bg-brand-card rounded-xl border border-slate-700 p-6 shadow-lg">
        <h2 className="text-xl font-bold text-white mb-6">Donation History</h2>
        <div className="overflow-hidden rounded-lg border border-slate-700">
            <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-800/50">
                    <tr className="text-slate-400">
                        <th className="py-3 px-4 font-medium">Campaign</th>
                        <th className="py-3 px-4 font-medium">Date</th>
                        <th className="py-3 px-4 font-medium text-right">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 bg-slate-800/20">
                    {MOCK_DONATIONS.map((donation) => (
                        <tr key={donation.id} className="group hover:bg-slate-700/30 transition-colors">
                            <td className="py-3 px-4 text-white font-medium">{donation.campaign}</td>
                            <td className="py-3 px-4 text-slate-400">{donation.date}</td>
                            <td className="py-3 px-4 text-right text-brand-cyan font-bold">${donation.amount}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );

  const renderReceiptsSection = () => (
    <div className="bg-brand-card rounded-xl border border-slate-700 p-6 shadow-lg">
        <h2 className="text-xl font-bold text-white mb-6">Tax Receipts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_DONATIONS.map(donation => (
                <div key={donation.id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors group">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-brand-purple/10 flex items-center justify-center text-brand-purple">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-white text-sm font-bold">Receipt #{donation.id.toUpperCase()}</p>
                            <p className="text-slate-400 text-xs">{donation.date} • ${donation.amount}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDownloadTaxReceipt(donation.id)} className="text-slate-400 hover:text-white">
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            ))}
        </div>
    </div>
  );

  const renderMyEventsSection = () => (
    <div className="bg-brand-card rounded-xl border border-slate-700 p-6 shadow-lg">
        <h2 className="text-xl font-bold text-white mb-6">My Registered Events</h2>
        <div className="space-y-4">
        {events.slice(0, 2).map(evt => (
            <div key={evt.id} className="flex items-center p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <div className="h-14 w-14 rounded-xl bg-brand-cyan/20 flex flex-col items-center justify-center text-brand-cyan font-bold border border-brand-cyan/20 flex-shrink-0">
                    <span className="text-xs uppercase">{new Date(evt.date).toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-xl leading-none">{evt.date.split('-')[2]}</span>
                </div>
                <div className="ml-4">
                    <h4 className="text-white font-bold text-lg">{evt.title}</h4>
                    <div className="flex flex-wrap gap-3 mt-1 text-slate-400 text-sm">
                        <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {evt.time}</span>
                        <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" /> {evt.location}</span>
                    </div>
                </div>
            </div>
        ))}
        </div>
    </div>
  );

  const renderTestimonialSection = () => (
    <div className="bg-brand-card rounded-xl border border-slate-700 p-6 shadow-lg max-w-2xl">
        <h2 className="text-xl font-bold text-white mb-2">Share Your Story</h2>
        <p className="text-slate-400 mb-6">Your experience can inspire others to join our community.</p>
        
        {showTestimonialForm ? (
            <form onSubmit={handleSubmitTestimonial} className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <textarea 
                    className="w-full bg-slate-900 rounded-xl p-4 text-white border border-slate-700 focus:ring-2 focus:ring-brand-cyan focus:border-transparent min-h-[150px] leading-relaxed"
                    placeholder="How has Aaria's Blue Elephant impacted you?"
                    value={testimonialContent}
                    onChange={e => setTestimonialContent(e.target.value)}
                    required
                />
                <div className="flex gap-3">
                    <Button type="submit">Submit Story</Button>
                    <Button type="button" variant="ghost" onClick={() => setShowTestimonialForm(false)}>Cancel</Button>
                </div>
            </form>
        ) : (
            <div className="text-center p-8 border-2 border-dashed border-slate-700 rounded-xl hover:border-slate-600 transition-colors bg-slate-800/20">
                <MessageSquare className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <h3 className="text-white font-medium mb-2">Write a Testimonial</h3>
                <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
                    Share how our playgroups or events have helped your family. 
                </p>
                <Button variant="outline" onClick={() => setShowTestimonialForm(true)}>Start Writing</Button>
            </div>
        )}
    </div>
  );

  const renderContent = () => {
    switch(activeView) {
        case 'overview': return renderStatsCards();
        case 'events': return renderEventsSection();
        case 'volunteers': return renderVolunteersSection();
        case 'analytics': return renderAnalyticsSection();
        case 'history': return renderHistorySection();
        case 'receipts': return renderReceiptsSection();
        case 'my-events': return renderMyEventsSection();
        case 'testimonial': return renderTestimonialSection();
        default: return renderStatsCards();
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-brand-dark">
       {/* Sidebar Navigation */}
       <div className="w-full lg:w-72 bg-brand-card border-b lg:border-b-0 lg:border-r border-slate-800 flex-shrink-0 flex flex-col">
          {/* Profile Section */}
          <div className="p-6 border-b border-slate-800 flex flex-col items-center text-center">
            <div className="relative group mb-4">
                <div className="h-24 w-24 rounded-full bg-brand-purple p-1 border-4 border-slate-800 shadow-xl">
                    <div className="h-full w-full rounded-full overflow-hidden bg-slate-700">
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-2xl font-bold text-white">
                                {user.name.charAt(0)}
                            </div>
                        )}
                    </div>
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-all duration-300">
                    <Camera className="h-8 w-8 text-white" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                </label>
            </div>
            <h2 className="text-xl font-bold text-white">{user.name}</h2>
            <p className="text-sm font-medium mt-1 text-brand-cyan">
                {isBoard ? 'Board Member' : isDonor ? 'Valued Donor' : 'Community Member'}
            </p>
          </div>

          {/* Nav Items Desktop (Vertical) */}
          <nav className="flex-1 p-4 space-y-1 hidden lg:block overflow-y-auto">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => setActiveView(item.id as ViewState)}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                            isActive 
                            ? 'bg-brand-cyan/10 text-brand-cyan shadow-sm' 
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                        <Icon className={`mr-3 h-5 w-5 transition-colors ${isActive ? 'text-brand-cyan' : 'text-slate-500 group-hover:text-white'}`} />
                        {item.label}
                        {isActive && <ChevronRight className="ml-auto h-4 w-4 opacity-50" />}
                    </button>
                );
            })}
          </nav>

           {/* Nav Items Mobile (Horizontal) */}
           <nav className="lg:hidden flex overflow-x-auto p-4 space-x-2 no-scrollbar border-b border-slate-800">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => setActiveView(item.id as ViewState)}
                        className={`flex-shrink-0 flex items-center px-4 py-2 text-sm font-medium rounded-full transition-all ${
                            isActive 
                            ? 'bg-brand-cyan text-slate-900' 
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                    >
                        <Icon className="mr-2 h-4 w-4" />
                        {item.label}
                    </button>
                );
            })}
           </nav>
       </div>

       {/* Main Content Area */}
       <div className="flex-1 p-4 sm:p-8 overflow-y-auto bg-slate-900/50">
          <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">
                    {navItems.find(i => i.id === activeView)?.label || 'Dashboard'}
                </h1>
                <p className="text-slate-400 text-sm">Manage your activities and view your reports.</p>
            </div>
            {renderContent()}
          </div>
       </div>
    </div>
  );
};

export default Dashboard;