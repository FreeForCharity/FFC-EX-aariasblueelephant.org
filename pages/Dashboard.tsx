
import React, { useState, useEffect } from 'react';
import { 
    LayoutDashboard, 
    Calendar, 
    MessageSquare, 
    Heart, 
    Settings, 
    LogOut, 
    User, 
    Bell, 
    ChevronRight, 
    Plus, 
    Clock, 
    CheckCircle2, 
    AlertCircle,
    Sticker,
    Eye,
    Trash2,
    Edit,
    ExternalLink,
    Download,
    FileText,
    Users,
    MapPin,
    X,
    TrendingUp,
    Star,
    Camera
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import Button from '../components/Button';
import RichText from '../components/RichText';
import WheelOfFun from '../components/WheelOfFun';
import { MOCK_DONATIONS, DEFAULT_EVENT_IMAGE } from '../constants';
import { 
  Event, 
  VolunteerApplication, 
  NewsletterSubscription, 
  Testimonial as TestimonialType, 
  EventRegistration 
} from '../types';

type ViewState = 
    | 'overview' 
    | 'events' 
    | 'manage-registrations' 
    | 'volunteers' 
    | 'manage-testimonials' 
    | 'wheel' 
    | 'history' 
    | 'receipts' 
    | 'my-events' 
    | 'my-volunteering' 
    | 'testimonial';

const Dashboard: React.FC = () => {
    const { user, isBoard, isDonor, updateAvatar } = useAuth();
    const { 
        events, 
        eventRegistrations, 
        volunteerApplications, 
        testimonials,
        approveTestimonial,
        deleteTestimonial,
        addTestimonial,
        approveRegistration,
        deleteRegistration,
        approveVolunteer,
        deleteVolunteer,
        updateUserDonation,
        getUserDonation,
        updateEvent,
        deleteEvent,
        addEvent
    } = useData();
    
    const navigate = useNavigate();
    const [activeView, setActiveView] = useState<ViewState>(isBoard ? 'events' : 'overview');
    const [editingEventId, setEditingEventId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<Event>>({});
    const [isAddingEvent, setIsAddingEvent] = useState(false);
    const [showTestimonialForm, setShowTestimonialForm] = useState(false);
    const [testimonialContent, setTestimonialContent] = useState('');
    const [submissionStatus, setSubmissionStatus] = useState<'Idle' | 'StorySuccess' | 'VolunteerSuccess' | 'RegSuccess'>('Idle');
    const [filterSpecialNeeds, setFilterSpecialNeeds] = useState<boolean | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [confirmDeleteTestimonialId, setConfirmDeleteTestimonialId] = useState<string | null>(null);
    const [confirmDeleteVolunteerId, setConfirmDeleteVolunteerId] = useState<string | null>(null);
    const [appError, setAppError] = useState<string | null>(null);
    const [regSortBy, setRegSortBy] = useState<'newest' | 'upcoming_event'>('newest');
    const [editingDonationEmail, setEditingDonationEmail] = useState<string | null>(null);
    const [newDonationAmount, setNewDonationAmount] = useState<string>('');
    const [editingDurationId, setEditingDurationId] = useState<string | null>(null);
    const [newDuration, setNewDuration] = useState<string>('');


    const userRegs = eventRegistrations.filter((r: EventRegistration) => r.userId === user?.id || r.userEmail === user?.email);
    const userApps = volunteerApplications.filter((app: VolunteerApplication) => app.userId === user?.id || app.email === user?.email);
    const userTestimonials = testimonials.filter((t: TestimonialType) => t.userId === user?.id || t.authorEmail === user?.email);

    const totalImpactHours = userRegs.reduce((sum, reg) => {
        const event = events.find(e => e.id === reg.eventId);
        return sum + (event?.hours || 0);
    }, 0);
    const donationTotal = getUserDonation(user?.email || '');

    // Protection happens in middleware or AuthContext, but double check here
    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    if (!user) return null;

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateAvatar(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDownloadTaxReceipt = (id: string) => {
        alert(`Generating PDF receipt for donation ${id}... In a production environment, this would generate and download a formal 501(c)(3) tax-compliant receipt.`);
    };

    const handleExportEmails = (eventId: string, eventTitle: string) => {
        const eventRegs = eventRegistrations.filter(r => r.eventId === eventId);
        
        // Alphabetically sort the registrations by user name as requested for the registration desk check-in
        eventRegs.sort((a, b) => a.userName.localeCompare(b.userName));
        
        // Even if zero, download a blank CSV as requested for testing
        const rows = [
            ["Name", "Email", "Registration Date", "Status", "Accommodations"],
            ...eventRegs.map(r => [
                r.userName,
                r.userEmail,
                r.date,
                r.status,
                r.specialNeeds ? "Yes" : "No"
            ])
        ];

        const csvString = rows.map(e => e.join(",")).join("\n");
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `registrations_${eventTitle.replace(/\s+/g, '_').toLowerCase()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleSubmitTestimonial = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await addTestimonial({
            content: testimonialContent,
            author: user.name,
            authorEmail: user.email
        } as any);
        if (result.success) {
            setTestimonialContent('');
            setShowTestimonialForm(false);
            setSubmissionStatus('StorySuccess');
            setTimeout(() => setSubmissionStatus('Idle'), 5000);
        } else {
            setAppError(result.error || "Failed to submit story");
        }
    };

    // Nav Items Configuration
    const navItems = [
        // Default View
        { id: 'overview', label: 'Overview', icon: LayoutDashboard, role: 'all' },
        
        // Management View (Board Only)
        { id: 'events', label: 'Manage Events', icon: Calendar, role: 'board' },
        { id: 'manage-registrations', label: 'Manage Registrations', icon: Users, role: 'board' },
        { id: 'volunteers', label: 'Review Volunteers', icon: Heart, role: 'board' },
        { id: 'manage-testimonials', label: 'Manage Stories', icon: MessageSquare, role: 'board' },
        
        // User View (Standard)
        { id: 'my-events', label: 'My Events', icon: Calendar, role: 'user' },
        { id: 'my-volunteering', label: 'Volunteering', icon: Heart, role: 'user' },
        { id: 'testimonial', label: 'Share Story', icon: MessageSquare, role: 'user' },
        { id: 'history', label: 'Donations', icon: TrendingUp, role: 'donor' },
        { id: 'receipts', label: 'Tax Receipts', icon: FileText, role: 'donor_board' }, 
        
        // Always Visible (at the end)
        { id: 'wheel', label: 'Wheel of Fun', icon: Star, role: 'all' },
    ].filter(item => {
        // Special case for wheel - always show
        if (item.id === 'wheel') return true;
        
        // For Board members: only show management tools and designated donor paths
        if (isBoard) {
            // Admin only needs these, they don't need 'user' items
            return item.role === 'board' || item.role === 'donor_board' || (item.role === 'donor' && isDonor);
        }
        
        // For non-board members (regular users)
        if (item.role === 'user') return true;
        if (item.role === 'donor') return isDonor;
        if (item.role === 'donor_board') return isDonor;
        return false;
    });

    const renderSuccessView = (type: string) => (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-8 text-center animate-in zoom-in-95 duration-500">
            <div className="h-16 w-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-green-900 dark:text-green-400 mb-2">{type} Received!</h3>
            <p className="text-green-700 dark:text-green-300/70 max-w-sm mx-auto">
                Thank you for your submission. Our team will review it and get back to you shortly.
            </p>
            <Button variant="outline" className="mt-6 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-800/30" onClick={() => setSubmissionStatus('Idle')}>Dismiss</Button>
        </div>
    );

    const renderStatsCards = () => {
        if (isBoard) {
            // Management Stats for Board Members
            const totalRegistrations = eventRegistrations.length;
            const pendingApplications = volunteerApplications.filter(v => v.status === 'Pending').length;
            const pendingStories = testimonials.filter(t => t.status === 'Pending').length;

            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-brand-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan group-hover:scale-110 transition-transform">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest leading-tight">Total Registrations<br/>Across All Events</p>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalRegistrations} Signups</h3>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" className="w-full justify-between group/btn text-slate-500 hover:text-brand-cyan hover:bg-brand-cyan/5" onClick={() => setActiveView('manage-registrations')}>
                            Manage All <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                    </div>

                    <div className="bg-white dark:bg-brand-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-xl bg-brand-green/10 flex items-center justify-center text-brand-green group-hover:scale-110 transition-transform">
                                <Heart className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest leading-tight">Pending Volunteer<br/>Applications</p>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{pendingApplications} Pending</h3>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" className="w-full justify-between group/btn text-slate-500 hover:text-brand-green hover:bg-brand-green/5" onClick={() => setActiveView('volunteers')}>
                            Review Now <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                    </div>

                    <div className="bg-white dark:bg-brand-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-xl bg-brand-purple/10 flex items-center justify-center text-brand-purple group-hover:scale-110 transition-transform">
                                <MessageSquare className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest leading-tight">Pending Community<br/>Stories</p>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{pendingStories} New</h3>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" className="w-full justify-between group/btn text-slate-500 hover:text-brand-purple hover:bg-brand-purple/5" onClick={() => setActiveView('manage-testimonials')}>
                            Verify Stories <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </div>
            );
        }

        // Standard Impact Stats for Regular Users
        const userRegistrations = eventRegistrations.filter(r => r.userEmail === user.email);
        const totalImpactHours = userRegistrations.reduce((sum, reg) => {
            const evt = events.find(e => e.id === reg.eventId);
            return sum + (evt?.hours || 0);
        }, 0);
        const donationTotal = (getUserDonation as any)?.(user.email) || 0;

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-brand-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-12 w-12 rounded-xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan group-hover:scale-110 transition-transform">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest leading-tight">Time Spent with <br/>Aaria's Blue Elephant</p>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalImpactHours} Hours</h3>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full justify-between group/btn text-slate-500 hover:text-brand-cyan hover:bg-brand-cyan/5" onClick={() => setActiveView('my-events')}>
                        My Event History <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                </div>

                <div className="bg-white dark:bg-brand-card p-6 rounded-2xl border-2 border-brand-green/20 dark:border-brand-green/30 shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden">
                    {/* Decorative Background */}
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-brand-green/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                    
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-12 w-12 rounded-xl bg-brand-green/10 flex items-center justify-center text-brand-green group-hover:scale-110 transition-transform">
                            <Heart className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Donation Impact</p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white">${donationTotal.toLocaleString()}</h3>
                        </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="h-3.5 w-3.5 text-slate-400 mt-0.5" />
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed italic">
                                Note: It takes up to <span className="font-bold">2 business days</span> for the Donation Impact to be reflected after a contribution is made.
                            </p>
                        </div>
                    </div>

                    {(isDonor || isBoard) && !isBoard && (
                        <Button variant="ghost" size="sm" className="w-full justify-between group/btn text-slate-500 hover:text-brand-green hover:bg-brand-green/5 mt-4" onClick={() => setActiveView('history')}>
                            Tax Receipts <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                    )}
                </div>
            </div>
        );
    };

    const handleEditEvent = (event: Event) => {
        setEditingEventId(event.id);
        setEditFormData(event);
    };

    const handleSaveEvent = async (id: string) => {
        const result = await updateEvent(id, editFormData);
        if (result.success) {
            setEditingEventId(null);
            setEditFormData({});
        } else {
            setAppError(result.error || "Failed to update event");
        }
    };

    const handleAddEventSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await addEvent(editFormData as any);
        if (result.success) {
            setIsAddingEvent(false);
            setEditFormData({});
        } else {
            setAppError(result.error || "Failed to add event");
        }
    };

    const renderEventsSection = () => (
        <div className="bg-white dark:bg-brand-card rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm dark:shadow-lg">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Manage Events</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest leading-tight">Create, edit, and track event performance</p>
                </div>
                <div className="flex gap-3">
                    <Button 
                        size="sm" 
                        variant={isAddingEvent ? "ghost" : "primary"}
                        onClick={() => {
                            setIsAddingEvent(!isAddingEvent);
                            setEditingEventId(null);
                            setEditFormData({});
                        }}
                    >
                        {isAddingEvent ? "Cancel" : "Add New Event"}
                    </Button>
                    <Link to="/events">
                        <Button size="sm" variant="outline">View Live Site</Button>
                    </Link>
                </div>
            </div>

            {isAddingEvent && (
                <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-brand-cyan/20 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">Create New Event</h3>
                    <form onSubmit={handleAddEventSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Event Title</label>
                                <input 
                                    className="w-full bg-white dark:bg-slate-900 rounded-xl p-3 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-cyan outline-none"
                                    placeholder="e.g. Inclusive Event"
                                    required
                                    value={editFormData.title || ''}
                                    onChange={e => setEditFormData({...editFormData, title: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Date</label>
                                    <input 
                                        type="date"
                                        className="w-full bg-white dark:bg-slate-900 rounded-xl p-3 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none"
                                        required
                                        value={editFormData.date || ''}
                                        onChange={e => setEditFormData({...editFormData, date: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Time</label>
                                    <input 
                                        placeholder="e.g. 10:00 AM"
                                        className="w-full bg-white dark:bg-slate-900 rounded-xl p-3 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none"
                                        required
                                        value={editFormData.time || ''}
                                        onChange={e => setEditFormData({...editFormData, time: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Location</label>
                                <input 
                                    placeholder="e.g. Central Park"
                                    className="w-full bg-white dark:bg-slate-900 rounded-xl p-3 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none"
                                    required
                                    value={editFormData.location || ''}
                                    onChange={e => setEditFormData({...editFormData, location: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Capacity</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-white dark:bg-slate-900 rounded-xl p-3 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none"
                                        required
                                        value={editFormData.capacity || ''}
                                        onChange={e => setEditFormData({...editFormData, capacity: parseInt(e.target.value) || 0})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 ml-1 font-bold text-brand-cyan">Duration (Hours)</label>
                                    <input 
                                        type="number"
                                        step="0.5"
                                        placeholder="e.g. 1.5"
                                        className="w-full bg-white dark:bg-slate-900 rounded-xl p-3 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none"
                                        required
                                        value={editFormData.hours || ''}
                                        onChange={e => setEditFormData({...editFormData, hours: parseFloat(e.target.value) || 0})}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Description</label>
                                <textarea 
                                    className="w-full bg-white dark:bg-slate-900 rounded-xl p-3 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none min-h-[120px]"
                                    placeholder="Tell people about the event..."
                                    required
                                    value={editFormData.description || ''}
                                    onChange={e => setEditFormData({...editFormData, description: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Image URL</label>
                                <input 
                                    className="w-full bg-white dark:bg-slate-900 rounded-xl p-3 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none"
                                    placeholder="https://..."
                                    value={editFormData.image || ''}
                                    onChange={e => setEditFormData({...editFormData, image: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Type</label>
                                <select 
                                    className="w-full bg-white dark:bg-slate-900 rounded-xl p-3 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none"
                                    value={editFormData.type || 'Event'}
                                    onChange={e => setEditFormData({...editFormData, type: e.target.value as any})}
                                >
                                    <option value="Class">Class</option>
                                    <option value="Event">Event</option>
                                    <option value="Fundraiser">Fundraiser</option>
                                    <option value="Outreach">Outreach</option>
                                    <option value="Advocacy">Advocacy</option>
                                </select>
                            </div>
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                            <Button type="submit" className="px-8">Create Event</Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                {events.map((event: Event) => (
                    <div key={event.id} className="p-1 px-1 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden transition-all duration-300">
                        {editingEventId === event.id ? (
                            <div className="p-6 bg-white dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Event Title</label>
                                            <input 
                                                className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-brand-cyan"
                                                value={editFormData.title || ''}
                                                onChange={e => setEditFormData({...editFormData, title: e.target.value})}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Date</label>
                                                <input 
                                                    type="date"
                                                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none"
                                                    value={editFormData.date || ''}
                                                    onChange={e => setEditFormData({...editFormData, date: e.target.value})}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Time</label>
                                                <input 
                                                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none"
                                                    value={editFormData.time || ''}
                                                    onChange={e => setEditFormData({...editFormData, time: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Location</label>
                                            <input 
                                                className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none"
                                                value={editFormData.location || ''}
                                                onChange={e => setEditFormData({...editFormData, location: e.target.value})}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Capacity</label>
                                                <input 
                                                    type="number"
                                                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none"
                                                    value={editFormData.capacity || 0}
                                                    onChange={e => setEditFormData({...editFormData, capacity: parseInt(e.target.value) || 0})}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1 text-brand-cyan">Duration (Hours)</label>
                                                <input 
                                                    type="number"
                                                    step="0.5"
                                                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white border-2 border-brand-cyan/30 focus:border-brand-cyan outline-none"
                                                    value={editFormData.hours || 0}
                                                    onChange={e => setEditFormData({...editFormData, hours: parseFloat(e.target.value) || 0})}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Description</label>
                                            <textarea 
                                                className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none min-h-[120px]"
                                                value={editFormData.description || ''}
                                                onChange={e => setEditFormData({...editFormData, description: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Media Link (Social)</label>
                                            <input 
                                                className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none"
                                                value={editFormData.mediaLink || ''}
                                                onChange={e => setEditFormData({...editFormData, mediaLink: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <Button variant="outline" onClick={() => setEditingEventId(null)}>Cancel</Button>
                                    <Button variant="primary" onClick={() => handleSaveEvent(event.id)}>Save Changes</Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 group">
                                <div className="flex items-center gap-6">
                                    <div className="relative h-16 w-16 rounded-xl overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm">
                                        <img src={event.image || DEFAULT_EVENT_IMAGE} alt="" className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-slate-900 dark:text-white font-black text-lg leading-tight">{event.title}</h4>
                                        <div className="flex items-center gap-3 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                                            <span>{event.date}</span>
                                            <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                                            <span>{event.location}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="px-2 py-0.5 rounded-lg bg-brand-cyan/10 text-brand-cyan font-bold text-[9px] uppercase tracking-wider">{event.type}</div>
                                            <div className="px-2 py-0.5 rounded-lg bg-brand-purple/10 text-brand-purple font-bold text-[9px] uppercase tracking-wider">{event.hours || 0} Hours</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-row items-center gap-8 mt-4 sm:mt-0">
                                    <div className="text-right hidden md:block">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Registration Capacity</p>
                                        <div className="flex items-center gap-2 justify-end">
                                            <span className="text-slate-900 dark:text-white font-black text-sm">{event.registered} / {event.capacity}</span>
                                            <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-brand-cyan transition-all duration-1000" style={{ width: `${Math.min(100, (event.registered / event.capacity) * 100)}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            title="Edit Event"
                                            className="h-9 w-9 p-0 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-cyan hover:text-brand-cyan transition-all"
                                            onClick={() => handleEditEvent(event)}
                                        >
                                            <Edit className="h-4 w-4" strokeWidth={2.5} />
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            title="Download Registrations CSV"
                                            className="h-9 w-9 p-0 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-cyan hover:text-brand-cyan transition-all"
                                            onClick={() => handleExportEmails(event.id, event.title)}
                                        >
                                            <Download className="h-4 w-4" strokeWidth={2.5} />
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            title="Delete Event"
                                            className="h-9 w-9 p-0 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-red-500 hover:text-red-500 transition-all"
                                            onClick={async () => {
                                                if (window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
                                                    await deleteEvent(event.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" strokeWidth={2.5} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );


    const renderVolunteersSection = () => (
        <div className="bg-white dark:bg-brand-card rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm dark:shadow-lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Review Volunteer Applications</h2>
            <div className="space-y-4">
                {volunteerApplications.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 text-sm italic">No pending applications at this time.</p>
                ) : (
                    volunteerApplications.map((app: VolunteerApplication) => (
                        <div key={app.id} className="p-5 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h4 className="text-slate-900 dark:text-white font-bold text-lg">{app.name}</h4>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border ${app.status === 'Pending'
                                            ? 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-500'
                                            : 'bg-green-100 text-green-600 border-green-200 dark:bg-green-500/10 dark:text-green-500'
                                            }`}>
                                            {app.status}
                                        </span>
                                    </div>
                                    <p className="text-brand-cyan text-sm font-medium mt-0.5 uppercase tracking-tighter italic">{app.interest}</p>
                                    <p className="text-slate-500 text-xs mt-1">{app.email} • {app.phone}</p>
                                </div>
                                <div className="flex gap-2">
                                    {app.status === 'Pending' && (
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            onClick={async () => {
                                                const res = await approveVolunteer(app.id);
                                                if (!res.success) setAppError(res.error || "Approval failed");
                                            }}
                                        >
                                            Approve
                                        </Button>
                                    )}
                                    {confirmDeleteVolunteerId === app.id ? (
                                        <div className="flex items-center gap-1 animate-in slide-in-from-right-2">
                                            <Button
                                                size="sm"
                                                variant="primary"
                                                className="text-xs"
                                                onClick={async () => {
                                                    const res = await deleteVolunteer(app.id);
                                                    if (res.success) setConfirmDeleteVolunteerId(null);
                                                    else setAppError(res.error || "Deletion failed");
                                                }}
                                            >Confirm</Button>
                                            <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteVolunteerId(null)}><X className="h-4 w-4" /></Button>
                                        </div>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                                            onClick={() => setConfirmDeleteVolunteerId(app.id)}
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                <p className="text-slate-600 dark:text-slate-300 text-xs italic leading-relaxed">"{app.experience}"</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    const renderManageTestimonialsSection = () => (
        <div className="bg-white dark:bg-brand-card rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm dark:shadow-lg">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Review Stories & Testimonials</h2>
            <div className="grid grid-cols-1 gap-6">
                {testimonials.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-10 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700/50">No stories submitted yet.</p>
                ) : (
                    userTestimonials.map((testimonial: TestimonialType) => (
                        <div key={testimonial.id} className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 transition-all flex flex-col md:flex-row gap-6 group">
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-brand-cyan/10 flex items-center justify-center text-brand-cyan font-bold border border-brand-cyan/20">
                                            {testimonial.author.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="text-slate-900 dark:text-white font-bold">{testimonial.author}</h4>
                                            <p className="text-slate-500 text-xs">{testimonial.authorEmail} • {testimonial.date}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest border shadow-sm ${testimonial.status === 'Pending'
                                        ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-500 dark:border-amber-500/20'
                                        : 'bg-green-50 text-green-600 border-green-200 dark:bg-green-500/10 dark:text-green-500 dark:border-green-500/20'
                                        }`}>
                                        {testimonial.status}
                                    </span>
                                </div>
                                <div className="p-4 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-sm leading-relaxed text-slate-700 dark:text-slate-300 transition-colors">
                                    <RichText content={testimonial.content} className="max-h-[300px] overflow-y-auto" />
                                </div>
                            </div>
                            <div className="flex md:flex-col gap-2 justify-end min-w-[120px]">
                                {testimonial.status === 'Pending' && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        className="w-full bg-brand-cyan hover:bg-brand-cyan-dark text-slate-900 shadow-md"
                                        onClick={async () => {
                                            const result = await approveTestimonial(testimonial.id);
                                            if (!result.success) setAppError(result.error || "Failed to approve testimonial");
                                        }}
                                    >
                                        Approve
                                    </Button>
                                )}
                                {confirmDeleteTestimonialId === testimonial.id ? (
                                    <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 w-full">
                                        <Button
                                            type="button"
                                            size="sm"
                                            className="bg-red-600 hover:bg-red-700 text-white text-xs px-3"
                                            onClick={async () => {
                                                const result = await deleteTestimonial(testimonial.id);
                                                if (result.success) {
                                                    setConfirmDeleteTestimonialId(null);
                                                } else {
                                                    setAppError(result.error || "Failed to delete testimonial");
                                                    setConfirmDeleteTestimonialId(null);
                                                }
                                            }}
                                        >
                                            Confirm
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className="text-slate-500 text-xs px-2"
                                            onClick={() => setConfirmDeleteTestimonialId(null)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                                        onClick={() => setConfirmDeleteTestimonialId(testimonial.id)}
                                    >
                                        Delete
                                    </Button>
                                )}
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
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="min-w-full text-left text-sm whitespace-nowrap">
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
                        userRegs.map((reg: EventRegistration) => {
                            const evt = events.find((e: Event) => e.id === reg.eventId);
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

    const renderManageRegistrationsSection = () => {
        const sortedRegistrations = [...eventRegistrations]
            .filter(r => filterSpecialNeeds === null ? true : !!r.specialNeeds === filterSpecialNeeds)
            .sort((a, b) => {
                if (regSortBy === 'upcoming_event') {
                    const evtA = events.find(e => e.id === a.eventId);
                    const evtB = events.find(e => e.id === b.eventId);
                    if (!evtA || !evtB) return 0;
                    return new Date(evtA.date).getTime() - new Date(evtB.date).getTime();
                }
                // Default: newest signups first
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            });

        const filteredRegistrations = sortedRegistrations;

        return (
            <div className="bg-white dark:bg-brand-card rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm dark:shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Manage Event Registrations</h2>
                    <div className="flex flex-wrap gap-2">
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-fit">
                            <button onClick={() => setRegSortBy('newest')} className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-colors ${regSortBy === 'newest' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500'}`}>Newest</button>
                            <button onClick={() => setRegSortBy('upcoming_event')} className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-colors ${regSortBy === 'upcoming_event' ? 'bg-white dark:bg-slate-600 shadow-sm text-brand-cyan dark:text-brand-cyan' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500'}`}>By Event</button>
                        </div>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-fit">
                            <button onClick={() => setFilterSpecialNeeds(null)} className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-colors ${filterSpecialNeeds === null ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500'}`}>All</button>
                            <button onClick={() => setFilterSpecialNeeds(true)} className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-colors ${filterSpecialNeeds === true ? 'bg-white dark:bg-slate-600 shadow-sm text-brand-purple dark:text-brand-purple' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500'}`}>Accommodations</button>
                            <button onClick={() => setFilterSpecialNeeds(false)} className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-colors ${filterSpecialNeeds === false ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500'}`}>Standard</button>
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    {filteredRegistrations.length === 0 ? (
                        <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">No event registrations found.</p>
                    ) : (
                        filteredRegistrations.map(reg => {
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
                                        {reg.specialNeeds && (
                                            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-brand-purple/10 text-brand-purple dark:text-brand-purple text-[10px] font-bold uppercase tracking-wider">
                                                <Heart className="h-3 w-3" /> Special Accommodations Requested
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-4 items-center justify-end w-full sm:w-auto">
                                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-700 pb-4 sm:pb-0 sm:pr-4">
                                            {editingDonationEmail === reg.userEmail ? (
                                                <div className="flex items-center gap-2 animate-in zoom-in-95 duration-200 w-full sm:w-auto justify-center sm:justify-start">
                                                    <div className="relative flex-1 sm:flex-none">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                                                        <input 
                                                            type="number"
                                                            className="w-full sm:w-24 pl-6 pr-2 py-1.5 bg-white dark:bg-slate-900 border border-brand-cyan rounded-lg text-xs font-bold focus:ring-2 focus:ring-brand-cyan/20 outline-none"
                                                            value={newDonationAmount}
                                                            onChange={(e) => setNewDonationAmount(e.target.value)}
                                                            autoFocus
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                    <Button 
                                                        size="sm" 
                                                        className="h-8 px-3 bg-brand-cyan text-slate-900 text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                                                        onClick={() => {
                                                            updateUserDonation(reg.userEmail, parseFloat(newDonationAmount) || 0);
                                                            setEditingDonationEmail(null);
                                                            setNewDonationAmount('');
                                                        }}
                                                    >
                                                        Save
                                                    </Button>
                                                    <button 
                                                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                                        onClick={() => setEditingDonationEmail(null)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto">
                                                    <div className="text-left sm:text-right">
                                                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">Total Contributed</p>
                                                        <p className="text-sm font-black text-brand-green">${getUserDonation(reg.userEmail).toLocaleString()}</p>
                                                    </div>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="h-8 text-[10px] font-black uppercase tracking-widest border-slate-200 dark:border-slate-700 hover:border-brand-cyan hover:text-brand-cyan px-4"
                                                        onClick={() => {
                                                            setEditingDonationEmail(reg.userEmail);
                                                            setNewDonationAmount(getUserDonation(reg.userEmail).toString());
                                                        }}
                                                    >
                                                        Update Donation
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        {reg.status === 'Pending' && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={async () => {
                                                    const result = await approveRegistration(reg.id);
                                                    if (!result.success) setAppError(result.error || "Failed to approve registration");
                                                }}
                                                className="shrink-0 h-8 text-[10px] font-black uppercase tracking-widest"
                                            >
                                                Approve
                                            </Button>
                                        )}

                                        {confirmDeleteId === reg.id ? (
                                            <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest h-8 px-3"
                                                    onClick={async () => {
                                                        const result = await deleteRegistration(reg.id);
                                                        if (result.success) {
                                                            setConfirmDeleteId(null);
                                                        } else {
                                                            setAppError(result.error || "Failed to delete registration");
                                                            setConfirmDeleteId(null);
                                                        }
                                                    }}
                                                >
                                                    Confirm
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-slate-500 text-xs px-2 h-8"
                                                    onClick={() => setConfirmDeleteId(null)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0 h-8 text-[10px] font-black uppercase tracking-widest"
                                                onClick={() => setConfirmDeleteId(reg.id)}
                                            >
                                                Delete
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    };

    const renderTestimonialSection = () => {
        const pendingTestimonial = testimonials.find(t => t.authorEmail === user.email && t.status === 'Pending');

        if (submissionStatus === 'StorySuccess') return renderSuccessView('Story');

        return (
            <div className="bg-white dark:bg-brand-card rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm dark:shadow-lg max-w-2xl">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Share Your Story</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm leading-relaxed">
                    Your perspective and experiences play a vital role in inspiring others to join our journey. We highly encourage including <strong>social media links (YouTube, Instagram, TikTok)</strong> or images that capture your story, helping us showcase the authentic impact of our community.
                </p>

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
                            <Button type="submit" variant="primary">Submit Story</Button>
                            <Button type="button" variant="ghost" onClick={() => setShowTestimonialForm(false)}>Cancel</Button>
                        </div>
                    </form>
                ) : (
                    <div className="text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl hover:border-slate-300 dark:hover:border-slate-600 transition-colors bg-slate-50 dark:bg-slate-800/20">
                        <MessageSquare className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                        <h3 className="text-slate-900 dark:text-white font-medium mb-2">Write a Testimonial</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-md mx-auto">
                            Share how our events or events have helped your family.
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

    const renderWheelSection = () => (
        <div className="flex justify-center py-8">
            <WheelOfFun />
        </div>
    );


    const renderContent = () => {
        switch (activeView) {
            case 'overview': return renderStatsCards();
            case 'events': return renderEventsSection();
            case 'manage-registrations': return renderManageRegistrationsSection();
            case 'volunteers': return renderVolunteersSection();
            case 'manage-testimonials': return renderManageTestimonialsSection();
            case 'wheel': return renderWheelSection();

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
                            <div className="h-full w-full rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 transition-colors duration-300 relative">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="object-cover" />
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
                <nav className="flex-1 p-4 space-y-1 hidden lg:block overflow-y-auto uppercase tracking-tighter font-bold">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeView === item.id;
                        return (
                            <button
                                type="button"
                                key={item.id}
                                onClick={() => setActiveView(item.id as ViewState)}
                                className={`w-full flex items-center px-4 py-3 text-xs font-bold rounded-lg transition-all duration-200 group ${isActive
                                    ? 'bg-brand-cyan/10 text-brand-cyan shadow-sm dark:bg-brand-cyan/10 dark:text-brand-cyan'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                                    }`}
                            >
                                <Icon className={`mr-3 h-4 w-4 transition-colors ${isActive ? 'text-brand-cyan' : 'text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-white'}`} />
                                {item.label}
                                {isActive && <ChevronRight className="ml-auto h-3 w-3 opacity-50" />}
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
                                type="button"
                                key={item.id}
                                onClick={() => setActiveView(item.id as ViewState)}
                                className={`flex-shrink-0 flex items-center px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${isActive
                                    ? 'bg-brand-cyan text-slate-900 bg-brand-cyan dark:text-slate-900'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                    }`}
                            >
                                <Icon className="mr-2 h-3 w-3" />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-4 sm:p-8 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 transition-colors duration-300">
                <div className="max-w-5xl mx-auto animate-in fade-in duration-500">

                    {/* Persistent Error Banner */}
                    {appError && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-4 duration-300">
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-red-900 dark:text-red-300">Action Failed</h3>
                                <p className="text-xs text-red-700 dark:text-red-400 mt-1 font-mono break-all">{appError}</p>
                                <p className="text-[10px] text-red-500 mt-2">Please share the message above with support if this continues.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAppError(null)}
                                className="text-red-400 hover:text-red-600 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    )}

                    <div className="mb-2"></div>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
