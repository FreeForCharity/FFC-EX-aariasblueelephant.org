
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
    Camera,
    Play,
    Youtube, 
    Image as ImageIcon, 
    Instagram, 
    Facebook, 
    Send, 
    Share, 
    Link as LinkIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import Button from '../components/Button';
import RichText, { extractMedia } from '../components/RichText';
import WheelOfFun from '../components/WheelOfFun';
import { MOCK_DONATIONS, DEFAULT_EVENT_IMAGE } from '../constants';
import ResilientImage from '../components/ResilientImage';

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
        deleteVolunteerApplication,
        updateUserDonation,
        getUserDonation,
        updateEvent,
        deleteEvent,
        addEvent,
        updateTestimonial
    } = useData();
    
    const navigate = useNavigate();
    const [activeView, setActiveView] = useState<ViewState>(isBoard ? 'events' : 'overview');
    const [editingEventId, setEditingEventId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<Event>>({});
    const [isAddingEvent, setIsAddingEvent] = useState(false);
    const [showTestimonialForm, setShowTestimonialForm] = useState(false);
    const [testimonialContent, setTestimonialContent] = useState('');
    const [submissionStatus, setSubmissionStatus] = useState<'Idle' | 'StorySuccess' | 'VolunteerSuccess' | 'RegSuccess' | 'Submitting' | 'Error'>('Idle');
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
    const [editingTestimonialId, setEditingTestimonialId] = useState<string | null>(null);
    const [testimonialEditForm, setTestimonialEditForm] = useState<Partial<TestimonialType>>({});
    
    // Testimonial Form State (Sync with About.tsx)
    const [newStory, setNewStory] = useState({
        author: user?.name || '',
        role: '',
        content: '',
        rating: 5,
        avatar: user?.avatar || '',
        media: ''
    });

    // Sync author and avatar when user is loaded
    useEffect(() => {
        if (user) {
            setNewStory(prev => ({
                ...prev,
                author: prev.author || user.name,
                avatar: user.avatar || prev.avatar || ''
            }));
        }
    }, [user]);

    const userRegs = eventRegistrations.filter((r: EventRegistration) => r.userId === user?.id || r.userEmail === user?.email);
    const userApps = volunteerApplications.filter((app: VolunteerApplication) => app.userId === user?.id || app.email === user?.email);
    const userTestimonials = testimonials.filter((t: TestimonialType) => t.userId === user?.id || t.authorEmail === user?.email);

    const totalImpactHours = userRegs.reduce((sum, reg) => {
        const event = events.find(e => e.id === reg.eventId);
        return sum + (event?.hours || 0);
    }, 0);
    const donationTotal = getUserDonation(user?.email || '');

    // ProtectedRoute already handles the redirect to /login if user is null.
    if (!user) return null;

    const compressImage = (base64: string, maxWidth = 800, quality = 0.6): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxWidth) {
                        width *= maxWidth / height;
                        height = maxWidth;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
        });
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const compressed = await compressImage(reader.result as string, 400, 0.7);
                updateAvatar(compressed);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEventImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const compressed = await compressImage(reader.result as string, 1000, 0.6);
                setEditFormData({ ...editFormData, image: compressed });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleTestimonialAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const compressed = await compressImage(reader.result as string, 400, 0.7);
                setTestimonialEditForm({ ...testimonialEditForm, avatar: compressed });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleNewStoryImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const compressed = await compressImage(reader.result as string, 800, 0.6);
                setNewStory({ ...newStory, media: compressed });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDownloadTaxReceipt = (id: string) => {
        alert(`Generating PDF receipt for donation ${id}... In a production environment, this would generate and download a formal 501(c)(3) tax-compliant receipt.`);
    };

    const handleEditTestimonial = (testimonial: TestimonialType) => {
        setEditingTestimonialId(testimonial.id);
        setTestimonialEditForm(testimonial);
    };

    const handleSaveTestimonial = async (id: string) => {
        // Prepare metadata for update, matching the DB column names if necessary
        const metadata: any = {
            author: testimonialEditForm.author,
            role: testimonialEditForm.role,
            content: testimonialEditForm.content,
            avatar: testimonialEditForm.avatar,
            rating: testimonialEditForm.rating,
            rank: testimonialEditForm.rank,
            author_email: testimonialEditForm.authorEmail, // Ensure sync between local camelCase and DB snake_case
            media: testimonialEditForm.media
        };

        const result = await updateTestimonial(id, metadata);
        if (result.success) {
            setEditingTestimonialId(null);
        } else {
            setAppError(result.error || "Failed to update testimonial");
        }
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

        const csvString = rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
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

    const handleExportAllRegistrations = () => {
        // Sort registrations by date (newest first)
        const allRegs = [...eventRegistrations].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        const rows = [
            ["Event", "Name", "Email", "Registration Date", "Status", "Accommodations"],
            ...allRegs.map(r => {
                const eventTitle = events.find(e => e.id === r.eventId)?.title || 'Unknown Event';
                return [
                    eventTitle,
                    r.userName,
                    r.userEmail,
                    r.date,
                    r.status,
                    r.specialNeeds ? "Yes" : "No"
                ];
            })
        ];

        const csvString = rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `all_registrations_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleSubmitTestimonial = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSubmissionStatus('Submitting');
        
        const result = await addTestimonial({
            author: newStory.author,
            role: newStory.role || 'Community Member',
            content: newStory.content,
            avatar: newStory.avatar,
            media: newStory.media,
            rating: newStory.rating,
            authorEmail: user.email,
            userId: user.id
        });

        if (result.success) {
            setSubmissionStatus('StorySuccess');
            setNewStory({ 
                author: user.name, 
                role: '', 
                content: '', 
                rating: 5, 
                avatar: user.avatar || '',
                media: ''
            });
            setTimeout(() => {
                setShowTestimonialForm(false);
                setSubmissionStatus('Idle');
            }, 3000);
        } else {
            setAppError(result.error || "Failed to submit story");
            setSubmissionStatus('Error');
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
        { id: 'receipts', label: 'Tax Receipts', icon: FileText, role: 'donor' }, 
        
        // Always Visible (at the end)
        { id: 'wheel', label: 'Wheel of Fun', icon: Star, role: 'all' },
    ].filter(item => {
        // Special case for wheel - always show
        if (item.id === 'wheel') return true;
        
        // For Board members: only show management tools and designated donor paths
        // For Board members: show management tools AND global views (Overview, Wheel, etc.)
        if (isBoard) {
            return item.role === 'board' || item.role === 'all';
        }
        
        // For non-board members (regular users/members/donors)
        if (item.role === 'user' || item.role === 'all') return true; 
        if (item.role === 'donor') return isDonor;
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
            const pendingRegistrations = eventRegistrations.filter(r => r.status === 'Pending').length;

            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                        <div className="flex gap-2">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="flex-1 justify-between group/btn text-slate-500 hover:text-brand-cyan hover:bg-brand-cyan/5" 
                                onClick={() => setActiveView('manage-registrations')}
                            >
                                Manage All <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="px-3 text-slate-500 hover:text-brand-cyan hover:bg-brand-cyan/5"
                                onClick={handleExportAllRegistrations}
                                title="Download All Registrations CSV"
                            >
                                <Download className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-brand-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                                <Clock className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest leading-tight">Pending Event<br/>Registrations</p>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{pendingRegistrations} Pending</h3>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" className="w-full justify-between group/btn text-slate-500 hover:text-amber-500 hover:bg-amber-500/5" onClick={() => setActiveView('manage-registrations')}>
                            Review Now <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
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
                            setEditFormData({ hours: 1 });
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
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Time (with AM/PM)</label>
                                    <input 
                                        placeholder="e.g. 10:30 AM"
                                        className="w-full bg-white dark:bg-slate-900 rounded-xl p-3 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-brand-cyan"
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
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Already Registered</label>
                                    <input 
                                        type="number"
                                        className="w-full bg-white dark:bg-slate-900 rounded-xl p-3 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none"
                                        placeholder="0"
                                        value={editFormData.registered || 0}
                                        onChange={e => setEditFormData({...editFormData, registered: parseInt(e.target.value) || 0})}
                                    />
                                </div>
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
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 ml-1 font-bold text-brand-cyan">Duration (Hours)</label>
                                    <input 
                                        type="number"
                                        step="0.5"
                                        placeholder="1.0"
                                        className="w-full bg-white dark:bg-slate-900 rounded-xl p-3 text-sm text-slate-900 dark:text-white border-2 border-brand-cyan/20 focus:border-brand-cyan outline-none"
                                        required
                                        value={editFormData.hours || 1}
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
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Event Image</label>
                                <div className="space-y-2">
                                    <input 
                                        type="file"
                                        accept="image/*"
                                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-brand-cyan/10 file:text-brand-cyan hover:file:bg-brand-cyan/20 cursor-pointer"
                                        onChange={handleEventImageChange}
                                    />
                                    <div className="flex items-center gap-3">
                                        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OR</span>
                                        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                                    </div>
                                    <input 
                                        className="w-full bg-white dark:bg-slate-900 rounded-xl p-3 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none"
                                        placeholder="Paste Image URL instead..."
                                        value={editFormData.image || ''}
                                        onChange={e => setEditFormData({...editFormData, image: e.target.value})}
                                    />
                                </div>
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
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Time (AM/PM)</label>
                                                <input 
                                                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-brand-cyan"
                                                    placeholder="10:00 AM"
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
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Registered</label>
                                                <input 
                                                    type="number"
                                                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none"
                                                    value={editFormData.registered || 0}
                                                    onChange={e => setEditFormData({...editFormData, registered: parseInt(e.target.value) || 0})}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Capacity</label>
                                                <input 
                                                    type="number"
                                                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none"
                                                    value={editFormData.capacity || 0}
                                                    onChange={e => setEditFormData({...editFormData, capacity: parseInt(e.target.value) || 0})}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
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
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Event Image</label>
                                            <div className="space-y-4">
                                                <input 
                                                    type="file"
                                                    accept="image/*"
                                                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-brand-cyan/10 file:text-brand-cyan hover:file:bg-brand-cyan/20 cursor-pointer"
                                                    onChange={handleEventImageChange}
                                                />
                                                <div className="flex items-center gap-3">
                                                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OR</span>
                                                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                                                </div>
                                                <input 
                                                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none"
                                                    placeholder="Paste Image URL..."
                                                    value={editFormData.image || ''}
                                                    onChange={e => setEditFormData({...editFormData, image: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        <div className="pt-2">
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Social Media Link</label>
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
                                        <ResilientImage 
                                            id={event.id}
                                            table="events"
                                            column="image"
                                            alt={event.title}
                                            className="h-full w-full"
                                            fallbackImage={DEFAULT_EVENT_IMAGE}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-slate-900 dark:text-white font-black text-lg leading-tight">{event.title}</h4>
                                        <div className="flex items-center gap-3 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                                            <span>{event.date}</span>
                                            <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                                            <span className="text-brand-purple">{event.time}</span>
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
                                        <button 
                                            title="Edit Event"
                                            className="h-9 w-9 p-0 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-brand-cyan hover:text-brand-cyan transition-all"
                                            onClick={() => handleEditEvent(event)}
                                        >
                                            <Edit className="h-4 w-4" strokeWidth={2.5} />
                                        </button>
                                        <button 
                                            title="Download Registrations CSV"
                                            className="h-9 w-9 p-0 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-brand-cyan hover:text-brand-cyan transition-all"
                                            onClick={() => handleExportEmails(event.id, event.title)}
                                        >
                                            <Download className="h-4 w-4" strokeWidth={2.5} />
                                        </button>
                                        <button 
                                            title="Delete Event"
                                            className="h-9 w-9 p-0 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-red-500 hover:text-red-500 transition-all"
                                            onClick={async () => {
                                                if (window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
                                                    await deleteEvent(event.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" strokeWidth={2.5} />
                                        </button>
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
                                                    const res = await deleteVolunteerApplication(app.id);
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
                    testimonials.map((testimonial: TestimonialType) => (
                        <div key={testimonial.id} className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 transition-all flex flex-col gap-6 group">
                            {editingTestimonialId === testimonial.id ? (
                                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="md:col-span-1 space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Author Image</label>
                                                <div className="space-y-2">
                                                    <div className="h-20 w-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                                                        <img src={testimonialEditForm.avatar || ''} alt="" className="h-full w-full object-cover" />
                                                    </div>
                                                    <input 
                                                        type="file"
                                                        accept="image/*"
                                                        className="text-[10px] w-full text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:bg-slate-200 dark:file:bg-slate-700 cursor-pointer"
                                                        onChange={handleTestimonialAvatarChange}
                                                    />
                                                    <input 
                                                        className="w-full bg-white dark:bg-slate-900 rounded-lg p-2 text-xs border border-slate-200 dark:border-slate-700 outline-none"
                                                        placeholder="Or paste URL..."
                                                        value={testimonialEditForm.avatar || ''}
                                                        onChange={e => setTestimonialEditForm({...testimonialEditForm, avatar: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Name</label>
                                                    <input 
                                                        className="w-full bg-white dark:bg-slate-900 rounded-lg p-2 text-sm border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-brand-cyan"
                                                        value={testimonialEditForm.author || ''}
                                                        onChange={e => setTestimonialEditForm({...testimonialEditForm, author: e.target.value})}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Role</label>
                                                    <input 
                                                        className="w-full bg-white dark:bg-slate-900 rounded-lg p-2 text-sm border border-slate-200 dark:border-slate-700 outline-none"
                                                        value={testimonialEditForm.role || ''}
                                                        onChange={e => setTestimonialEditForm({...testimonialEditForm, role: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Rating (1-5)</label>
                                                    <select 
                                                        className="w-full bg-white dark:bg-slate-900 rounded-lg p-2 text-sm border border-slate-200 dark:border-slate-700 outline-none"
                                                        value={testimonialEditForm.rating || 5}
                                                        onChange={e => setTestimonialEditForm({...testimonialEditForm, rating: parseInt(e.target.value)})}
                                                    >
                                                        {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Stars</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Priority Rank (Lower = First)</label>
                                                    <input 
                                                        type="number"
                                                        className="w-full bg-white dark:bg-slate-900 rounded-lg p-2 text-sm border border-slate-200 dark:border-slate-700 outline-none"
                                                        placeholder="e.g. 1"
                                                        value={testimonialEditForm.rank || ''}
                                                        onChange={e => setTestimonialEditForm({...testimonialEditForm, rank: parseInt(e.target.value) || 0})}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Media Link (Social or Image URL)</label>
                                                    <input 
                                                        type="text"
                                                        className="w-full bg-white dark:bg-slate-900 rounded-lg p-2 text-sm border border-slate-200 dark:border-slate-700 outline-none"
                                                        placeholder="https://instagram.com/p/..."
                                                        value={testimonialEditForm.media || ''}
                                                        onChange={e => setTestimonialEditForm({...testimonialEditForm, media: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Testimonial Content</label>
                                                <textarea 
                                                    className="w-full bg-white dark:bg-slate-900 rounded-lg p-2 text-sm border border-slate-200 dark:border-slate-700 outline-none min-h-[100px]"
                                                    value={testimonialEditForm.content || ''}
                                                    onChange={e => setTestimonialEditForm({...testimonialEditForm, content: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <Button variant="ghost" size="sm" onClick={() => setEditingTestimonialId(null)}>Cancel</Button>
                                        <Button variant="primary" size="sm" onClick={() => handleSaveTestimonial(testimonial.id)}>Save Testimonial</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col md:flex-row gap-6 w-full">
                                    {(() => {
                                        const media = testimonial.media ? extractMedia(testimonial.media) : (extractMedia(testimonial.content) || (testimonial.avatar ? extractMedia(testimonial.avatar) : null));
                                        const previewUrl = media?.thumbnail || (testimonial.media && !testimonial.media.startsWith('http') ? testimonial.media : testimonial.avatar);
                                        
                                        if (!previewUrl) return null;
                                        
                                        return (
                                            <div className="w-full md:w-32 lg:w-48 aspect-video md:aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/50 flex-shrink-0 relative group">
                                                <ResilientImage 
                                                    id={testimonial.id}
                                                    table="testimonials"
                                                    column="media"
                                                    alt="Story Media"
                                                    className="h-full w-full"
                                                />
                                                {media?.type && media.type !== 'image' && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                        <div className="p-2 rounded-full bg-white/90 shadow-lg text-slate-900">
                                                            <Play className="h-4 w-4 fill-current" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-brand-cyan/10 flex items-center justify-center text-brand-cyan font-bold border border-brand-cyan/20 overflow-hidden">
                                                    {testimonial.avatar ? (
                                                        <img src={testimonial.avatar} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        testimonial.author.charAt(0)
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-slate-900 dark:text-white font-bold">{testimonial.author}</h4>
                                                        {testimonial.rating && (
                                                            <div className="flex gap-0.5 ml-1">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star key={i} className={`h-3 w-3 ${i < (testimonial.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'}`} />
                                                                ))}
                                                            </div>
                                                        )}
                                                        {testimonial.rank !== undefined && (
                                                            <span className="text-[9px] font-black bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 uppercase tracking-tighter">Rank: {testimonial.rank}</span>
                                                        )}
                                                    </div>
                                                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">{testimonial.authorEmail || 'No Email'} • {testimonial.date} • {testimonial.role}</p>
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
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-cyan hover:text-brand-cyan"
                                            onClick={() => handleEditTestimonial(testimonial)}
                                        >
                                            Edit
                                        </Button>
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
                            )}
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
                    <form onSubmit={handleSubmitTestimonial} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 px-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Your Name</label>
                                <input 
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan transition-all text-sm text-slate-900 dark:text-white"
                                    placeholder="e.g. Jane Doe"
                                    value={newStory.author}
                                    onChange={e => setNewStory({...newStory, author: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Your Role</label>
                                <input 
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan transition-all text-sm text-slate-900 dark:text-white"
                                    placeholder="e.g. Parent, Donor"
                                    value={newStory.role}
                                    onChange={e => setNewStory({...newStory, role: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Your Story</label>
                            <textarea 
                                required
                                rows={4}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan transition-all text-sm resize-none text-slate-900 dark:text-white"
                                placeholder="Tell us about your experience..."
                                value={newStory.content}
                                onChange={e => setNewStory({...newStory, content: e.target.value})}
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Add a Photo / Media Link <span className="opacity-50 font-normal ml-1">(Optional)</span></label>
                            
                            <div className="space-y-4 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700 ring-4 ring-slate-50 dark:ring-slate-900/50">
                                {/* 1. Identity Preview */}
                                <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-brand-cyan/20 ring-2 ring-white">
                                        <img 
                                            src={newStory.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(newStory.author || 'U')}&background=0EA5E9&color=fff`} 
                                            alt="Identity" 
                                            className="h-full w-full object-cover" 
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Your Identity</p>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{newStory.author || 'Anonymous'}</h4>
                                    </div>
                                    {user?.avatar && (
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-cyan/5 dark:bg-brand-cyan/10 rounded-full border border-brand-cyan/20">
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse"></div>
                                            <span className="text-[8px] font-black text-brand-cyan uppercase tracking-widest leading-none">Verified Identity</span>
                                        </div>
                                    )}
                                </div>

                                {/* 2. Media Upload / URL Paste */}
                                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-brand-cyan/50 transition-all group">
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="relative group/file">
                                            <input 
                                                type="file" 
                                                id="dashboard-story-image"
                                                accept="image/*"
                                                onChange={handleNewStoryImageChange}
                                                className="hidden"
                                            />
                                            <label 
                                                htmlFor="dashboard-story-image"
                                                className="flex flex-col items-center justify-center h-24 w-24 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-brand-cyan/5 dark:hover:bg-brand-cyan/10 transition-all relative overflow-hidden"
                                            >
                                                {newStory.media && !newStory.media.startsWith('http') ? (
                                                    <>
                                                        <img src={newStory.media} alt="Preview" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/file:opacity-100 transition-opacity">
                                                            <ImageIcon className="h-6 w-6 text-white" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1.5 p-2 text-center text-slate-400 group-hover:text-brand-cyan transition-colors">
                                                        <ImageIcon className="h-6 w-6" />
                                                        <span className="text-[9px] font-bold leading-tight uppercase tracking-wider">From Computer</span>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                        
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                                                <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase text-center">OR PASTE URL</span>
                                                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                                            </div>
                                            <input 
                                                type="url"
                                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan transition-all text-sm text-slate-900 dark:text-white"
                                                placeholder="Paste Image/Media URL..."
                                                value={newStory.media && newStory.media.startsWith('http') ? newStory.media : ''}
                                                onChange={e => setNewStory({...newStory, media: e.target.value})}
                                            />
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic leading-tight text-center sm:text-left">Paste a link to any image or video thumbnail</p>
                                        </div>
                                    </div>

                                    {/* Media Preview Box */}
                                    {newStory.media && (
                                        <div className="mt-3 p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl animate-in zoom-in-95 duration-300">
                                            <div className="flex items-center gap-3">
                                                {extractMedia(newStory.media) ? (
                                                    <div className="h-10 w-10 rounded bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-500">
                                                        <Youtube className="h-5 w-5" />
                                                    </div>
                                                ) : (
                                                    <div className="h-10 w-10 rounded bg-sky-100 dark:bg-sky-500/20 flex items-center justify-center text-sky-500 overflow-hidden">
                                                        <img src={newStory.media} className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                                        <ImageIcon className="h-5 w-5" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Story Media Attached</p>
                                                    <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate mt-0.5">{newStory.media.startsWith('data:') ? 'Image from computer' : newStory.media}</p>
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={() => setNewStory({...newStory, media: ''})}
                                                    className="p-1 px-2 text-[10px] font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors uppercase tracking-widest"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 p-4 bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl border border-amber-500/20">
                            <label className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest block text-center">Your Rating</label>
                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setNewStory({...newStory, rating: star})}
                                        className="transition-transform active:scale-90 hover:scale-110"
                                    >
                                        <Star 
                                            className={`h-8 w-8 transition-colors ${
                                                star <= newStory.rating 
                                                    ? 'fill-amber-400 text-amber-400' 
                                                    : 'text-slate-200 dark:text-slate-700'
                                            }`} 
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button 
                                type="submit" 
                                variant="primary" 
                                className="flex-1 h-12 text-sm font-black uppercase tracking-widest"
                                disabled={submissionStatus === 'Submitting'}
                            >
                                {submissionStatus === 'Submitting' ? 'Sending...' : (
                                    <span className="flex items-center justify-center gap-2">
                                        Submit Story <Send className="h-4 w-4" />
                                    </span>
                                )}
                            </Button>
                            <Button 
                                type="button" 
                                variant="ghost" 
                                onClick={() => setShowTestimonialForm(false)}
                                className="h-12 text-slate-500"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl hover:border-slate-300 dark:hover:border-slate-600 transition-colors bg-slate-50 dark:bg-slate-800/20">
                        <MessageSquare className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                        <h3 className="text-slate-900 dark:text-white font-medium mb-2">Write a Testimonial</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-md mx-auto">
                            Share how our events or mission have helped your family.
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


    const renderOverviewSection = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* High-Impact Welcome */}
            <div className="relative overflow-hidden bg-gradient-to-br from-brand-purple/20 to-brand-cyan/20 dark:from-brand-purple/10 dark:to-brand-cyan/10 rounded-3xl p-8 border border-white/20 shadow-2xl backdrop-blur-sm">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Welcome Back, {user.name.split(' ')[0]}!</h2>
                        <p className="text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                            {isBoard ? "Board Administration Dashboard" : "Your Humanitarian Impact Center"}
                        </p>
                    </div>
                    {!isBoard && (
                        <Link to="/events">
                            <Button variant="primary" className="shadow-lg shadow-brand-cyan/20 group">
                                Explore New Opportunities <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    )}
                </div>
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 -transtale-y-1/2 translate-x-1/2 w-64 h-64 bg-brand-cyan/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 transtale-y-1/2 -translate-x-1/2 w-64 h-64 bg-brand-purple/10 rounded-full blur-3xl"></div>
            </div>

            {/* Recent Activity Context */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-brand-card rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-brand-purple" /> My Upcoming Events
                    </h3>
                    {userRegs.length > 0 ? (
                        <div className="space-y-3">
                            {userRegs.slice(0, 3).map((reg: any) => {
                                const event = events.find(e => e.id === reg.eventId);
                                return (
                                    <div key={reg.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                                        <div className="h-10 w-10 rounded-lg bg-brand-purple/10 flex items-center justify-center text-brand-purple">
                                            <Calendar className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">{event?.title || 'Event Removed'}</h4>
                                            <p className="text-[10px] text-slate-500 mt-0.5">{event?.date} at {event?.time}</p>
                                        </div>
                                        <ChevronRight className="ml-auto h-4 w-4 text-slate-300" />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500 italic py-4">No upcoming events registered yet.</p>
                    )}
                </div>

                <div className="bg-white dark:bg-brand-card rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-brand-cyan" /> My Impact Stories
                    </h3>
                    {userTestimonials.length > 0 ? (
                        <div className="space-y-3">
                            {userTestimonials.slice(0, 3).map((t: any) => (
                                <div key={t.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                                    <div className="h-10 w-10 rounded-lg bg-brand-cyan/10 flex items-center justify-center text-brand-cyan">
                                        <Star className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{t.title || 'Untitled Story'}</h4>
                                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">{t.content}</p>
                                    </div>
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                                        t.status === 'Approved' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                                    }`}>
                                        {t.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500 italic py-4">You haven't shared any stories yet.</p>
                    )}
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeView) {
            case 'overview': return renderOverviewSection();
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

            default: return renderOverviewSection();
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

                    <div className="mb-8 overflow-x-auto no-scrollbar">
                        {renderStatsCards()}
                    </div>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
