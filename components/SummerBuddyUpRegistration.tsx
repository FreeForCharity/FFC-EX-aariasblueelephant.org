import React, { useState } from 'react';
import { db } from '../lib/database';
import { Team, SubCoach, Student } from '../lib/database/types';

interface SummerBuddyUpRegistrationProps {
  currentUser: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  onSuccess: (team: Team) => void;
}

export const SummerBuddyUpRegistration: React.FC<SummerBuddyUpRegistrationProps> = ({ currentUser, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [teamName, setTeamName] = useState('');
  const [focusArea, setFocusArea] = useState('DIGITAL DISCOVERY');
  const [headCoachPhone, setHeadCoachPhone] = useState('');
  
  // Sub Coaches
  const [subCoaches, setSubCoaches] = useState<Omit<SubCoach, 'id' | 'team_id' | 'consent_accepted' | 'user_id'>[]>([
    { name: '', email: '', phone: '' }
  ]);

  // Students
  const [students, setStudents] = useState<Omit<Student, 'id' | 'team_id'>[]>([
    { name: '', grade: '3rd', school_district: 'Tracy Unified', classification: 'Gen Ed, without any special accomodation', award_delivery_type: 'IN_PERSON_ONLY', parent_email: currentUser.email },
    { name: '', grade: '3rd', school_district: 'Tracy Unified', classification: 'Inclusion Buddy', award_delivery_type: 'IN_PERSON_ONLY', parent_email: currentUser.email },
    { name: '', grade: '3rd', school_district: 'Tracy Unified', classification: 'Gen Ed, without any special accomodation', award_delivery_type: 'IN_PERSON_ONLY', parent_email: currentUser.email }
  ]);

  // Overrides & Consent
  const [ratioOverrideRequested, setRatioOverrideRequested] = useState(false);
  const [overrideExplanation, setOverrideExplanation] = useState('');
  const [certifyOfflineConsent, setCertifyOfflineConsent] = useState(false);
  const [acceptCoordinatorRole, setAcceptCoordinatorRole] = useState(false);
  
  const focusAreas = [
    { value: 'DIGITAL DISCOVERY', label: 'DIGITAL DISCOVERY: Co-build a community park or "dream school" in Minecraft or Roblox.' },
    { value: 'PERFORMANCE ARTS', label: 'PERFORMANCE ARTS: Choreograph a dance, write the "Blue Elephant Anthem," or perform a puppet show.' },
    { value: 'COMMUNITY SPIRIT', label: 'COMMUNITY SPIRIT: Create "Welcome to the Herd" care packages for new students or a large mural for a favorite teacher.' },
    { value: 'CREATIVE PLAY', label: 'CREATIVE PLAY: Use clay for stop-motion animation, build Lego murals, or write joint poems.' },
    { value: 'Other', label: 'Other' }
  ];

  // Add/Remove Sub-Coach handlers
  const addSubCoach = () => {
    if (subCoaches.length >= 3) return; // Limit to 3 co-parents
    setSubCoaches([...subCoaches, { name: '', email: '', phone: '' }]);
  };

  const removeSubCoach = (index: number) => {
    const updated = [...subCoaches];
    updated.splice(index, 1);
    setSubCoaches(updated);
  };

  const updateSubCoach = (index: number, key: keyof typeof subCoaches[0], value: string) => {
    const updated = [...subCoaches];
    updated[index] = { ...updated[index], [key]: value };
    setSubCoaches(updated);
  };

  // Add/Remove Student handlers
  const addStudent = () => {
    if (students.length >= 9) return;
    setStudents([...students, {
      name: '',
      grade: '3rd',
      school_district: 'Tracy Unified',
      classification: 'Gen Ed, without any special accomodation',
      award_delivery_type: 'IN_PERSON_ONLY',
      parent_email: currentUser.email
    }]);
  };

  const removeStudent = (index: number) => {
    const updated = [...students];
    updated.splice(index, 1);
    setStudents(updated);
  };

  const updateStudent = (index: number, key: keyof typeof students[0], value: any) => {
    const updated = [...students];
    let newVal = value;
    
    // Auto delivery lock logic: if district is Tracy Unified or LUSD, award delivery must be IN_PERSON_ONLY
    if (key === 'school_district') {
      if (value === 'Tracy Unified' || value === 'LUSD') {
        updated[index] = {
          ...updated[index],
          school_district: value,
          award_delivery_type: 'IN_PERSON_ONLY'
        };
        setStudents(updated);
        return;
      }
    }
    
    updated[index] = { ...updated[index], [key]: newVal };
    setStudents(updated);
  };

  // Validations
  const peerMentors = students.filter(s => s.classification === 'Gen Ed, without any special accomodation').length;
  const inclusionBuddies = students.filter(s => s.classification === 'Inclusion Buddy').length;
  const ratioViolated = peerMentors > inclusionBuddies * 3; // violation if peer mentors are > 3x inclusion buddies

  const isStepValid = () => {
    if (step === 1) {
      return teamName.trim().length >= 1 && headCoachPhone.trim().length >= 7;
    }
    if (step === 2) {
      // If there are subcoaches, validate their inputs (if they started typing)
      for (const coach of subCoaches) {
        if (coach.name || coach.email || coach.phone) {
          if (!coach.name.trim() || !coach.email.trim().includes('@') || !coach.phone.trim()) {
            return false;
          }
        }
      }
      return true;
    }
    if (step === 3) {
      if (students.length < 2) return false;
      for (const s of students) {
        if (!s.name.trim() || !s.parent_email.trim().includes('@')) return false;
      }
      if (ratioViolated && !ratioOverrideRequested) return false;
      if (ratioViolated && ratioOverrideRequested && !overrideExplanation.trim()) return false;
      return true;
    }
    if (step === 4) {
      return certifyOfflineConsent && acceptCoordinatorRole;
    }
    return false;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (isStepValid()) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStepValid()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Create the team
      const newTeam = await db.createTeam({
        team_name: teamName.trim(),
        focus_area: focusArea,
        head_coach_id: currentUser.id,
        status: 'PENDING_CONSENT',
        ratio_override: ratioOverrideRequested
      });

      // 2. Add sub coaches
      for (const coach of subCoaches) {
        if (coach.name.trim() && coach.email.trim()) {
          await db.createSubCoach({
            team_id: newTeam.id,
            name: coach.name.trim(),
            email: coach.email.trim().toLowerCase(),
            phone: coach.phone.trim(),
            consent_accepted: false
          });
        }
      }

      // 3. Add students
      for (const student of students) {
        if (student.name.trim()) {
          await db.createStudent({
            team_id: newTeam.id,
            name: student.name.trim(),
            grade: student.grade,
            school_district: student.school_district,
            classification: student.classification,
            award_delivery_type: student.award_delivery_type,
            parent_email: student.parent_email.trim().toLowerCase()
          });
        }
      }

      // Trigger success callback
      onSuccess(newTeam);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('teams_team_name_key') || err.message?.includes('duplicate key value')) {
        setErrorMsg(`The team name "${teamName}" is already taken. Please choose a different name.`);
      } else {
        setErrorMsg(err.message || 'Failed to register the team. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Get list of parent email options (Head coach + valid Sub-coaches)
  const parentEmailOptions = [
    { email: currentUser.email, label: `Me (Head Coach - ${currentUser.email})` },
    ...subCoaches
      .filter(c => c.email.trim() && c.email.includes('@'))
      .map(c => ({ email: c.email.trim().toLowerCase(), label: `${c.name || 'Co-Parent'} (${c.email.trim()})` }))
  ];

  return (
    <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden font-sans">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-sky-500 via-sky-400 to-indigo-500 px-6 py-8 text-white relative">
        <h2 className="text-3xl font-extrabold tracking-tight">Summer Buddy Up Roster Wizard</h2>
        <p className="text-sky-50 mt-1 text-sm md:text-base">
          Bring children of all abilities together for local sensory-friendly projects and fun!
        </p>



        {/* Step Indicator */}
        <div className="flex items-center gap-2 mt-6">
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className="flex-1 flex items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  step === num 
                    ? 'bg-yellow-350 text-slate-900 ring-4 ring-white/30 scale-110' 
                    : step > num 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-white/20 text-sky-200'
                }`}
              >
                {step > num ? '✓' : num}
              </div>
              {num < 4 && (
                <div className={`flex-1 h-1 mx-2 rounded-full ${step > num ? 'bg-emerald-500' : 'bg-white/20'}`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={step === 4 ? handleSubmit : handleNext} className="p-6 md:p-8 space-y-6">
        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg text-sm text-red-700 flex items-start gap-2">
            <span className="font-semibold">Error:</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Team Basics */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-xl font-bold text-slate-800">Step 1: Create Team Profile</h3>
              <p className="text-xs text-slate-500 mt-1">Set up your team identity and coordinator contact details.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="teamName" className="block text-sm font-semibold text-slate-700 mb-1">
                  Team Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Tracy Inclusion Explorers"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-350 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none transition text-slate-800 placeholder-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="focusArea" className="block text-sm font-semibold text-slate-700 mb-1">
                    Activity Focus Area
                  </label>
                  <select
                    id="focusArea"
                    value={focusArea}
                    onChange={(e) => setFocusArea(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-350 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none text-slate-800"
                  >
                    {focusAreas.map(area => (
                      <option key={area.value} value={area.value}>{area.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="headPhone" className="block text-sm font-semibold text-slate-700 mb-1">
                    Your Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="headPhone"
                    value={headCoachPhone}
                    onChange={(e) => setHeadCoachPhone(e.target.value)}
                    placeholder="e.g. (209) 555-0199"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-350 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none transition text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Sub-Coaches (Co-Parents) */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-end">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Step 2: Add Co-Parent Partners (Sub-Coaches)</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Add other student parents who will help coordinate activities and check-ins.
                </p>
              </div>
              <button
                type="button"
                onClick={addSubCoach}
                disabled={subCoaches.length >= 3}
                className="text-xs font-semibold bg-sky-50 hover:bg-sky-100 disabled:opacity-50 text-sky-650 border border-sky-200 px-3 py-1.5 rounded-xl transition"
              >
                + Add Partner
              </button>
            </div>

            <div className="space-y-4">
              {subCoaches.map((coach, index) => (
                <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Partner #{index + 1}</span>
                    {subCoaches.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSubCoach(index)}
                        className="text-xs text-red-500 hover:text-red-700 font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Name</label>
                      <input
                        type="text"
                        value={coach.name}
                        onChange={(e) => updateSubCoach(index, 'name', e.target.value)}
                        placeholder="Name"
                        className="w-full px-3 py-2 rounded-lg border border-slate-350 outline-none focus:ring-1 focus:ring-sky-400 text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Google Account Email</label>
                      <input
                        type="email"
                        value={coach.email}
                        onChange={(e) => updateSubCoach(index, 'email', e.target.value)}
                        placeholder="Google login email"
                        className="w-full px-3 py-2 rounded-lg border border-slate-350 outline-none focus:ring-1 focus:ring-sky-400 text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={coach.phone}
                        onChange={(e) => updateSubCoach(index, 'phone', e.target.value)}
                        placeholder="Phone"
                        className="w-full px-3 py-2 rounded-lg border border-slate-350 outline-none focus:ring-1 focus:ring-sky-400 text-xs text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-250 text-xs text-amber-800">
                <span className="font-semibold">Note:</span> Co-parents added here must accept their legal waivers via a login gate before the team can upload milestones or finalize active registration. No email invitations are sent; you will receive a magic dashboard link to copy-paste and share with them manually.
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Students Roster */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Step 3: Register Students (Min 2, Max 9)</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Compose your buddy cohort. Maintain the inclusive Gen Ed ratio!
                </p>
              </div>
              {students.length < 9 ? (
                <button
                  type="button"
                  onClick={addStudent}
                  className="text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-650 border border-sky-200 px-3 py-1.5 rounded-xl transition"
                >
                  + Add Student
                </button>
              ) : (
                <div className="relative group">
                  <button
                    type="button"
                    disabled
                    className="text-xs font-semibold bg-slate-100 text-slate-400 border border-slate-200 px-3 py-1.5 rounded-xl cursor-not-allowed"
                  >
                    Max Reached (9)
                  </button>
                  <div className="absolute right-0 bottom-8 hidden group-hover:block w-64 bg-slate-855 text-white p-2 rounded-lg text-[11px] shadow-lg leading-relaxed z-50">
                    Maximum of 9 students per team reached! If you have more students, we highly recommend splitting into two separate teams so that all buddies get optimal quality focus.
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {students.map((student, index) => (
                <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Student #{index + 1}</span>
                    {students.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeStudent(index)}
                        className="text-xs text-red-500 hover:text-red-700 font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Child's Name</label>
                      <input
                        type="text"
                        value={student.name}
                        onChange={(e) => updateStudent(index, 'name', e.target.value)}
                        placeholder="Child's Name"
                        required
                        className="w-full px-3 py-2 rounded-lg border border-slate-350 outline-none focus:ring-1 focus:ring-sky-400 text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Grade Level</label>
                      <select
                        value={student.grade}
                        onChange={(e) => updateStudent(index, 'grade', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-350 outline-none focus:ring-1 focus:ring-sky-400 text-xs text-slate-800"
                      >
                        {['TK', 'K', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map(g => (
                          <option key={g} value={g}>{g} Grade</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">School District</label>
                      <select
                        value={student.school_district}
                        onChange={(e) => updateStudent(index, 'school_district', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-350 outline-none focus:ring-1 focus:ring-sky-400 text-xs text-slate-800"
                      >
                        <option value="Tracy Unified">Tracy Unified</option>
                        <option value="LUSD">LUSD (Lammersville)</option>
                        <option value="Other Out of Area">Other Out of Area</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Classification</label>
                      <select
                        value={student.classification}
                        onChange={(e) => updateStudent(index, 'classification', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-350 outline-none focus:ring-1 focus:ring-sky-400 text-xs text-slate-800"
                      >
                        <option value="Gen Ed, without any special accomodation">Gen Ed, without any special accommodation</option>
                        <option value="Inclusion Buddy">Inclusion Buddy (Special Education)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Parent Google Account Email</label>
                      <select
                        value={student.parent_email}
                        onChange={(e) => updateStudent(index, 'parent_email', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-350 outline-none focus:ring-1 focus:ring-sky-400 text-xs text-slate-800"
                      >
                        {parentEmailOptions.map((opt, oIdx) => (
                          <option key={oIdx} value={opt.email}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Award Delivery Type</label>
                      {student.school_district === 'Tracy Unified' || student.school_district === 'LUSD' ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-3 py-2 rounded-lg border border-indigo-200">
                            🏆 In-Person Ceremony
                          </span>
                          <span className="text-[9px] text-slate-400">Locked for local Tracy/LUSD district partners</span>
                        </div>
                      ) : (
                        <select
                          value={student.award_delivery_type}
                          onChange={(e) => updateStudent(index, 'award_delivery_type', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-350 outline-none focus:ring-1 focus:ring-sky-400 text-xs text-slate-800"
                        >
                          <option value="VIRTUAL_DIGITAL">Virtual Digital Award</option>
                          <option value="IN_PERSON_ONLY">In-Person Ceremony</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Roster composition helper & validations */}
              <div className="p-4 bg-sky-50 rounded-2xl border border-sky-150 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-xs text-slate-700">
                  <div className="font-semibold text-slate-900">Current Cohort Composition:</div>
                  <div className="flex gap-4 mt-1.5">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <div className="text-slate-600 font-medium">Gen Ed Students: <strong className="text-slate-900">{peerMentors}</strong></div>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      Inclusion Buddies: <strong className="text-slate-900">{inclusionBuddies}</strong>
                    </span>
                  </div>
                </div>

                {ratioViolated ? (
                  <div className="flex-1 bg-red-50 border border-red-200 p-3 rounded-xl">
                    <div className="text-xs font-bold text-red-800 mb-1">
                      ⚠️ Ratio Alert (Needs at least 1 Inclusion Buddy for every 3 Gen Ed Students)
                    </div>
                    <label className="flex items-start gap-1.5 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ratioOverrideRequested}
                        onChange={(e) => setRatioOverrideRequested(e.target.checked)}
                        className="mt-0.5"
                      />
                      <span className="text-[11px] text-red-750 font-medium">
                        Request Admin Ratio Override
                      </span>
                    </label>
                    {ratioOverrideRequested && (
                      <textarea
                        value={overrideExplanation}
                        onChange={(e) => setOverrideExplanation(e.target.value)}
                        placeholder="Briefly explain your scenario (e.g., waiting for matching buddies)..."
                        className="w-full mt-2 p-2 border border-red-300 rounded text-xs outline-none focus:ring-1 focus:ring-red-400"
                        rows={2}
                      />
                    )}
                  </div>
                ) : peerMentors > 0 && inclusionBuddies > 0 ? (
                  <div className="text-xs bg-emerald-50 text-emerald-800 px-3.5 py-2 rounded-xl border border-emerald-200 font-semibold flex items-center gap-1.5">
                    ✓ Inclusion Buddy ratio constraints met!
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Legal & Verification */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-xl font-bold text-slate-800">Step 4: Certifications & Legal Waiver</h3>
              <p className="text-xs text-slate-500 mt-1">Submit roster certifications as the primary Team Coordinator.</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs leading-relaxed text-slate-700">
                <h4 className="font-bold text-slate-850">Primary Head Coach Certification and Obligations:</h4>
                <p>
                  As the primary submitter (Head Coach), you are the administrative owner of this Aaria's Blue Elephant team. You acknowledge that Aaria's Blue Elephant is a 501(c)(3) nonprofit entity (Entity No. B20250299015).
                </p>
                <p>
                  You agree to conduct your group projects in safe, sensory-friendly public spaces or consenting parent homes, ensuring inclusion and safety for children of all sensory profiles.
                </p>
              </div>

              <div className="space-y-3 p-4 border border-slate-200 rounded-2xl">
                <label className="flex items-start gap-3 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={certifyOfflineConsent}
                    onChange={(e) => setCertifyOfflineConsent(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-sky-500 border-slate-350 focus:ring-sky-400 focus:ring-opacity-25"
                  />
                  <div className="text-xs text-slate-700 font-medium">
                    <span className="text-slate-900 font-bold block mb-0.5">I certify offline parental consents are obtained *</span>
                    I verify that I have printed, distributed, and obtained physical/offline parent-signed waivers (Liability, Media Release, No-Face photography agreement) for all registered students prior to adding them to this database.
                  </div>
                </label>

                <label className="flex items-start gap-3 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptCoordinatorRole}
                    onChange={(e) => setAcceptCoordinatorRole(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-sky-500 border-slate-350 focus:ring-sky-400 focus:ring-opacity-25"
                  />
                  <div className="text-xs text-slate-700 font-medium">
                    <span className="text-slate-900 font-bold block mb-0.5">Accept Coordinator responsibilities *</span>
                    I accept the duties of a Head Coach and agree to ensure all milestone videos are uploaded according to Aaria's Blue Elephant's privacy guardrails (unlisted YouTube URLs only, no child names in titles).
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="border-t border-slate-100 pt-6 flex justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-650 hover:bg-slate-50 transition font-semibold text-sm disabled:opacity-50"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Skip for now
              </button>
            )}
            <button
              type="submit"
              disabled={!isStepValid() || loading}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                step === 4 
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-200' 
                  : 'bg-sky-500 hover:bg-sky-400 shadow-sky-100'
              }`}
            >
              {loading ? 'Registering...' : step === 4 ? 'Submit Roster & Register Team' : 'Continue'}
            </button>
          </div>
        </div>
      </form>


    </div>
  );
};
