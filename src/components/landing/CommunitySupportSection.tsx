import { useState } from 'react';
import { 
  Users, MessageSquare, HelpCircle, Trophy, Award, 
  Headphones, Mail, Phone, BookOpen, Clock, ChevronRight, 
  X, Check, Send, ShieldCheck, Activity, MessageCircle, 
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface DiscussionItem {
  id: string;
  avatarLetter: string;
  avatarBg: string;
  title: string;
  author: string;
  category: string;
  commentCount: number;
  timeAgo: string;
  initialQuestion?: string;
  replies?: Array<{ user: string; role?: string; text: string; time: string }>;
}

const DEFAULT_DISCUSSIONS: DiscussionItem[] = [
  {
    id: 'disc-1',
    avatarLetter: 'R',
    avatarBg: 'bg-purple-600',
    title: "Confused about Kirchhoff's Laws in AC circuits ⚡",
    author: 'Rohan Kumar',
    category: 'Physics',
    commentCount: 12,
    timeAgo: '2m ago',
    initialQuestion: "In AC circuits with inductor and capacitor, when applying KVL do we need to consider peak voltages or instantaneous phasor sum? My net voltage equation is coming out wrong.",
    replies: [
      { user: 'Raj Sir (Faculty)', role: 'Verified Faculty', text: 'Always use instantaneous values $v(t) = v_R(t) + v_L(t) + v_C(t)$ or phasor impedance form $V = I \\cdot Z$. Never add rms magnitudes algebraically!', time: '1m ago' },
      { user: 'Amit Verma', text: 'Think of phasors as rotating vectors at angle 90 degrees apart.', time: 'Just now' }
    ]
  },
  {
    id: 'disc-2',
    avatarLetter: 'A',
    avatarBg: 'bg-amber-600',
    title: 'Trigonometry shortcuts that helped me in SSC CGL 🎯',
    author: 'Ananya Singh',
    category: 'Mathematics',
    commentCount: 18,
    timeAgo: '15m ago',
    initialQuestion: "Here is a quick trick: for questions with $\\sin^4 \\theta + \\cos^4 \\theta$, substitute $\\theta = 45^\\circ$ or $0^\\circ$ to solve within 5 seconds without lengthy identity expansions.",
    replies: [
      { user: 'Vikram Patel', text: 'This value-putting method saved me at least 4 minutes in tier 1!', time: '10m ago' },
      { user: 'Sneha Roy', text: 'Works for almost 80% symmetric trig expressions. Super helpful.', time: '5m ago' }
    ]
  },
  {
    id: 'disc-3',
    avatarLetter: 'S',
    avatarBg: 'bg-emerald-600',
    title: 'Best timetable for JEE preparation? 📚',
    author: 'Shubham Verma',
    category: 'JEE Aspirant',
    commentCount: 24,
    timeAgo: '1h ago',
    initialQuestion: "How do you guys divide time between mock tests, formula revisions, and backlogs? Currently studying 10 hrs a day but feeling exhausted.",
    replies: [
      { user: 'Dev Sharma (AIR 412)', text: 'Give 3 hours for test in morning, 2 hours analysis, and 3 hours revision in evening. Quality over quantity.', time: '45m ago' }
    ]
  },
  {
    id: 'disc-4',
    avatarLetter: 'P',
    avatarBg: 'bg-blue-600',
    title: 'Chemistry: Organic reactions quick revision notes 🧪',
    author: 'Pooja Sharma',
    category: 'NEET Aspirant',
    commentCount: 31,
    timeAgo: '2h ago',
    initialQuestion: "I have consolidated all Name Reactions (Aldol, Cannizzaro, Reimer-Tiemann, Gabriel Phthalimide) into a single 3-page summary flow chart.",
    replies: [
      { user: 'Dr. Priya Rao', role: 'Faculty', text: 'Excellent effort Pooja! Pay special attention to electrophilic attack on phenoxide ion for Kolbe reaction.', time: '1h ago' }
    ]
  }
];

export default function CommunitySupportSection() {
  const auth = useAuth();
  const currentUser = auth?.currentUser;
  const profileData = auth?.profileData;
  const studentName = profileData?.fullName || currentUser?.displayName || 'Student';

  // Modals state
  const [showLiveChatModal, setShowLiveChatModal] = useState<boolean>(false);
  const [showDoubtModal, setShowDoubtModal] = useState<boolean>(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState<boolean>(false);
  const [showBadgesModal, setShowBadgesModal] = useState<boolean>(false);
  const [showCommunityModal, setShowCommunityModal] = useState<boolean>(false);
  const [showHelpCenterModal, setShowHelpCenterModal] = useState<boolean>(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState<DiscussionItem | null>(null);

  // Toast alert state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live Chat messages state with sessionStorage persistence
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'agent' | 'user'; text: string; time: string }>>(() => {
    try {
      const saved = sessionStorage.getItem('examinant_support_chat');
      return saved ? JSON.parse(saved) : [
        { sender: 'agent', text: 'Hello! I am Rahul from Examinant Support. How can I help you today? 😊', time: 'Just now' }
      ];
    } catch {
      return [
        { sender: 'agent', text: 'Hello! I am Rahul from Examinant Support. How can I help you today? 😊', time: 'Just now' }
      ];
    }
  });
  const [chatInput, setChatInput] = useState<string>('');

  // Ask Doubt form state
  const [doubtSubject, setDoubtSubject] = useState<string>('Physics');
  const [doubtText, setDoubtText] = useState<string>('');

  // Discussion reply state
  const [replyInput, setReplyInput] = useState<string>('');

  // Joined study groups state with localStorage persistence
  const [joinedGroups, setJoinedGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('examinant_joined_clubs');
      return saved ? JSON.parse(saved) : { 'jee-club': true };
    } catch {
      return { 'jee-club': true };
    }
  });

  // Dynamic Discussion items with localStorage persistence
  const [discussions, setDiscussions] = useState<DiscussionItem[]>(() => {
    try {
      const saved = localStorage.getItem('examinant_community_discussions');
      return saved ? JSON.parse(saved) : DEFAULT_DISCUSSIONS;
    } catch {
      return DEFAULT_DISCUSSIONS;
    }
  });

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSendLiveChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    const updatedMessages = [...chatMessages, { sender: 'user' as const, text: userText, time: 'Just now' }];
    setChatMessages(updatedMessages);
    setChatInput('');

    // Intelligent chatbot responses based on student question context
    let botReply = 'Thank you for reaching out! Our student advisor is reviewing your query and will assist you immediately.';
    const lower = userText.toLowerCase();

    if (lower.includes('live') || lower.includes('class') || lower.includes('faculty') || lower.includes('teacher')) {
      botReply = 'Live masterclasses run daily! You can check today’s active broadcast in Section 4 (Live Classroom) on the homepage or open the full weekly schedule.';
    } else if (lower.includes('test') || lower.includes('mock') || lower.includes('series') || lower.includes('exam')) {
      botReply = 'We provide full-length All India Mocks and chapter tests with real ranking and AI performance analysis. Check out the Test Series section!';
    } else if (lower.includes('note') || lower.includes('dpp') || lower.includes('pdf') || lower.includes('formula')) {
      botReply = 'You can download chapter handwritten revision notes and DPPs directly from the Continue Learning and Live Classroom sections.';
    } else if (lower.includes('doubt') || lower.includes('question') || lower.includes('help')) {
      botReply = 'You can post your doubt directly through the Ask Doubts card or join our study clubs. Top faculty and peers usually reply within 15 minutes!';
    } else if (lower.includes('fee') || lower.includes('cost') || lower.includes('price') || lower.includes('discount')) {
      botReply = 'Special discount of 33% is active on test series batches, plus free demo series are available to start practicing immediately.';
    }

    setTimeout(() => {
      setChatMessages(prev => {
        const nextList = [...prev, { sender: 'agent' as const, text: botReply, time: 'Just now' }];
        try {
          sessionStorage.setItem('examinant_support_chat', JSON.stringify(nextList));
        } catch (err) {
          console.warn(err);
        }
        return nextList;
      });
    }, 700);
  };

  const handlePostDoubt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doubtText.trim()) return;

    const newDisc: DiscussionItem = {
      id: `disc-${Date.now()}`,
      avatarLetter: (studentName[0] || 'S').toUpperCase(),
      avatarBg: 'bg-indigo-600',
      title: doubtText.trim(),
      author: studentName,
      category: doubtSubject,
      commentCount: 0,
      timeAgo: 'Just now',
      initialQuestion: doubtText.trim(),
      replies: []
    };

    const updated = [newDisc, ...discussions];
    setDiscussions(updated);
    try {
      localStorage.setItem('examinant_community_discussions', JSON.stringify(updated));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
    setDoubtText('');
    setShowDoubtModal(false);
    triggerToast("Your doubt has been submitted! Faculty & top peers will answer shortly.");
  };

  const handleSendDiscussionReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim() || !selectedDiscussion) return;

    const newReply = {
      user: studentName,
      text: replyInput.trim(),
      time: 'Just now'
    };

    const updatedDisc: DiscussionItem = {
      ...selectedDiscussion,
      commentCount: selectedDiscussion.commentCount + 1,
      replies: [...(selectedDiscussion.replies || []), newReply]
    };

    setSelectedDiscussion(updatedDisc);

    const updatedList = discussions.map(d => d.id === selectedDiscussion.id ? updatedDisc : d);
    setDiscussions(updatedList);
    try {
      localStorage.setItem('examinant_community_discussions', JSON.stringify(updatedList));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }

    setReplyInput('');
    triggerToast("Reply posted to community discussion!");
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('support@examinantt.com');
    triggerToast("Email support@examinantt.com copied to clipboard!");
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/919123456789?text=Hi%20Examinant%20Team%2C%20I%20need%20help%20with%20my%20course', '_blank');
  };

  const toggleGroup = (groupId: string, groupName: string) => {
    const isJoined = !joinedGroups[groupId];
    setJoinedGroups(prev => ({ ...prev, [groupId]: isJoined }));
    if (isJoined) {
      triggerToast(`Joined ${groupName}! You will receive discussion alerts.`);
    } else {
      triggerToast(`Left ${groupName}.`);
    }
  };

  return (
    <section id="community-support" className="relative py-12 sm:py-16 bg-[#040817] text-white overflow-hidden scroll-mt-20 select-none">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/[0.07] rounded-full blur-[160px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-purple-600/[0.06] rounded-full blur-[140px] pointer-events-none"></div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Main Section Card */}
        <div className="relative rounded-[28px] sm:rounded-[36px] bg-[#070D22]/95 border border-[#14234C] p-5 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-xl">
          
          {/* HEADER ROW */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#121E42]">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                  Community & Support
                </h2>
                <Users size={24} className="text-indigo-400 stroke-[2.5]" />
              </div>
              <p className="text-slate-400 text-sm sm:text-base font-normal mt-1 max-w-2xl">
                Learn together, grow together. Get help, stay motivated and never feel alone on your learning journey.
              </p>
            </div>

            {/* We're Here for You Top-Right Card */}
            <div className="self-start sm:self-auto rounded-2xl bg-[#061722]/80 border border-emerald-500/30 px-4 py-3 flex items-center gap-3 shadow-inner">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck size={18} className="stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-emerald-400 leading-none">
                  We're Here for You!
                </h4>
                <p className="text-[11px] text-slate-400 font-medium mt-1 leading-none">
                  Our team and community are always ready to support you.
                </p>
              </div>
            </div>
          </div>

          {/* ROW 1: FOUR FEATURE ACTION CARDS */}
          <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            
            {/* Card 1: Student Community */}
            <div 
              onClick={() => setShowCommunityModal(true)}
              className="cursor-pointer rounded-2xl bg-[#0B1229]/80 hover:bg-[#0E1733] border border-[#1B264E] hover:border-purple-500/50 p-5 flex flex-col justify-between transition-all duration-300 group shadow-sm hover:shadow-lg hover:-translate-y-1"
            >
              <div>
                <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)] group-hover:scale-110 transition-transform">
                  <MessageSquare size={22} />
                </div>
                <h3 className="text-base font-extrabold text-[#C084FC] group-hover:text-purple-300 transition-colors mt-4">
                  Student Community
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Connect with thousands of aspiring students, share knowledge and grow together.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center gap-1 text-xs font-bold text-[#C084FC] group-hover:text-purple-300">
                <span>Join Community</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>

            {/* Card 2: Ask Doubts */}
            <div 
              onClick={() => setShowDoubtModal(true)}
              className="cursor-pointer rounded-2xl bg-[#0B142D]/80 hover:bg-[#0E1B38] border border-[#172D52] hover:border-cyan-500/50 p-5 flex flex-col justify-between transition-all duration-300 group shadow-sm hover:shadow-lg hover:-translate-y-1"
            >
              <div>
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)] group-hover:scale-110 transition-transform">
                  <HelpCircle size={22} />
                </div>
                <h3 className="text-base font-extrabold text-[#38BDF8] group-hover:text-cyan-300 transition-colors mt-4">
                  Ask Doubts
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Stuck on a concept? Ask your doubts and get quick solutions from experts and peers.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center gap-1 text-xs font-bold text-[#38BDF8] group-hover:text-cyan-300">
                <span>Ask Now</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>

            {/* Card 3: Leaderboards */}
            <div 
              onClick={() => setShowLeaderboardModal(true)}
              className="cursor-pointer rounded-2xl bg-[#081726]/80 hover:bg-[#0B1E30] border border-[#13353A] hover:border-emerald-500/50 p-5 flex flex-col justify-between transition-all duration-300 group shadow-sm hover:shadow-lg hover:-translate-y-1"
            >
              <div>
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover:scale-110 transition-transform">
                  <Trophy size={22} />
                </div>
                <h3 className="text-base font-extrabold text-[#34D399] group-hover:text-emerald-300 transition-colors mt-4">
                  Leaderboards
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Compete, climb the ranks and motivate yourself with top performer rankings.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center gap-1 text-xs font-bold text-[#34D399] group-hover:text-emerald-300">
                <span>View Leaderboard</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>

            {/* Card 4: Achievements */}
            <div 
              onClick={() => setShowBadgesModal(true)}
              className="cursor-pointer rounded-2xl bg-[#17131F]/80 hover:bg-[#1C1727] border border-[#362719] hover:border-amber-500/50 p-5 flex flex-col justify-between transition-all duration-300 group shadow-sm hover:shadow-lg hover:-translate-y-1"
            >
              <div>
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)] group-hover:scale-110 transition-transform">
                  <Award size={22} />
                </div>
                <h3 className="text-base font-extrabold text-[#FBBF24] group-hover:text-amber-300 transition-colors mt-4">
                  Achievements
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Earn badges and celebrate your milestones. Every step forward counts!
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center gap-1 text-xs font-bold text-[#FBBF24] group-hover:text-amber-300">
                <span>View Badges</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>

          </div>

          {/* ROW 2: TWO LARGE COLUMNS (TALK TO SUPPORT & COMMUNITY ACTIVITY) */}
          <div className="mt-7 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* LEFT COLUMN: TALK TO OUR SUPPORT TEAM WITH 3D MASCOT */}
            <div className="lg:col-span-6 rounded-3xl bg-[#09112B]/85 border border-[#162452] p-5 sm:p-7 flex flex-col justify-between relative shadow-xl">
              
              <div>
                {/* Header */}
                <div className="flex items-center gap-2.5">
                  <Headphones size={20} className="text-blue-400 stroke-[2.5]" />
                  <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                    Talk to Our Support Team
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Facing an issue or need help? Our support team is just a click away.
                </p>

                {/* Sub-grid: 4 Support Action Rows on left, 3D Character on right */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                  
                  {/* Action Buttons List */}
                  <div className="sm:col-span-7 space-y-2.5">
                    
                    {/* Live Chat */}
                    <button
                      onClick={() => setShowLiveChatModal(true)}
                      className="w-full text-left p-3 rounded-2xl bg-[#0D183B] hover:bg-[#122152] border border-[#1D2F64] hover:border-blue-500/50 flex items-center justify-between transition-all duration-200 group active:scale-95"
                    >
                      <div className="flex items-center gap-3">
                        <MessageSquare size={17} className="text-blue-400" />
                        <div>
                          <span className="text-xs font-bold text-white block">Live Chat</span>
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>Online now</span>
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={15} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    {/* Email Support */}
                    <button
                      onClick={handleCopyEmail}
                      className="w-full text-left p-3 rounded-2xl bg-[#0D183B] hover:bg-[#122152] border border-[#1D2F64] hover:border-blue-500/50 flex items-center justify-between transition-all duration-200 group active:scale-95"
                    >
                      <div className="flex items-center gap-3">
                        <Mail size={17} className="text-blue-400" />
                        <div>
                          <span className="text-xs font-bold text-white block">Email Support</span>
                          <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                            support@examinantt.com
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={15} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    {/* WhatsApp Support */}
                    <button
                      onClick={handleWhatsApp}
                      className="w-full text-left p-3 rounded-2xl bg-[#0D183B] hover:bg-[#122152] border border-[#1D2F64] hover:border-emerald-500/50 flex items-center justify-between transition-all duration-200 group active:scale-95"
                    >
                      <div className="flex items-center gap-3">
                        <Phone size={17} className="text-emerald-400" />
                        <div>
                          <span className="text-xs font-bold text-white block">WhatsApp Support</span>
                          <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                            +91 9123456789
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={15} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    {/* Help Center */}
                    <button
                      onClick={() => setShowHelpCenterModal(true)}
                      className="w-full text-left p-3 rounded-2xl bg-[#0D183B] hover:bg-[#122152] border border-[#1D2F64] hover:border-indigo-500/50 flex items-center justify-between transition-all duration-200 group active:scale-95"
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen size={17} className="text-indigo-400" />
                        <div>
                          <span className="text-xs font-bold text-white block">Help Center</span>
                          <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                            Browse FAQs & Guides
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={15} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                  </div>

                  {/* 3D Support Mascot Visual with Speech Bubble */}
                  <div className="sm:col-span-5 flex flex-col items-center justify-center relative">
                    <div className="relative w-40 sm:w-44 aspect-square rounded-2xl overflow-hidden border border-blue-500/20 shadow-2xl bg-[#070D22] group">
                      <img
                        src="/support_agent_3d.jpg"
                        alt="Examinant Support Agent"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/student_mascot.png";
                        }}
                      />
                      
                      {/* Floating Speech Bubble Accent */}
                      <div className="absolute top-2 left-2 bg-[#091638]/90 border border-blue-400/40 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1.5 shadow-md">
                        <MessageCircle size={12} className="text-blue-400" />
                        <span className="text-[10px] font-bold text-white">Online Help</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Bottom Response Time Guarantee */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Clock size={15} className="text-cyan-400" />
                <span>Average response time: <strong className="text-cyan-400">Under 2 minutes</strong></span>
              </div>

            </div>

            {/* RIGHT COLUMN: WHAT'S HAPPENING IN THE COMMUNITY */}
            <div className="lg:col-span-6 rounded-3xl bg-[#09112B]/85 border border-[#162452] p-5 sm:p-7 flex flex-col justify-between relative shadow-xl">
              
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Activity size={18} className="text-rose-500" />
                    <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                      What's Happening in the Community
                    </h3>
                  </div>

                  <button
                    onClick={() => setShowCommunityModal(true)}
                    className="text-xs sm:text-sm font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors group"
                  >
                    <span>View All</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </button>
                </div>

                {/* 4 Live Community Discussion Items */}
                <div className="space-y-3">
                  {discussions.slice(0, 4).map((disc) => (
                    <div
                      key={disc.id}
                      onClick={() => setSelectedDiscussion(disc)}
                      className="p-3.5 rounded-2xl bg-[#0D183B] hover:bg-[#122152] border border-[#1D2F64] hover:border-indigo-500/40 flex items-center justify-between gap-3 sm:gap-4 transition-all duration-200 cursor-pointer group shadow-sm"
                    >
                      {/* Left: Avatar + Title & Meta */}
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar Circle with Online Dot */}
                        <div className="relative shrink-0">
                          <div className={`w-9 h-9 rounded-full ${disc.avatarBg} flex items-center justify-center text-white font-black text-sm shadow-md`}>
                            {disc.avatarLetter}
                          </div>
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0D183B]"></span>
                        </div>

                        {/* Title and Author/Category */}
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                            {disc.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {disc.author} • <span className="text-slate-300">{disc.category}</span>
                          </p>
                        </div>
                      </div>

                      {/* Right: Comments Count & Time */}
                      <div className="flex items-center gap-3 shrink-0 text-[11px] text-slate-400">
                        <div className="flex items-center gap-1 text-slate-300 font-bold">
                          <MessageSquare size={13} className="text-slate-400" />
                          <span>{disc.commentCount}</span>
                        </div>
                        <span className="hidden sm:inline text-slate-500">{disc.timeAgo}</span>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Action */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">Join discussions and get peer reviews on your test solutions</span>
                <button
                  onClick={() => setShowDoubtModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 active:scale-95"
                >
                  Start Discussion
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* TOAST NOTIFICATION ALERT */}
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

      {/* 1. LIVE CHAT MODAL */}
      {showLiveChatModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0A1024] border border-[#1A2A54] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col h-[560px]">
            
            {/* Header */}
            <div className="p-4 bg-[#070D1F] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-blue-400/50 bg-slate-800">
                    <img src="/support_agent_3d.jpg" alt="Support Agent" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/student_mascot.png'; }} />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#070D1F]"></span>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Rahul • Student Support</h3>
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1">Online & ready to assist</p>
                </div>
              </div>
              <button onClick={() => setShowLiveChatModal(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center">
                <X size={18} />
              </button>
            </div>

            {/* Quick Prompt Badges */}
            <div className="p-3 bg-[#080E22] border-b border-slate-800/80 flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
              {['Test series access?', 'How to reset password?', 'Live class schedule?'].map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setChatMessages(prev => [...prev, { sender: 'user', text: q, time: 'Just now' }]);
                    setTimeout(() => {
                      setChatMessages(prev => [
                        ...prev,
                        { sender: 'agent', text: `For "${q}", please check our student dashboard or browse the full schedule. Our team is also on standby to help!`, time: 'Just now' }
                      ]);
                    }, 800);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-slate-300 font-medium whitespace-nowrap border border-white/5"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-3 rounded-2xl max-w-[82%] text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white/10 text-slate-200 rounded-tl-none border border-white/5'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendLiveChat} className="p-3 bg-[#070D1F] border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 bg-white/5 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center transition-colors"
              >
                <Send size={14} />
              </button>
            </form>

          </div>
        </div>
      )}

      {/* 2. ASK DOUBTS MODAL */}
      {showDoubtModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0A1024] border border-[#1A2A54] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="p-5 bg-[#070D1F] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <HelpCircle size={20} className="text-cyan-400" />
                <h3 className="text-base font-extrabold text-white">Ask an Expert or Peer</h3>
              </div>
              <button onClick={() => setShowDoubtModal(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePostDoubt} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">Subject / Category</label>
                <div className="grid grid-cols-4 gap-2">
                  {['Physics', 'Chemistry', 'Mathematics', 'Biology'].map((subj) => (
                    <button
                      type="button"
                      key={subj}
                      onClick={() => setDoubtSubject(subj)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        doubtSubject === subj
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500'
                          : 'bg-white/5 text-slate-400 border-slate-700/60 hover:text-white'
                      }`}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">Your Doubt or Question</label>
                <textarea
                  rows={4}
                  value={doubtText}
                  onChange={(e) => setDoubtText(e.target.value)}
                  placeholder="Describe where you are stuck, question text, or concepts you want explained..."
                  className="w-full bg-white/5 border border-slate-700/60 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-[11px] text-cyan-300 flex items-center gap-2">
                <Sparkles size={14} className="shrink-0" />
                <span>Top educators and 10,000+ peers respond to community doubts within 15 minutes!</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDoubtModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs transition-colors shadow-lg shadow-cyan-500/20"
                >
                  Submit Doubt
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* 3. LEADERBOARDS MODAL */}
      {showLeaderboardModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0A1024] border border-[#1A2A54] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            
            <div className="p-5 bg-[#070D1F] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Trophy size={20} className="text-emerald-400" />
                <div>
                  <h3 className="text-base font-extrabold text-white">All India Student Leaderboard</h3>
                  <p className="text-xs text-slate-400">Weekly Top Mock Test Scorers</p>
                </div>
              </div>
              <button onClick={() => setShowLeaderboardModal(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center">
                <X size={18} />
              </button>
            </div>

            {/* Top 3 Podium Cards */}
            <div className="p-5 bg-gradient-to-b from-[#0A1828] to-[#0A1024] border-b border-slate-800 grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-end">
                <div className="w-10 h-10 rounded-full bg-slate-300 text-slate-950 font-black flex items-center justify-center text-sm mb-1 shadow-md">2</div>
                <span className="text-xs font-bold text-white truncate max-w-full">Priya S.</span>
                <span className="text-[10px] text-emerald-400 font-bold">96.8%</span>
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col items-center justify-end -translate-y-2 shadow-lg">
                <span className="text-lg">👑</span>
                <div className="w-12 h-12 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-base mb-1 shadow-xl">1</div>
                <span className="text-xs font-black text-amber-300 truncate max-w-full">Aarav Patel</span>
                <span className="text-[11px] text-emerald-400 font-extrabold">98.4%</span>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-end">
                <div className="w-10 h-10 rounded-full bg-amber-700 text-white font-black flex items-center justify-center text-sm mb-1 shadow-md">3</div>
                <span className="text-xs font-bold text-white truncate max-w-full">Rohan K.</span>
                <span className="text-[10px] text-emerald-400 font-bold">95.2%</span>
              </div>
            </div>

            {/* Ranks List */}
            <div className="p-5 space-y-2.5 overflow-y-auto flex-1">
              {[
                { rank: 4, name: 'Ananya Sharma', exam: 'JEE Mains', score: '94.5%', tests: 28 },
                { rank: 5, name: 'Kunal Verma', exam: 'NEET UG', score: '93.8%', tests: 34 },
                { rank: 6, name: 'Sneha Roy', exam: 'Boards 12th', score: '93.1%', tests: 19 },
                { rank: 7, name: 'Vikram Singh', exam: 'NDA', score: '92.4%', tests: 22 },
              ].map((item) => (
                <div key={item.rank} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-extrabold text-slate-400 text-xs">#{item.rank}</span>
                    <div>
                      <h5 className="text-xs font-bold text-white">{item.name}</h5>
                      <span className="text-[10px] text-slate-400">{item.exam} • {item.tests} tests completed</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-400">{item.score}</span>
                </div>
              ))}
            </div>

            <div className="p-4 bg-[#070D1F] border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Your current rank: <strong>#42</strong> (Top 3%)</span>
              <button onClick={() => setShowLeaderboardModal(false)} className="px-4 py-1.5 bg-emerald-500 text-slate-950 font-black rounded-xl text-xs">
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 4. ACHIEVEMENTS & BADGES MODAL */}
      {showBadgesModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0A1024] border border-[#1A2A54] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="p-5 bg-[#070D1F] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Award size={20} className="text-amber-400" />
                <div>
                  <h3 className="text-base font-extrabold text-white">Student Achievements & Badges</h3>
                  <p className="text-xs text-slate-400">Celebrate every learning milestone</p>
                </div>
              </div>
              <button onClick={() => setShowBadgesModal(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-3.5">
              {[
                { title: '🔥 7-Day Streak', desc: 'Studied for 7 consecutive days', unlocked: true },
                { title: '🎯 Accuracy Master', desc: 'Scored >90% in 5 mock tests', unlocked: true },
                { title: '⚡ Speed Demon', desc: 'Average <45 sec per question', unlocked: true },
                { title: '💡 Doubt Champion', desc: 'Solved 10 community doubts', unlocked: false },
                { title: '📚 Full Syllabus Pro', desc: 'Covered 100% of Physics modules', unlocked: false },
                { title: '🏆 Top 1% Club', desc: 'Ranked in Top 1% nationwide', unlocked: true },
              ].map((badge, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                    badge.unlocked
                      ? 'bg-amber-500/10 border-amber-500/30 text-white'
                      : 'bg-white/[0.02] border-white/5 text-slate-500 opacity-60'
                  }`}
                >
                  <div>
                    <span className="text-sm font-black block">{badge.title}</span>
                    <span className="text-[11px] text-slate-400 block mt-1 leading-snug">{badge.desc}</span>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider mt-3 ${badge.unlocked ? 'text-amber-400' : 'text-slate-500'}`}>
                    {badge.unlocked ? 'Unlocked ✓' : 'Locked 🔒'}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-4 bg-[#070D1F] border-t border-slate-800 flex justify-end">
              <button onClick={() => setShowBadgesModal(false)} className="px-5 py-2 bg-amber-500 text-slate-950 font-black rounded-xl text-xs">
                Great!
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. STUDENT COMMUNITY MODAL */}
      {showCommunityModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0A1024] border border-[#1A2A54] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            
            <div className="p-5 bg-[#070D1F] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Users size={20} className="text-purple-400" />
                <div>
                  <h3 className="text-base font-extrabold text-white">Examinant Study Clubs</h3>
                  <p className="text-xs text-slate-400">Join active aspirant peer networks</p>
                </div>
              </div>
              <button onClick={() => setShowCommunityModal(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3 overflow-y-auto flex-1">
              {[
                { id: 'jee-club', name: 'JEE Advanced Aspirants Club', members: '14,200+ Members', desc: 'Daily challenging numericals, Irodov discussion & mock reviews.' },
                { id: 'neet-club', name: 'NEET UG 680+ Warriors', members: '18,500+ Members', desc: 'NCERT biology line-by-line quizzes & organic chemistry charts.' },
                { id: 'nda-club', name: 'NDA / Defence Cadets Guild', members: '8,400+ Members', desc: 'Maths short tricks, GAT current affairs & SSB physical prep.' },
                { id: 'boards-club', name: 'Class 12th Board 95%+ Target', members: '11,100+ Members', desc: 'Sample papers, derivations blueprint & subjective marking tips.' }
              ].map((club) => {
                const joined = !!joinedGroups[club.id];

                return (
                  <div key={club.id} className="p-4 rounded-2xl bg-[#0C1535] border border-slate-800 hover:border-purple-500/40 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-white">{club.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{club.desc}</p>
                      <span className="text-[10px] text-purple-400 font-semibold mt-1.5 block">{club.members}</span>
                    </div>

                    <button
                      onClick={() => toggleGroup(club.id, club.name)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        joined
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md'
                      }`}
                    >
                      {joined ? 'Joined ✓' : 'Join Group'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-[#070D1F] border-t border-slate-800 flex justify-end">
              <button onClick={() => setShowCommunityModal(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold">
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. HELP CENTER / FAQS MODAL */}
      {showHelpCenterModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0A1024] border border-[#1A2A54] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            
            <div className="p-5 bg-[#070D1F] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BookOpen size={20} className="text-indigo-400" />
                <div>
                  <h3 className="text-base font-extrabold text-white">Examinant Help Center</h3>
                  <p className="text-xs text-slate-400">Frequently asked questions & guides</p>
                </div>
              </div>
              <button onClick={() => setShowHelpCenterModal(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3 overflow-y-auto flex-1 text-xs">
              {[
                { q: 'How do I attempt a Free Demo Test Series?', a: 'Navigate to the Test Series section on the homepage and click "Explore Series" on any card labeled "Free Demo" to start practicing without upfront payment.' },
                { q: 'Can I watch recorded live classroom sessions?', a: 'Yes! All live sessions are automatically archived under the "Recorded Classroom" tab in the Student Portal with downloadable notes.' },
                { q: 'How does AI Simulation score analysis work?', a: 'Our AI engine evaluates question speed, accuracy, and topic-wise strengths to provide AIR prediction and recommendations.' },
                { q: 'How do I contact educator faculty for doubts?', a: 'You can ask live during active streams via chat or post on the Community & Support doubt portal anytime.' }
              ].map((faq, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <h5 className="font-bold text-white text-xs mb-1.5">{faq.q}</h5>
                  <p className="text-slate-400 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>

            <div className="p-4 bg-[#070D1F] border-t border-slate-800 flex justify-end">
              <button onClick={() => setShowHelpCenterModal(false)} className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs">
                Got it
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 7. COMMUNITY DISCUSSION THREAD DETAIL MODAL */}
      {selectedDiscussion && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0A1024] border border-[#1A2A54] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-5 bg-[#070D1F] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full ${selectedDiscussion.avatarBg} flex items-center justify-center text-white font-black text-sm`}>
                  {selectedDiscussion.avatarLetter}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{selectedDiscussion.author}</h4>
                  <p className="text-xs text-slate-400">{selectedDiscussion.category} • {selectedDiscussion.timeAgo}</p>
                </div>
              </div>
              <button onClick={() => setSelectedDiscussion(null)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center">
                <X size={18} />
              </button>
            </div>

            {/* Content & Replies */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="p-4 rounded-2xl bg-[#0D183B] border border-[#1C2C5E] space-y-2">
                <h3 className="text-base font-extrabold text-white">{selectedDiscussion.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedDiscussion.initialQuestion}</p>
              </div>

              <div className="pt-2">
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <MessageSquare size={13} />
                  <span>Community Responses ({selectedDiscussion.replies?.length || 0})</span>
                </h5>

                <div className="space-y-2.5">
                  {selectedDiscussion.replies?.map((rep, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <span>{rep.user}</span>
                          {rep.role && (
                            <span className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded font-extrabold">
                              {rep.role}
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-500">{rep.time}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{rep.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Reply Input */}
            <form onSubmit={handleSendDiscussionReply} className="p-3.5 bg-[#070D1F] border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                placeholder="Write your answer or feedback..."
                className="flex-1 bg-white/5 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Send size={13} />
                <span>Reply</span>
              </button>
            </form>

          </div>
        </div>
      )}

    </section>
  );
}
