import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, CheckCircle2, Bookmark, FileText, ChevronRight, 
  X, CheckSquare, Sparkles, Download, 
  ExternalLink, Check
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { entitlementService } from '../../services/entitlementService';

interface LectureItem {
  id: string;
  subject: string;
  subjectColor: string;
  badgeBg: string;
  badgeBorder: string;
  progressColor: string;
  title: string;
  subtitle: string;
  educatorName: string;
  educatorAvatar: string;
  thumbnail: string;
  graphicType?: 'image' | 'math' | 'motion';
  graphicUrl?: string;
  currentTime: string;
  totalTime: string;
  progressPercent: number;
  notesTitle?: string;
  videoUrl?: string;
}

const DEFAULT_FEATURED: LectureItem = {
  id: 'lec-phy-curr',
  subject: 'PHYSICS',
  subjectColor: 'text-emerald-400',
  badgeBg: 'bg-emerald-950/60',
  badgeBorder: 'border-emerald-800/50',
  progressColor: 'from-emerald-500 to-green-400',
  title: 'Current Electricity',
  subtitle: 'Lecture 4: Combination of Resistors',
  educatorName: 'Raj Sir',
  educatorAvatar: '/live_teacher_raj.jpg',
  thumbnail: '/physics_lab_circuit.jpg',
  currentTime: '45:32',
  totalTime: '65:10',
  progressPercent: 68,
  notesTitle: 'Combination_of_Resistors_Handwritten_Notes.pdf',
  videoUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1'
};

const RECENTLY_WATCHED_ITEMS: LectureItem[] = [
  {
    id: 'lec-chem-bond',
    subject: 'CHEMISTRY',
    subjectColor: 'text-cyan-400',
    badgeBg: 'bg-cyan-950/60',
    badgeBorder: 'border-cyan-800/40',
    progressColor: 'from-cyan-500 to-blue-500',
    title: 'Chemical Bonding',
    subtitle: 'Lecture 3: Hybridization',
    educatorName: 'Amit Sir',
    educatorAvatar: '/live_teacher_raj.jpg',
    thumbnail: '/chemistry_molecule_3d.jpg',
    graphicType: 'image',
    graphicUrl: '/chemistry_molecule_3d.jpg',
    currentTime: '32:10',
    totalTime: '61:20',
    progressPercent: 52,
    notesTitle: 'Hybridization_SP_SP2_SP3_Notes.pdf'
  },
  {
    id: 'lec-math-int',
    subject: 'MATHEMATICS',
    subjectColor: 'text-purple-400',
    badgeBg: 'bg-purple-950/60',
    badgeBorder: 'border-purple-800/40',
    progressColor: 'from-purple-500 to-indigo-500',
    title: 'Integration',
    subtitle: 'Lecture 2: Basic Integrals',
    educatorName: "Neha Ma'am",
    educatorAvatar: '/live_teacher_raj.jpg',
    thumbnail: '/chemistry_molecule_3d.jpg',
    graphicType: 'math',
    currentTime: '28:45',
    totalTime: '64:30',
    progressPercent: 44,
    notesTitle: 'Standard_Integrals_Substitution_Sheet.pdf'
  },
  {
    id: 'lec-phy-kin',
    subject: 'PHYSICS',
    subjectColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-950/60',
    badgeBorder: 'border-emerald-800/40',
    progressColor: 'from-emerald-500 to-teal-400',
    title: 'Kinematics',
    subtitle: 'Lecture 1: Motion in a Straight Line',
    educatorName: 'Raj Sir',
    educatorAvatar: '/live_teacher_raj.jpg',
    thumbnail: '/physics_lab_circuit.jpg',
    graphicType: 'motion',
    currentTime: '40:12',
    totalTime: '48:20',
    progressPercent: 83,
    notesTitle: 'Equations_of_Motion_Calculus_Approach.pdf'
  },
  {
    id: 'lec-zoo-phys',
    subject: 'ZOOLOGY',
    subjectColor: 'text-amber-400',
    badgeBg: 'bg-amber-950/60',
    badgeBorder: 'border-amber-800/40',
    progressColor: 'from-amber-500 to-orange-500',
    title: 'Human Physiology',
    subtitle: 'Lecture 2: Blood',
    educatorName: 'Dr. Priya Rao',
    educatorAvatar: '/live_teacher_raj.jpg',
    thumbnail: '/anatomical_heart_3d.jpg',
    graphicType: 'image',
    graphicUrl: '/anatomical_heart_3d.jpg',
    currentTime: '21:18',
    totalTime: '57:30',
    progressPercent: 37,
    notesTitle: 'Blood_Corpuscles_Circulation_Diagrams.pdf'
  }
];

export default function ContinueLearningSection() {
  const navigate = useNavigate();
  const carouselRef = useRef<HTMLDivElement>(null);
  const auth = useAuth();
  const currentUser = auth?.currentUser;

  // Active featured lecture (can be swapped when clicking a recently watched item)
  const [activeLecture, setActiveLecture] = useState<LectureItem>(DEFAULT_FEATURED);

  // Modals state
  const [showVideoModal, setShowVideoModal] = useState<boolean>(false);
  const [showNotesModal, setShowNotesModal] = useState<boolean>(false);
  const [showAllCoursesModal, setShowAllCoursesModal] = useState<boolean>(false);

  // Bookmark state & toast
  const [bookmarkedLectures, setBookmarkedLectures] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('examinant_saved_bookmarks');
      return saved ? JSON.parse(saved) : { 'lec-phy-curr': true };
    } catch {
      return { 'lec-phy-curr': true };
    }
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Real student enrolled courses fetch
  useEffect(() => {
    const loadRealEnrollments = async () => {
      if (!currentUser) return;
      try {
        const enrollments = await entitlementService.getStudentEnrollments(currentUser.uid);
        if (enrollments && enrollments.length > 0) {
          const first = enrollments[0];
          setActiveLecture(prev => ({
            ...prev,
            id: first.id,
            title: first.courseTitle || prev.title,
            subtitle: first.batchName ? `Batch: ${first.batchName}` : prev.subtitle,
            progressPercent: first.progressPercent || prev.progressPercent,
            subject: (first.examCategory || 'GENERAL').toUpperCase(),
            thumbnail: first.thumbnailUrl || prev.thumbnail
          }));
        }
      } catch (err) {
        console.warn("Could not fetch real enrollments:", err);
      }
    };
    loadRealEnrollments();
  }, [currentUser]);

  const scrollCarouselRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const handleToggleBookmark = (id: string, title: string) => {
    const isBookmarked = !bookmarkedLectures[id];
    const updated = { ...bookmarkedLectures, [id]: isBookmarked };
    setBookmarkedLectures(updated);
    try {
      localStorage.setItem('examinant_saved_bookmarks', JSON.stringify(updated));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }

    if (isBookmarked) {
      setToastMessage(`"${title}" saved to your study bookmarks!`);
    } else {
      setToastMessage(`Removed from bookmarks.`);
    }

    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleDownloadNotesFile = () => {
    const noteContent = `EXAMINANT REVISION HANDOUT
Course: ${activeLecture.title}
Topic: ${activeLecture.subtitle}
Faculty: ${activeLecture.educatorName}
==================================================
Key Formulas & Concepts:
1. Series Combination: Rs = R1 + R2 + ... + Rn (Current remains same through all elements)
2. Parallel Combination: 1/Rp = 1/R1 + 1/R2 + ... + 1/Rn (Potential difference remains same across all branches)
3. Voltage Divider Rule: V1 = V * (R1 / (R1 + R2))
4. Current Divider Rule: I1 = I * (R2 / (R1 + R2))
5. Temperature Dependence: R(T) = R0 * (1 + alpha * Delta_T)

Study tip: Practice 10 numerical problems from DPP 04 today.
Examinant All India Learning Portal: https://examinantt.com
`;
    const blob = new Blob([noteContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeLecture.title.replace(/\s+/g, '_')}_Notes.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setToastMessage(`Downloaded ${activeLecture.title} Notes!`);
  };

  const handleSaveProgress = () => {
    const newProgress = Math.min(100, activeLecture.progressPercent + 5);
    setActiveLecture(prev => ({ ...prev, progressPercent: newProgress }));
    setToastMessage(`Progress saved! Updated to ${newProgress}% Completed.`);
    setShowVideoModal(false);
  };

  const handleSelectRecent = (item: LectureItem) => {
    setActiveLecture(item);
  };

  const handlePlayLecture = (item: LectureItem) => {
    setActiveLecture(item);
    setShowVideoModal(true);
  };

  return (
    <section id="continue-learning" className="relative py-12 sm:py-16 bg-[#03090F] text-white overflow-hidden scroll-mt-20 select-none">
      {/* Ambient background glow matching dark emerald/cyan palette */}
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/[0.07] rounded-full blur-[160px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-teal-500/[0.06] rounded-full blur-[140px] pointer-events-none"></div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Main Section Card */}
        <div className="relative rounded-[28px] sm:rounded-[36px] bg-[#051119]/95 border border-[#0F2830] p-5 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-xl">
          
          {/* HEADER ROW */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#0C2028]">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                Continue Learning
              </h2>
              <p className="text-slate-400 text-sm sm:text-base font-normal mt-1">
                Pick up where you left off and keep your momentum going.
              </p>
            </div>

            {/* View All My Courses Button */}
            <button
              onClick={() => navigate('/courses')}
              className="self-start sm:self-auto group flex items-center gap-2 px-4 py-2.5 bg-[#091F26] hover:bg-[#0E2C36] border border-[#133A44] hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-300 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 shadow-sm active:scale-95"
            >
              <span>View All My Courses</span>
              <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* MAIN FEATURED "IN PROGRESS" CARD */}
          <div className="mt-7 rounded-3xl bg-[#071720]/80 hover:bg-[#091C27] border border-[#10303A] p-5 sm:p-7 relative shadow-xl transition-all duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              
              {/* Left Column: Physics Laboratory Thumbnail with "In Progress" & Play Button */}
              <div className="lg:col-span-4 relative aspect-[4/3] rounded-2xl overflow-hidden border border-slate-700/60 shadow-lg bg-black group">
                <img
                  src={activeLecture.thumbnail}
                  alt={activeLecture.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/physics_lab_circuit.jpg";
                  }}
                />

                {/* In Progress Pill Badge */}
                <div className="absolute top-3 left-3 bg-[#031E18]/90 border border-emerald-500/50 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[11px] font-black text-emerald-300 tracking-wider">
                    In Progress
                  </span>
                </div>

                {/* Center Big Play Button Overlay */}
                <button
                  onClick={() => setShowVideoModal(true)}
                  className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:scale-110 hover:bg-emerald-500 hover:text-slate-950 transition-all duration-300 shadow-2xl group/play"
                  title="Play Lecture"
                >
                  <Play size={22} className="ml-1 fill-current" />
                </button>
              </div>

              {/* Right Column: Lecture Details, Metadata, Progress Bar & Actions */}
              <div className="lg:col-span-8 flex flex-col justify-between h-full">
                
                {/* Top Row: Subject Badge & Primary "Continue Learning" CTA */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className={`px-3 py-1 ${activeLecture.badgeBg} border ${activeLecture.badgeBorder} ${activeLecture.subjectColor} text-[10px] font-extrabold uppercase tracking-widest rounded-full`}>
                    {activeLecture.subject}
                  </span>

                  <button
                    onClick={() => setShowVideoModal(true)}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-400 hover:to-green-300 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center gap-2 transition-all duration-200 active:scale-95"
                  >
                    <Play size={16} className="fill-slate-950 stroke-slate-950" />
                    <span>Continue Learning</span>
                  </button>
                </div>

                {/* Title & Subtitle */}
                <div className="mt-3">
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight tracking-tight">
                    {activeLecture.title}
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1">
                    {activeLecture.subtitle}
                  </p>
                </div>

                {/* Metadata Row: Educator, Time, Notes, Bookmark */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-5 text-xs text-slate-300">
                  {/* Educator with Verified Tick */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-emerald-500/40 bg-slate-800 shrink-0">
                      <img
                        src={activeLecture.educatorAvatar}
                        alt={activeLecture.educatorName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="font-extrabold text-white">{activeLecture.educatorName}</span>
                    <CheckCircle2 size={13} className="text-emerald-400 fill-emerald-400/20" />
                  </div>

                  <span className="text-slate-600 hidden sm:inline">|</span>

                  {/* Timestamp */}
                  <div className="flex items-center gap-1 font-mono font-bold">
                    <span className="text-emerald-400">{activeLecture.currentTime}</span>
                    <span className="text-slate-500">/</span>
                    <span className="text-slate-400">{activeLecture.totalTime}</span>
                  </div>

                  <span className="text-slate-600 hidden sm:inline">|</span>

                  {/* Notes Button */}
                  <button
                    onClick={() => setShowNotesModal(true)}
                    className="flex items-center gap-1.5 text-slate-300 hover:text-emerald-400 transition-colors py-1 px-2 rounded-lg hover:bg-white/5 font-semibold"
                  >
                    <Download size={13} />
                    <span>Notes</span>
                  </button>

                  <span className="text-slate-600 hidden sm:inline">|</span>

                  {/* Bookmark Button */}
                  <button
                    onClick={() => handleToggleBookmark(activeLecture.id, activeLecture.title)}
                    className={`flex items-center gap-1.5 transition-colors py-1 px-2 rounded-lg font-semibold ${
                      bookmarkedLectures[activeLecture.id]
                        ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40'
                        : 'text-slate-300 hover:text-emerald-400 hover:bg-white/5'
                    }`}
                  >
                    <Bookmark size={13} className={bookmarkedLectures[activeLecture.id] ? 'fill-emerald-400 text-emerald-400' : ''} />
                    <span>{bookmarkedLectures[activeLecture.id] ? 'Bookmarked' : 'Bookmark'}</span>
                  </button>
                </div>

                {/* Progress Bar & Percentage */}
                <div className="mt-6 flex items-center gap-4">
                  <div className="flex-1 h-2 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div
                      className={`h-full bg-gradient-to-r ${activeLecture.progressColor} rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)] transition-all duration-500`}
                      style={{ width: `${activeLecture.progressPercent}%` }}
                    />
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-emerald-400 shrink-0">
                    {activeLecture.progressPercent}% Completed
                  </span>
                </div>

              </div>

            </div>
          </div>

          {/* RECENTLY WATCHED SUB-SECTION */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare size={17} className="text-emerald-400" />
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Recently Watched
                </h3>
              </div>

              <button
                onClick={() => setShowAllCoursesModal(true)}
                className="text-xs sm:text-sm font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors group"
              >
                <span>See All</span>
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Carousel Container with Right Arrow Button */}
            <div className="relative group/carousel">
              <div
                ref={carouselRef}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [scrollbar-width:none] py-1"
              >
                {RECENTLY_WATCHED_ITEMS.map((item) => {
                  const isCurrent = activeLecture.id === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectRecent(item)}
                      className={`cursor-pointer rounded-2xl bg-[#071620]/90 hover:bg-[#0A1E2B] border p-4 flex flex-col justify-between transition-all duration-300 group/card relative overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 ${
                        isCurrent ? 'border-emerald-500/70 ring-1 ring-emerald-500/40' : 'border-[#0F2933] hover:border-emerald-500/40'
                      }`}
                    >
                      {/* Top Row: Subject Tag + Graphic Visual */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${item.badgeBg} ${item.badgeBorder} ${item.subjectColor}`}>
                            {item.subject}
                          </span>
                          <h4 className="text-sm font-bold text-white group-hover/card:text-emerald-300 transition-colors mt-2 leading-snug line-clamp-1">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {item.subtitle}
                          </p>
                        </div>

                        {/* Graphic Art on Top Right */}
                        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center relative bg-black/40">
                          {item.graphicType === 'math' ? (
                            <div className="font-serif italic text-purple-400 text-lg font-black tracking-tighter text-center leading-none">
                              <span>∫</span>
                              <span className="text-[10px] ml-0.5 not-italic font-mono block">dx/x</span>
                            </div>
                          ) : item.graphicType === 'motion' ? (
                            <div className="relative w-10 h-10 flex items-center justify-center">
                              <span className="w-4 h-4 rounded-full bg-emerald-400/90 shadow-[0_0_10px_#34d399] absolute left-1"></span>
                              <span className="w-3 h-3 rounded-full bg-teal-300/80 absolute right-1"></span>
                              <span className="w-2 h-2 rounded-full bg-emerald-200/60 absolute bottom-1"></span>
                            </div>
                          ) : (
                            <img
                              src={item.graphicUrl}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-300"
                            />
                          )}

                          {/* Mini play button overlay */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayLecture(item);
                            }}
                            className="absolute inset-0 m-auto w-7 h-7 rounded-full bg-black/70 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white opacity-0 group-hover/card:opacity-100 transition-opacity hover:scale-110"
                            title="Play"
                          >
                            <Play size={11} className="ml-0.5 fill-white" />
                          </button>
                        </div>
                      </div>

                      {/* Bottom Row: Progress Bar & Timestamp */}
                      <div className="mt-4 pt-3 border-t border-slate-800/60">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1.5">
                          <span className="text-slate-400">{item.currentTime} / {item.totalTime}</span>
                          <span className={item.subjectColor}>{item.progressPercent}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${item.progressColor} rounded-full`}
                            style={{ width: `${item.progressPercent}%` }}
                          />
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Next Arrow Button for Carousel */}
              <button
                onClick={scrollCarouselRight}
                className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#0A202A] hover:bg-emerald-600 text-slate-300 hover:text-white border border-[#163B47] items-center justify-center shadow-xl transition-all duration-200 hover:scale-110 z-20"
                title="Next"
              >
                <ChevronRight size={18} />
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* TOAST ALERT NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#091C25] border border-emerald-500/50 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-md">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Check size={16} className="stroke-[2.5]" />
          </div>
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-auto text-slate-400 hover:text-white">
            <X size={15} />
          </button>
        </div>
      )}

      {/* 1. VIDEO LECTURE PLAYER MODAL */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[#07131B] border border-[#12313C] rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            
            {/* Header */}
            <div className="p-4 sm:p-5 bg-[#050E15] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`px-2.5 py-0.5 ${activeLecture.badgeBg} ${activeLecture.subjectColor} border ${activeLecture.badgeBorder} text-[10px] font-black rounded-full uppercase tracking-wider shrink-0`}>
                  {activeLecture.subject}
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-white truncate">
                  {activeLecture.title}: {activeLecture.subtitle}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/courses')}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition-colors"
                >
                  <span>Open Full Course</span>
                  <ExternalLink size={12} />
                </button>
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                className="w-full h-full border-0"
                src={activeLecture.videoUrl || "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1"}
                title={activeLecture.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Player Controls & Info Bar */}
            <div className="p-5 bg-[#050E15] border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-emerald-500/50 bg-slate-800 shrink-0">
                  <img src={activeLecture.educatorAvatar} alt={activeLecture.educatorName} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    <span>{activeLecture.educatorName}</span>
                    <CheckCircle2 size={13} className="text-emerald-400" />
                  </h4>
                  <p className="text-xs text-slate-400">Current Progress: {activeLecture.progressPercent}% ({activeLecture.currentTime} / {activeLecture.totalTime})</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadNotesFile}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-slate-700/60 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <Download size={13} />
                  <span>Download Notes</span>
                </button>
                <button
                  onClick={handleSaveProgress}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-colors shadow-lg shadow-emerald-500/20"
                >
                  Save & Exit
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. LECTURE NOTES MODAL */}
      {showNotesModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#07131B] border border-[#13333F] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="p-5 bg-[#050E15] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Lecture Study Notes</h3>
                  <p className="text-xs text-slate-400">{activeLecture.title} • {activeLecture.subtitle}</p>
                </div>
              </div>
              <button
                onClick={() => setShowNotesModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-[#0A1A22] border border-[#14323E] space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  Included Content
                </span>
                <h4 className="text-sm font-bold text-white">Handwritten Faculty Class Handout</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Contains all derivations, series & parallel formulas, equivalent resistance shortcuts, and solved numerical problems from this lecture.
                </p>
                <div className="pt-2 text-xs text-slate-300 font-mono flex items-center gap-2">
                  <span>File:</span>
                  <span className="text-emerald-400">{activeLecture.notesTitle || 'Lecture_Handwritten_Notes.pdf'}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 text-xs text-slate-300">
                <h5 className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-400" />
                  <span>Key Formulas in this Lecture:</span>
                </h5>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>Series Equivalent: $R_s = R_1 + R_2 + ... + R_n$</li>
                  <li>Parallel Equivalent: $\frac{1}{R_p} = \frac{1}{R_1} + \frac{1}{R_2}$</li>
                  <li>Voltage Divider & Current Divider Shortcut Rules</li>
                </ul>
              </div>
            </div>

            <div className="p-5 bg-[#050E15] border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowNotesModal(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDownloadNotesFile();
                  setShowNotesModal(false);
                }}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25"
              >
                <Download size={14} />
                <span>Download Handout</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 3. ALL COURSES / HISTORY MODAL */}
      {showAllCoursesModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#07131B] border border-[#13333F] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            
            <div className="p-5 bg-[#050E15] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckSquare size={20} className="text-emerald-400" />
                <div>
                  <h3 className="text-base font-extrabold text-white">All Recently Watched Lectures</h3>
                  <p className="text-xs text-slate-400">Your learning timeline and progress history</p>
                </div>
              </div>
              <button
                onClick={() => setShowAllCoursesModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3 overflow-y-auto flex-1">
              {[DEFAULT_FEATURED, ...RECENTLY_WATCHED_ITEMS].map((lec) => (
                <div
                  key={lec.id}
                  className="p-4 rounded-2xl bg-[#091A23] border border-slate-800 hover:border-emerald-500/40 flex items-center justify-between gap-4 transition-all"
                >
                  <div>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${lec.badgeBg} ${lec.badgeBorder} ${lec.subjectColor}`}>
                      {lec.subject}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1">{lec.title}</h4>
                    <p className="text-xs text-slate-400">{lec.subtitle} • <span className="text-slate-300">{lec.educatorName}</span></p>
                    <span className="text-[11px] text-emerald-400 font-bold mt-1 block">{lec.progressPercent}% Completed ({lec.currentTime} / {lec.totalTime})</span>
                  </div>

                  <button
                    onClick={() => {
                      handlePlayLecture(lec);
                      setShowAllCoursesModal(false);
                    }}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shrink-0"
                  >
                    <Play size={13} className="fill-slate-950" />
                    <span>Resume</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="p-4 bg-[#050E15] border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Total 5 active courses in progress</span>
              <button
                onClick={() => setShowAllCoursesModal(false)}
                className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold"
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
