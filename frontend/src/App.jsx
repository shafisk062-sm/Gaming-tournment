import { useEffect, useState, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Bell, ChevronRight, Crosshair, Gamepad2, Menu, Search, Shield, Trophy, Users, X, Zap } from 'lucide-react';
import './App.css';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('arena_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const AuthContext = createContext(null);
function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('arena_user') || 'null'));
  const login = (data) => { localStorage.setItem('arena_token', data.token); localStorage.setItem('arena_user', JSON.stringify(data.user)); setUser(data.user); };
  const logout = () => { localStorage.removeItem('arena_token'); localStorage.removeItem('arena_user'); setUser(null); };
  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}
const useAuth = () => useContext(AuthContext);

const demoGames = ['BGMI','Free Fire MAX','Valorant','Counter-Strike 2','Call of Duty Mobile','PUBG','Fortnite','Minecraft','EA Sports FC','Clash of Clans'].map((name,i)=>({ _id:String(i),name,category:i<6?'Battle Royale / FPS':'Sports & Strategy',activeTournaments:(i%4)+1,players:4500+i*850,image:`https://images.unsplash.com/photo-${['1542751371-adc38448a05e','1511512578047-dfb367046420','1550745165-9bc0b252726f','1538481196605-c7fb89a7c9b0','1493711662062-fa541adb3fc8','1509198397868-475647b2a1e5','1556438064-2d7646166914','1511882150382-421056c89033','1518091043644-c1d4457512c6','1560419015-7c427e8ae5ba'][i]}?auto=format&fit=crop&w=700&q=80`}));
const demoTournaments = [
  ['Neon Valorant Clash','Valorant','Live','₹50,000','32'],
  ['BGMI Prime Battle','BGMI','Registration Open','₹25,000','64'],
  ['Fortnite Zero Hour','Fortnite','Upcoming','₹75,000','100'],
  ['CS2 Arena Masters','Counter-Strike 2','Live','₹100,000','32'],
  ['EA FC Championship','EA Sports FC','Registration Open','₹40,000','64'],
  ['PUBG Mobile Elite','PUBG','Upcoming','₹60,000','100']
].map((x,i)=>({_id:String(i),name:x[0],game:{name:x[1]},status:x[2],prizePool:x[3].replace('₹',''),entryFee:i%2?199:0,maxParticipants:Number(x[4]),participants:Array.from({length:(i+3)*3}),tournamentDate:new Date(Date.now()+i*86400000).toISOString(),banner:`https://images.unsplash.com/photo-${['1542751371-adc38448a05e','1511512578047-dfb367046420','1550745165-9bc0b252726f','1538481196605-c7fb89a7c9b0','1493711662062-fa541adb3fc8','1509198397868-475647b2a1e5'][i]}?auto=format&fit=crop&w=900&q=80`}));

function Header() {
  const [open,setOpen]=useState(false); const {user,logout}=useAuth();
  return <header className="nav">
    <Link className="brand" to="/" onClick={()=>setOpen(false)}><span><Crosshair size={25}/></span><b>ARENA <em>X</em></b></Link>
    <button className="menu-btn" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button>
    <nav className={open?'nav-links open':'nav-links'}>
      <Link to="/" onClick={()=>setOpen(false)}>Home</Link><Link to="/games" onClick={()=>setOpen(false)}>Games</Link><Link to="/tournaments" onClick={()=>setOpen(false)}>Tournaments</Link><Link to="/leaderboard" onClick={()=>setOpen(false)}>Leaderboard</Link>
      {user?<><Link to="/dashboard" onClick={()=>setOpen(false)}>Dashboard</Link>{user.role==='admin'&&<Link to="/admin" onClick={()=>setOpen(false)}>Admin</Link>}<button className="ghost" onClick={logout}>Logout</button></>:<><Link className="btn small ghost" to="/login" onClick={()=>setOpen(false)}>Login</Link><Link className="btn small" to="/register" onClick={()=>setOpen(false)}>Register</Link></>}
    </nav>
  </header>;
}

function GameCard({game}) {
  return <motion.article className="game-card" whileHover={{y:-8}}>
    <div className="game-image" style={{backgroundImage:`linear-gradient(180deg,transparent,rgba(8,8,18,.95)),url(${game.image||demoGames[0].image})`}}><span className="category">{game.category}</span></div>
    <div className="game-info"><h3>{game.name}</h3><div className="meta"><span><Trophy/> {game.activeTournaments||0} active</span><span><Users/> {(game.players||0).toLocaleString()}</span></div><Link className="text-link" to={`/tournaments?game=${encodeURIComponent(game.name)}`}>View tournaments <ChevronRight/></Link></div>
  </motion.article>;
}
function TournamentCard({t}) {
  const prize=typeof t.prizePool==='number'?t.prizePool:t.prizePool;
  return <motion.article className="tournament-card" whileHover={{y:-6}}>
    <div className="tournament-banner" style={{backgroundImage:`linear-gradient(90deg,rgba(8,8,18,.9),rgba(8,8,18,.15)),url(${t.banner||demoTournaments[0].banner})`}}><span className={`status ${String(t.status).toLowerCase().replaceAll(' ','-')}`}>{t.status}</span></div>
    <div className="tournament-body"><small>{t.game?.name||'Tournament'}</small><h3>{t.name}</h3><div className="prize"><span>PRIZE POOL</span><b>₹{Number(prize||0).toLocaleString()}</b></div><div className="progress"><i style={{width:`${Math.min(100,(t.participants?.length||0)/(t.maxParticipants||64)*100)}%`}}/></div><div className="t-meta"><span>{t.participants?.length||0}/{t.maxParticipants||64} joined</span><span>{t.entryFee?'₹'+t.entryFee:'Free entry'}</span></div><Link className="btn full" to={`/tournaments/${t._id}`}>View tournament</Link></div>
  </motion.article>;
}
function Page({title,children}){return <main className="page"><div className="page-head"><div><small>ARENA X</small><h1>{title}</h1></div></div>{children}</main>}

function Home(){
  const [games,setGames]=useState(demoGames); const [tournaments,setTournaments]=useState(demoTournaments);
  useEffect(()=>{api.get('/games').then(r=>r.data?.length&&setGames(r.data)).catch(()=>{});api.get('/tournaments').then(r=>r.data?.length&&setTournaments(r.data)).catch(()=>{})},[]);
  return <main>
    <section className="hero">
      <div className="hero-grid"/>
      <motion.div className="hero-copy" initial={{opacity:0,x:-30}} animate={{opacity:1,x:0}}>
        <span className="eyebrow"><Zap size={14}/> NEXT-GEN ESPORTS PLATFORM</span>
        <h1>ENTER THE ARENA.<br/><em>PROVE YOUR SKILLS.</em></h1>
        <p>Compete in elite tournaments, build your dream team, and become a legend across the global arena.</p>
        <div className="hero-actions"><Link className="btn" to="/tournaments">Join tournament</Link><Link className="btn outline" to="/games">Explore games</Link></div>
        <div className="stats-row"><div><b>25K+</b><span>Players</span></div><div><b>500+</b><span>Tournaments</span></div><div><b>₹50L+</b><span>Prizes won</span></div></div>
      </motion.div>
      <motion.div className="hero-art" initial={{opacity:0,scale:.9}} animate={{opacity:1,scale:1}}><div className="rank-card"><small>GLOBAL RANK</small><strong># 01</strong><span>NEON RAIDERS</span></div><Crosshair/></motion.div>
    </section>
    <section className="section"><div className="section-title"><div><small>FIGHT FOR GLORY</small><h2>Featured tournaments</h2></div><Link to="/tournaments">View all <ChevronRight/></Link></div><div className="tournament-grid">{tournaments.slice(0,3).map(t=><TournamentCard key={t._id} t={t}/>)}</div></section>
    <section className="section"><div className="section-title"><div><small>CHOOSE YOUR BATTLEGROUND</small><h2>Popular games</h2></div><Link to="/games">View all <ChevronRight/></Link></div><div className="game-grid">{games.slice(0,5).map(g=><GameCard key={g._id||g.name} game={g}/>)}</div></section>
    <section className="cta"><Shield/><div><small>READY TO COMPETE?</small><h2>Build your legacy today</h2></div><Link className="btn" to="/register">Create free account</Link></section>
  </main>;
}

function Games(){
  const [games,setGames]=useState(demoGames);const [filter,setFilter]=useState('All');
  useEffect(()=>{api.get('/games').then(r=>r.data?.length&&setGames(r.data)).catch(()=>{})},[]);
  const cats=['All',...new Set(games.map(g=>g.category))]
  return <Page title="Game arena"><div className="filters">{cats.map(c=><button className={filter===c?'active':''} onClick={()=>setFilter(c)} key={c}>{c}</button>)}</div><div className="game-grid">{games.filter(g=>filter==='All'||g.category===filter).map(g=><GameCard key={g._id||g.name} game={g}/>)}</div></Page>
}

function Tournaments(){
  const [items,setItems]=useState(demoTournaments);const [search,setSearch]=useState('');
  useEffect(()=>{api.get('/tournaments').then(r=>r.data?.length&&setItems(r.data)).catch(()=>{})},[]);
  const visible=items.filter(t=>t.name.toLowerCase().includes(search.toLowerCase()));
  return <Page title="Tournaments"><div className="toolbar"><label><Search/><input placeholder="Search tournaments..." value={search} onChange={e=>setSearch(e.target.value)}/></label></div><div className="tournament-grid">{visible.map(t=><TournamentCard key={t._id} t={t}/>)}</div></Page>
}
function TournamentDetail(){
  const {id}=useParams();const [t,setT]=useState(demoTournaments.find(x=>x._id===id)||demoTournaments[0]);const {user}=useAuth();const navigate=useNavigate();
  useEffect(()=>{api.get('/tournaments/'+id).then(r=>setT(r.data)).catch(()=>{})},[id]);
  const register=async()=>{if(!user)return navigate('/login');try{await api.post('/tournaments/'+id+'/register');alert('Tournament registration successful');}catch(e){alert(e.response?.data?.message||'Registration failed')}};
  return <Page title={t.name}><div className="detail"><div className="detail-banner" style={{backgroundImage:`linear-gradient(90deg,rgba(8,8,18,.9),transparent),url(${t.banner||demoTournaments[0].banner})`}}><span className="status live">{t.status}</span></div><div className="detail-grid"><div><small>{t.game?.name||'Tournament'}</small><h2>{t.name}</h2><p>{t.description||'Join the arena and compete against verified teams and players for points, prizes, and global ranking.'}</p><h3>Tournament rules</h3><ul>{(t.rules||['No cheating or exploits','Join the lobby 15 minutes early','Disputes require valid screenshots']).map(r=><li key={r}>{r}</li>)}</ul></div><aside><span>PRIZE POOL</span><strong>₹{Number(t.prizePool||50000).toLocaleString()}</strong><div><b>Entry fee</b><span>{t.entryFee?'₹'+t.entryFee:'Free'}</span></div><div><b>Participants</b><span>{t.participants?.length||0}/{t.maxParticipants||64}</span></div><button className="btn full" onClick={register}>Register now</button></aside></div></div></Page>
}

function Leaderboard(){
  const [players,setPlayers]=useState([]);
  useEffect(()=>{api.get('/leaderboard').then(r=>setPlayers(r.data)).catch(()=>{})},[]);
  const rows=players.length?players:Array.from({length:10},(_,i)=>({name:`Neon Player ${i+1}`,username:`player${i+1}`,stats:{points:3500-i*230,wins:42-i*3,matchesPlayed:60-i*4},avatar:''}));
  return <Page title="Global leaderboard"><div className="leaderboard"><div className="lb-head"><span>Rank</span><span>Player</span><span>Matches</span><span>Wins</span><span>Points</span></div>{rows.map((p,i)=><div className="lb-row" key={p.username||p.name}><b className={'rank r'+(i+1)}>#{i+1}</b><div className="player"><div className="avatar">{p.name?.[0]||'P'}</div><div><strong>{p.name}</strong><small>@{p.username}</small></div></div><span>{p.stats?.matchesPlayed||0}</span><span>{p.stats?.wins||0}</span><b>{p.stats?.points||0}</b></div>)}</div></Page>
}

function AuthPage({register=false}) {
  const [form,setForm]=useState({name:'',username:'',email:'',phone:'',password:'',confirmPassword:''});const [error,setError]=useState('');const {login}=useAuth();const navigate=useNavigate();
  const submit=async(e)=>{e.preventDefault();setError('');try{const r=await api.post(register?'/auth/register':'/auth/login',register?form:{email:form.email,password:form.password});login(r.data);navigate('/dashboard')}catch(err){setError(err.response?.data?.message||'Unable to connect to the server')}};
  const change=e=>setForm({...form,[e.target.name]:e.target.value});
  return <main className="auth-wrap"><form className="auth-card" onSubmit={submit}><Link className="brand" to="/"><span><Crosshair/></span><b>ARENA <em>X</em></b></Link><h1>{register?'Create account':'Welcome back'}</h1><p>{register?'Join the next generation of esports':'Sign in to continue to your arena'}</p>{error&&<div className="form-error">{error}</div>}<div className="form-grid">{register&&<><input name="name" placeholder="Full name" value={form.name} onChange={change} required/><input name="username" placeholder="Username" value={form.username} onChange={change} required/><input name="phone" placeholder="Phone number" value={form.phone} onChange={change}/></>}<input name="email" type={register?'email':'text'} placeholder={register?'Email address':'Email or username'} value={form.email} onChange={change} required/><input name="password" type="password" placeholder="Password" value={form.password} onChange={change} required/>{register&&<input name="confirmPassword" type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={change} required/>}</div><button className="btn full">{register?'Create account':'Login'}</button><small>{register?'Already have an account?':'New to Arena X?'} <Link to={register?'/login':'/register'}>{register?'Login':'Register'}</Link></small></form></main>
}

function Dashboard(){
  const {user}=useAuth();const navigate=useNavigate();
  useEffect(()=>{if(!user)navigate('/login')},[user,navigate]);
  if(!user)return null;
  return <Page title="Player dashboard"><div className="dashboard"><aside className="profile-card"><div className="avatar large">{user.name?.[0]||'P'}</div><h3>{user.name}</h3><small>@{user.username}</small><b>GLOBAL RANK #{4}</b><button className="btn outline full">Edit profile</button></aside><div className="dash-main"><div className="dash-stats"><article><Trophy/><div><b>{user.stats?.wins||18}</b><span>Total wins</span></div></article><article><Crosshair/><div><b>{user.stats?.matchesPlayed||42}</b><span>Matches</span></div></article><article><Zap/><div><b>{user.stats?.points||2850}</b><span>Points</span></div></article></div><section className="panel"><h3>Upcoming matches</h3><div className="empty-state">No upcoming matches yet. <Link to="/tournaments">Join a tournament</Link></div></section><section className="panel"><h3>Notifications</h3><div className="empty-state"><Bell/> Welcome to Arena X! Your player profile is ready.</div></section></div></div></Page>
}
function Admin(){
  const {user}=useAuth();const navigate=useNavigate();const [stats,setStats]=useState(null);
  useEffect(()=>{if(!user||user.role!=='admin')navigate('/dashboard');else api.get('/admin/stats').then(r=>setStats(r.data)).catch(()=>{})},[user,navigate]);
  if(!stats)return <Page title="Admin dashboard"><div className="loading">Loading analytics...</div></Page>;
  return <Page title="Admin dashboard"><div className="admin-grid">{[['Users',stats.users],['Active tournaments',stats.activeTournaments],['Teams',stats.teams],['Matches',stats.matches],['Tournaments',stats.tournaments],['Reports',0]].map(([label,value])=> <article className="stat-card" key={label}><small>{label}</small><strong>{value}</strong></article>)}</div><section className="panel"><h3>Administration</h3><div className="admin-actions"><button className="btn">Create tournament</button><button className="btn outline">Manage users</button><button className="btn outline">Verify matches</button></div></section></Page>
}
function Footer(){return <footer><div className="brand"><span><Crosshair/></span><b>ARENA <em>X</em></b></div><p>The global arena for competitive players and teams.</p><div><Link to="/tournaments">Tournaments</Link><Link to="/leaderboard">Leaderboard</Link><Link to="/games">Games</Link></div><small>© 2026 Arena X Esports. All rights reserved.</small></footer>}

export default function App(){
  return <AuthProvider><BrowserRouter><Header/><Routes><Route path="/" element={<Home/>}/><Route path="/games" element={<Games/>}/><Route path="/tournaments" element={<Tournaments/>}/><Route path="/tournaments/:id" element={<TournamentDetail/>}/><Route path="/leaderboard" element={<Leaderboard/>}/><Route path="/login" element={<AuthPage/>}/><Route path="/register" element={<AuthPage register/>}/><Route path="/dashboard" element={<Dashboard/>}/><Route path="/admin" element={<Admin/>}/><Route path="*" element={<Page title="404 — Arena not found"><p>The page you are looking for does not exist.</p></Page>}/></Routes><Footer/></BrowserRouter></AuthProvider>
}
