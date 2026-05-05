import { useState, useEffect } from "react"
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { createSession, getSessions,reset,deleteSession } from '../features/sessions/sessionSlice'
import { toast } from 'react-toastify'
import SessionCard from "../components/SessionCard"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const ROLES = [
  "MERN Stack Developer",
  "MEAN Stack Developer",
  "Full Stack Python",
  "Full Stack Java",
  "Frontend Developer",
  "Backend Developer",
  "Data Scientist",
  "Data Analyst",
  "Machine Learning Engineer",
  "DevOps Engineer",
  "Cloud Engineer (AWS/Azure/GCP)",
  "Cybersecurity Engineer",
  "Blockchain Developer",
  "Mobile Developer (iOS/Android)",
  "Game Developer",
  "UI/UX Designer",
  "QA Automation Engineer",
  "Product Manager"
];
const LEVELS = ["Junior", "Mid-Level", "Senior"];
const TYPES = [{ label: 'Oral only', value: 'oral-only' }, { label: 'Coding Mix', value: 'coding-mix' }];
const COUNTS = [5, 10, 15];

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { sessions, isLoading, isGenerating, isError, message } = useSelector((state) => state.sessions);
  const isProcessing = isGenerating;

  const [formData, setFormData] = useState({
    role: user.preferredRole || ROLES[0],
    level: LEVELS[0],
    interviewType: TYPES[1].value,
    count: COUNTS[0],
  });
  const [resumeFile, setResumeFile] = useState(null);

  useEffect(() => {
    dispatch(getSessions());
  }, [dispatch]);

  useEffect(() => {
    if (isError && message) {
      toast.error(message);
      dispatch(reset());
    }
  }, [isError, message, dispatch]);

  const onChange = (e) => {
    setFormData((prevState) => ({ ...prevState, [e.target.name]: e.target.value }));
  }

  const onSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('role', formData.role);
    data.append('level', formData.level);
    data.append('interviewType', formData.interviewType);
    data.append('count', formData.count);
    if (resumeFile) {
       data.append('resume', resumeFile);
    }
    dispatch(createSession(data));
  }

  const viewSession = (session) => {
    if (session.status === 'completed') {
      navigate(`/review/${session._id}`);
    } else if(session.status === 'in-progress') {
      navigate(`/interview/${session._id}`);
    }else{
      toast.info('Session not ready yet')
    }
  }


    const handleDelete = (e, sessionId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this session?')) {
      dispatch(deleteSession(sessionId));
      toast.error('Session Deleted')
    }
  }

  // Analytics Data Preparation
  const completedSessions = [...sessions].filter(s => s.status === 'completed').reverse(); // oldest to newest for chart
  const trendData = completedSessions.map((s, index) => ({
    name: `Session ${index + 1}`,
    score: s.overallScore || 0,
    technical: s.metrics?.avgTechnical || 0,
    confidence: s.metrics?.avgConfidence || 0
  }));

  // Average radar data
  const avgTech = trendData.length > 0 ? Math.round(trendData.reduce((acc, curr) => acc + curr.technical, 0) / trendData.length) : 0;
  const avgConf = trendData.length > 0 ? Math.round(trendData.reduce((acc, curr) => acc + curr.confidence, 0) / trendData.length) : 0;
  const radarData = [
    { subject: 'Technical', A: avgTech, fullMark: 100 },
    { subject: 'Confidence', A: avgConf, fullMark: 100 },
    { subject: 'Problem Solving', A: Math.round((avgTech + avgConf) / 2), fullMark: 100 }, 
    { subject: 'Communication', A: avgConf, fullMark: 100 }, 
  ];



  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-8 sm:space-y-12 animate-in duration-700">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 sm:pb-8">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Welcome, <span className="text-teal-600">{user.name.split(' ')[0]}</span> </h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-lg font-medium">Ready for your technical prep?</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-teal-50 dark:bg-teal-900/30 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl border border-teal-100 dark:border-teal-800 flex sm:block items-center gap-2">
            <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider">Total Sessions</p>
            <p className="text-xl sm:text-2xl font-black text-teal-700 dark:text-teal-300 leading-none">{sessions.length}</p>
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[2.5rem] shadow-xl sm:shadow-2xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="bg-slate-900 dark:bg-slate-950 px-6 py-4 sm:px-8 sm:py-6">
          <h2 className="text-lg font-bold text-white flex items-center">
            <span className="bg-teal-500 w-1.5 h-5 rounded-full mr-3"></span>
            New Interview
          </h2>
        </div>
        <form onSubmit={onSubmit} className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 items-end">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role</label>
            <select name="role" value={formData.role} onChange={onChange} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl sm:rounded-2xl p-3 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-teal-500">
              {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}</select>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:contents">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Level</label>
              <select name="level" value={formData.level} onChange={onChange} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl sm:rounded-2xl p-3 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-teal-500">
                {LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}</select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Length</label>
              <select name="count" value={formData.count} onChange={onChange} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl sm:rounded-2xl p-3 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-teal-500">
                {COUNTS.map((count) => <option key={count} value={count}>{count} Qs</option>)}</select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
            <select name="interviewType" value={formData.interviewType} onChange={onChange} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl sm:rounded-2xl p-3 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-teal-500">
              {TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select>
          </div>
          <div className="space-y-1.5 lg:col-span-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Upload Resume (PDF)</label>
             <input type="file" accept=".pdf" onChange={(e) => setResumeFile(e.target.files[0])} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl p-2.5 text-sm text-slate-700 dark:text-slate-200 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 dark:file:bg-teal-900/30 dark:file:text-teal-400" />
          </div>
          <button type="submit" disabled={isProcessing} className={`w-full lg:col-span-3 h-[48px] rounded-xl font-bold text-white flex items-center justify-center gap-2 ${isProcessing ? 'bg-slate-300' : 'bg-teal-600 hover:bg-teal-700'}`}>
            {isProcessing ? <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> Generating...</> : <span className="text-sm">Start Interview</span>}
          </button>
        </form>
      </div>

      {/* ANALYTICS SECTION */}
      {completedSessions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Performance Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#0d9488" strokeWidth={3} dot={{ r: 4, fill: '#0d9488' }} activeDot={{ r: 6 }} name="Overall Score" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Skill Breakdown</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#334155" opacity={0.3} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Skills" dataKey="A" stroke="#0d9488" fill="#14b8a6" fillOpacity={0.5} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY LIST (Now separate from the creation card) */}
      <div className="space-y-6 pb-20 sm:pb-0">
        <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center px-2"><span className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 dark:bg-slate-800 rounded-lg sm:rounded-xl flex items-center justify-center mr-3 text-sm sm:text-lg">📊</span> Interview History</h2>
        {isLoading && sessions.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-teal-500 rounded-full"></div>
          </div>
        ) : (
          sessions.length === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-[2rem] py-16 sm:py-20 text-center">
              <p className="text-slate-400 dark:text-slate-500 font-bold text-base sm:text-lg">No sessions yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <SessionCard key={session._id} session={session} onClick={viewSession} onDelete={handleDelete}/>
              ))}
            </div>
          )
        )}
      </div>

    </div>
  )
}
export default Dashboard
