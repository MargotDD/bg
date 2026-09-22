const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

type Handler=(payload:any)=>void;

export class RealtimeChannel {
  private ws: WebSocket|null=null;
  private topic:string;
  private access:string;
  private handlers:Record<string,Handler[]>={};
  private queue:any[]=[];
  private joined=false;
  constructor(topic:string){this.topic=topic;this.access=localStorage.getItem('business-girls-supabase-access-token')||'';}
  on(event:string,handler:Handler){(this.handlers[event] ||= []).push(handler);return this;}
  async subscribe(){
    if(!SUPABASE_URL||!SUPABASE_KEY) throw new Error('Supabase is not configured.');
    const host=new URL(SUPABASE_URL).host;
    this.ws=new WebSocket(`wss://${host}/realtime/v1/websocket?apikey=${encodeURIComponent(SUPABASE_KEY)}&vsn=1.0.0`);
    await new Promise<void>((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('Could not connect to Supabase Realtime.')),10000);
      this.ws!.onopen=()=>{
        clearTimeout(timer); this.ws!.send(JSON.stringify({topic:this.topic,event:'phx_join',payload:{config:{broadcast:{ack:true,self:false},presence:{key:''}},access_token:this.access},ref:'1'}));
      };
      this.ws!.onmessage=(ev)=>{
        const msg=JSON.parse(ev.data);
        if(msg.event==='phx_reply'&&msg.ref==='1'){if(msg.payload?.status==='ok'){this.joined=true;this.flush();resolve();}else reject(new Error('Supabase Realtime rejected the channel.'));return;}
        if(msg.event==='broadcast'){const evName=msg.payload?.event;for(const h of this.handlers[evName]||[])h(msg.payload?.payload);}
      };
      this.ws!.onerror=()=>{clearTimeout(timer);reject(new Error('Could not connect to Supabase Realtime.'));};
      this.ws!.onclose=()=>{this.joined=false;};
    });
    return this;
  }
  private flush(){for(const item of this.queue)this.sendRaw(item);this.queue=[];}
  private sendRaw(item:any){this.ws?.send(JSON.stringify({topic:this.topic,event:'broadcast',payload:{type:'broadcast',event:item.event,payload:item.payload},ref:String(Date.now())}));}
  send(item:{type:'broadcast';event:string;payload:any}){if(!this.joined)this.queue.push(item);else this.sendRaw(item);return Promise.resolve();}
  close(){try{this.ws?.send(JSON.stringify({topic:this.topic,event:'phx_leave',payload:{},ref:String(Date.now())}));}catch{}this.ws?.close();this.ws=null;this.joined=false;}
}

export function createRealtimeChannel(name:string){return new RealtimeChannel(name);}

export async function sbRest(path:string, options:RequestInit={}){
  if(!SUPABASE_URL||!SUPABASE_KEY) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  const access=localStorage.getItem('business-girls-supabase-access-token')||SUPABASE_KEY;
  const res=await fetch(`${SUPABASE_URL}${path}`,{...options,headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${access}`,'Content-Type':'application/json',...(options.headers||{})}});
  const data=await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data?.message||data?.msg||data?.error||`Supabase request failed (${res.status})`);
  return data;
}

export async function uploadChatFile(file:File,companyId:string,userId:string){
  const access=localStorage.getItem('business-girls-supabase-access-token')||SUPABASE_KEY;
  const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');
  const path=`${companyId}/${userId}/${crypto.randomUUID()}-${safe}`;
  const res=await fetch(`${SUPABASE_URL}/storage/v1/object/chat-media/${path}`,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${access}`,'Content-Type':file.type||'application/octet-stream','x-upsert':'false'},body:file});
  if(!res.ok) throw new Error((await res.text())||'Could not upload the file.');
  return `${SUPABASE_URL}/storage/v1/object/public/chat-media/${path}`;
}
