"use client";
import { useState, useEffect } from "react";
import { Save, Plus, Trash2, TrendingUp, Printer } from "lucide-react";
import { storageSave, storageLoad } from "@/lib/storage";
import { PrintDocument } from "@/components/tools/print-document";
import type { PrintSection } from "@/components/tools/print-document";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";
const STORAGE_KEY = "roster_social_calendar";

const PLATFORMS = ["TikTok","Instagram","YouTube","Facebook","Twitter / X","WhatsApp","LinkedIn"];
const CONTENT_TYPES = ["Short-form video","Reel / Short","Feed post","Story","Go Live","Long-form video","Community post","Podcast episode","Newsletter","Press release"];
const STATUS_OPTS = ["Planned","Creating","Scheduled","Posted","Cancelled"] as const;
type PostStatus = typeof STATUS_OPTS[number];
const STATUS_COLORS: Record<PostStatus, string> = {
  Planned: "#8B5CF6", Creating: "#F59E0B", Scheduled: "#3B82F6", Posted: "#10B981", Cancelled: "#6B7280"
};

interface Post { id:string; platform:string; contentType:string; caption:string; postDate:string; status:PostStatus; notes:string; }
interface StrategyBrief { artistName:string; manager:string; genres:string; homeCity:string; targetMarkets:string; targetAge:string; goals:string; tone:string; }
interface HashtagGroup { id:string; name:string; tags:string; }
interface CollabEntry { id:string; name:string; type:string; platform:string; status:string; notes:string; }

const EMPTY_POST: Omit<Post,"id"> = { platform:"TikTok", contentType:"Short-form video", caption:"", postDate:"", status:"Planned", notes:"" };
const MONTHLY_THEMES = [
  { month:"January", theme:"New Year energy / Fresh starts / Summer push", events:"New Year, Youth energy" },
  { month:"February", theme:"Love songs, collabs, fan appreciation", events:"Valentine's Day, Grammy Awards" },
  { month:"March", theme:"Heritage, identity, social justice, album rollout", events:"Human Rights Day (21 Mar), SAMA nominations" },
  { month:"April", theme:"Reflection, faith-adjacent content, freedom themes", events:"Freedom Day (27 Apr), Easter" },
  { month:"May", theme:"Pan-African pride, continental artist collabs", events:"Workers' Day (1 May), Africa Day (25 May)" },
  { month:"June", theme:"Youth culture, education, struggle heritage, authenticity", events:"Youth Day (16 Jun)" },
  { month:"July", theme:"Fashion, lifestyle, winter vibes, nostalgia", events:"Mandela Day (18 Jul), Durban July" },
  { month:"August", theme:"Women empowerment, community uplift", events:"Women's Month, National Women's Day (9 Aug)" },
  { month:"September", theme:"Heritage Month, spring energy, identity", events:"Heritage Day (24 Sep), SAMA Awards" },
  { month:"October", theme:"Festive season buildup, album campaign push", events:"DSTV Delicious Festival, Awesome Africa" },
  { month:"November", theme:"Year-end campaign, fan gratitude", events:"AfriMuseXchange, year-end push" },
  { month:"December", theme:"Festive season, year in review, new era teaser", events:"Festive tours, year-end content series" },
];

type Tab = "brief" | "calendar" | "themes" | "hashtags" | "collabs" | "analytics";

export default function SocialMediaCalendar() {
  const handleExportPDF = () => { window.print(); };
  const [tab, setTab] = useState<Tab>("brief");
  const [brief, setBrief] = useState<StrategyBrief>({ artistName:"",manager:"",genres:"",homeCity:"",targetMarkets:"",targetAge:"",goals:"",tone:"" });
  const [posts, setPosts] = useState<Post[]>([]);
  const [hashtagGroups, setHashtagGroups] = useState<HashtagGroup[]>([
    { id:"1", name:"Amapiano", tags:"#amapiano #amapianolovers #logdrum #saamapiano #mzansimusic" },
    { id:"2", name:"Afropop / Afrobeats", tags:"#afropop #afrobeats #africamusic #naijasounds #newafricanmusic" },
    { id:"3", name:"SA Music General", tags:"#samusic #mzansi #southafricanmusic #proudlysafrica #joburg" },
  ]);
  const [collabs, setCollabs] = useState<CollabEntry[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, Record<string, string>>>({});
  const [showPostForm, setShowPostForm] = useState(false);
  const [newPost, setNewPost] = useState({...EMPTY_POST});
  const [saved, setSaved] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState("All");

  useEffect(() => {
    type Saved = { brief?: StrategyBrief; posts?: Post[]; hashtags?: HashtagGroup[]; collabs?: CollabEntry[]; analytics?: Record<string, Record<string, string>> };
    try {
      const d = storageLoad<Saved>(STORAGE_KEY);
      if (d) {
        if (d.brief) setBrief(d.brief);
        if (d.posts) setPosts(d.posts);
        if (d.hashtags) setHashtagGroups(d.hashtags);
        if (d.collabs) setCollabs(d.collabs);
        if (d.analytics) setAnalytics(d.analytics);
        return;
      }
    } catch {}
    fetch(`/api/tools/save?slug=social-media-calendar`)
      .then(r => r.json())
      .then(({ snapshot }) => {
        if (!snapshot?.data) return;
        const d = snapshot.data as Saved;
        if (d.brief) setBrief(d.brief);
        if (d.posts) setPosts(d.posts);
        if (d.hashtags) setHashtagGroups(d.hashtags);
        if (d.collabs) setCollabs(d.collabs);
        if (d.analytics) setAnalytics(d.analytics);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ brief: d.brief, posts: d.posts, hashtags: d.hashtags, collabs: d.collabs, analytics: d.analytics })); } catch {}
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = () => {
    storageSave("roster_social_calendar", { brief, posts, hashtags: hashtagGroups, collabs, analytics });
    setSaved(true); setTimeout(()=>setSaved(false), 2000);
  };

  const addPost = () => {
    if (!newPost.caption && !newPost.postDate) return;
    setPosts(p => [...p, {...newPost, id: Date.now().toString()}]);
    setNewPost({...EMPTY_POST}); setShowPostForm(false);
  };

  const removePost = (id: string) => setPosts(p => p.filter(x => x.id !== id));
  const updatePostStatus = (id: string, status: PostStatus) => setPosts(p => p.map(x => x.id===id?{...x,status}:x));

  const filteredPosts = filterPlatform==="All" ? posts : posts.filter(p=>p.platform===filterPlatform);
  const ANALYTICS_METRICS = ["Followers","Monthly Reach","Engagement Rate (%)","Posts Published","Top Post Views","Profile Visits"];

  const TABS: {id:Tab; label:string}[] = [
    {id:"brief",label:"Strategy Brief"},
    {id:"calendar",label:`Content Calendar (${posts.length})`},
    {id:"themes",label:"Annual Themes"},
    {id:"hashtags",label:"Hashtag Bank"},
    {id:"collabs",label:"Collabs"},
    {id:"analytics",label:"Analytics"},
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={18} className="text-brand"/>
            <h1 className="text-xl font-black text-text-primary">Social Media Strategy Calendar</h1>
          </div>
          <p className="text-sm text-text-muted">Full social strategy, brief, content calendar, annual themes, hashtags, collabs and analytics.</p>
        </div>
        <ExportButton onPDF={handleExportPDF} />
        <SaveButton toolSlug="social-media-calendar" storageKey={STORAGE_KEY} title={`Social Media Calendar — ${new Date().toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}`} />
      </div>
      <div className="flex gap-1.5 mb-6 border-b border-border overflow-x-auto scrollbar-none">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-shrink-0 px-3 py-2.5 text-xs font-semibold transition-all border-b-2 -mb-px whitespace-nowrap ${tab===t.id?"border-brand text-brand":"border-transparent text-text-muted hover:text-text-primary"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Strategy Brief */}
      {tab==="brief" && (
        <div className="glass-card rounded-xl p-6">
          <p className="text-xs font-black uppercase tracking-widest text-brand mb-5">Artist Strategy Brief</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {label:"Artist / Project Name",key:"artistName",placeholder:"e.g. IMARA"},
              {label:"Manager / Team Contact",key:"manager",placeholder:"e.g. Thembi Khumalo"},
              {label:"Genre(s)",key:"genres",placeholder:"e.g. Amapiano, Afrobeats, R&B"},
              {label:"Home City & Province",key:"homeCity",placeholder:"e.g. Johannesburg, Gauteng"},
              {label:"Target Markets",key:"targetMarkets",placeholder:"e.g. South Africa, Nigeria, UK Diaspora"},
              {label:"Target Age Demographics",key:"targetAge",placeholder:"e.g. 18–34 years"},
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-text-muted mb-1">{f.label}</label>
                <input type="text" value={(brief as unknown as Record<string,string>)[f.key]} placeholder={f.placeholder}
                  onChange={e => setBrief(p=>({...p,[f.key]:e.target.value}))}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-brand transition-colors"/>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {[
              {label:"Annual Goals",key:"goals",placeholder:"e.g. 1M monthly Spotify listeners, 500K TikTok followers, 3 brand deals"},
              {label:"Brand Tone & Voice",key:"tone",placeholder:"e.g. Authentic, aspirational, community-first, bilingual (Zulu/English)"},
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-text-muted mb-1">{f.label}</label>
                <textarea rows={3} value={(brief as unknown as Record<string,string>)[f.key]} placeholder={f.placeholder}
                  onChange={e => setBrief(p=>({...p,[f.key]:e.target.value}))}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-brand transition-colors resize-none"/>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Calendar */}
      {tab==="calendar" && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
              {["All",...PLATFORMS].map(p => (
                <button key={p} onClick={() => setFilterPlatform(p)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterPlatform===p?"bg-brand text-bg":"bg-surface-2 text-text-muted hover:text-text-primary"}`}>{p}</button>
              ))}
            </div>
            <button onClick={() => setShowPostForm(v=>!v)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-brand/20 text-brand hover:bg-brand/30 transition-all flex-shrink-0">
              <Plus size={13}/>{showPostForm?"Cancel":"Add Post"}
            </button>
          </div>
          {showPostForm && (
            <div className="glass-card rounded-xl p-5 mb-5 border-brand/20">
              <p className="text-xs font-black uppercase tracking-widest text-brand mb-4">New Content Entry</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Platform</label>
                  <select value={newPost.platform} onChange={e=>setNewPost(p=>({...p,platform:e.target.value}))}
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-brand">
                    {PLATFORMS.map(p=><option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Content Type</label>
                  <select value={newPost.contentType} onChange={e=>setNewPost(p=>({...p,contentType:e.target.value}))}
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-brand">
                    {CONTENT_TYPES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Post Date</label>
                  <input type="date" value={newPost.postDate} onChange={e=>setNewPost(p=>({...p,postDate:e.target.value}))}
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"/>
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-xs font-semibold text-text-muted mb-1">Caption / Content Idea</label>
                <textarea rows={2} value={newPost.caption} onChange={e=>setNewPost(p=>({...p,caption:e.target.value}))}
                  placeholder="What's the post about? Add your caption idea or content brief here..."
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-brand resize-none"/>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-text-muted mb-1">Notes</label>
                <input type="text" value={newPost.notes} onChange={e=>setNewPost(p=>({...p,notes:e.target.value}))}
                  placeholder="Hashtags, tags, assets needed, deadline notes..."
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"/>
              </div>
              <button onClick={addPost} className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold bg-brand text-bg hover:opacity-90 transition-all">
                <Plus size={14}/>Add to Calendar
              </button>
            </div>
          )}
          {filteredPosts.length === 0 ? (
            <div className="glass-card rounded-xl p-10 text-center">
              <p className="text-4xl mb-3">📅</p>
              <p className="font-bold text-text-primary mb-1">No content planned yet</p>
              <p className="text-sm text-text-muted">Add your first post to start filling your content calendar.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPosts.sort((a,b)=>a.postDate.localeCompare(b.postDate)).map(post => {
                const sc = STATUS_COLORS[post.status];
                return (
                  <div key={post.id} className="glass-card rounded-xl p-4 flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <span className="text-xs font-black px-2 py-1 rounded" style={{color:sc,backgroundColor:`${sc}15`}}>{post.platform}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-xs font-semibold text-text-muted">{post.contentType}</span>
                        {post.postDate && <span className="text-xs text-text-muted">· {post.postDate}</span>}
                      </div>
                      {post.caption && <p className="text-sm text-text-primary mb-0.5">{post.caption}</p>}
                      {post.notes && <p className="text-xs text-text-muted italic">{post.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <select value={post.status} onChange={e=>updatePostStatus(post.id, e.target.value as PostStatus)}
                        className="text-xs bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-text-primary outline-none focus:border-brand">
                        {STATUS_OPTS.map(s=><option key={s}>{s}</option>)}
                      </select>
                      <button onClick={()=>removePost(post.id)} className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/5 transition-all"><Trash2 size={13}/></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Annual Themes */}
      {tab==="themes" && (
        <div className="space-y-2">
          {MONTHLY_THEMES.map(m => (
            <div key={m.month} className="glass-card rounded-xl p-4 flex gap-4 items-start">
              <div className="w-16 flex-shrink-0">
                <span className="text-xs font-black text-brand">{m.month}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary mb-0.5">{m.theme}</p>
                <p className="text-xs text-text-muted">{m.events}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hashtag Bank */}
      {tab==="hashtags" && (
        <div className="space-y-4">
          {hashtagGroups.map((g,gi) => (
            <div key={g.id} className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <input type="text" value={g.name} onChange={e=>setHashtagGroups(p=>p.map((x,i)=>i===gi?{...x,name:e.target.value}:x))}
                  className="flex-1 bg-transparent text-sm font-bold text-text-primary outline-none border-b border-transparent hover:border-brand/30 focus:border-brand pb-0.5 transition-colors"/>
                <button onClick={()=>setHashtagGroups(p=>p.filter((_,i)=>i!==gi))} className="p-1.5 rounded text-text-muted hover:text-error transition-all"><Trash2 size={13}/></button>
              </div>
              <textarea rows={3} value={g.tags} onChange={e=>setHashtagGroups(p=>p.map((x,i)=>i===gi?{...x,tags:e.target.value}:x))}
                placeholder="Add hashtags separated by spaces..."
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-brand resize-none font-mono text-xs"/>
            </div>
          ))}
          <button onClick={()=>setHashtagGroups(p=>[...p,{id:Date.now().toString(),name:"New Group",tags:""}])}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-brand/10 text-brand hover:bg-brand/20 transition-all">
            <Plus size={13}/>Add Hashtag Group
          </button>
        </div>
      )}

      {/* Collabs */}
      {tab==="collabs" && (
        <div>
          <button onClick={()=>setCollabs(p=>[...p,{id:Date.now().toString(),name:"",type:"Feature",platform:"Instagram",status:"Outreach",notes:""}])}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-brand/20 text-brand hover:bg-brand/30 transition-all mb-4">
            <Plus size={13}/>Add Collaboration
          </button>
          {collabs.length===0 ? (
            <div className="glass-card rounded-xl p-10 text-center">
              <p className="text-4xl mb-3">🤝🏽</p>
              <p className="font-bold text-text-primary mb-1">No collaborations tracked yet</p>
              <p className="text-sm text-text-muted">Track potential features, cross-posts, brand collabs and more.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {collabs.map((c,ci) => (
                <div key={c.id} className="glass-card rounded-xl p-4 grid grid-cols-[2fr_1fr_1fr_1fr_2fr_auto] gap-2 items-center">
                  {[
                    {key:"name",placeholder:"Name / Artist"},
                    {key:"type",placeholder:"Type"},
                    {key:"platform",placeholder:"Platform"},
                    {key:"status",placeholder:"Status"},
                    {key:"notes",placeholder:"Notes"},
                  ].map(f => (
                    <input key={f.key} type="text" value={(c as unknown as Record<string,string>)[f.key]} placeholder={f.placeholder}
                      onChange={e=>setCollabs(p=>p.map((x,i)=>i===ci?{...x,[f.key]:e.target.value}:x))}
                      className="bg-surface-2 border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary outline-none focus:border-brand transition-colors"/>
                  ))}
                  <button onClick={()=>setCollabs(p=>p.filter((_,i)=>i!==ci))} className="p-1.5 rounded text-text-muted hover:text-error transition-all"><Trash2 size={13}/></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics Tracker */}
      {tab==="analytics" && (
        <div className="overflow-x-auto">
          <p className="text-xs text-text-muted mb-4">Track your monthly platform stats. Enter numbers to build a picture of your growth over time.</p>
          <table className="w-full min-w-[800px] text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="text-left px-4 py-2.5 font-bold text-text-muted w-36 sticky left-0 bg-surface-2 border-r border-border">Platform / Metric</th>
                {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m=>
                  <th key={m} className="px-2 py-2.5 font-bold text-text-muted text-center">{m}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {PLATFORMS.flatMap(platform =>
                ANALYTICS_METRICS.map((metric, mi) => {
                  const key = `${platform}__${metric}`;
                  return (
                    <tr key={key} className={mi===0?"border-t border-border/50":""}>
                      <td className="px-4 py-2 sticky left-0 bg-surface border-r border-border">
                        {mi===0 && <p className="text-[10px] font-black text-brand uppercase tracking-wider">{platform}</p>}
                        <p className="text-xs text-text-muted">{metric}</p>
                      </td>
                      {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m => (
                        <td key={m} className="px-1 py-1.5">
                          <input type="text" value={analytics[key]?.[m]??""} placeholder=", "
                            onChange={e=>setAnalytics(p=>({...p,[key]:{...(p[key]??{}),[m]:e.target.value}}))}
                            className="w-full text-center bg-transparent border border-transparent hover:border-brand/30 focus:border-brand focus:bg-surface-2 rounded px-1 py-0.5 outline-none transition-all text-text-primary placeholder:text-text-muted/30"/>
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-text-muted mt-4 text-center">Press Save to keep your data between sessions (stored 90 days).</p>

      {showPrint && (() => {
        const sections: PrintSection[] = [
          { heading: "Artist Strategy Brief", stats: [
              { label: "Artist", value: brief.artistName || ", " },
              { label: "Manager", value: brief.manager || ", " },
              { label: "Genre(s)", value: brief.genres || ", " },
              { label: "Home City", value: brief.homeCity || ", " },
              { label: "Target Markets", value: brief.targetMarkets || ", " },
              { label: "Target Age", value: brief.targetAge || ", " },
            ],
            note: brief.goals ? `Goals: ${brief.goals}` : undefined },
          { heading: "Content Calendar", color: "#06B6D4",
            tables: posts.length > 0 ? [{ headers: ["Date","Platform","Type","Caption","Status"],
              rows: posts.sort((a,b)=>a.postDate.localeCompare(b.postDate)).map(p=>[p.postDate||", ",p.platform,p.contentType,p.caption||", ",p.status]) }] : undefined,
            note: posts.length === 0 ? "No posts planned yet." : undefined },
          { heading: "Hashtag Bank", color: "#8B5CF6",
            lists: hashtagGroups.map(g => ({ title: g.name, items: [g.tags || "(empty)"] })) },
          { heading: "Collaborations", color: "#EC4899",
            tables: collabs.length > 0 ? [{ headers: ["Name","Type","Platform","Status","Notes"],
              rows: collabs.map(c=>[c.name,c.type,c.platform,c.status,c.notes]) }] : undefined,
            note: collabs.length === 0 ? "No collaborations logged yet." : undefined },
        ];
        return <PrintDocument toolName="Social Media Strategy Calendar" subtitle={brief.artistName ? `${brief.artistName} · 2026 Strategy` : "Social Strategy"} sections={sections} onClose={() => setShowPrint(false)}/>;
      })()}
    </div>
  );
}
