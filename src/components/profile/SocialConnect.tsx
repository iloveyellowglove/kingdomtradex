'use client';
import { useState, useEffect } from 'react';
interface SocialPlatform { key: string; name: string; color: string; icon: string; }
const PLATFORMS: SocialPlatform[] = [
  { key: 'twitter', name: 'Twitter / X', color: '#1DA1F2', icon: '𝕏' },
  { key: 'telegram', name: 'Telegram', color: '#26A5E4', icon: '✈' },
  { key: 'instagram', name: 'Instagram', color: '#E4405F', icon: '📷' },
  { key: 'facebook', name: 'Facebook', color: '#1877F2', icon: 'f' },
];
export default function SocialConnect() {
  const [handles, setHandles] = useState<Record<string, string>>({});
  const [verified, setVerified] = useState<Record<string, boolean>>({});
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => { async function load() { try { const r = await fetch('/api/profile/social'); const d = await r.json(); if (d.success) { setHandles(d.handles||{}); setVerified(d.verified||{}); setRewardClaimed(d.rewardClaimed||false); } } catch { /* */ } setLoading(false); } load(); }, []);
  async function save(key: string) { const r = await fetch('/api/profile/social', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform: key, handle: editValue }) }); const d = await r.json(); if (d.success) { setHandles(p=>({...p,[key]:editValue})); setEditing(null); setMsg('Saved.'); } else setMsg(d.error||'Failed.'); setTimeout(()=>setMsg(''),3000); }
  async function claimReward() { const r = await fetch('/api/profile/social', { method: 'PUT' }); const d = await r.json(); if (d.success) { setRewardClaimed(true); setMsg('$10 bonus credit added!'); } else setMsg(d.error||'Not eligible.'); setTimeout(()=>setMsg(''),4000); }
  const allVerified = PLATFORMS.every(p=>verified[p.key]);
  const verifiedCount = PLATFORMS.filter(p=>verified[p.key]).length;
  if (loading) return <div className="animate-pulse h-32 rounded-xl" style={{ background: '#2B3139', opacity:0.3 }} />;
  return <div className="p-5 rounded-xl" style={{ background:'#1E2329', border:'1px solid #2B3139' }}><div className="flex items-center justify-between mb-4"><div><h3 className="text-base font-bold text-[#EAECEF]">Connect Social Accounts</h3><p className="text-xs text-[#848E9C]">Connect all 4 to earn $10 bonus credits ({verifiedCount}/4)</p></div>{allVerified&&!rewardClaimed&&<button onClick={claimReward} className="px-4 py-2 rounded-lg text-xs font-bold" style={{ background:'#0ECB81',color:'#0B0E11' }}>Claim $10 Bonus</button>}{rewardClaimed&&<span className="text-xs text-[#0ECB81] font-bold">$10 Claimed ✓</span>}</div>{msg&&<div className="mb-3 p-2 rounded text-xs" style={{background:msg.includes('Failed')?'rgba(246,70,93,0.1)':'rgba(14,203,129,0.1)',color:msg.includes('Failed')?'#F6465D':'#0ECB81'}}>{msg}</div>}<div className="grid grid-cols-2 gap-3">{PLATFORMS.map(p=><div key={p.key} className="p-3 rounded-lg" style={{background:'#0B0E11',border:'1px solid #2B3139'}}><div className="flex items-center gap-2 mb-2"><span className="text-lg" style={{color:p.color}}>{p.icon}</span><span className="text-xs font-medium text-[#EAECEF]">{p.name}</span></div>{editing===p.key?<div className="flex gap-1"><input type="text" value={editValue} onChange={e=>setEditValue(e.target.value)} placeholder="Your handle or link" className="flex-1 px-2 py-1 rounded text-xs text-[#EAECEF]" style={{background:'#2B3139',border:'1px solid #2B3139'}}/><button onClick={()=>save(p.key)} className="px-2 py-1 rounded text-xs font-bold" style={{background:'#F0B90B',color:'#0B0E11'}}>Save</button></div>:handles[p.key]?<div className="flex items-center gap-2"><span className="text-xs text-[#848E9C] truncate flex-1">{handles[p.key]}</span>{verified[p.key]?<span className="text-xs text-[#0ECB81] font-bold">✓</span>:<span className="text-xs text-[#F0B90B]">Pending</span>}</div>:<button onClick={()=>{setEditing(p.key);setEditValue('');}} className="w-full py-1.5 rounded text-xs font-medium" style={{background:'#2B3139',color:'#848E9C',minHeight:32}}>Connect</button>}</div>)}</div></div>;
}
