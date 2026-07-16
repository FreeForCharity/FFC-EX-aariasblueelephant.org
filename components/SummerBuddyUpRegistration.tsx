import React, { useState } from 'react';
import { db } from '../lib/database';
import { Team, SubCoach, Student } from '../lib/database/types';
import { tr } from '../lib/lang';

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
    { name: '', grade: '3rd', school_district: 'Tracy Unified', classification: 'Gen Ed, without any special accommodation', award_delivery_type: 'IN_PERSON_ONLY', parent_email: currentUser.email },
    { name: '', grade: '3rd', school_district: 'Tracy Unified', classification: 'Inclusion Buddy', award_delivery_type: 'IN_PERSON_ONLY', parent_email: currentUser.email },
    { name: '', grade: '3rd', school_district: 'Tracy Unified', classification: 'Gen Ed, without any special accommodation', award_delivery_type: 'IN_PERSON_ONLY', parent_email: currentUser.email }
  ]);

  // Overrides & Consent
  const [ratioOverrideRequested, setRatioOverrideRequested] = useState(false);
  const [overrideExplanation, setOverrideExplanation] = useState('');
  const [certifyOfflineConsent, setCertifyOfflineConsent] = useState(false);
  const [acceptCoordinatorRole, setAcceptCoordinatorRole] = useState(false);
  
  const focusAreas = [
    { value: 'DIGITAL DISCOVERY', label: tr('DIGITAL DISCOVERY: Co-build a community park or "dream school" in Minecraft or Roblox.', 'DESCUBRIMIENTO DIGITAL: Construyan juntos un parque comunitario o una "escuela de ensueño" en Minecraft o Roblox.') },
    { value: 'PERFORMANCE ARTS', label: tr('PERFORMANCE ARTS: Choreograph a dance, write the "Blue Elephant Anthem," or perform a puppet show.', 'ARTES ESCÉNICAS: Coreografíen un baile, escriban el "Himno del Elefante Azul" o hagan un show de títeres.') },
    { value: 'COMMUNITY SPIRIT', label: tr('COMMUNITY SPIRIT: Create "Welcome to the Herd" care packages for new students or a large mural for a favorite teacher.', 'ESPÍRITU COMUNITARIO: Creen paquetes de bienvenida "Bienvenido a la Manada" para estudiantes nuevos o un gran mural para un maestro favorito.') },
    { value: 'CREATIVE PLAY', label: tr('CREATIVE PLAY: Use clay for stop-motion animation, build Lego murals, or write joint poems.', 'JUEGO CREATIVO: Usen plastilina para animación stop-motion, construyan murales de Lego o escriban poemas en conjunto.') },
    { value: 'Other', label: tr('Other', 'Otro') }
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
      classification: 'Gen Ed, without any special accommodation',
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
  const peerMentors = students.filter(s => s.classification === 'Gen Ed, without any special accommodation').length;
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
        setErrorMsg(tr(`The team name "${teamName}" is already taken. Please choose a different name.`, `El nombre de equipo "${teamName}" ya está en uso. Por favor elige un nombre diferente.`));
      } else {
        setErrorMsg(err.message || tr('Failed to register the team. Please try again.', 'No se pudo registrar el equipo. Por favor intenta de nuevo.'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Get list of parent email options (Head coach + valid Sub-coaches)
  const parentEmailOptions = [
    { email: currentUser.email, label: tr(`Me (Head Coach - ${currentUser.email})`, `Yo (Entrenador Principal - ${currentUser.email})`) },
    ...subCoaches
      .filter(c => c.email.trim() && c.email.includes('@'))
      .map(c => ({ email: c.email.trim().toLowerCase(), label: `${c.name || tr('Co-Parent', 'Copadre/madre')} (${c.email.trim()})` }))
  ];

  return (
    <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden font-sans">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-sky-500 via-sky-400 to-indigo-500 px-6 py-8 text-white relative">
        <h2 className="text-3xl font-extrabold tracking-tight">{tr('Summer Buddy Up Roster Wizard', 'Asistente de Registro Summer Buddy Up')}</h2>
        <p className="text-sky-50 mt-1 text-sm md:text-base">
          {tr('Bring children of all abilities together for local sensory-friendly projects and fun!', '¡Reúne a niños de todas las habilidades para proyectos locales y diversión sensorial-amigable!')}
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
            <span className="font-semibold">{tr('Error:', 'Error:')}</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Team Basics */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-xl font-bold text-slate-800">{tr('Step 1: Create Team Profile', 'Paso 1: Crear Perfil de Equipo')}</h3>
              <p className="text-xs text-slate-500 mt-1">{tr('Set up your team identity and coordinator contact details.', 'Configura la identidad de tu equipo y los datos de contacto del coordinador.')}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="teamName" className="block text-sm font-semibold text-slate-700 mb-1">
                  {tr('Team Name', 'Nombre del Equipo')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder={tr('e.g. Tracy Inclusion Explorers', 'ej. Tracy Inclusion Explorers')}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-350 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none transition text-slate-800 placeholder-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="focusArea" className="block text-sm font-semibold text-slate-700 mb-1">
                    {tr('Activity Focus Area', 'Área de Enfoque de Actividad')}
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
                    {tr('Your Phone Number', 'Tu Número de Teléfono')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="headPhone"
                    value={headCoachPhone}
                    onChange={(e) => setHeadCoachPhone(e.target.value)}
                    placeholder={tr('e.g. (209) 555-0199', 'ej. (209) 555-0199')}
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
                <h3 className="text-xl font-bold text-slate-800">{tr('Step 2: Add Co-Parent Partners (Sub-Coaches)', 'Paso 2: Agregar Copadres/madres Socios (Sub-Entrenadores)')}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {tr('Add other student parents who will help coordinate activities and check-ins.', 'Agrega a otros padres de estudiantes que ayudarán a coordinar las actividades y los reportes de avance.')}
                </p>
              </div>
              <button
                type="button"
                onClick={addSubCoach}
                disabled={subCoaches.length >= 3}
                className="text-xs font-bold bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl shadow-sm transition-colors"
              >
                {tr('+ Add Partner', '+ Agregar Socio')}
              </button>
            </div>

            <div className="space-y-4">
              {subCoaches.map((coach, index) => (
                <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{tr('Partner', 'Socio')} #{index + 1}</span>
                    {subCoaches.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSubCoach(index)}
                        className="text-xs text-red-500 hover:text-red-700 font-semibold"
                      >
                        {tr('Remove', 'Eliminar')}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{tr('Name', 'Nombre')}</label>
                      <input
                        type="text"
                        value={coach.name}
                        onChange={(e) => updateSubCoach(index, 'name', e.target.value)}
                        placeholder={tr('Name', 'Nombre')}
                        className="w-full px-3 py-2 rounded-lg border border-slate-350 outline-none focus:ring-1 focus:ring-sky-400 text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{tr('Google Account Email', 'Correo de Cuenta de Google')}</label>
                      <input
                        type="email"
                        value={coach.email}
                        onChange={(e) => updateSubCoach(index, 'email', e.target.value)}
                        placeholder={tr('Google login email', 'Correo de inicio de sesión de Google')}
                        className="w-full px-3 py-2 rounded-lg border border-slate-350 outline-none focus:ring-1 focus:ring-sky-400 text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{tr('Phone Number', 'Número de Teléfono')}</label>
                      <input
                        type="tel"
                        value={coach.phone}
                        onChange={(e) => updateSubCoach(index, 'phone', e.target.value)}
                        placeholder={tr('Phone', 'Teléfono')}
                        className="w-full px-3 py-2 rounded-lg border border-slate-350 outline-none focus:ring-1 focus:ring-sky-400 text-xs text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-250 text-xs text-amber-800">
                <span className="font-semibold">{tr('Note:', 'Nota:')}</span> {tr('Co-parents added here must accept their legal waivers via a login gate before the team can upload milestones or finalize active registration. No email invitations are sent; you will receive a magic dashboard link to copy-paste and share with them manually.', 'Los copadres/madres agregados aquí deben aceptar sus exenciones legales mediante un inicio de sesión antes de que el equipo pueda subir hitos o finalizar el registro activo. No se envían invitaciones por correo; recibirás un enlace mágico al panel para copiar y compartir manualmente.')}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Students Roster */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{tr('Step 3: Register Students (Min 2, Max 9)', 'Paso 3: Registrar Estudiantes (Mín. 2, Máx. 9)')}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {tr('Compose your buddy cohort. Maintain the inclusive Gen Ed ratio!', 'Forma tu grupo de amigos. ¡Mantén la proporción inclusiva de Educación General!')}
                </p>
              </div>
              {students.length < 9 ? (
                <button
                  type="button"
                  onClick={addStudent}
                  className="text-xs font-bold bg-sky-500 text-white hover:bg-sky-600 px-4 py-2 rounded-xl shadow-sm transition-colors"
                >
                  {tr('+ Add Student', '+ Agregar Estudiante')}
                </button>
              ) : (
                <div className="relative group">
                  <button
                    type="button"
                    disabled
                    className="text-xs font-semibold bg-slate-100 text-slate-400 border border-slate-200 px-3 py-1.5 rounded-xl cursor-not-allowed"
                  >
                    {tr('Max Reached (9)', 'Máximo Alcanzado (9)')}
                  </button>
                  <div className="absolute right-0 bottom-8 hidden group-hover:block w-64 bg-slate-855 text-white p-2 rounded-lg text-[11px] shadow-lg leading-relaxed z-50">
                    {tr('Maximum of 9 students per team reached! If you have more students, we highly recommend splitting into two separate teams so that all buddies get optimal quality focus.', '¡Se alcanzó el máximo de 9 estudiantes por equipo! Si tienes más estudiantes, te recomendamos dividir en dos equipos separados para que todos los amigos reciban una atención de calidad óptima.')}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {students.map((student, index) => (
                <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{tr('Student', 'Estudiante')} #{index + 1}</span>
                    {students.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeStudent(index)}
                        className="text-xs text-red-500 hover:text-red-700 font-semibold"
                      >
                        {tr('Remove', 'Eliminar')}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{tr("Child's Name", 'Nombre del Niño/a')}</label>
                      <input
                        type="text"
                        value={student.name}
                        onChange={(e) => updateStudent(index, 'name', e.target.value)}
                        placeholder={tr("Child's Name", 'Nombre del Niño/a')}
                        required
                        className="w-full px-3 py-2 rounded-lg border border-slate-350 outline-none focus:ring-1 focus:ring-sky-400 text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{tr('Grade Level', 'Grado Escolar')}</label>
                      <select
                        value={student.grade}
                        onChange={(e) => updateStudent(index, 'grade', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-350 outline-none focus:ring-1 focus:ring-sky-400 text-xs text-slate-800"
                      >
                        {['TK', 'K', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map(g => (
                          <option key={g} value={g}>{g} {tr('Grade', 'Grado')}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{tr('School District', 'Distrito Escolar')}</label>
                      <select
                        value={student.school_district}
                        onChange={(e) => updateStudent(index, 'school_district', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-350 outline-none focus:ring-1 focus:ring-sky-400 text-xs text-slate-800"
                      >
                        <option value="Tracy Unified">Tracy Unified</option>
                        <option value="LUSD">{tr('LUSD (Lammersville)', 'LUSD (Lammersville)')}</option>
                        <option value="Other Out of Area">{tr('Other Out of Area', 'Otro Fuera del Área')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{tr('Classification', 'Clasificación')}</label>
                      <select
                        value={student.classification}
                        onChange={(e) => updateStudent(index, 'classification', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-350 outline-none focus:ring-1 focus:ring-sky-400 text-xs text-slate-800"
                      >
                        <option value="Gen Ed, without any special accommodation">{tr('Gen Ed, without any special accommodation', 'Educación General, sin adaptaciones especiales')}</option>
                        <option value="Inclusion Buddy">{tr('Inclusion Buddy (Special Education)', 'Amigo de Inclusión (Educación Especial)')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{tr('Parent Google Account Email', 'Correo de Cuenta de Google del Padre/Madre')}</label>
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
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{tr('Award Delivery Type', 'Tipo de Entrega de Premio')}</label>
                      {student.school_district === 'Tracy Unified' || student.school_district === 'LUSD' ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-3 py-2 rounded-lg border border-indigo-200">
                            🏆 {tr('In-Person Ceremony', 'Ceremonia en Persona')}
                          </span>
                          <span className="text-[9px] text-slate-400">{tr('Locked for local Tracy/LUSD district partners', 'Bloqueado para socios de los distritos locales Tracy/LUSD')}</span>
                        </div>
                      ) : (
                        <select
                          value={student.award_delivery_type}
                          onChange={(e) => updateStudent(index, 'award_delivery_type', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-350 outline-none focus:ring-1 focus:ring-sky-400 text-xs text-slate-800"
                        >
                          <option value="VIRTUAL_DIGITAL">{tr('Virtual Digital Award', 'Premio Digital Virtual')}</option>
                          <option value="IN_PERSON_ONLY">{tr('In-Person Ceremony', 'Ceremonia en Persona')}</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Roster composition helper & validations */}
              <div className="p-4 bg-sky-50 rounded-2xl border border-sky-150 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-xs text-slate-700">
                  <div className="font-semibold text-slate-900">{tr('Current Cohort Composition:', 'Composición Actual del Grupo:')}</div>
                  <div className="flex gap-4 mt-1.5">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <div className="text-slate-600 font-medium">{tr('Gen Ed Students:', 'Estudiantes de Educación General:')} <strong className="text-slate-900">{peerMentors}</strong></div>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      {tr('Inclusion Buddies:', 'Amigos de Inclusión:')} <strong className="text-slate-900">{inclusionBuddies}</strong>
                    </span>
                  </div>
                </div>

                {ratioViolated ? (
                  <div className="flex-1 bg-red-50 border border-red-200 p-3 rounded-xl">
                    <div className="text-xs font-bold text-red-800 mb-1">
                      ⚠️ {tr('Ratio Alert (Needs at least 1 Inclusion Buddy for every 3 Gen Ed Students)', 'Alerta de Proporción (Se necesita al menos 1 Amigo de Inclusión por cada 3 Estudiantes de Educación General)')}
                    </div>
                    <label className="flex items-start gap-1.5 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ratioOverrideRequested}
                        onChange={(e) => setRatioOverrideRequested(e.target.checked)}
                        className="mt-0.5"
                      />
                      <span className="text-[11px] text-red-750 font-medium">
                        {tr('Request Admin Ratio Override', 'Solicitar Excepción de Proporción al Administrador')}
                      </span>
                    </label>
                    {ratioOverrideRequested && (
                      <textarea
                        value={overrideExplanation}
                        onChange={(e) => setOverrideExplanation(e.target.value)}
                        placeholder={tr('Briefly explain your scenario (e.g., waiting for matching buddies)...', 'Explica brevemente tu situación (ej. esperando amigos compatibles)...')}
                        className="w-full mt-2 p-2 border border-red-300 rounded text-xs outline-none focus:ring-1 focus:ring-red-400"
                        rows={2}
                      />
                    )}
                  </div>
                ) : peerMentors > 0 && inclusionBuddies > 0 ? (
                  <div className="text-xs bg-emerald-50 text-emerald-800 px-3.5 py-2 rounded-xl border border-emerald-200 font-semibold flex items-center gap-1.5">
                    ✓ {tr('Inclusion Buddy ratio constraints met!', '¡Se cumplen los requisitos de proporción de Amigos de Inclusión!')}
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
              <h3 className="text-xl font-bold text-slate-800">{tr('Step 4: Certifications & Legal Waiver', 'Paso 4: Certificaciones y Exención Legal')}</h3>
              <p className="text-xs text-slate-500 mt-1">{tr('Submit roster certifications as the primary Team Coordinator.', 'Envía las certificaciones del equipo como Coordinador Principal.')}</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs leading-relaxed text-slate-700">
                <h4 className="font-bold text-slate-850">{tr('Primary Head Coach Certification and Obligations:', 'Certificación y Obligaciones del Entrenador Principal:')}</h4>
                <p>
                  {tr("As the primary submitter (Head Coach), you are the administrative owner of this Aaria's Blue Elephant team. You acknowledge that Aaria's Blue Elephant is a 501(c)(3) nonprofit entity (Entity No. B20250299015).", "Como el remitente principal (Entrenador Principal), eres el propietario administrativo de este equipo de Aaria's Blue Elephant. Reconoces que Aaria's Blue Elephant es una entidad sin fines de lucro 501(c)(3) (Entidad No. B20250299015).")}
                </p>
                <p>
                  {tr('You agree to conduct your group projects in safe, sensory-friendly public spaces or consenting parent homes, ensuring inclusion and safety for children of all sensory profiles.', 'Aceptas realizar tus proyectos grupales en espacios públicos seguros y sensorialmente amigables, o en hogares de padres que consientan, garantizando la inclusión y seguridad de niños con todo tipo de perfil sensorial.')}
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
                    <span className="text-slate-900 font-bold block mb-0.5">{tr('I certify offline parental consents are obtained *', 'Certifico que se obtuvieron los consentimientos de los padres en papel *')}</span>
                    {tr('I verify that I have printed, distributed, and obtained physical/offline parent-signed waivers (Liability, Media Release, No-Face photography agreement) for all registered students prior to adding them to this database.', 'Verifico que he impreso, distribuido y obtenido exenciones físicas/en papel firmadas por los padres (Responsabilidad, Liberación de Medios, acuerdo de fotografía Sin Rostro) para todos los estudiantes registrados antes de agregarlos a esta base de datos.')}
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
                    <span className="text-slate-900 font-bold block mb-0.5">{tr('Accept Coordinator responsibilities *', 'Acepto las responsabilidades de Coordinador *')}</span>
                    {tr("I accept the duties of a Head Coach and agree to ensure all milestone videos are uploaded according to Aaria's Blue Elephant's privacy guardrails (unlisted YouTube URLs only, no child names in titles).", "Acepto los deberes de un Entrenador Principal y me comprometo a asegurar que todos los videos de hitos se suban según las normas de privacidad de Aaria's Blue Elephant (solo enlaces de YouTube no listados, sin nombres de niños en los títulos).")}
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
              className="px-5 py-2.5 rounded-xl border-2 border-slate-300 text-slate-700 hover:bg-slate-100 transition font-bold text-sm disabled:opacity-50"
            >
              {tr('Back', 'Atrás')}
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
                {tr('Skip for now', 'Omitir por ahora')}
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
              {loading ? tr('Registering...', 'Registrando...') : step === 4 ? tr('Submit Roster & Register Team', 'Enviar Lista y Registrar Equipo') : tr('Continue', 'Continuar')}
            </button>
          </div>
        </div>
      </form>


    </div>
  );
};
