const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const tokenKey = 'business-girls-supabase-access-token';
const refreshKey = 'business-girls-supabase-refresh-token';

export const isSupabaseConfigured = () => !!(SUPABASE_URL && SUPABASE_ANON_KEY);
export const getApiToken = () => { try { return localStorage.getItem(tokenKey); } catch { return null; } };
export const setApiToken = (t:string) => localStorage.setItem(tokenKey,t);
export const clearApiToken = () => {
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(refreshKey);
};

const headers = (token?:string) => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${token || getApiToken() || SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json'
});

let refreshInFlight: Promise<string | null> | null = null;

function tokenIsExpiringSoon(token:string | null, withinSeconds = 60) {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
    return typeof payload.exp === 'number' && payload.exp <= Math.floor(Date.now()/1000) + withinSeconds;
  } catch {
    return false;
  }
}

async function refreshAccessToken() {
  if (!isSupabaseConfigured()) return null;
  if (refreshInFlight) return refreshInFlight;
  const refreshToken = (() => { try { return localStorage.getItem(refreshKey); } catch { return null; } })();
  if (!refreshToken) return null;

  refreshInFlight = (async () => {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data?.access_token) {
      clearApiToken();
      return null;
    }
    setApiToken(data.access_token);
    if (data.refresh_token) localStorage.setItem(refreshKey, data.refresh_token);
    return data.access_token as string;
  })().finally(() => { refreshInFlight = null; });

  return refreshInFlight;
}

async function sb(path:string, options:RequestInit={}, retry=true) {
  if (!isSupabaseConfigured()) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel environment variables.');

  let token = getApiToken();
  // Proactively refresh shortly before expiry so normal requests never use an expired JWT.
  if (token && tokenIsExpiringSoon(token) && !path.startsWith('/auth/v1/token')) {
    token = await refreshAccessToken() || token;
  }

  const requestHeaders = { ...headers(token || undefined), ...(options.headers || {}) };
  const r = await fetch(`${SUPABASE_URL}${path}`, { ...options, headers: requestHeaders });
  const data = await r.json().catch(() => ({}));

  // If a race or a stale token still caused a 401, refresh once and retry the request.
  if (r.status === 401 && retry && !path.startsWith('/auth/v1/token')) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return sb(path, options, false);
  }

  if (!r.ok) throw new Error(data?.msg || data?.message || data?.error_description || data?.error || `Request failed (${r.status})`);
  return data;
}

async function auth(path:string, body:any) {
  return sb(`/auth/v1/${path}`, { method:'POST', body:JSON.stringify(body) });
}

export async function api(path:string, options:RequestInit={}) {
  if (!isSupabaseConfigured()) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel environment variables.');
  const method = (options.method || 'GET').toUpperCase();

  if (path === '/api/auth/register' && method === 'POST') {
    const body = JSON.parse(String(options.body || '{}'));
    const data = await auth('signup', { email: body.email, password: body.password, options: { data: { name: body.name, avatar_url: body.avatarUrl || null } } });
    if (!data?.access_token) {
      if (data?.user && !data?.session) throw new Error('Account created. Check your email to confirm the account, then log in.');
      throw new Error('Could not create the account.');
    }
    setApiToken(data.access_token);
    if (data.refresh_token) localStorage.setItem(refreshKey, data.refresh_token);
    const profile = await getProfile(data.user?.id);
    return { token:data.access_token, user:{id:data.user.id,email:data.user.email,name:profile?.name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',avatarUrl:profile?.avatar_url || data.user.user_metadata?.avatar_url || '',companyIds:profile?.company_ids || []} };
  }

  if (path === '/api/auth/login' && method === 'POST') {
    const body = JSON.parse(String(options.body || '{}'));
    const data = await auth('token?grant_type=password', { email: body.email, password: body.password });
    setApiToken(data.access_token);
    if (data.refresh_token) localStorage.setItem(refreshKey, data.refresh_token);
    const profile = await getProfile(data.user?.id);
    return { token:data.access_token, user:{id:data.user.id,email:data.user.email,name:profile?.name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',avatarUrl:profile?.avatar_url || data.user.user_metadata?.avatar_url || '',companyIds:profile?.company_ids || []} };
  }

  if (path === '/api/auth/logout' && method === 'POST') {
    try { await sb('/auth/v1/logout', {method:'POST'}); } finally { clearApiToken(); }
    return {ok:true};
  }

  if (path === '/api/me' && method === 'GET') {
    const u = await sb('/auth/v1/user');
    const profile = await getProfile(u.id);
    return {user:{id:u.id,email:u.email,name:profile?.name || u.user_metadata?.name || u.email?.split('@')[0] || 'User',avatarUrl:profile?.avatar_url || u.user_metadata?.avatar_url || '',companyIds:profile?.company_ids || []}};
  }

  if (path === '/api/profile' && method === 'PUT') {
    const body = JSON.parse(String(options.body || '{}'));
    const u = await sb('/auth/v1/user');
    const name = String(body.name || '').trim();
    if (!name) throw new Error('Username is required.');
    const avatarUrl = body.avatarUrl || '';
    await rest(`/rest/v1/profiles?id=eq.${encodeURIComponent(u.id)}`, {
      method:'PATCH',
      headers:{Prefer:'return=minimal'},
      body:JSON.stringify({name, avatar_url:avatarUrl})
    });
    await sb('/auth/v1/user', {method:'PUT', body:JSON.stringify({data:{name,avatar_url:avatarUrl}})});
    return {user:{id:u.id,email:u.email,name,avatarUrl,companyIds:(await getProfile(u.id))?.company_ids || []}};
  }

  if (path === '/api/state' && method === 'GET') {
    const u = await sb('/auth/v1/user');
    const own = await rest(`/rest/v1/app_states?user_id=eq.${encodeURIComponent(u.id)}&select=state&limit=1`);
    let state = own?.[0]?.state || null;
    if (state?.activeCompanyId) {
      const cid = state.activeCompanyId;
      const cs = await rest(`/rest/v1/company_states?company_id=eq.${encodeURIComponent(cid)}&select=state&limit=1`);
      if (cs?.[0]?.state) state = mergeCompanyState(state, cs[0].state);
    }
    return {state};
  }

  if (path === '/api/state' && method === 'PUT') {
    const body = JSON.parse(String(options.body || '{}'));
    const state = body.state || null;
    const u = await sb('/auth/v1/user');
    await rest('/rest/v1/app_states', {method:'POST', headers:{Prefer:'resolution=merge-duplicates'}, body:JSON.stringify({user_id:u.id,state})});
    if (state?.activeCompanyId) {
      const me = state.users?.find((x:any)=>x.id===u.id);
      // A newly created company must create the owner's membership before
      // company_states can be written under the RLS policies.
      if (me) {
        await rest('/rest/v1/company_members', {
          method:'POST',
          headers:{Prefer:'resolution=merge-duplicates'},
          body:JSON.stringify({company_id:state.activeCompanyId,user_id:u.id,role:me.role || 'Member',permissions:me.permissions || {}})
        });
        const profile = await getProfile(u.id);
        const ids = Array.from(new Set([...(profile?.company_ids || []), state.activeCompanyId]));
        await rest(`/rest/v1/profiles?id=eq.${encodeURIComponent(u.id)}`, {
          method:'PATCH',
          headers:{Prefer:'return=minimal'},
          body:JSON.stringify({company_ids:ids})
        });
      }
      const canonical = extractCompanyState(state,state.activeCompanyId);
      await rest('/rest/v1/company_states', {method:'POST', headers:{Prefer:'resolution=merge-duplicates'}, body:JSON.stringify({company_id:state.activeCompanyId,state:canonical,updated_by:u.id})});
      if (me) {
        await rest(`/rest/v1/company_members?company_id=eq.${encodeURIComponent(state.activeCompanyId)}&user_id=eq.${encodeURIComponent(u.id)}`, {
          method:'PATCH',
          headers:{Prefer:'return=minimal'},
          body:JSON.stringify({role:me.role || 'Member',permissions:me.permissions || {}})
        });
      }
    }
    return {ok:true};
  }

  const inviteMatch = path.match(/^\/api\/invites\/([^/]+)\/(accept)?$/);
  if (path === '/api/invites' && method === 'POST') {
    const body = JSON.parse(String(options.body || '{}'));
    const company = body.company;
    if (!company?.id || !company?.name) throw new Error('Company data is required.');
    // A newly-created company can reach the invite button before the state-save
    // effect has created the owner's Supabase membership. Ensure the owner is
    // a real Owner member before the invite RPC checks admin permissions.
    const u = await sb('/auth/v1/user');
    if (company.ownerId === u.id) {
      await rest('/rest/v1/company_members', {
        method:'POST',
        headers:{Prefer:'resolution=merge-duplicates'},
        body:JSON.stringify({
          company_id:company.id,
          user_id:u.id,
          role:'Owner',
          permissions:{
            create_edit_delete_products:true, make_sales:true, view_customers:true,
            create_purchases:true, view_finances:true, edit_financial_records:true,
            delete_financial_records:true, manage_members:true, manage_announcements:true,
            manage_goals:true, manage_plans:true, create_admin_spending:true,
            edit_delete_admin_spending:true, view_sensitive_finance:true,
            create_sales:true, process_returns:true, create_expenses:true,
            manage_customers:true, restrict_customers:true, manage_team:true,
            adjust_finances:true, view_activity_logs:true
          }
        })
      });
    }
    const result = await rpc('create_company_invite', {p_company_id:company.id, p_company:company, p_company_state:extractCompanyStateFromStored(company.id)});
    return {code:result.code,link:`${window.location.origin}/?invite=${result.code}`,expiresAt:result.expires_at};
  }
  if (inviteMatch && inviteMatch[1] && !inviteMatch[2] && method === 'GET') {
    const rows = await rest(`/rest/v1/company_invites?token=eq.${encodeURIComponent(inviteMatch[1])}&select=token,company,expires_at&limit=1`);
    const inv=rows?.[0]; if(!inv || new Date(inv.expires_at).getTime()<Date.now()) throw new Error('Invite not found or expired.');
    return {company:inv.company,expiresAt:new Date(inv.expires_at).getTime()};
  }
  if (inviteMatch && inviteMatch[1] && inviteMatch[2] === 'accept' && method === 'POST') {
    const result = await rpc('accept_company_invite', {p_token:inviteMatch[1]});
    return {ok:true,state:result.state};
  }
  throw new Error(`Unsupported API endpoint: ${path}`);
}

async function rest(path:string, options:RequestInit={}) {
  return sb(path, options);
}
async function rpc(fn:string, body:any) { return sb(`/rest/v1/rpc/${fn}`, {method:'POST', body:JSON.stringify(body)}); }

async function getProfile(id:string) {
  const rows=await rest(`/rest/v1/profiles?id=eq.${encodeURIComponent(id)}&select=id,name,avatar_url,company_ids&limit=1`);
  return rows?.[0] || null;
}
async function extractCompanyStateFromStored(companyId:string) {
  const u=await sb('/auth/v1/user');
  const rows=await rest(`/rest/v1/app_states?user_id=eq.${encodeURIComponent(u.id)}&select=state&limit=1`);
  return extractCompanyState(rows?.[0]?.state || null,companyId);
}
function extractCompanyState(state:any, companyId:string) {
  if (!state || !companyId) return null;
  const out:any={companyId,company:(state.companies||[]).find((c:any)=>c.id===companyId)||null};
  for(const [key,value] of Object.entries(state)) {
    if(['companies','users','activeCompanyId','activeUserId','theme','darkMode'].includes(key)) continue;
    if(Array.isArray(value)) {
      const companyItems=value.filter((x:any)=>x&&typeof x==='object'&&'companyId' in x);
      if(companyItems.length || value.length===0) out[key]=companyItems.filter((x:any)=>x.companyId===companyId);
    }
  }
  return out;
}
function mergeCompanyState(state:any,canonical:any) {
  if(!state||!canonical) return state;
  const cid=canonical.companyId;
  if(canonical.company) state.companies=(state.companies||[]).filter((c:any)=>c.id!==cid).concat([canonical.company]);
  for(const [key,items] of Object.entries(canonical)) {
    if(key==='companyId'||key==='company'||!Array.isArray(items)) continue;
    const existing=Array.isArray(state[key])?state[key]:[];
    const others=existing.filter((x:any)=>!(x&&typeof x==='object'&&x.companyId===cid));
    state[key]=others.concat(items as any[]);
  }
  return state;
}
