import React, { useState, useEffect } from 'react';
import { db } from '../lib/database';
import { Team, SubCoach, Student, CheckIn, BuddyUpConfig } from '../lib/database/types';

interface SummerBuddyUpDashboardProps {
  team: Team;
  currentUser: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  onRefreshTeam: () => void;
}

export const SummerBuddyUpDashboard: React.FC<SummerBuddyUpDashboardProps> = ({ team, currentUser, onRefreshTeam }) => {
  const [subCoaches, setSubCoaches] = useState<SubCoach[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Waiver modal state
  const [showWaiverModal, setShowWaiverModal] = useState(false);
  const [mySubCoachRecord, setMySubCoachRecord] = useState<SubCoach | null>(null);
  const [waiverChecks, setWaiverChecks] = useState({
    liability: false,
    noFace: false,
    piiSafe: false
  });
  const [submittingWaiver, setSubmittingWaiver] = useState(false);

  // New Check-In Form State
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false);
  const [activeMilestoneForm, setActiveMilestoneForm] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checkInError, setCheckInError] = useState('');

  // Config State
  const [buddyUpConfig, setBuddyUpConfig] = useState<BuddyUpConfig | null>(null);

  // Clipboard copy feedback
  const [copySuccess, setCopySuccess] = useState(false);

  // Edit Team State
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addMemberType, setAddMemberType] = useState<'student'|'coach'>('student');
  const [addMemberForm, setAddMemberForm] = useState({
    name: '', email: '', phone: '', grade: '', school_district: 'LUSD', classification: 'Inclusion Buddy', award_delivery_type: 'IN_PERSON_ONLY', parent_email: ''
  });
  const [addingMember, setAddingMember] = useState(false);

  const [waiverJustSubmitted, setWaiverJustSubmitted] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [coachesList, studentsList, checkInsList, config] = await Promise.all([
        db.getSubCoaches(team.id),
        db.getStudents(team.id),
        db.getCheckIns(team.id),
        db.getBuddyUpConfig()
      ]);

      setSubCoaches(coachesList);
      setStudents(studentsList);
      setCheckIns(checkInsList);
      setBuddyUpConfig(config);

      // Check if logged in user is a sub-coach
      const matchedSubCoach = coachesList.find(c => c.email.toLowerCase() === currentUser.email.toLowerCase());
      if (matchedSubCoach) {
        setMySubCoachRecord(matchedSubCoach);
        // Show waiver modal if they haven't accepted it yet
        if (!matchedSubCoach.consent_accepted && !waiverJustSubmitted) {
          setShowWaiverModal(true);
        } else if (matchedSubCoach.consent_accepted || waiverJustSubmitted) {
          setShowWaiverModal(false);
        }
      }

      // Check for dynamic status transition:
      // If team is PENDING_CONSENT, and all sub-coaches have consent_accepted = true
      const allConsented = coachesList.every(c => c.consent_accepted === true);
      // Include local waiverjustsubmitted logic to prevent race conditions from blocking active transition
      const allConsentedOrSubmitted = coachesList.every(c => 
        c.consent_accepted === true || (c.id === matchedSubCoach?.id && waiverJustSubmitted)
      );
      
      if (team.status === 'PENDING_CONSENT' && (allConsented || allConsentedOrSubmitted)) {
        // Automatically move to admin approval queue once consent is gathered
        await db.updateTeam(team.id, { status: 'PENDING_ADMIN_APPROVAL' });
        onRefreshTeam();
      }

    } catch (err) {
      console.error('Error loading team dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [team.id, currentUser.email]);

  const handleWaiverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mySubCoachRecord || !waiverChecks.liability || !waiverChecks.noFace || !waiverChecks.piiSafe) return;
    if (submittingWaiver) return; // Prevent double submission

    setSubmittingWaiver(true);
    setWaiverJustSubmitted(true);
    try {
      await db.updateSubCoach(mySubCoachRecord.id, {
        consent_accepted: true,
        user_id: currentUser.id
      });
      setShowWaiverModal(false);
      // Let the backend process, then reload
      setTimeout(() => {
        loadData();
      }, 1500);
    } catch (err) {
      console.error('Failed to submit waiver:', err);
      setWaiverJustSubmitted(false);
      setSubmittingWaiver(false);
    }
  };

  const handleCheckInSubmit = async (e: React.FormEvent, milestone: 'JULY_15' | 'JULY_30' | 'AUGUST_15' | 'AUGUST_30') => {
    e.preventDefault();
    setCheckInError('');

    // Quick regex validation for unlisted/listed YouTube urls
    const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    if (!ytRegex.test(youtubeUrl)) {
      setCheckInError('Please enter a valid YouTube video URL.');
      return;
    }

    if (!buddyUpConfig) return;

    for (const q of buddyUpConfig.checkin_questions) {
      if (!answers[q] || answers[q].trim().length < 5) {
        setCheckInError(`Please provide a more detailed answer for: "${q}"`);
        return;
      }
    }

    setSubmittingCheckIn(true);
    try {
      await db.createCheckIn({
        team_id: team.id,
        milestone_target: milestone,
        youtube_url: youtubeUrl.trim(),
        answers
      });

      // Clear form & close
      setYoutubeUrl('');
      setAnswers({});
      setActiveMilestoneForm(null);
      
      // Reload checkins
      loadData();
    } catch (err: any) {
      console.error(err);
      setCheckInError(err.message || 'Failed to submit check-in.');
    } finally {
      setSubmittingCheckIn(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingMember(true);
    try {
      if (addMemberType === 'student') {
        await db.createStudent({
          team_id: team.id,
          name: addMemberForm.name,
          grade: addMemberForm.grade,
          school_district: addMemberForm.school_district as any,
          classification: addMemberForm.classification as any,
          award_delivery_type: addMemberForm.award_delivery_type as any,
          parent_email: addMemberForm.parent_email
        });
      } else {
        await db.createSubCoach({
          team_id: team.id,
          name: addMemberForm.name,
          email: addMemberForm.email,
          phone: addMemberForm.phone
        });
      }
      
      setShowAddMemberModal(false);
      onRefreshTeam();
      loadData();
      alert(`Successfully added new ${addMemberType}! The team is now pending Admin Approval.`);
      
      // Reset form
      setAddMemberForm({
        name: '', email: '', phone: '', grade: '', school_district: 'LUSD', classification: 'Inclusion Buddy', award_delivery_type: 'IN_PERSON_ONLY', parent_email: ''
      });
    } catch (err) {
      console.error(err);
      alert('Failed to add member. Please try again.');
    } finally {
      setAddingMember(false);
    }
  };

  const copyInviteText = () => {
    const inviteLink = `${window.location.origin}${window.location.pathname}?tab=summer-buddy-up`;
    const text = `Hey co-coach! I registered our Aaria's Blue Elephant Summer Buddy Up team ("${team.team_name}"). Please log in to ${inviteLink} using your Google account (${currentUser.id === team.head_coach_id ? 'the email I added' : 'your email'}) to claim your profile and accept the safety waivers so we can start tracking our check-ins! 🐘💙`;
    
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    });
  };

  // Masking functions for co-parent privacy before waiver consent
  const maskEmail = (email: string) => {
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const name = parts[0];
    const domain = parts[1];
    if (name.length <= 2) return `${name[0]}***@${domain}`;
    return `${name.substring(0, 2)}***${name.substring(name.length - 1)}@${domain}`;
  };

  const maskPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 4) return phone;
    return `(***) ***-**${cleaned.substring(cleaned.length - 2)}`;
  };

  const isHeadCoach = currentUser.id === team.head_coach_id;
  const isTeamActive = team.status !== 'PENDING_CONSENT';

  // Check-ins targets configuration
  const milestoneDetails = [
    { key: 'JULY_15', label: 'Milestone 1: July 15', dateLabel: 'July 15 Check-in' },
    { key: 'JULY_30', label: 'Milestone 2: July 30', dateLabel: 'July 30 Check-in' },
    { key: 'AUGUST_15', label: 'Milestone 3: August 15', dateLabel: 'August 15 Check-in' },
    { key: 'AUGUST_30', label: 'Milestone 4: August 30', dateLabel: 'August 30 Check-in' }
  ];

  const submittedCount = checkIns.length;
  const isPrizeEligible = submittedCount >= 2;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 border-4 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-semibold">Loading Summer Buddy Up Dashboard...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 font-sans relative ${(showWaiverModal || showAddMemberModal) ? 'blur-sm select-none pointer-events-none' : ''}`}>
      
      {team.status === 'PENDING_ADMIN_APPROVAL' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-4 shadow-sm mb-6">
          <div className="bg-amber-100 p-2 rounded-full text-amber-600 mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-amber-800 text-sm">Awaiting Administrator Approval</h3>
            <p className="text-amber-700 text-xs mt-1 leading-relaxed">
              Your cohort registration is complete! An administrator is currently reviewing your team details. You can continue to invite sub-coaches and add students while you wait.
            </p>
          </div>
        </div>
      )}

      {/* ADD MEMBER MODAL OVERLAY */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4 select-text pointer-events-auto">
          <div className="bg-white max-w-xl w-full rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-5 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-bold">Edit Team</h3>
                <p className="text-xs text-indigo-100 mt-1">Add a new student or sub-coach to the roster</p>
              </div>
              <button onClick={() => setShowAddMemberModal(false)} className="text-white hover:text-sky-200 text-2xl font-bold">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto grow">
              <div className="flex space-x-2 mb-6">
                <button
                  type="button"
                  onClick={() => setAddMemberType('student')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${addMemberType === 'student' ? 'bg-sky-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Add Student
                </button>
                <button
                  type="button"
                  onClick={() => setAddMemberType('coach')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${addMemberType === 'coach' ? 'bg-sky-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Add Sub-Coach
                </button>
              </div>

              <form id="add-member-form" onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={addMemberForm.name}
                    onChange={(e) => setAddMemberForm({...addMemberForm, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                  />
                </div>

                {addMemberType === 'coach' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email Address</label>
                      <input
                        type="email"
                        required
                        value={addMemberForm.email}
                        onChange={(e) => setAddMemberForm({...addMemberForm, email: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={addMemberForm.phone}
                        onChange={(e) => setAddMemberForm({...addMemberForm, phone: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                      />
                    </div>
                  </>
                )}

                {addMemberType === 'student' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Grade Level</label>
                        <select required value={addMemberForm.grade} onChange={(e) => setAddMemberForm({...addMemberForm, grade: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                          <option value="">Select Grade</option>
                          {['Pre-K','K','1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th','Transition (18-22)'].map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">School District</label>
                        <select required value={addMemberForm.school_district} onChange={(e) => setAddMemberForm({...addMemberForm, school_district: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                          <option value="LUSD">LUSD</option>
                          <option value="Tracy Unified">Tracy Unified</option>
                          <option value="Other Out of Area">Other Out of Area</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Role</label>
                        <select required value={addMemberForm.classification} onChange={(e) => setAddMemberForm({...addMemberForm, classification: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                          <option value="Inclusion Buddy">Inclusion Buddy (IEP)</option>
                          <option value="Gen Ed, without any special accommodation">Gen Ed, without any special accommodation</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Awards</label>
                        <select required value={addMemberForm.award_delivery_type} onChange={(e) => setAddMemberForm({...addMemberForm, award_delivery_type: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
                          <option value="IN_PERSON_ONLY">In-Person Only</option>
                          <option value="VIRTUAL_DIGITAL">Virtual/Digital</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Parent Email</label>
                      <input type="email" required value={addMemberForm.parent_email} onChange={(e) => setAddMemberForm({...addMemberForm, parent_email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                  </>
                )}
              </form>
            </div>
            
            <div className="border-t border-slate-100 p-6 bg-slate-50 shrink-0">
              <button
                type="submit"
                form="add-member-form"
                disabled={addingMember}
                className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl shadow-lg transition"
              >
                {addingMember ? 'Saving...' : `Add ${addMemberType === 'student' ? 'Student' : 'Sub-Coach'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WAIVER MODAL OVERLAY */}
      {showWaiverModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4 select-text pointer-events-auto">
          <div className="bg-white max-w-xl w-full rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-sky-500 px-6 py-5 text-white">
              <h3 className="text-xl font-bold">Parent Partnership Consent & Waiver</h3>
              <p className="text-xs text-indigo-100 mt-1">Review legal releases to join team "{team.team_name}"</p>
            </div>
            
            <form onSubmit={handleWaiverSubmit} className="p-6 space-y-4">
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 text-xs leading-relaxed text-slate-600 border-b border-slate-100 pb-4">
                <p>
                  Welcome! You have been added as a Partnering Parent/Sub-Coach for the Summer Buddy Up program. To safeguard student privacy and establish safe guidelines, please review and accept the agreements below:
                </p>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 space-y-2">
                  <h5 className="font-bold text-slate-800">1. Offline Consent Signatures</h5>
                  <p>
                    All students on the roster must have offline signatures captured from their respective legal guardians before participating. By checking the boxes, you agree to coordinate and verify that physical safety release sheets are kept on file.
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 space-y-2">
                  <h5 className="font-bold text-slate-800">2. No-Face Photography Compliance</h5>
                  <p>
                    Aaria's Blue Elephant promotes child safety and protects children from online facial recognition trackers. When filming check-in videos, please avoid direct eye-level frontal face shots of students. Film from behind, focus on hands/actions, use creative camera angles, or obtain explicit parent permission first.
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 space-y-2">
                  <h5 className="font-bold text-slate-800">3. Liability Release & PII Safety</h5>
                  <p>
                    Aaria's Blue Elephant is a 501(c)(3) (Entity No. B20250299015). Activities are self-guided and voluntary. You release Aaria's Blue Elephant from direct liabilities during independent cohort project sessions. Do not include students' full names or locations in YouTube video titles.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={waiverChecks.liability}
                    onChange={(e) => setWaiverChecks({ ...waiverChecks, liability: e.target.checked })}
                    className="mt-0.5"
                    required
                  />
                  <span className="text-xs text-slate-700">
                    I accept the general liability waiver release policies.
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={waiverChecks.noFace}
                    onChange={(e) => setWaiverChecks({ ...waiverChecks, noFace: e.target.checked })}
                    className="mt-0.5"
                    required
                  />
                  <span className="text-xs text-slate-700">
                    I agree to follow the "No-Face" visual filming guardrails in all milestone uploads.
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={waiverChecks.piiSafe}
                    onChange={(e) => setWaiverChecks({ ...waiverChecks, piiSafe: e.target.checked })}
                    className="mt-0.5"
                    required
                  />
                  <span className="text-xs text-slate-700">
                    I certify I will protect child PII and submit only unlisted YouTube links.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={!waiverChecks.liability || !waiverChecks.noFace || !waiverChecks.piiSafe || submittingWaiver}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm py-2.5 rounded-xl shadow-lg transition"
              >
                {submittingWaiver ? 'Signing...' : 'Sign Waiver & Open Dashboard'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DASHBOARD HERO BANNER */}
      <div className="bg-gradient-to-r from-sky-450 via-sky-350 to-indigo-400 p-6 md:p-8 rounded-3xl text-white shadow-lg relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="bg-white/20 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              Summer Buddy Cohort
            </span>
            <h2 className="text-3xl font-extrabold mt-1.5">{team.team_name}</h2>
            <p className="text-sm text-sky-50 mt-1">Focus Area: <strong className="text-white">{team.focus_area}</strong></p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1.5">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <span className="text-xs font-semibold text-sky-100">Status:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                isTeamActive 
                  ? 'bg-emerald-500 text-white shadow shadow-emerald-250 animate-pulse' 
                  : team.status === 'PENDING_ADMIN_APPROVAL'
                  ? 'bg-amber-500 text-white shadow shadow-amber-200'
                  : 'bg-yellow-450 text-slate-900 shadow shadow-yellow-200'
              }`}>
                {team.status === 'PENDING_CONSENT' ? '⏳ PENDING PARENT CONSENT' : team.status === 'PENDING_ADMIN_APPROVAL' ? '⏳ PENDING ADMIN APPROVAL' : '✓ ACTIVE COHORT'}
              </span>
              
              {currentUser.id === team.head_coach_id && (
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold py-1 px-3 rounded-full backdrop-blur-sm transition-colors mt-2 md:mt-0"
                >
                  Edit Team
                </button>
              )}
            </div>

            {/* Prize eligibility check */}
            <div className="text-[11px] font-medium text-sky-100">
              {isPrizeEligible ? (
                <span className="bg-emerald-600/30 border border-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  🎉 Final Award Ceremony Eligible ({submittedCount}/4)
                </span>
              ) : (
                <span className="bg-white/10 px-2 py-0.5 rounded-full">
                  Submit any 2 milestones to qualify for awards ({submittedCount}/4)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* WARNING IF PENDING_CONSENT */}
      {!isTeamActive && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-2xl text-xs md:text-sm text-amber-800">
          <div className="font-bold mb-1">⚠️ Checklist Locked (Pending Co-Parent Consent)</div>
          Our safety policy requires all listed co-parents to log in and sign their safety waiver. Once all sub-coaches accept, the timeline checklist will automatically unlock!
        </div>
      )}

      {/* TWO COLUMN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: ROSTER INFO */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* PARENT COORDINATORS CARD */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 flex justify-between items-center text-sm md:text-base">
              <span>Coaches & Parents</span>
              <span className="text-[10px] text-slate-400 font-normal">Pull Login Matched</span>
            </h3>

            <div className="space-y-3">
              {/* Head Coach */}
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-150">
                <div>
                  <div className="font-bold text-slate-800"> {currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Primary Coordinator'} (You)</div>
                  <div className="text-[10px] text-sky-600 font-semibold mt-0.5">{currentUser.email}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-full">Owner</span>
                </div>
              </div>

              {/* Sub Coaches */}
              {subCoaches.map((coach, index) => {
                const isConsented = coach.consent_accepted;
                return (
                  <div key={index} className="p-2.5 rounded-xl border border-slate-150 space-y-1.5 text-xs bg-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-slate-800">{coach.name}</div>
                        <div className="text-[10px] text-slate-400">Co-Parent</div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isConsented 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isConsented ? 'Consented' : 'Pending'}
                      </span>
                    </div>

                    <div className="text-[10.5px] text-slate-500 space-y-0.5 border-t border-slate-50 pt-1.5 font-mono">
                      <div>
                        Email: <span className="text-slate-700">{isConsented || isHeadCoach ? coach.email : maskEmail(coach.email)}</span>
                      </div>
                      <div>
                        Phone: <span className="text-slate-700">{isConsented || isHeadCoach ? coach.phone : maskPhone(coach.phone)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Manual Invite widget (Head coach only) */}
            {isHeadCoach && (
              <div className="border border-indigo-100 bg-indigo-50/50 p-3.5 rounded-xl space-y-2.5">
                <div className="text-xs font-bold text-indigo-900">Invite Co-Parents / Partners</div>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Since we protect user privacy and use zero transaction emails, copy and share the link/text directly with co-parents to sign waivers!
                </p>
                <button
                  type="button"
                  onClick={copyInviteText}
                  className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold text-white transition flex items-center justify-center gap-1.5 ${
                    copySuccess ? 'bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-550'
                  }`}
                >
                  {copySuccess ? '✓ Copied Invite to Clipboard!' : 'Copy WhatsApp / Text Invite'}
                </button>
              </div>
            )}
          </div>

          {/* REGISTERED STUDENTS CARD */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 text-sm md:text-base">
              Roster Students ({students.length})
            </h3>
            
            <div className="space-y-3">
              {students.map((student, index) => (
                <div key={index} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 relative overflow-hidden">
                  {/* Category Accent */}
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${
                    student.classification === 'Inclusion Buddy' ? 'bg-purple-400' : 'bg-sky-400'
                  }`}></div>

                  <div className="pl-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-850">{student.name}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        student.classification === 'Inclusion Buddy' 
                          ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                          : 'bg-sky-50 text-sky-700 border border-sky-200'
                      }`}>
                        {student.classification === 'Inclusion Buddy' ? 'Buddy' : 'Mentor'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-1.5 mt-2 text-[10px] text-slate-500 font-semibold border-t border-slate-200/50 pt-2">
                      <div>Grade: <span className="text-slate-850">{student.grade}</span></div>
                      <div>District: <span className="text-slate-850">{student.school_district}</span></div>
                      <div className="col-span-2">
                        Delivery: <span className="text-indigo-600">{student.award_delivery_type === 'IN_PERSON_ONLY' ? '🏆 Local In-Person Ceremony' : '✉️ Virtual Digital'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PROGRESS TIMELINE & FORM */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 p-5 md:p-6 rounded-2xl shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-base md:text-lg">Buddy Up Check-In Milestones</h3>
                <p className="text-xs text-slate-500 mt-0.5">Flexible dates: Submit any 2 out of 4 check-ins for award certification.</p>
              </div>
            </div>

            {!buddyUpConfig?.checkins_enabled && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 text-sm font-semibold">
                Check-ins are currently disabled by the administrator. Please check back later.
              </div>
            )}

            {/* MILESTONE GRID */}
            <div className="space-y-4">
              {milestoneDetails.map((milestone) => {
                const checkIn = checkIns.find(c => c.milestone_target === milestone.key);
                const isFormActive = activeMilestoneForm === milestone.key;

                return (
                  <div key={milestone.key} className={`border rounded-2xl p-4 transition-all ${
                    checkIn 
                      ? 'border-emerald-200 bg-emerald-50/20' 
                      : isFormActive 
                        ? 'border-sky-400 ring-2 ring-sky-100 bg-white' 
                        : 'border-slate-200 bg-white'
                  }`}>
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                          checkIn 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {checkIn ? '✓' : '•'}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs md:text-sm">{milestone.label}</h4>
                          <span className="text-[10px] text-slate-400 font-medium">Cohort Milestones Log</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div>
                        {checkIn ? (
                          <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold py-1 px-3 rounded-full">
                            ✓ Submitted
                          </span>
                        ) : !isTeamActive || (buddyUpConfig?.unlocked_milestones && !buddyUpConfig.unlocked_milestones.includes(milestone.key)) || (!buddyUpConfig?.unlocked_milestones && !buddyUpConfig?.checkins_enabled) ? (
                          <button
                            disabled
                            className="text-xs bg-slate-200 text-slate-500 border border-slate-300 font-semibold py-1.5 px-4 rounded-xl cursor-not-allowed"
                          >
                            Locked
                          </button>
                        ) : isFormActive ? (
                          <button
                            onClick={() => setActiveMilestoneForm(null)}
                            className="text-xs text-slate-500 hover:text-slate-700 font-semibold px-2 py-1"
                          >
                            Cancel
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setActiveMilestoneForm(milestone.key);
                              setCheckInError('');
                            }}
                            className="text-xs bg-sky-500 hover:bg-sky-600 text-white font-bold py-1.5 px-4 rounded-xl shadow-sm transition-colors"
                          >
                            Submit Log
                          </button>
                        )}
                      </div>
                    </div>

                    {/* SUBMITTED CONTENT VIEW */}
                    {checkIn && (
                      <div className="mt-4 border-t border-slate-100 pt-3.5 space-y-2.5 text-xs text-slate-750">
                        <div className="flex items-center gap-1.5 mb-3">
                          <span className="font-bold text-slate-500">Video Link:</span>
                          <a 
                            href={checkIn.youtube_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-sky-600 hover:underline font-mono break-all font-semibold flex items-center gap-1"
                          >
                            🎬 View YouTube Video
                          </a>
                        </div>
                        {Object.entries(checkIn.answers || {}).map(([question, answer], i) => (
                          <div key={i}>
                            <span className="font-bold text-slate-800 block mb-0.5">{question}</span>
                            <p className="bg-white p-2.5 border border-slate-150 rounded-xl leading-relaxed">{answer}</p>
                          </div>
                        ))}
                        <div className="text-[10px] text-slate-400 font-semibold text-right mt-2">
                          Submitted at {new Date(checkIn.submitted_at).toLocaleDateString()}
                        </div>
                      </div>
                    )}

                    {/* ACTIVE FORM SUBMISSION PANEL */}
                    {isFormActive && (
                      <form onSubmit={(e) => handleCheckInSubmit(e, milestone.key as any)} className="mt-4 border-t border-slate-100 pt-4 space-y-4 text-xs">
                        {checkInError && (
                          <div className="bg-red-50 border border-red-250 p-2.5 rounded-lg text-xs text-red-700">
                            {checkInError}
                          </div>
                        )}

                        <div className="space-y-3">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Unlisted YouTube URL <span className="text-red-500">*</span></label>
                            <input
                              type="url"
                              required
                              value={youtubeUrl}
                              onChange={(e) => setYoutubeUrl(e.target.value)}
                              placeholder="e.g. https://www.youtube.com/watch?v=..."
                              className="w-full px-3 py-2 rounded-lg border border-slate-350 outline-none text-slate-800 placeholder-slate-400 text-xs font-mono"
                            />
                            <p className="text-[9px] text-slate-400 mt-1">
                              ⚠️ To protect child privacy, configure your YouTube video privacy settings as <strong>Unlisted</strong>. Do not use student full names in titles!
                            </p>
                          </div>

                          {buddyUpConfig?.checkin_questions.map((question, i) => (
                            <div key={i}>
                              <label className="block font-bold text-slate-700 mb-1">{question} <span className="text-red-500">*</span></label>
                              <textarea
                                required
                                value={answers[question] || ''}
                                onChange={(e) => setAnswers(prev => ({ ...prev, [question]: e.target.value }))}
                                placeholder="Type your answer here..."
                                rows={3}
                                className="w-full px-3 py-2 rounded-lg border border-slate-350 outline-none text-slate-800 text-xs leading-normal"
                              />
                            </div>
                          ))}
                        </div>

                        <button
                          type="submit"
                          disabled={submittingCheckIn}
                          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs py-2 px-4 rounded-xl shadow transition active:scale-95"
                        >
                          {submittingCheckIn ? 'Uploading...' : 'Submit Log Entries'}
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      

    </div>
  );
};
