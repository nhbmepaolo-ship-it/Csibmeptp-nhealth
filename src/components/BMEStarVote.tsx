import React, { useState, useEffect, useMemo } from 'react';
import { VoteRecord, Employee } from '../types';
import { StorageService } from '../services/storage';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BMEStarVoteProps {
  currentUser: Employee | null;
  onLogin: (user: Employee) => void;
  onLogout: () => void;
  showToast: (type: 'success' | 'error', msg: string) => void;
}

const CATEGORIES = [
  'พลังบวกประจำทีม (Positive Energy)',
  'สุดยอดผู้ช่วยเหลือ (Super Helper)',
  'ดาวรุ่งนักสร้างสรรค์ (Creative Thinker)',
  'สุดยอดนักทำงานเป็นทีม (Team Player)'
];

const CATEGORY_CONFIG: {
  [cat: string]: {
    icon: string;
    badgeBg: string;
    borderColor: string;
    accentColor: string;
    desc: string;
  };
} = {
  'พลังบวกประจำทีม (Positive Energy)': {
    icon: 'fa-solid fa-sun',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    borderColor: 'border-amber-500/40',
    accentColor: 'text-amber-400',
    desc: 'ส่งต่อพลังบวก รอยยิ้ม และบรรยากาศที่ดีให้แก่เพื่อนร่วมงานเสมอ'
  },
  'สุดยอดผู้ช่วยเหลือ (Super Helper)': {
    icon: 'fa-solid fa-hand-holding-heart',
    badgeBg: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
    borderColor: 'border-pink-500/40',
    accentColor: 'text-pink-400',
    desc: 'มีน้ำใจ เสียสละ พร้อมช่วยเหลือแก้ไขปัญหาให้เพื่อนร่วมทีมในทุกสถานการณ์'
  },
  'ดาวรุ่งนักสร้างสรรค์ (Creative Thinker)': {
    icon: 'fa-solid fa-lightbulb',
    badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    borderColor: 'border-sky-500/40',
    accentColor: 'text-sky-400',
    desc: 'ริเริ่มไอเดียใหม่ พัฒนาปรับปรุงงานอย่างสร้างสรรค์ และมีคุณค่า'
  },
  'สุดยอดนักทำงานเป็นทีม (Team Player)': {
    icon: 'fa-solid fa-people-group',
    badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    borderColor: 'border-indigo-500/40',
    accentColor: 'text-indigo-400',
    desc: 'ร่วมมือร่วมใจ ประสานงานยอดเยี่ยม ทำงานเพื่อความสำเร็จของส่วนรวม'
  }
};

const VOTE_BAR_COLORS = [
  { bg: 'rgba(129,140,248,0.85)', border: '#818cf8' },
  { bg: 'rgba(52,211,153,0.85)', border: '#34d399' },
  { bg: 'rgba(251,191,36,0.85)', border: '#fbbf24' },
  { bg: 'rgba(244,63,94,0.85)', border: '#f43f5e' },
  { bg: 'rgba(192,132,252,0.85)', border: '#c084fc' },
  { bg: 'rgba(34,211,238,0.85)', border: '#22d3ee' }
];

export const BMEStarVote: React.FC<BMEStarVoteProps> = ({ currentUser, onLogin, onLogout, showToast }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'vote-form' | 'login' | 'admin'>('dashboard');
  const [votes, setVotes] = useState<VoteRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Vote round filters
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(currentMonthKey);

  // Form states - 1 person must vote for all 4 categories in one ballot
  const [targetVoteMonth, setTargetVoteMonth] = useState<string>(currentMonthKey);
  const [categoryVotes, setCategoryVotes] = useState<Record<string, string>>({});
  const [submitSuccessModal, setSubmitSuccessModal] = useState<boolean>(false);

  // Login form
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  const loadData = () => {
    setVotes(StorageService.getVotes());
    setEmployees(StorageService.getEmployees().filter(e => e.status === 'active'));
  };

  useEffect(() => {
    loadData();
  }, []);

  const years = useMemo(() => {
    const set = new Set<number>();
    set.add(now.getFullYear());
    votes.forEach(v => {
      if (v.voteMonth) {
        const y = parseInt(v.voteMonth.split('-')[0]);
        if (!isNaN(y)) set.add(y);
      }
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [votes]);

  // Months for vote round selector
  const availableMonths = useMemo(() => {
    const months: string[] = [];
    for (let m = 1; m <= 12; m++) {
      months.push(`${selectedYear}-${String(m).padStart(2, '0')}`);
    }
    return months;
  }, [selectedYear]);

  // Past vote month choices (up to 12 months) for submit form
  const pastMonthChoices = useMemo(() => {
    const choices: string[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      choices.push(key);
    }
    return choices;
  }, []);

  // Filtered votes by month / year
  const filteredVotes = useMemo(() => {
    return votes.filter(v => {
      if (selectedMonthKey) {
        return v.voteMonth === selectedMonthKey;
      }
      return v.voteMonth.startsWith(selectedYear.toString());
    });
  }, [votes, selectedMonthKey, selectedYear]);

  // Summary counts
  const categorySummaries = useMemo(() => {
    const summary: { [category: string]: { [nominee: string]: number } } = {};
    CATEGORIES.forEach(cat => { summary[cat] = {}; });

    filteredVotes.forEach(v => {
      if (!summary[v.category]) summary[v.category] = {};
      summary[v.category][v.nominee] = (summary[v.category][v.nominee] || 0) + 1;
    });

    return summary;
  }, [filteredVotes]);

  // Combined overall ranking top 10
  const overallRanking = useMemo(() => {
    const totals: { [nominee: string]: number } = {};
    filteredVotes.forEach(v => {
      totals[v.nominee] = (totals[v.nominee] || 0) + 1;
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [filteredVotes]);

  // Photo map
  const photoMap = useMemo(() => {
    const map: { [name: string]: string } = {};
    employees.forEach(e => {
      map[e.fullName] = e.img;
      map[`${e.fullName} (${e.nickname})`] = e.img;
      map[e.nickname] = e.img;
    });
    return map;
  }, [employees]);

  // Candidates available for currentUser to vote for (cannot vote for oneself, and CANNOT vote for resigned/inactive employees in that month)
  const eligibleCandidates = useMemo(() => {
    if (!employees || employees.length === 0) return [];
    return employees.filter(emp => {
      // 1. Exclude resigned and inactive employees
      if (emp.status === 'resigned' || emp.status === 'inactive') {
        return false;
      }

      // Check if employee has resignation month specified
      if ((emp as any).resignedMonth && targetVoteMonth >= (emp as any).resignedMonth) {
        return false;
      }

      if (!currentUser) return true;

      // 2. Cannot vote for oneself
      const isSelf = emp.username.trim().toLowerCase() === currentUser.username.trim().toLowerCase() ||
                     emp.fullName.trim().toLowerCase() === currentUser.fullName.trim().toLowerCase();
      if (isSelf) return false;

      // Colleague voting is open to all active employees (no club restriction)
      return true;
    });
  }, [employees, currentUser, targetVoteMonth]);

  // Load existing votes by currentUser for targetVoteMonth
  useEffect(() => {
    if (!currentUser) {
      setCategoryVotes({});
      return;
    }
    const userVotes = votes.filter(
      v => v.voter.toLowerCase() === currentUser.username.toLowerCase() && v.voteMonth === targetVoteMonth
    );
    const initialMap: Record<string, string> = {};
    CATEGORIES.forEach(cat => {
      const match = userVotes.find(v => v.category === cat);
      if (match) {
        initialMap[cat] = match.nominee;
      }
    });
    setCategoryVotes(initialMap);
  }, [currentUser, targetVoteMonth, votes]);

  // Clean up any candidate in categoryVotes if they became ineligible
  useEffect(() => {
    if (Object.keys(categoryVotes).length > 0 && eligibleCandidates.length > 0) {
      let changed = false;
      const updated = { ...categoryVotes };
      for (const cat of CATEGORIES) {
        if (updated[cat] && !eligibleCandidates.some(c => c.fullName === updated[cat])) {
          delete updated[cat];
          changed = true;
        }
      }
      if (changed) {
        setCategoryVotes(updated);
      }
    }
  }, [eligibleCandidates]);

  const completedVoteCount = useMemo(() => {
    return CATEGORIES.filter(cat => !!categoryVotes[cat]?.trim()).length;
  }, [categoryVotes]);
  const isAllCategoriesVoted = completedVoteCount === CATEGORIES.length;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUser || !loginPass) {
      showToast('error', 'กรุณากรอก Username และ Password');
      return;
    }

    const auth = StorageService.authenticateUser(loginUser, loginPass);
    if (auth.success && auth.user) {
      onLogin(auth.user);
      StorageService.setCurrentUser(auth.user);
      setLoginUser('');
      setLoginPass('');
      showToast('success', `เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับคุณ ${auth.user.fullName}`);
      setActiveTab('vote-form');
    } else {
      showToast('error', auth.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  const handleVoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('error', 'เซสชันหมดอายุ กรุณาล็อกอินใหม่');
      setActiveTab('login');
      return;
    }
    if (!isAllCategoriesVoted) {
      showToast('error', `กรุณาเลือกลงคะแนนให้ครบทั้ง 4 หมวด (ปัจจุบันเลือกแล้ว ${completedVoteCount}/4 หมวด)`);
      return;
    }

    const result = StorageService.addVotesBatch(
      currentUser.username,
      targetVoteMonth,
      categoryVotes
    );

    if (result.success) {
      showToast('success', result.message);
      loadData();
      if (result.monthKey) setSelectedMonthKey(result.monthKey);
      setSubmitSuccessModal(true);
    } else {
      showToast('error', result.message);
    }
  };

  return (
    <div className="min-h-full pb-16 text-slate-100">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-indigo-600/90 via-purple-600/90 to-pink-600/90 py-10 px-4 text-center text-white overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 border border-white/25 mb-3 shadow-xl backdrop-blur-md">
            <i className="fa-solid fa-heart text-3xl text-pink-300"></i>
          </div>
          <h1 className="font-th font-extrabold text-3xl sm:text-4xl text-white tracking-tight">BME Star Vote</h1>
          <p className="text-xs font-semibold text-white/90 uppercase tracking-widest mt-1">ระบบโหวตพนักงานในดวงใจ · Biomedical Engineering</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        {/* User Status Bar */}
        {currentUser && (
          <div className="glass-card rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-lg border border-indigo-500/30">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-semibold text-indigo-200">
                ยินดีต้อนรับ, <strong className="text-white">{currentUser.fullName} ({currentUser.nickname})</strong>
                {currentUser.isAdmin && <span className="ml-2 bg-purple-500/30 text-purple-200 border border-purple-400/40 px-2 py-0.5 rounded-full text-[10px] font-extrabold">ADMIN</span>}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="text-xs font-bold text-pink-300 hover:text-pink-200 underline underline-offset-4"
            >
              ออกจากระบบ
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 glass-panel p-2 rounded-2xl border border-white/15">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2.5 px-3 rounded-xl font-th text-xs font-bold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg border border-white/20'
                : 'text-slate-300/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-chart-pie mr-1.5"></i>แดชบอร์ด
          </button>
          <button
            onClick={() => setActiveTab('vote-form')}
            className={`py-2.5 px-3 rounded-xl font-th text-xs font-bold transition-all ${
              activeTab === 'vote-form'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg border border-white/20'
                : 'text-slate-300/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-vote-yea mr-1.5"></i>ส่งคะแนน
          </button>
          <button
            onClick={() => setActiveTab('login')}
            className={`py-2.5 px-3 rounded-xl font-th text-xs font-bold transition-all ${
              activeTab === 'login'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg border border-white/20'
                : 'text-slate-300/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-key mr-1.5"></i>ล็อกอิน
          </button>
          {currentUser?.isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`py-2.5 px-3 rounded-xl font-th text-xs font-bold transition-all border border-purple-400/40 ${
                activeTab === 'admin'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-purple-900/30 text-purple-200 hover:bg-purple-900/50'
              }`}
            >
              <i className="fa-solid fa-shield-halved mr-1.5"></i>แอดมิน
            </button>
          )}
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Round Filter */}
            <div className="glass-panel border border-white/15 rounded-2xl p-4 flex flex-wrap items-center gap-3">
              <i className="fa-solid fa-calendar-days text-indigo-300"></i>
              <span className="text-xs font-bold text-slate-200">รอบโหวต:</span>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="bg-slate-900/80 border border-white/15 text-white text-xs font-bold rounded-xl px-3 py-2 outline-none"
              >
                {years.map(y => <option key={y} value={y}>ปี {y}</option>)}
              </select>

              <select
                value={selectedMonthKey}
                onChange={e => setSelectedMonthKey(e.target.value)}
                className="bg-slate-900/80 border border-white/15 text-white text-xs font-bold rounded-xl px-3 py-2 outline-none flex-1 min-w-[160px]"
              >
                <option value="">ทั้งปี {selectedYear}</option>
                {availableMonths.map(mKey => {
                  const [y, m] = mKey.split('-');
                  const monthNames = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
                  return (
                    <option key={mKey} value={mKey}>
                      {monthNames[parseInt(m)]} {y} {mKey === currentMonthKey ? '(เดือนนี้)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Overall Ranking Top 10 */}
            <div className="bg-gradient-to-br from-amber-500/10 via-pink-500/5 to-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-xl">
              <div className="text-center font-th font-extrabold text-amber-300 text-sm sm:text-base mb-4 flex items-center justify-center gap-2">
                <i className="fa-solid fa-crown text-amber-400 text-lg"></i>
                <span>อันดับรวมพนักงานในดวงใจ (คะแนนรวมทั้ง 4 หมวด)</span>
              </div>

              <div className="space-y-3">
                {overallRanking.map(([name, count], idx) => {
                  const avatar = photoMap[name] || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
                  const medal = ['🥇', '🥈', '🥉'][idx] || `#${idx + 1}`;
                  return (
                    <div key={`${name}-${idx}`} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="w-8 text-center text-amber-400 font-extrabold text-sm">{medal}</div>
                      <img
                        src={avatar}
                        alt={name}
                        className="w-10 h-10 rounded-xl object-cover bg-slate-800 border border-slate-700"
                        onError={e => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate">{name}</div>
                        <div className="w-full bg-slate-800 h-2 rounded-full mt-1 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-pink-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, (count / (overallRanking[0][1] || 1)) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-xs font-black text-purple-300">{count} คะแนน</div>
                    </div>
                  );
                })}
                {overallRanking.length === 0 && (
                  <div className="py-8 text-center text-slate-500 text-xs">ยังไม่มีผลโหวตในรอบนี้</div>
                )}
              </div>
            </div>

            {/* Category Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {CATEGORIES.map((cat, catIdx) => {
                const catData = categorySummaries[cat] || {};
                const nominees = Object.keys(catData);
                const scores = Object.values(catData);

                return (
                  <div key={cat} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                    <h3 className="text-xs font-bold text-indigo-300 text-center flex items-center justify-center gap-2">
                      <span>🏆</span>
                      <span>{cat}</span>
                    </h3>

                    {/* Avatar Header Row for top candidates */}
                    {nominees.length > 0 && (
                      <div className="flex justify-center items-end gap-3 pt-2">
                        {nominees.slice(0, 4).map((nom, idx) => {
                          const avatar = photoMap[nom] || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nom)}`;
                          return (
                            <div key={`${nom}-${idx}`} className="text-center">
                              <img
                                src={avatar}
                                alt={nom}
                                className="w-10 h-10 rounded-full object-cover mx-auto border-2 border-indigo-500 shadow-md mb-1"
                                onError={e => {
                                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nom)}`;
                                }}
                              />
                              <div className="text-[9px] font-bold text-slate-300 max-w-[50px] truncate">{nom.split(' ')[0]}</div>
                              <div className="text-[9px] font-black text-pink-400">{catData[nom]} คะแนน</div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {nominees.length > 0 ? (
                      <div className="h-48">
                        <Bar
                          data={{
                            labels: nominees.map(n => n.split(' ')[0]),
                            datasets: [{
                              label: 'คะแนน',
                              data: scores,
                              backgroundColor: nominees.map((_, i) => VOTE_BAR_COLORS[i % VOTE_BAR_COLORS.length].bg),
                              borderColor: nominees.map((_, i) => VOTE_BAR_COLORS[i % VOTE_BAR_COLORS.length].border),
                              borderWidth: 1,
                              borderRadius: 6
                            }]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                              y: { beginAtZero: true, ticks: { stepSize: 1, color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                              x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { display: false } }
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="py-12 text-center text-slate-500 text-xs">ยังไม่มีผลโหวตในหมวดนี้</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VOTE FORM TAB */}
        {activeTab === 'vote-form' && (
          <div>
            {!currentUser ? (
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center max-w-md mx-auto space-y-4 shadow-xl">
                <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto text-2xl">
                  <i className="fa-solid fa-lock"></i>
                </div>
                <h2 className="font-th font-extrabold text-xl text-white">ต้องล็อกอินก่อนส่งโหวต</h2>
                <p className="text-xs text-slate-400">กรุณายืนยันตัวตนด้วยบัญชีพนักงาน BME ของคุณเพื่อลงคะแนนให้เพื่อนพนักงาน</p>
                <button
                  onClick={() => setActiveTab('login')}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-th font-bold text-sm shadow-lg shadow-indigo-600/30"
                >
                  <i className="fa-solid fa-key mr-2"></i>ไปหน้าล็อกอิน
                </button>
              </div>
            ) : (
              <form onSubmit={handleVoteSubmit} className="max-w-3xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                {/* Ballot Header Banner */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white relative">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="font-th font-black text-xl sm:text-2xl flex items-center gap-2">
                        <i className="fa-solid fa-square-check text-pink-300"></i>
                        <span>บัตรลงคะแนนโหวตพนักงานในดวงใจ</span>
                      </h2>
                      <p className="text-xs text-white/90 mt-1 font-medium">
                        📌 กติกา: 1 คนต้องลงคะแนนให้ครบทั้ง 4 หมวด (ไม่สามารถโหวตให้ตนเองหรือคนที่ลาออกแล้วได้)
                      </p>
                    </div>

                    <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl px-3.5 py-2 shrink-0 flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <div>
                        <div className="text-[10px] text-white/70">ผู้ลงคะแนน:</div>
                        <div className="font-extrabold text-white">{currentUser.fullName} ({currentUser.nickname})</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Month Selection & Progress */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        <i className="fa-solid fa-calendar-check text-pink-400 mr-2"></i>รอบเดือนที่ต้องการโหวต
                      </label>
                      <select
                        value={targetVoteMonth}
                        onChange={e => setTargetVoteMonth(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold outline-none focus:border-indigo-500 shadow-inner"
                      >
                        {pastMonthChoices.map(mKey => {
                          const [y, m] = mKey.split('-');
                          const monthNames = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
                          return (
                            <option key={mKey} value={mKey}>
                              {monthNames[parseInt(m)]} {y} {mKey === currentMonthKey ? '(เดือนปัจจุบัน)' : '(ย้อนหลัง)'}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold text-slate-300">
                          ความคืบหน้าการโหวต:
                        </span>
                        <span className={`font-black ${isAllCategoriesVoted ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {completedVoteCount} จาก {CATEGORIES.length} หมวด ({Math.round((completedVoteCount / CATEGORIES.length) * 100)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-700/80 p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isAllCategoriesVoted
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/30'
                              : 'bg-gradient-to-r from-amber-500 to-pink-500'
                          }`}
                          style={{ width: `${(completedVoteCount / CATEGORIES.length) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                        <i className={`fa-solid ${isAllCategoriesVoted ? 'fa-circle-check text-emerald-400' : 'fa-circle-exclamation text-amber-400'}`}></i>
                        <span>{isAllCategoriesVoted ? 'ลงคะแนนครบทั้ง 4 หมวดแล้ว พร้อมกดยืนยัน' : 'ยังขาดอีก ' + (CATEGORIES.length - completedVoteCount) + ' หมวด โปรดเลือกให้ครบ'}</span>
                      </p>
                    </div>
                  </div>

                  {/* 4 Category Ballot Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {CATEGORIES.map((cat, idx) => {
                      const meta = CATEGORY_CONFIG[cat] || {
                        icon: 'fa-solid fa-trophy',
                        badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
                        borderColor: 'border-indigo-500/30',
                        accentColor: 'text-indigo-400',
                        desc: ''
                      };
                      const selectedNominee = categoryVotes[cat] || '';
                      const nomineeEmp = eligibleCandidates.find(e => e.fullName === selectedNominee);
                      const isVoted = !!selectedNominee;

                      return (
                        <div
                          key={cat}
                          className={`rounded-2xl border p-4 transition-all duration-200 flex flex-col justify-between ${
                            isVoted
                              ? 'bg-slate-800/90 border-indigo-500/50 shadow-md shadow-indigo-500/10'
                              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            {/* Card Top: Category Icon & Title */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${meta.badgeBg} border`}>
                                  <i className={meta.icon}></i>
                                </div>
                                <div>
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    หมวดที่ {idx + 1}
                                  </span>
                                  <h3 className="font-th font-extrabold text-sm text-white leading-tight">
                                    {cat}
                                  </h3>
                                </div>
                              </div>

                              {isVoted ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0 flex items-center gap-1">
                                  <i className="fa-solid fa-check text-[9px]"></i> เลือกแล้ว
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                                  รอดำเนินการ
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-400 mb-3.5 leading-snug">
                              {meta.desc}
                            </p>

                            {/* Dropdown Candidate Selection */}
                            <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                              เลือกพนักงานที่ต้องการโหวต:
                            </label>
                            <select
                              value={selectedNominee}
                              onChange={e => {
                                const val = e.target.value;
                                setCategoryVotes(prev => ({ ...prev, [cat]: val }));
                              }}
                              className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold outline-none border transition-all ${
                                isVoted
                                  ? 'border-indigo-500/60 focus:border-indigo-400 text-indigo-100'
                                  : 'border-slate-700 focus:border-indigo-500 text-slate-300'
                              }`}
                              required
                            >
                              <option value="">-- เลือกพนักงานสำหรับหมวดนี้ --</option>
                              {eligibleCandidates.map((emp, cIdx) => (
                                <option key={`${emp.id || emp.username || 'c'}-${cIdx}`} value={emp.fullName}>
                                  {emp.fullName} ({emp.nickname})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Selected Candidate Preview Thumbnail */}
                          {nomineeEmp && (
                            <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center gap-2.5 bg-slate-900/60 p-2 rounded-xl">
                              <img
                                src={photoMap[nomineeEmp.fullName] || nomineeEmp.img}
                                alt={nomineeEmp.fullName}
                                className="w-8 h-8 rounded-full object-cover border border-indigo-400/50 shrink-0"
                                onError={e => {
                                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nomineeEmp.nickname || nomineeEmp.fullName)}`;
                                }}
                              />
                              <div className="min-w-0 flex-1 text-xs">
                                <div className="font-bold text-white truncate">{nomineeEmp.fullName}</div>
                                <div className="text-[10px] text-indigo-300 truncate">ชื่อเล่น: {nomineeEmp.nickname}</div>
                              </div>
                              <i className="fa-solid fa-heart text-pink-400 text-sm mr-1"></i>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Submission Notice & Submit Button */}
                  <div className="space-y-3 pt-2">
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-3 text-xs text-indigo-200 flex items-start gap-2.5">
                      <i className="fa-solid fa-shield-halved text-indigo-400 text-base mt-0.5 shrink-0"></i>
                      <div className="leading-relaxed">
                        <strong>ระบบจะบันทึกคะแนนพร้อมกันทั้ง 4 หมวด:</strong> คุณสามารถแก้ไขและส่งคะแนนใหม่ในรอบเดือนเดียวกันได้ตลอดเวลา คะแนนที่บันทึกจะนับเป็นผลโหวตล่าสุดของคุณ
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!isAllCategoriesVoted}
                      className={`w-full py-4 rounded-2xl font-th font-extrabold text-base shadow-xl transition-all flex items-center justify-center gap-2.5 ${
                        isAllCategoriesVoted
                          ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white shadow-indigo-600/30 cursor-pointer'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      }`}
                    >
                      <i className="fa-solid fa-paper-plane text-lg"></i>
                      <span>
                        {isAllCategoriesVoted
                          ? 'ยืนยันผลโหวตครบ 4 หมวด'
                          : `กรุณาเลือกลงคะแนนให้ครบทั้ง 4 หมวด (${completedVoteCount}/4 หมวด)`}
                      </span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Submit Success Modal */}
            {submitSuccessModal && (
              <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center shadow-2xl space-y-5">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto text-3xl">
                    <i className="fa-solid fa-circle-check"></i>
                  </div>

                  <div>
                    <h3 className="font-th font-black text-2xl text-white">
                      บันทึกผลการโหวตสำเร็จ!
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      คุณได้ลงคะแนนครบทั้ง 4 หมวดรอบเดือน {targetVoteMonth} เรียบร้อยแล้ว
                    </p>
                  </div>

                  {/* Summary of chosen nominees */}
                  <div className="grid grid-cols-2 gap-2 text-left bg-slate-800/80 border border-slate-700 rounded-2xl p-3">
                    {CATEGORIES.map(cat => {
                      const nomineeName = categoryVotes[cat];
                      const emp = employees.find(e => e.fullName === nomineeName);
                      return (
                        <div key={cat} className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2">
                          <img
                            src={emp ? (photoMap[emp.fullName] || emp.img) : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nomineeName || 'nom')}`}
                            alt={nomineeName}
                            className="w-7 h-7 rounded-full object-cover shrink-0 border border-indigo-400/40"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] text-pink-300 font-extrabold truncate">{cat.split(' ')[0]}</div>
                            <div className="text-xs font-bold text-white truncate">{nomineeName ? nomineeName.split(' ')[0] : '-'}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Modal Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center gap-2.5 font-th">
                    <button
                      onClick={() => {
                        setSubmitSuccessModal(false);
                        setActiveTab('dashboard');
                      }}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30"
                    >
                      <i className="fa-solid fa-chart-pie mr-1.5"></i>ดูผลคะแนนบนแดชบอร์ด
                    </button>
                    <button
                      onClick={() => {
                        setSubmitSuccessModal(false);
                        onLogout();
                        setActiveTab('login');
                      }}
                      className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-pink-300 hover:text-white border border-slate-700 font-bold text-xs"
                    >
                      <i className="fa-solid fa-user-plus mr-1.5"></i>ให้เพื่อนโหวตต่อ (สลับผู้ใช้)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LOGIN TAB */}
        {activeTab === 'login' && (
          <div className="max-w-sm mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto text-2xl mb-2">
                <i className="fa-solid fa-user-lock"></i>
              </div>
              <h2 className="font-th font-extrabold text-lg text-white">ยืนยันตัวตนพนักงาน BME</h2>
              <p className="text-xs text-slate-400">กรอก Username และ Password ของคุณ</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Username</label>
                <input
                  type="text"
                  value={loginUser}
                  onChange={e => setLoginUser(e.target.value)}
                  placeholder="เช่น 563770 / SPV_BME / MGR_BME"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  value={loginPass}
                  onChange={e => setLoginPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-th font-bold text-sm shadow-lg shadow-indigo-600/30"
              >
                เข้าสู่ระบบ
              </button>
            </form>
          </div>
        )}

        {/* ADMIN TAB */}
        {activeTab === 'admin' && currentUser?.isAdmin && (
          <div className="bg-slate-900/90 border border-purple-500/30 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-th font-extrabold text-base text-purple-300 flex items-center gap-2">
                  <i className="fa-solid fa-shield-halved"></i>
                  <span>ตารางข้อมูลการโหวตทั้งหมด (Admin)</span>
                </h3>
                <p className="text-xs text-slate-400">เฉพาะผู้ดูแลระบบ ({currentUser.username})</p>
              </div>
              <button
                onClick={loadData}
                className="px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold"
              >
                รีเฟรช
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-purple-950/40 text-purple-200 font-bold border-b border-purple-900/40">
                  <tr>
                    <th className="p-3">เวลาที่โหวต</th>
                    <th className="p-3">ผู้โหวต</th>
                    <th className="p-3">หัวข้อ</th>
                    <th className="p-3">ผู้ได้รับโหวต</th>
                    <th className="p-3">รอบเดือน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredVotes.map((v, idx) => (
                    <tr key={`${v.id || 'vote'}-${idx}`} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono text-[11px] text-slate-400">{v.timestamp}</td>
                      <td className="p-3 font-bold text-white">{v.voter}</td>
                      <td className="p-3 text-purple-300">{v.category}</td>
                      <td className="p-3 font-bold text-indigo-300">{v.nominee}</td>
                      <td className="p-3 font-bold text-amber-300">{v.voteMonth}</td>
                    </tr>
                  ))}
                  {filteredVotes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500">ยังไม่มีข้อมูลโหวตในรอบนี้</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
