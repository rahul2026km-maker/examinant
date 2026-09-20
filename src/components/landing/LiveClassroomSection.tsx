import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Radio, Calendar, Users, MessageSquare, Info, Bell, Check, 
  ChevronRight, X, Clock, Sparkles, Send, ShieldCheck,
  BookOpen, Download, ExternalLink
} from 'lucide-react';
import { liveClassService } from '../../services/liveClassService';
import type { LiveClass } from '../../types/liveClass.types';

interface LiveChatMessage {
  id: string;
  user: string;
  avatarBg: string;
  message: string;
  time: string;
  isFaculty?: boolean;
}

export default function LiveClassroomSection() {
  const navigate = useNavigate();

  // Modals state
  const [showLiveStreamModal, setShowLiveStreamModal] = useState(false);
  const [showClassInfoModal, setShowClassInfoModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  // Reminders state with localStorage persistence
  const [reminders, setReminders] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('examinant_live_reminders');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic Live countdown timer (starts at 45:12 like screenshot)
  const [secondsRemaining, setSecondsRemaining] = useState(45 * 60 + 12);

  // Dynamic student viewer count fluctuation for realism
  const [liveStudents, setLiveStudents] = useState(1248);
  const [messageCount, setMessageCount] = useState(256);

  // Schedule filter
  const [scheduleDay, setScheduleDay] = useState<'all' | 'today' | 'tomorrow' | 'week'>('all');
  const [selectedExam, setSelectedExam] = useState<string>('All');

  // Live Stream Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([
    { id: '1', user: 'Raj Sir (Faculty)', avatarBg: 'bg-rose-600', message: 'Welcome to Chapter 3! We are covering Ohm\'s Law & Resistance derivations.', time: '10:00 AM', isFaculty: true },
    { id: '2', user: 'Aryan Sharma', avatarBg: 'bg-blue-600', message: 'Sir does resistance depend on temperature for conductors?', time: '10:04 AM' },
    { id: '3', user: 'Priya Patel', avatarBg: 'bg-emerald-600', message: 'Crystal clear voice and board view!', time: '10:05 AM' },
    { id: '4', user: 'Kunal Verma', avatarBg: 'bg-purple-600', message: 'Ready with notebook and formula sheet sir 🚀', time: '10:07 AM' },
  ]);

  // Firestore live classes subscription
  const [firestoreClasses, setFirestoreClasses] = useState<LiveClass[]>([]);

  useEffect(() => {
    const unsub = liveClassService.subscribeToLiveClasses((classes) => {
      setFirestoreClasses(classes);
    });
    return () => unsub();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fluctuate viewers slightly every 4 seconds for a living platform feel
  useEffect(() => {
    const viewerInterval = setInterval(() => {
      const delta = Math.floor(Math.random() * 7) - 3;
      setLiveStudents((prev) => Math.max(1180, Math.min(1350, prev + delta)));
    }, 4000);
    return () => clearInterval(viewerInterval);
  }, []);

  const formatRemainingTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleToggleReminder = (id: string, title: string) => {
    const newState = !reminders[id];
    const updated = { ...reminders, [id]: newState };
    setReminders(updated);
    try {
      localStorage.setItem('examinant_live_reminders', JSON.stringify(updated));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }

    if (newState) {
      setToastMessage(`Reminder set for "${title}"! We'll notify you 15m before class.`);
    } else {
      setToastMessage(`Reminder removed for "${title}".`);
    }

    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg: LiveChatMessage = {
      id: Date.now().toString(),
      user: 'You',
      avatarBg: 'bg-indigo-600',
      message: chatInput.trim(),
      time: 'Just now'
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setMessageCount((prev) => prev + 1);
    setChatInput('');
  };

  // Dynamic active live class from Firestore or curated defaults
  const activeFirestoreLive = firestoreClasses.find(c => c.status === 'live');
  const liveSubject = activeFirestoreLive?.subject || 'PHYSICS';
  const liveTitle = activeFirestoreLive?.title || 'Current Electricity';
  const liveChapter = activeFirestoreLive?.description || "Chapter 3 • Ohm's Law & Resistance";
  const liveFaculty = activeFirestoreLive?.educatorName || 'Raj Sir';
  const liveFacultyRole = activeFirestoreLive?.educatorAvatar ? 'Senior Master Faculty' : 'B.Tech, IIT Delhi';
  const liveThumbnail = activeFirestoreLive?.thumbnailUrl || '/live_teacher_raj.jpg';
  const liveStreamUrl = activeFirestoreLive?.streamUrl
    ? (activeFirestoreLive.streamUrl.includes('watch?v=')
        ? activeFirestoreLive.streamUrl.replace('watch?v=', 'embed/')
        : activeFirestoreLive.streamUrl)
    : 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1';

  // Upcoming classes dataset matching reference screenshot combined with Firestore
  const curatedUpcoming = [
    {
      id: 'chem-101',
      subject: 'CHEMISTRY',
      subjectColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/40',
      title: 'Chemical Bonding',
      chapter: 'Chapter 5 • Ionic & Covalent Bond',
      faculty: 'Amit Sir',
      facultyRole: 'M.Sc. Chemistry, 10+ Yrs Exp',
      dayLabel: 'Today',
      dayColor: 'text-emerald-400',
      calBg: 'text-emerald-400',
      time: '6:30 PM',
      exam: 'JEE / NEET'
    },
    {
      id: 'math-102',
      subject: 'MATHEMATICS',
      subjectColor: 'text-purple-400 bg-purple-950/60 border-purple-800/40',
      title: 'Integration',
      chapter: 'Chapter 7 • Indefinite Integration',
      faculty: "Neha Ma'am",
      facultyRole: 'M.Tech IIT Roorkee',
      dayLabel: 'Tomorrow',
      dayColor: 'text-amber-400',
      calBg: 'text-amber-400',
      time: '5:00 PM',
      exam: 'JEE Mains & Adv'
    },
    {
      id: 'phy-103',
      subject: 'PHYSICS',
      subjectColor: 'text-blue-400 bg-blue-950/60 border-blue-800/40',
      title: 'Kinematics',
      chapter: 'Chapter 2 • Motion in a Straight Line',
      faculty: 'Raj Sir',
      facultyRole: 'B.Tech, IIT Delhi',
      dayLabel: 'Tomorrow',
      dayColor: 'text-sky-400',
      calBg: 'text-sky-400',
      time: '7:30 PM',
      exam: 'JEE / NEET / Boards'
    }
  ];

  // Dynamic upcoming classes merged with curated list
  const firestoreUpcoming = (firestoreClasses || [])
    .filter(c => c.status === 'upcoming')
    .map(c => ({
      id: c.id,
      subject: (c.subject || 'GENERAL').toUpperCase(),
      subjectColor: 'text-indigo-400 bg-indigo-950/60 border-indigo-800/40',
      title: c.title,
      chapter: c.description || 'Live Masterclass',
      faculty: c.educatorName || 'Faculty',
      facultyRole: 'Senior Educator',
      dayLabel: 'Upcoming',
      dayColor: 'text-indigo-400',
      calBg: 'text-indigo-400',
      time: c.scheduledStartTime
        ? new Date(c.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Upcoming',
      exam: c.examCategory || 'Exam'
    }));

  const upcomingClasses = firestoreUpcoming.length > 0
    ? [...firestoreUpcoming, ...curatedUpcoming].slice(0, 3)
    : curatedUpcoming;

  // Extended timetable schedule for the Schedule Modal
  const fullWeeklySchedule = [
    ...upcomingClasses,
    {
      id: 'bio-104',
      subject: 'BIOLOGY',
      subjectColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40',
      title: 'Cell Division & Genetics',
      chapter: 'Chapter 4 • Mitosis, Meiosis & DNA',
      faculty: 'Dr. Priya Rao',
      facultyRole: 'MBBS, AIIMS New Delhi',
      dayLabel: 'Wednesday',
      dayColor: 'text-emerald-300',
      calBg: 'text-emerald-400',
      time: '4:00 PM',
      exam: 'NEET'
    },
    {
      id: 'math-105',
      subject: 'MATHEMATICS',
      subjectColor: 'text-purple-400 bg-purple-950/60 border-purple-800/40',
      title: 'Probability & Permutations',
      chapter: 'Chapter 11 • Bayes Theorem & Combinatorics',
      faculty: 'Vikram Sir',
      facultyRole: 'Ex-Super 30 Faculty',
      dayLabel: 'Thursday',
      dayColor: 'text-indigo-400',
      calBg: 'text-indigo-400',
      time: '6:00 PM',
      exam: 'JEE / NDA'
    },
    {
      id: 'phy-106',
      subject: 'PHYSICS',
      subjectColor: 'text-blue-400 bg-blue-950/60 border-blue-800/40',
      title: 'Electrostatics & Gauss Law',
      chapter: 'Chapter 1 • Electric Flux & Dipoles',
      faculty: 'Raj Sir',
      facultyRole: 'B.Tech, IIT Delhi',
      dayLabel: 'Friday',
      dayColor: 'text-blue-400',
      calBg: 'text-blue-400',
      time: '7:30 PM',
      exam: 'JEE / NEET'
    },
    {
      id: 'chem-107',
      subject: 'CHEMISTRY',
      subjectColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/40',
      title: 'Thermodynamics & Enthalpy',
      chapter: 'Chapter 6 • Hess Law & Entropy',
      faculty: 'Amit Sir',
      facultyRole: 'M.Sc. Chemistry, 10+ Yrs Exp',
      dayLabel: 'Saturday',
      dayColor: 'text-cyan-300',
      calBg: 'text-cyan-400',
      time: '5:30 PM',
      exam: 'JEE / NEET / Boards'
    }
  ];

  const filteredSchedule = fullWeeklySchedule.filter((item) => {
    const matchesExam = selectedExam === 'All' || item.exam.toLowerCase().includes(selectedExam.toLowerCase());
    if (!matchesExam) return false;
    if (scheduleDay === 'today') return item.dayLabel === 'Today';
    if (scheduleDay === 'tomorrow') return item.dayLabel === 'Tomorrow';
    return true;
  });

  return (
    <section id="live-classroom" className="relative py-12 sm:py-16 bg-[#040814] text-white overflow-hidden scroll-mt-20 select-none">
      {/* Background ambient lighting effects matching dark UI */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute top-0 right-1/3 w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Outer Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Outer Section Card */}
        <div className="relative rounded-[28px] sm:rounded-[36px] bg-[#070D1F]/95 border border-[#17254E] p-5 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-xl">
          
          {/* TOP HEADER ROW */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#142042]">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                  Live Classroom
                </h2>
                {/* Glowing Live Indicator Dot */}
                <span className="relative flex h-3.5 w-3.5" title="Live Broadcast Active">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-600 shadow-[0_0_12px_#f43f5e]"></span>
                </span>
              </div>
              <p className="text-slate-400 text-sm sm:text-base font-normal mt-1">
                Live learning with expert faculty
              </p>
            </div>

            {/* Top Right "View Full Schedule" Button */}
            <button
              onClick={() => setShowScheduleModal(true)}
              className="self-start sm:self-auto group flex items-center gap-2 px-4 py-2.5 bg-[#0D1836] hover:bg-[#142452] border border-[#1F3166] text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 shadow-sm active:scale-95"
            >
              <Calendar size={16} className="text-indigo-400 group-hover:text-indigo-300" />
              <span>View Full Schedule</span>
              <ChevronRight size={15} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* SUB-NOTIFICATION BANNER */}
          <div className="mt-5 bg-[#09152B]/90 border border-emerald-500/30 text-emerald-300/90 rounded-xl px-4 py-2.5 flex items-center gap-3 text-xs sm:text-[13px] font-medium shadow-inner">
            <div className="w-5 h-5 rounded-md border border-emerald-400/40 bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck size={13} className="stroke-[2.5]" />
            </div>
            <span className="leading-snug">
              You're all set! Join live classes, interact with faculty and learn in real time.
            </span>
          </div>

          {/* MAIN TWO-COLUMN SECTION GRID */}
          <div className="mt-7 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
            
            {/* LEFT COLUMN: FEATURED LIVE NOW CLASS */}
            <div className="lg:col-span-7 flex flex-col justify-between bg-[#0B132B]/80 hover:bg-[#0C1530] transition-colors border border-[#192750] rounded-3xl p-5 sm:p-7 relative shadow-xl">
              
              {/* LIVE NOW Crimson Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E11D48] text-white text-[11px] font-black uppercase tracking-wider rounded-md shadow-[0_0_15px_rgba(225,29,72,0.4)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                  <span>LIVE NOW</span>
                </div>
                
                <span className="text-[11px] font-bold text-slate-400 hidden sm:inline-flex items-center gap-1.5">
                  <Clock size={13} className="text-indigo-400" />
                  <span>Started at 10:00 AM</span>
                </span>
              </div>

              {/* Class Content Container */}
              <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-5 sm:gap-6">
                
                {/* Educator Visual Container with Formulas & Countdown Overlay */}
                <div className="relative w-full sm:w-[220px] md:w-[240px] aspect-square rounded-2xl overflow-hidden border border-slate-700/60 shadow-lg shrink-0 bg-slate-950 group">
                  <img
                    src={liveThumbnail}
                    alt={`${liveFaculty} - ${liveSubject} Faculty`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      // Fallback in case image asset is loading
                      (e.target as HTMLImageElement).src = "/student_mascot.png";
                    }}
                  />
                  
                  {/* Subtle vignette gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>

                  {/* Overlaid Live & Remaining Time Badge */}
                  <div className="absolute bottom-3 left-3 right-3 sm:right-auto bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 flex items-center justify-center sm:justify-start gap-2 text-xs font-bold text-white shadow-xl">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    <span className="text-[11px] font-black tracking-wide text-rose-400">LIVE</span>
                    <span className="text-slate-400 font-normal">|</span>
                    <span className="text-[11px] font-mono font-bold tracking-tight text-slate-200">
                      {formatRemainingTime(secondsRemaining)} remaining
                    </span>
                  </div>
                </div>

                {/* Right Details of Featured Class */}
                <div className="flex-1 flex flex-col justify-between py-1 text-center sm:text-left min-w-0">
                  <div>
                    {/* Subject Tag */}
                    <div className="inline-block">
                      <span className="px-3 py-1 bg-[#2C1844] border border-[#6B2496] text-[#D8B4FE] text-[10px] font-extrabold uppercase tracking-widest rounded-full">
                        {liveSubject}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight mt-2 tracking-tight">
                      {liveTitle}
                    </h3>

                    {/* Subtitle / Chapter */}
                    <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1">
                      {liveChapter}
                    </p>

                    {/* Educator Profile Card */}
                    <div className="flex items-center justify-center sm:justify-start gap-3 mt-4 pt-3 border-t border-slate-800/60">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-indigo-500/40 shadow-sm shrink-0 bg-slate-800">
                        <img
                          src={liveThumbnail}
                          alt={liveFaculty}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-extrabold text-white leading-none">{liveFaculty}</h4>
                        <p className="text-[11px] text-slate-400 font-medium mt-1">{liveFacultyRole}</p>
                      </div>
                    </div>
                  </div>

                  {/* Real-time Metric Stats Row */}
                  <div className="grid grid-cols-2 gap-3 mt-5 pt-3 border-t border-slate-800/60">
                    <div className="flex items-center justify-center sm:justify-start gap-2.5 p-2 rounded-xl bg-white/[0.02]">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                        <Users size={14} />
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-black text-white leading-none block">
                          {(liveStudents / 1000).toFixed(1)}K
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium leading-none block mt-0.5">
                          Students Live
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center sm:justify-start gap-2.5 p-2 rounded-xl bg-white/[0.02]">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                        <MessageSquare size={14} />
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-black text-white leading-none block">
                          {messageCount}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium leading-none block mt-0.5">
                          Live Messages
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-col sm:flex-row items-center gap-3 mt-6 pt-5 border-t border-[#172550]">
                <button
                  onClick={() => setShowLiveStreamModal(true)}
                  className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white font-extrabold text-sm shadow-[0_0_25px_rgba(99,102,241,0.45)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] flex items-center justify-center gap-2.5 transition-all duration-300 hover:scale-[1.01] active:scale-95"
                >
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                  <span>Join Live Class</span>
                </button>

                <button
                  onClick={() => setShowClassInfoModal(true)}
                  className="w-full sm:w-auto py-3.5 px-6 rounded-xl bg-transparent hover:bg-white/5 border border-slate-700/80 text-slate-300 hover:text-white font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
                >
                  <Info size={16} className="text-slate-400" />
                  <span>Class Info</span>
                </button>
              </div>

            </div>

            {/* RIGHT COLUMN: UPCOMING CLASSES */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              
              <div>
                {/* Header with "View All" */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                    Upcoming Classes
                  </h3>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="text-xs sm:text-sm font-extrabold text-[#C084FC] hover:text-purple-300 flex items-center gap-1 transition-colors group"
                  >
                    <span>View All</span>
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                {/* 3 Upcoming Class Cards */}
                <div className="space-y-3.5">
                  {upcomingClasses.map((item) => {
                    const isReminderSet = !!reminders[item.id];

                    return (
                      <div
                        key={item.id}
                        className="bg-[#0B132B]/75 hover:bg-[#0E1A3C] border border-[#18264E] hover:border-indigo-500/40 rounded-2xl p-4 transition-all duration-300 flex items-center justify-between gap-3 sm:gap-4 group shadow-sm hover:shadow-md"
                      >
                        {/* Left: Date/Time Badge */}
                        <div className="flex flex-col items-center justify-center w-16 sm:w-18 shrink-0 text-center border-r border-slate-800/80 pr-3 sm:pr-4">
                          <Calendar size={18} className={item.calBg} />
                          <span className={`text-[11px] font-black mt-1 ${item.dayColor}`}>
                            {item.dayLabel}
                          </span>
                          <span className="text-[10px] font-bold text-slate-300 mt-0.5">
                            {item.time}
                          </span>
                        </div>

                        {/* Middle: Subject, Title, Topic & Faculty */}
                        <div className="flex-1 min-w-0">
                          <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${item.subjectColor}`}>
                            {item.subject}
                          </span>
                          <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate mt-1">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {item.chapter}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium mt-1 flex items-center gap-1">
                            <span className="text-slate-400 font-semibold">{item.faculty}</span>
                          </p>
                        </div>

                        {/* Right: Set Reminder Toggle Button */}
                        <button
                          onClick={() => handleToggleReminder(item.id, item.title)}
                          className={`shrink-0 py-2 px-3 sm:px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-200 active:scale-95 ${
                            isReminderSet
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                              : 'bg-indigo-950/40 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-800/50'
                          }`}
                          title={isReminderSet ? 'Click to remove reminder' : 'Set class reminder'}
                        >
                          {isReminderSet ? (
                            <>
                              <Check size={13} className="text-emerald-400 stroke-[3]" />
                              <span className="hidden sm:inline">Set</span>
                            </>
                          ) : (
                            <>
                              <Bell size={13} />
                              <span>Set Reminder</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Schedule Button */}
              <button
                onClick={() => setShowScheduleModal(true)}
                className="w-full mt-4 py-3 bg-[#0B132B]/80 hover:bg-[#111C3D] border border-[#1B2750] hover:border-indigo-500/40 text-slate-300 hover:text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-sm"
              >
                <Calendar size={15} className="text-indigo-400" />
                <span>View Full Schedule</span>
              </button>

            </div>

          </div>

        </div>

      </div>

      {/* TOAST ALERT NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0B152B] border border-indigo-500/50 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-md">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Check size={16} className="stroke-[2.5]" />
          </div>
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-auto text-slate-400 hover:text-white">
            <X size={15} />
          </button>
        </div>
      )}

      {/* 1. LIVE STREAM PLAYER MODAL */}
      {showLiveStreamModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[#0A1024] border border-[#1A2A54] rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-[#070D1F] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className="px-2.5 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center gap-1 shrink-0 animate-pulse">
                  <Radio size={12} /> LIVE BROADCAST
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-white truncate">
                  Current Electricity: Chapter 3 • Ohm's Law & Resistance
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/courses')}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  <span>Go to Full Classroom</span>
                  <ExternalLink size={12} />
                </button>

                <button
                  onClick={() => setShowLiveStreamModal(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Stream + Chat Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
              
              {/* Video Player Column */}
              <div className="lg:col-span-8 bg-black flex flex-col justify-between">
                <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                  <iframe
                    className="w-full h-full border-0"
                    src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&mute=0"
                    title="Live Class Broadcast"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                  {/* Live Watermark Overlay */}
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 flex items-center gap-2 pointer-events-none">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    <span className="text-[11px] font-bold text-white">Examinant Live • 1080p 60fps</span>
                  </div>
                </div>

                {/* Faculty & Stream Details Bar */}
                <div className="p-4 bg-[#080E21] border-t border-slate-800/80 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-indigo-500/50 bg-slate-800 shrink-0">
                      <img src="/live_teacher_raj.jpg" alt="Raj Sir" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white">Raj Sir (B.Tech, IIT Delhi)</h4>
                      <p className="text-xs text-slate-400">Senior Physics Master Faculty • JEE Advanced Specialist</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-3 py-1.5 rounded-xl font-bold">
                      <Users size={14} />
                      <span>{liveStudents} Watching</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-time Interactive Chat Column */}
              <div className="lg:col-span-4 bg-[#070D1F] border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col h-[360px] lg:h-auto">
                {/* Chat Header */}
                <div className="p-3.5 bg-[#0A1229] border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={15} className="text-indigo-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-white">Live Student Doubts</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold bg-white/5 px-2 py-0.5 rounded-full">
                    {chatMessages.length} Messages
                  </span>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className="text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-bold ${msg.isFaculty ? 'text-rose-400 flex items-center gap-1' : 'text-slate-300'}`}>
                          {msg.isFaculty && <Sparkles size={11} />}
                          {msg.user}
                        </span>
                        <span className="text-[10px] text-slate-500">{msg.time}</span>
                      </div>
                      <p className={`p-2.5 rounded-xl leading-relaxed ${msg.isFaculty ? 'bg-rose-950/40 border border-rose-800/40 text-rose-200 font-medium' : 'bg-white/5 text-slate-200'}`}>
                        {msg.message}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendChat} className="p-3 bg-[#091024] border-t border-slate-800 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask a doubt live to Raj Sir..."
                    className="flex-1 bg-white/5 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center transition-colors"
                  >
                    <Send size={13} />
                  </button>
                </form>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 2. CLASS INFO MODAL */}
      {showClassInfoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0A1024] border border-[#1C2C58] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-6 bg-[#070D1F] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white">Lecture Syllabus & Details</h3>
                  <p className="text-xs text-slate-400">Current Electricity • Chapter 3</p>
                </div>
              </div>
              <button
                onClick={() => setShowClassInfoModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              
              {/* Faculty Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0E1B3E] to-[#141238] border border-indigo-500/30 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-indigo-400 shrink-0">
                  <img src="/live_teacher_raj.jpg" alt="Raj Sir" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-black text-white">Raj Sir</h4>
                    <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md">
                      IIT Delhi Alumni
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">8+ Years of Mentoring JEE (Mains & Advanced) / NEET aspirants</p>
                  <p className="text-[11px] text-slate-400 mt-1">Guided 50,000+ students, 120+ selections in AIR Top 500.</p>
                </div>
              </div>

              {/* Topics Covered in This Session */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                  <Sparkles size={14} className="text-indigo-400" />
                  <span>Key Concepts Covered in This Lecture</span>
                </h4>
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                    <span><strong>Electric Current & Drift Velocity:</strong> Microscopic view of current density ($J = \sigma E$), mobility of charge carriers.</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                    <span><strong>Ohm's Law & Resistance:</strong> Factors affecting resistance, resistivity, and temperature coefficient of resistance ($\alpha$).</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                    <span><strong>Kirchhoff's Laws:</strong> Junction Rule (KCL) & Loop Rule (KVL) with rigorous problem-solving shortcuts.</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0">4</span>
                    <span><strong>Wheatstone Bridge:</strong> Balanced and unbalanced bridge circuit simplification.</span>
                  </div>
                </div>
              </div>

              {/* Study Materials */}
              <div className="p-4 rounded-2xl bg-[#080E21] border border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Download size={18} className="text-indigo-400" />
                  <div>
                    <h5 className="text-xs font-bold text-white">Daily Practice Problems (DPP) & Notes</h5>
                    <p className="text-[11px] text-slate-400">Current_Electricity_DPP_03.pdf (25 Questions with Answer Key)</p>
                  </div>
                </div>
                <button
                  onClick={() => alert("Downloading DPP 03 & Handwritten notes...")}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Download
                </button>
              </div>

            </div>

            {/* Footer */}
            <div className="p-5 bg-[#070D1F] border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowClassInfoModal(false)}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowClassInfoModal(false);
                  setShowLiveStreamModal(true);
                }}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-indigo-600/30"
              >
                Join Live Stream
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 3. VIEW FULL SCHEDULE MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0A1024] border border-[#1C2C58] rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-5 bg-[#070D1F] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white">Full Weekly Live Schedule</h3>
                  <p className="text-xs text-slate-400">Never miss a live interactive masterclass</p>
                </div>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="p-4 bg-[#080E21] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-slate-800">
                {(['all', 'today', 'tomorrow', 'week'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setScheduleDay(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                      scheduleDay === tab ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab === 'week' ? 'This Week' : tab}
                  </button>
                ))}
              </div>

              {/* Target Exam Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-medium">Exam:</span>
                {['All', 'JEE', 'NEET'].map((exam) => (
                  <button
                    key={exam}
                    onClick={() => setSelectedExam(exam)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      selectedExam === exam ? 'bg-white/15 text-white border border-white/20' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {exam}
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule List */}
            <div className="p-5 space-y-3 overflow-y-auto flex-1">
              {filteredSchedule.map((item) => {
                const isReminderSet = !!reminders[item.id];

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-[#070D1F] border border-slate-800/80 hover:border-indigo-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 text-center shrink-0 border-r border-slate-800 pr-3">
                        <span className={`text-xs font-black block ${item.dayColor}`}>{item.dayLabel}</span>
                        <span className="text-[11px] font-bold text-slate-300 mt-0.5 block">{item.time}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${item.subjectColor}`}>
                            {item.subject}
                          </span>
                          <span className="text-[10px] text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded font-bold">
                            {item.exam}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1">{item.title}</h4>
                        <p className="text-xs text-slate-400">{item.chapter} • <span className="text-slate-300 font-semibold">{item.faculty}</span></p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleReminder(item.id, item.title)}
                      className={`self-end sm:self-auto py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        isReminderSet
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                          : 'bg-indigo-950/40 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-800/50'
                      }`}
                    >
                      {isReminderSet ? (
                        <>
                          <Check size={14} className="text-emerald-400 stroke-[3]" />
                          <span>Reminder Set</span>
                        </>
                      ) : (
                        <>
                          <Bell size={14} />
                          <span>Set Reminder</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#070D1F] border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">All timings in Indian Standard Time (IST)</span>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  );
}
