import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

import {
    LayoutDashboard,
    Calendar,
    Users,

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
    ArrowRight,
    Image as ImageIcon,
    X
} from 'lucide-react';
import { MOCK_DONATIONS, DEFAULT_EVENT_IMAGE, DEFAULT_LOCAL_FALLBACK } from '../constants';
import Button from '../components/Button';


type ViewState = 'overview' | 'events' | 'manage-registrations' | 'volunteers' | 'history' | 'receipts' | 'my-events' | 'testimonial';

const Dashboard: React.FC = () => {
    const { user, updateProfile, totalMembers } = useAuth();
    const { events, addEvent, updateEvent, deleteEvent, volunteerApplications, approveVolunteer, testimonials, addTestimonial, approveTestimonial, deleteTestimonial, eventRegistrations, approveRegistration, deleteRegistration } = useData();

    const [activeView, setActiveView] = useState<ViewState>('overview');
    const [showEventForm, setShowEventForm] = useState(false);
    const [editingEventId, setEditingEventId] = useState<string | null>(null);
    const [eventForm, setEventForm] = useState({ title: '', date: '', time: '', location: '', description: '', type: 'Event', image: '', capacity: 20 });
    const [showTestimonialForm, setShowTestimonialForm] = useState(false);
    const [testimonialContent, setTestimonialContent] = useState('');
    const [submissionStatus, setSubmissionStatus] = useState<'Idle' | 'StorySuccess' | 'VolunteerSuccess'>('Idle');

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
        const eventData = {
            title: eventForm.title,
            date: eventForm.date,
            time: eventForm.time,
            location: eventForm.location,
            description: eventForm.description,
            type: eventForm.type as any,
            image: eventForm.image || 'https://images.unsplash.com/photo-1502086223501-87db9e9cc358?auto=format&fit=crop&q=80&w=1000',
            capacity: Number(eventForm.capacity)
        };

        if (editingEventId) {
            updateEvent(editingEventId, eventData);
        } else {
            addEvent(eventData);
        }

        setShowEventForm(false);
        setEditingEventId(null);
        setEventForm({ title: '', date: '', time: '', location: '', description: '', type: 'Event', image: '', capacity: 20 });
    };

    const handleEditEvent = (id: string) => {
        const evt = events.find(e => e.id === id);
        if (evt) {
            setEventForm({
                title: evt.title,
                date: evt.date,
                time: evt.time,
                location: evt.location,
                description: evt.description,
                type: evt.type,
                image: evt.image || '',
                capacity: evt.capacity
            });
            setEditingEventId(id);
            setShowEventForm(true);
        }
    };

    const handleDeleteEvent = (id: string) => {
        if (window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
            deleteEvent(id);
        }
    };

    const handleSubmitTestimonial = (e: React.FormEvent) => {
        e.preventDefault();
        addTestimonial({
            author: user.name,
            authorEmail: user.email,
            role: user.role,
            content: testimonialContent,
            avatar: user.avatar
        });
        setTestimonialContent('');
        setShowTestimonialForm(false);
        setSubmissionStatus('StorySuccess');
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
            { id: 'manage-registrations', label: 'Registrations', icon: CheckCircle },
            { id: 'volunteers', label: 'Volunteers', icon: Users },
            { id: 'manage-testimonials', label: 'Testimonials', icon: MessageSquare },

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
            { id: 'my-volunteering', label: 'My Volunteering', icon: Users },
            { id: 'testimonial', label: 'Share Story', icon: MessageSquare },
        ] : []),
    ];

    // --- Render Sections ---

    const renderSuccessView = (type: 'Story' | 'Volunteer') => (
        <div className="bg-white dark:bg-brand-card rounded-2xl border border-slate-200 dark:border-slate-700 p-10 text-center shadow-xl animate-in zoom-in-95 duration-500 max-w-2xl mx-auto my-10">
            <div className="h-20 w-20 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="h-10 w-10 text-green-600 dark:text-green-400 animate-pulse" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                {type === 'Story' ? 'Thank You for Sharing Your Story!' : 'Thank You for Stepping Up!'}
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed mb-8">
                {type === 'Story'
                    ? "Your journey inspires us. Our team will review your testimonial shortly. Once approved, it will be highlighted in our 'Voices of our Community' section to inspire others."
                    : "We've received your application to join our volunteer force. A member of our team will reach out to you personally to discuss the next steps in signifying your impact."}
            </p>
            <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-6 mb-8 border border-sky-100 dark:border-sky-800/50">
                <p className="text-sky-800 dark:text-sky-300 font-medium mb-3">Want to amplify your impact right now?</p>
                <p className="text-sky-600 dark:text-sky-400 text-sm mb-4">
                    Your contribution directly funds the programs that build inclusive spaces for children like Aaria.
                </p>
                <a
                    href="/#join-herd"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand-cyan text-white rounded-full font-bold hover:bg-sky-500 transition-all shadow-lg hover:shadow-sky-500/25"
                    onClick={() => setSubmissionStatus('Idle')}
                >
                    Signify Impact with a Donation <ArrowRight className="h-4 w-4" />
                </a>
            </div>
            <Button variant="ghost" onClick={() => setSubmissionStatus('Idle')} className="text-slate-500 dark:text-slate-400">
                Back to Dashboard
            </Button>
        </div>
    );

    const renderStatsCards = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-2">
            {isBoard && (
                <>
                    <div className="bg-white dark:bg-brand-card p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-lg hover:scale-[1.02] hover:shadow-md transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Upcoming Classes</h3>
                            <Calendar className="h-5 w-5 text-brand-cyan" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{events.length}</p>
                    </div>
                    <div className="bg-white dark:bg-brand-card p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-lg hover:scale-[1.02] hover:shadow-md transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Pending Approvals</h3>
                            <CheckCircle className="h-5 w-5 text-brand-amber" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">
                            {volunteerApplications.filter(v => v.status === 'Pending').length +
                                testimonials.filter(t => t.status === 'Pending').length +
                                eventRegistrations.filter(r => r.status === 'Pending').length}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-brand-card p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-lg hover:scale-[1.02] hover:shadow-md transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Volunteers</h3>
                            <Users className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{volunteerApplications.filter(v => v.status === 'Approved').length}</p>
                    </div>
                    <div className="bg-white dark:bg-brand-card p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-lg hover:scale-[1.02] hover:shadow-md transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Network</h3>
                            <Users className="h-5 w-5 text-brand-pink" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalMembers}</p>
                    </div>
                </>
            )}
            {isDonor && (
                <div className="bg-white dark:bg-brand-card p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-lg col-span-full md:col-span-2 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Your Total Contributions</h3>
                        <Heart className="h-5 w-5 text-brand-pink" />
                    </div>
                    <p className="text-4xl font-bold text-slate-900 dark:text-white">$850.00</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Thank you for making a difference.</p>
                </div>
            )}
            {isUser && (
                <div className="bg-white dark:bg-brand-card p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-lg col-span-full md:col-span-2 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Registered Events</h3>
                        <Calendar className="h-5 w-5 text-brand-cyan" />
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{eventRegistrations.filter(r => r.userId === user.email).length}</p>
                </div>
            )}
        </div>
    );

    const renderEventsSection = () => (
        <div className="bg-white dark:bg-brand-card rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm dark:shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Manage Events</h2>
                <Button size="sm" onClick={() => {
                    if (showEventForm) {
                        setShowEventForm(false);
                        setEditingEventId(null);
                        setEventForm({ title: '', date: '', time: '', location: '', description: '', type: 'Event', image: '', capacity: 20 });
                    } else {
                        setShowEventForm(true);
                    }
                }}>
                    <Plus className={`h-4 w-4 mr-2 transition-transform duration-300 ${showEventForm ? 'rotate-45' : ''}`} />
                    {showEventForm ? 'Cancel' : 'Add Event'}
                </Button>
            </div>

            {showEventForm && (
                <form onSubmit={handleAddEvent} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl mb-8 border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-slate-900 dark:text-white font-medium mb-2">
                        {editingEventId ? 'Edit Event Details' : 'New Event Details'}
                    </h3>
                    <input type="text" placeholder="Event Title" className="w-full bg-white dark:bg-slate-900 rounded-lg p-3 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-cyan focus:border-transparent placeholder-slate-400 dark:placeholder-slate-500" value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: e.target.value })} required />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input type="date" className="w-full bg-white dark:bg-slate-900 rounded-lg p-3 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-cyan focus:border-transparent placeholder-slate-400 dark:placeholder-slate-500" value={eventForm.date} onChange={e => setEventForm({ ...eventForm, date: e.target.value })} required />
                        <input type="time" className="w-full bg-white dark:bg-slate-900 rounded-lg p-3 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-cyan focus:border-transparent placeholder-slate-400 dark:placeholder-slate-500" value={eventForm.time} onChange={e => setEventForm({ ...eventForm, time: e.target.value })} required />
                        <input type="number" placeholder="Capacity" className="w-full bg-white dark:bg-slate-900 rounded-lg p-3 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-cyan focus:border-transparent placeholder-slate-400 dark:placeholder-slate-500" value={eventForm.capacity} onChange={e => setEventForm({ ...eventForm, capacity: Number(e.target.value) })} required />
                    </div>
                    <input type="text" placeholder="Location" className="w-full bg-white dark:bg-slate-900 rounded-lg p-3 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-cyan focus:border-transparent placeholder-slate-400 dark:placeholder-slate-500" value={eventForm.location} onChange={e => setEventForm({ ...eventForm, location: e.target.value })} required />

                    {/* Event Image Upload */}
                    <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Event Image</label>
                        <div className="mt-1 flex justify-center rounded-lg border border-dashed border-slate-300 dark:border-slate-700 px-6 py-10 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative group bg-slate-50 dark:bg-slate-900/30">
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
                                            onClick={() => setEventForm({ ...eventForm, image: '' })}
                                            className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full text-white hover:bg-red-500 transition-colors backdrop-blur-sm"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                            <ImageIcon className="h-6 w-6 text-slate-400" aria-hidden="true" />
                                        </div>
                                        <div className="flex text-sm leading-6 text-slate-500 dark:text-slate-400 justify-center">
                                            <label
                                                htmlFor="event-image-upload"
                                                className="relative cursor-pointer rounded-md font-semibold text-brand-cyan focus-within:outline-none hover:text-brand-cyan/80"
                                            >
                                                <span>Upload a file</span>
                                                <input id="event-image-upload" name="event-image-upload" type="file" className="sr-only" accept="image/*" onChange={handleEventImageChange} />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">PNG, JPG, GIF up to 5MB</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <textarea placeholder="Description" className="w-full bg-white dark:bg-slate-900 rounded-lg p-3 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-cyan focus:border-transparent min-h-[100px] placeholder-slate-400 dark:placeholder-slate-500" value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} required />
                    <div className="flex justify-end pt-2">
                        <Button type="submit">{editingEventId ? 'Save Changes' : 'Create Event'}</Button>
                    </div>
                </form>
            )}

            <div className="space-y-3">
                {events.map(evt => (
                    <div key={evt.id} className="flex flex-col sm:flex-row sm:items-center p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 transition-colors group">
                        <div className="flex items-center">
                            <div className="h-12 w-12 rounded-xl overflow-hidden bg-brand-cyan/10 flex items-center justify-center text-brand-cyan font-bold text-sm flex-shrink-0 border border-brand-cyan/20">
                                <img
                                    src={evt.image || DEFAULT_EVENT_IMAGE}
                                    alt={evt.title}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        if (target.src === DEFAULT_EVENT_IMAGE) {
                                            target.src = DEFAULT_LOCAL_FALLBACK;
                                        } else {
                                            target.src = DEFAULT_EVENT_IMAGE;
                                        }
                                    }}
                                />
                            </div>
                            <div className="ml-4">
                                <h4 className="text-slate-900 dark:text-white font-bold">{evt.title}</h4>
                                <div className="flex items-center text-slate-500 dark:text-slate-400 text-xs mt-1 gap-3">
                                    <span className="flex items-center"><Calendar className="h-3 w-3 mr-1 text-slate-400" /> {evt.date}</span>
                                    <span className="flex items-center"><Clock className="h-3 w-3 mr-1 text-slate-400" /> {evt.time}</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 sm:mt-0 sm:ml-auto flex items-center gap-4">
                            <div className="text-right mr-4">
                                <span className="text-xs text-slate-500 uppercase font-bold">Capacity</span>
                                <p className="text-slate-900 dark:text-white font-mono">{evt.registered} / {evt.capacity}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleEditEvent(evt.id)}
                                >
                                    Edit
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    onClick={() => handleDeleteEvent(evt.id)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderVolunteersSection = () => (
        <div className="bg-white dark:bg-brand-card rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm dark:shadow-lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Volunteer Applications</h2>
            <div className="space-y-4">
                {volunteerApplications.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">No volunteer applications.</p>
                ) : (
                    volunteerApplications.map(app => (
                        <div key={app.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700/50">
                            <div className="mb-4 sm:mb-0">
                                <div className="flex items-center gap-3">
                                    <h4 className="text-slate-900 dark:text-white font-bold">{app.name}</h4>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${app.status === 'Pending'
                                        ? 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-500 dark:border-amber-500/20'
                                        : 'bg-green-100 text-green-600 border-green-200 dark:bg-green-500/10 dark:text-green-500 dark:border-green-500/20'
                                        }`}>
                                        {app.status}
                                    </span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">Interested in: <span className="text-brand-cyan">{app.interest}</span></p>
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

    const renderManageTestimonialsSection = () => (
        <div className="bg-white dark:bg-brand-card rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm dark:shadow-lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Manage Testimonials</h2>
            <div className="space-y-4">
                {testimonials.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">No testimonials submitted yet.</p>
                ) : (
                    testimonials.map(testimonial => (
                        <div key={testimonial.id} className="flex flex-col p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700/50">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                                        {testimonial.avatar ? (
                                            <img src={testimonial.avatar} alt={testimonial.author} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold">
                                                {testimonial.author.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-slate-900 dark:text-white font-bold">{testimonial.author}</h4>
                                        <p className="text-xs text-sky-600 dark:text-sky-400 font-medium">{testimonial.role} • {testimonial.date}</p>
                                    </div>
                                </div>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${testimonial.status === 'Pending'
                                    ? 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-500 dark:border-amber-500/20'
                                    : 'bg-green-100 text-green-600 border-green-200 dark:bg-green-500/10 dark:text-green-500 dark:border-green-500/20'
                                    }`}>
                                    {testimonial.status}
                                </span>
                            </div>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-lg mb-4">
                                <p className="text-slate-600 dark:text-slate-300 text-sm italic">"{testimonial.content}"</p>
                            </div>
                            <div className="flex justify-end gap-3">
                                {testimonial.status === 'Pending' && (
                                    <Button size="sm" onClick={() => approveTestimonial(testimonial.id)}>
                                        Approve Testimonial
                                    </Button>
                                )}
                                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10" onClick={() => {
                                    if (window.confirm('Are you sure you want to permanently delete this testimonial?')) {
                                        deleteTestimonial(testimonial.id);
                                    }
                                }}>
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );


    const renderHistorySection = () => (
        <div className="bg-white dark:bg-brand-card rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm dark:shadow-lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Donation History</h2>
            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr className="text-slate-500 dark:text-slate-400">
                            <th className="py-3 px-4 font-medium">Campaign</th>
                            <th className="py-3 px-4 font-medium">Date</th>
                            <th className="py-3 px-4 font-medium text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800/20">
                        {MOCK_DONATIONS.map((donation) => (
                            <tr key={donation.id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="py-3 px-4 text-slate-900 dark:text-white font-medium">{donation.campaign}</td>
                                <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{donation.date}</td>
                                <td className="py-3 px-4 text-right text-brand-cyan font-bold">${donation.amount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderReceiptsSection = () => (
        <div className="bg-white dark:bg-brand-card rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm dark:shadow-lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Tax Receipts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MOCK_DONATIONS.map(donation => (
                    <div key={donation.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-brand-purple/10 flex items-center justify-center text-brand-purple">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-slate-900 dark:text-white text-sm font-bold">Receipt #{donation.id.toUpperCase()}</p>
                                <p className="text-slate-500 dark:text-slate-400 text-xs">{donation.date} • ${donation.amount}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleDownloadTaxReceipt(donation.id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderMyEventsSection = () => {
        const myRegistrations = eventRegistrations.filter(r => r.userId === user.email);

        return (
            <div className="bg-white dark:bg-brand-card rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm dark:shadow-lg">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">My Registered Events</h2>
                <div className="space-y-4">
                    {myRegistrations.length === 0 ? (
                        <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700/50">
                            <Calendar className="h-10 w-10 text-slate-400 dark:text-slate-500 mx-auto mb-3 opacity-50" />
                            <p className="text-slate-500 dark:text-slate-400">You haven't registered for any events yet.</p>
                            <Link to="/events" className="mt-4 inline-block text-brand-cyan hover:underline text-sm">
                                Explore Events
                            </Link>
                        </div>
                    ) : (
                        myRegistrations.map(reg => {
                            const evt = events.find(e => e.id === reg.eventId);
                            if (!evt) return null;
                            return (
                                <div key={reg.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 transition-all">
                                    <div className="flex items-center">
                                        <div className="h-14 w-14 rounded-xl bg-brand-cyan/10 dark:bg-brand-cyan/20 flex flex-col items-center justify-center text-brand-cyan font-bold border border-brand-cyan/20 flex-shrink-0">
                                            <span className="text-xs uppercase">{new Date(evt.date).toLocaleString('default', { month: 'short' })}</span>
                                            <span className="text-xl leading-none">{evt.date.split('-')[2]}</span>
                                        </div>
                                        <div className="ml-4">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="text-slate-900 dark:text-white font-bold text-lg">{evt.title}</h4>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${reg.status === 'Pending'
                                                    ? 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-500 dark:border-amber-500/20'
                                                    : 'bg-green-100 text-green-600 border-green-200 dark:bg-green-500/10 dark:text-green-500 dark:border-green-500/20'
                                                    }`}>
                                                    {reg.status}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-3 mt-1 text-slate-500 dark:text-slate-400 text-sm">
                                                <span className="flex items-center"><Clock className="h-3 w-3 mr-1 text-slate-400" /> {evt.time}</span>
                                                <span className="flex items-center"><MapPin className="h-3 w-3 mr-1 text-slate-400" /> {evt.location}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    };

    const renderManageRegistrationsSection = () => (
        <div className="bg-white dark:bg-brand-card rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm dark:shadow-lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Manage Event Registrations</h2>
            <div className="space-y-4">
                {eventRegistrations.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">No event registrations.</p>
                ) : (
                    eventRegistrations.map(reg => {
                        const evt = events.find(e => e.id === reg.eventId);
                        return (
                            <div key={reg.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700/50">
                                <div className="mb-4 sm:mb-0">
                                    <div className="flex items-center gap-3">
                                        <h4 className="text-slate-900 dark:text-white font-bold">{reg.userName}</h4>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${reg.status === 'Pending'
                                            ? 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-500 dark:border-amber-500/20'
                                            : 'bg-green-100 text-green-600 border-green-200 dark:bg-green-500/10 dark:text-green-500 dark:border-green-500/20'
                                            }`}>
                                            {reg.status}
                                        </span>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">Event: <span className="text-brand-cyan">{evt?.title || 'Unknown Event'}</span></p>
                                    <p className="text-slate-500 text-xs mt-1">{reg.userEmail} • {reg.date}</p>
                                </div>
                                <div className="flex gap-2 items-center">
                                    {reg.status === 'Pending' && (
                                        <Button size="sm" variant="outline" onClick={() => approveRegistration(reg.id)} className="shrink-0">
                                            Approve
                                        </Button>
                                    )}
                                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0" onClick={() => {
                                        if (window.confirm("Delete this registration?")) {
                                            deleteRegistration(reg.id);
                                        }
                                    }}>
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );

    const renderTestimonialSection = () => {
        const pendingTestimonial = testimonials.find(t => t.authorEmail === user.email && t.status === 'Pending');

        if (submissionStatus === 'StorySuccess') return renderSuccessView('Story');

        return (
            <div className="bg-white dark:bg-brand-card rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm dark:shadow-lg max-w-2xl">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Share Your Story</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Your experience can inspire others to join our community.</p>

                {pendingTestimonial ? (
                    <div className="text-center p-8 border border-amber-200 dark:border-amber-500/20 rounded-xl bg-amber-50/50 dark:bg-amber-500/5 animate-in fade-in slide-in-from-bottom-2">
                        <MessageSquare className="h-10 w-10 text-amber-500 mx-auto mb-4 opacity-70" />
                        <h3 className="text-slate-900 dark:text-white font-bold mb-2">Review in Progress</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 max-w-sm mx-auto">
                            You currently have a testimonial waiting for approval. To ensure high-quality community stories, we limit submissions to one pending story at a time.
                        </p>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-500 text-xs font-bold uppercase tracking-wider">
                            Status: Pending Approval
                        </div>
                    </div>
                ) : showTestimonialForm ? (
                    <form onSubmit={handleSubmitTestimonial} className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <textarea
                            className="w-full bg-slate-50 dark:bg-slate-900 rounded-xl p-4 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-cyan focus:border-transparent min-h-[150px] leading-relaxed placeholder-slate-400 dark:placeholder-slate-500"
                            placeholder="How has Aaria's Blue Elephant impacted you? (Max 2000 characters)"
                            value={testimonialContent}
                            onChange={e => setTestimonialContent(e.target.value)}
                            maxLength={2000}
                            required
                        />
                        <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-2 px-1">
                            <span>Your story reflects our collective impact.</span>
                            <span className={testimonialContent.length >= 2000 ? 'text-red-500 font-bold' : ''}>
                                {testimonialContent.length} / 2000
                            </span>
                        </div>
                        <div className="flex gap-3">
                            <Button type="submit">Submit Story</Button>
                            <Button type="button" variant="ghost" className="text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" onClick={() => setShowTestimonialForm(false)}>Cancel</Button>
                        </div>
                    </form>
                ) : (
                    <div className="text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl hover:border-slate-300 dark:hover:border-slate-600 transition-colors bg-slate-50 dark:bg-slate-800/20">
                        <MessageSquare className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                        <h3 className="text-slate-900 dark:text-white font-medium mb-2">Write a Testimonial</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-md mx-auto">
                            Share how our playgroups or events have helped your family.
                        </p>
                        <Button variant="outline" onClick={() => setShowTestimonialForm(true)}>Start Writing</Button>
                    </div>
                )}
            </div>
        );
    };

    const renderMyVolunteeringSection = () => {
        const myApplications = volunteerApplications.filter(app => app.email === user.email);
        const pendingApp = myApplications.find(app => app.status === 'Pending');

        if (submissionStatus === 'VolunteerSuccess') return renderSuccessView('Volunteer');

        return (
            <div className="bg-white dark:bg-brand-card rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm dark:shadow-lg max-w-4xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">My Volunteer Applications</h2>
                    {!pendingApp && (
                        <Link to="/volunteer">
                            <Button size="sm" variant="outline">New Application</Button>
                        </Link>
                    )}
                </div>

                {pendingApp && (
                    <div className="mb-8 p-6 border border-brand-cyan/20 rounded-2xl bg-brand-cyan/5 text-center">
                        <Heart className="h-8 w-8 text-brand-cyan mx-auto mb-3" />
                        <h4 className="text-slate-900 dark:text-white font-bold mb-2">Application Pending</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
                            Thank you for your interest in volunteering! You currently have an active application under review. Multiple simultaneous applications are restricted to maintain efficiency.
                        </p>
                    </div>
                )}

                <div className="space-y-4">
                    {myApplications.length === 0 ? (
                        <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700/50">
                            <Heart className="h-10 w-10 text-slate-400 dark:text-slate-500 mx-auto mb-3 opacity-50" />
                            <p className="text-slate-500 dark:text-slate-400">You haven't submitted any volunteer applications yet.</p>
                            <Link to="/volunteer" className="mt-4 inline-block text-brand-cyan hover:underline text-sm">
                                Explore Volunteer Opportunities
                            </Link>
                        </div>
                    ) : (
                        myApplications.map(app => (
                            <div key={app.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 transition-all">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="text-slate-900 dark:text-white font-bold text-lg">{app.interest}</h4>
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${app.status === 'Pending'
                                            ? 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-500 dark:border-amber-500/20'
                                            : 'bg-green-100 text-green-600 border-green-200 dark:bg-green-500/10 dark:text-green-500 dark:border-green-500/20'
                                            }`}>
                                            {app.status}
                                        </span>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">Application ID: <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{app.id}</span></p>
                                </div>
                                <div className="mt-3 sm:mt-0">
                                    <p className="text-xs text-slate-500">Submitted Name: {app.name}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (activeView) {
            case 'overview': return renderStatsCards();
            case 'events': return renderEventsSection();
            case 'manage-registrations': return renderManageRegistrationsSection();
            case 'volunteers': return renderVolunteersSection();
            case 'manage-testimonials': return renderManageTestimonialsSection();

            case 'history': return renderHistorySection();
            case 'receipts': return renderReceiptsSection();
            case 'my-events': return renderMyEventsSection();
            case 'my-volunteering': return renderMyVolunteeringSection();
            case 'testimonial': return renderTestimonialSection();
            default: return renderStatsCards();
        }
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-brand-dark transition-colors duration-300">
            {/* Sidebar Navigation */}
            <div className="w-full lg:w-72 bg-white dark:bg-brand-card border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex-shrink-0 flex flex-col transition-colors duration-300">
                {/* Profile Section */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col items-center text-center transition-colors duration-300">
                    <div className="relative group mb-4">
                        <div className="h-24 w-24 rounded-full bg-brand-purple p-1 border-4 border-slate-100 dark:border-slate-800 shadow-xl transition-colors duration-300">
                            <div className="h-full w-full rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 transition-colors duration-300">
                                {user.avatar ? (
                                    <img src={user.avatar} referrerPolicy="no-referrer" alt={user.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-2xl font-bold text-slate-600 dark:text-white transition-colors duration-300">
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
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white transition-colors duration-300">{user.name}</h2>
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
                                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${isActive
                                    ? 'bg-brand-cyan/10 text-brand-cyan shadow-sm dark:bg-brand-cyan/10 dark:text-brand-cyan'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                                    }`}
                            >
                                <Icon className={`mr-3 h-5 w-5 transition-colors ${isActive ? 'text-brand-cyan' : 'text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-white'}`} />
                                {item.label}
                                {isActive && <ChevronRight className="ml-auto h-4 w-4 opacity-50" />}
                            </button>
                        );
                    })}
                </nav>

                {/* Nav Items Mobile (Horizontal) */}
                <nav className="lg:hidden flex overflow-x-auto p-4 space-x-2 no-scrollbar border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveView(item.id as ViewState)}
                                className={`flex-shrink-0 flex items-center px-4 py-2 text-sm font-medium rounded-full transition-all ${isActive
                                    ? 'bg-brand-cyan text-slate-900 bg-brand-cyan dark:text-slate-900'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
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
            <div className="flex-1 p-4 sm:p-8 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 transition-colors duration-300">
                <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors duration-300">
                            {navItems.find(i => i.id === activeView)?.label || 'Dashboard'}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm transition-colors duration-300">Manage your activities and view your reports.</p>
                    </div>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;