import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, Send, Paperclip, Image, Mic, Phone, VideoIcon, X, Users, PhoneOff, MicOff, Camera, CameraOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { createRealtimeChannel, sbRest, uploadChatFile, RealtimeChannel } from '../../utils/supabaseRealtime';

type ChatRow = { id:string; company_id:string; sender_id:string; sender_name:string; sender_avatar:string; text:string; attachment_url:string|null; attachment_type:string|null; attachment_name:string|null; created_at:string };
type CallRoom = { id:string; company_id:string; type:'audio'|'video'; host_id:string; status:string; created_at:string };

const MAX_FILE = 25 * 1024 * 1024;

export const TeamChatView: React.FC = () => {
  const { currentCompany, currentUser } = useApp();
  const [messages,setMessages]=useState<ChatRow[]>([]);
  const [input,setInput]=useState('');
  const [file,setFile]=useState<File|null>(null);
  const [error,setError]=useState('');
  const [call,setCall]=useState<CallRoom|null>(null);
  const [incoming,setIncoming]=useState<CallRoom|null>(null);
  const [participants,setParticipants]=useState<string[]>([]);
  const [remoteStreams,setRemoteStreams]=useState<Record<string,MediaStream>>({});
  const [muted,setMuted]=useState(false);
  const [cameraOff,setCameraOff]=useState(false);
  const [recording,setRecording]=useState(false);
  const [recordingSeconds,setRecordingSeconds]=useState(0);
  const recorder=useRef<MediaRecorder|null>(null);
  const recordingStream=useRef<MediaStream|null>(null);
  const recordingTimer=useRef<number|null>(null);
  const fileRef=useRef<HTMLInputElement>(null);
  const localVideo=useRef<HTMLVideoElement>(null);
  const localStream=useRef<MediaStream|null>(null);
  const peers=useRef<Record<string,RTCPeerConnection>>({});
  const channel=useRef<RealtimeChannel|null>(null);
  const roomRef=useRef<CallRoom|null>(null);
  const messagesEnd=useRef<HTMLDivElement>(null);

  const messagesByTime=useMemo(()=>[...messages].sort((a,b)=>+new Date(a.created_at)-+new Date(b.created_at)),[messages]);

  useEffect(()=>{
    let alive=true;
    const load=async()=>{
      try{
        const rows=await sbRest(`/rest/v1/chat_messages?company_id=eq.${encodeURIComponent(currentCompany.id)}&select=*&order=created_at.asc&limit=500`);
        if(alive) setMessages(rows||[]);
      }catch(e:any){ if(alive) setError(e.message||'Could not load chat.'); }
    };
    load();
    const ch=createRealtimeChannel(`realtime:company-chat-${currentCompany.id}`)
      .on('new-message',({message}:any)=>{if(message?.company_id===currentCompany.id)setMessages(prev=>prev.some(x=>x.id===message.id)?prev:[...prev,message]);})
      .on('call-invite',(payload:any)=>{
        if(payload?.room?.company_id===currentCompany.id && payload.room.host_id!==currentUser.id) setIncoming(payload.room);
      })
      .on('call-ended',(payload:any)=>{ if(payload?.roomId===roomRef.current?.id) endCall(false); });
    ch.subscribe().catch(e=>alive&&setError(e.message||'Realtime chat is unavailable.')); channel.current=ch;
    const poll=window.setInterval(async()=>{try{const rows=await sbRest(`/rest/v1/chat_messages?company_id=eq.${encodeURIComponent(currentCompany.id)}&select=*&order=created_at.asc&limit=500`);if(alive)setMessages(rows||[]);}catch{}},5000);
    return ()=>{alive=false;window.clearInterval(poll);ch.close();channel.current=null;};
  },[currentCompany.id,currentUser.id]);

  useEffect(()=>{messagesEnd.current?.scrollIntoView({behavior:'smooth'});},[messages.length]);
  useEffect(()=>()=>{ cleanupCall(); stopRecording(true); },[]);
  useEffect(()=>{ if(!recording) return; recordingTimer.current=window.setInterval(()=>setRecordingSeconds(s=>s+1),1000); return ()=>{if(recordingTimer.current) window.clearInterval(recordingTimer.current); recordingTimer.current=null;}; },[recording]);

  function pickRecordingMime(){
    const types=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg;codecs=opus'];
    return types.find(t=>MediaRecorder.isTypeSupported(t))||'';
  }
  async function startRecording(){
    try{
      setError('');
      if(!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder==='undefined') throw new Error('Audio recording is not supported in this browser.');
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const mimeType=pickRecordingMime();
      const chunks:BlobPart[]=[];
      const mr=mimeType?new MediaRecorder(stream,{mimeType}):new MediaRecorder(stream);
      recorder.current=mr; recordingStream.current=stream; setRecordingSeconds(0); setRecording(true);
      mr.ondataavailable=e=>{if(e.data.size) chunks.push(e.data);};
      mr.onerror=()=>{setError('Could not record audio.'); stopRecording(true);};
      mr.onstop=async()=>{
        stream.getTracks().forEach(t=>t.stop());
        recorder.current=null; recordingStream.current=null; setRecording(false);
        if(!chunks.length) return;
        try{
          const blob=new Blob(chunks,{type:mr.mimeType||'audio/webm'});
          const ext=(blob.type.includes('mp4')?'m4a':blob.type.includes('ogg')?'ogg':'webm');
          const audioFile=new File([blob],`voice-message-${Date.now()}.${ext}`,{type:blob.type||'audio/webm'});
          await sendAudioMessage(audioFile);
        }catch(e:any){setError(e.message||'Could not send voice message.');}
      };
      mr.start();
    }catch(e:any){setError(e.message||'Microphone permission is required to record a voice message.');}
  }
  function stopRecording(cancel=false){
    if(recordingTimer.current) window.clearInterval(recordingTimer.current);
    recordingTimer.current=null;
    if(recorder.current&&recorder.current.state!=='inactive'){
      if(cancel){ recorder.current.onstop=null; recorder.current.stop(); recordingStream.current?.getTracks().forEach(t=>t.stop()); recorder.current=null; recordingStream.current=null; setRecording(false); }
      else recorder.current.stop();
    } else if(recording){ setRecording(false); }
    setRecordingSeconds(0);
  }
  async function sendAudioMessage(audioFile:File){
    if(audioFile.size>MAX_FILE) throw new Error('Voice messages must be 25 MB or smaller.');
    const attachmentUrl=await uploadChatFile(audioFile,currentCompany.id,currentUser.id);
    const newMessage={company_id:currentCompany.id,sender_id:currentUser.id,sender_name:currentUser.name,sender_avatar:currentUser.avatarUrl||'',text:'',attachment_url:attachmentUrl,attachment_type:'audio',attachment_name:audioFile.name};
    const inserted=await sbRest('/rest/v1/chat_messages?select=*',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(newMessage)});
    if(inserted?.[0]) setMessages(prev=>prev.some(x=>x.id===inserted[0].id)?prev:[...prev,inserted[0]]);
    await channel.current?.send({type:'broadcast',event:'new-message',payload:{message:inserted?.[0]||newMessage}});
  }
  function formatRecordingTime(seconds:number){return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;}

  async function sendMessage(){
    if(!input.trim() && !file) return;
    try{
      setError('');
      let attachmentUrl=null, attachmentType=null, attachmentName=null;
      if(file){
        if(file.size>MAX_FILE) throw new Error('Files must be 25 MB or smaller.');
        attachmentUrl=await uploadChatFile(file,currentCompany.id,currentUser.id);
        attachmentType=file.type.startsWith('image/')?'image':file.type.startsWith('video/')?'video':file.type.startsWith('audio/')?'audio':'file';
        attachmentName=file.name;
      }
      const newMessage={company_id:currentCompany.id,sender_id:currentUser.id,sender_name:currentUser.name,sender_avatar:currentUser.avatarUrl||'',text:input.trim(),attachment_url:attachmentUrl,attachment_type:attachmentType,attachment_name:attachmentName};
      const inserted=await sbRest('/rest/v1/chat_messages?select=*',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(newMessage)});
      if(inserted?.[0]) setMessages(prev=>prev.some(x=>x.id===inserted[0].id)?prev:[...prev,inserted[0]]);
      await channel.current?.send({type:'broadcast',event:'new-message',payload:{message:inserted?.[0]||newMessage}});
      setInput('');setFile(null);
    }catch(e:any){setError(e.message||'Could not send message.');}
  }

  async function startCall(type:'audio'|'video'){
    try{
      setError('');
      const room:CallRoom={id:crypto.randomUUID(),company_id:currentCompany.id,type,host_id:currentUser.id,status:'active',created_at:new Date().toISOString()};
      await sbRest('/rest/v1/call_rooms',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(room)});
      await joinCall(room,true);
      await channel.current?.send({type:'broadcast',event:'call-invite',payload:{room}});
    }catch(e:any){setError(e.message||'Could not start the call.');}
  }

  async function joinCall(room:CallRoom,isHost=false){
    const stream=await navigator.mediaDevices.getUserMedia({audio:true,video:room.type==='video'});
    localStream.current=stream;
    if(localVideo.current){localVideo.current.srcObject=stream;localVideo.current.play().catch(()=>{});}
    roomRef.current=room; setCall(room); setParticipants([currentUser.id]);
    if(!channel.current){ channel.current=createRealtimeChannel(`realtime:company-chat-${currentCompany.id}`); await channel.current.subscribe(); }
    const ch=channel.current;
    ch.on('call-join',async(payload:any)=>{
      if(payload.roomId!==room.id || payload.userId===currentUser.id) return;
      setParticipants(p=>Array.from(new Set([...p,payload.userId])));
      if(room.host_id===currentUser.id) await makeOffer(payload.userId);
    });
    ch.on('call-offer',async(payload:any)=>{if(payload.roomId===room.id&&payload.to===currentUser.id) await handleOffer(payload);});
    ch.on('call-answer',async(payload:any)=>{if(payload.roomId===room.id&&payload.to===currentUser.id) await peers.current[payload.from]?.setRemoteDescription(new RTCSessionDescription(payload.answer));});
    ch.on('call-ice',async(payload:any)=>{if(payload.roomId===room.id&&payload.to===currentUser.id&&payload.candidate) await peers.current[payload.from]?.addIceCandidate(new RTCIceCandidate(payload.candidate)).catch(()=>{});});
    await ch.send({type:'broadcast',event:'call-join',payload:{roomId:room.id,userId:currentUser.id}});
    if(!isHost) setIncoming(null);
  }

  function getIceServers(): RTCIceServer[] {
    const fallback: RTCIceServer[] = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ];
    try {
      const raw = import.meta.env.VITE_TURN_ICE_SERVERS;
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return fallback;
      return [...fallback, ...parsed];
    } catch {
      return fallback;
    }
  }

  function makePeer(peerId:string){
    if(peers.current[peerId]) return peers.current[peerId];
    const pc=new RTCPeerConnection({iceServers:getIceServers()});
    localStream.current?.getTracks().forEach(t=>pc.addTrack(t,localStream.current!));
    pc.onicecandidate=e=>{if(e.candidate) channel.current?.send({type:'broadcast',event:'call-ice',payload:{roomId:roomRef.current?.id,to:peerId,from:currentUser.id,candidate:e.candidate.toJSON()}});};
    pc.ontrack=e=>{if(e.streams[0]) setRemoteStreams(prev=>({...prev,[peerId]:e.streams[0]}));};
    pc.onconnectionstatechange=()=>{if(['failed','closed','disconnected'].includes(pc.connectionState)){pc.close();delete peers.current[peerId];}};
    peers.current[peerId]=pc; return pc;
  }
  async function makeOffer(peerId:string){const pc=makePeer(peerId);const offer=await pc.createOffer();await pc.setLocalDescription(offer);await channel.current?.send({type:'broadcast',event:'call-offer',payload:{roomId:roomRef.current?.id,to:peerId,from:currentUser.id,offer}});}
  async function handleOffer(p:any){const pc=makePeer(p.from);await pc.setRemoteDescription(new RTCSessionDescription(p.offer));const answer=await pc.createAnswer();await pc.setLocalDescription(answer);await channel.current?.send({type:'broadcast',event:'call-answer',payload:{roomId:roomRef.current?.id,to:p.from,from:currentUser.id,answer}});}

  async function acceptIncoming(){if(incoming) await joinCall(incoming);}
  async function endCall(notify=true){
    const room=roomRef.current;
    if(notify&&room) await channel.current?.send({type:'broadcast',event:'call-ended',payload:{roomId:room.id}});
    if(room) await sbRest(`/rest/v1/call_rooms?id=eq.${encodeURIComponent(room.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'ended',ended_at:new Date().toISOString()})}).catch(()=>{});
    cleanupCall();
  }
  function cleanupCall(){localStream.current?.getTracks().forEach(t=>t.stop());localStream.current=null;Object.values(peers.current).forEach(p=>p.close());peers.current={};setRemoteStreams({});setParticipants([]);setCall(null);roomRef.current=null;setMuted(false);setCameraOff(false);}
  function toggleMute(){const t=localStream.current?.getAudioTracks()[0];if(t){t.enabled=!t.enabled;setMuted(!t.enabled);}}
  function toggleCamera(){const t=localStream.current?.getVideoTracks()[0];if(t){t.enabled=!t.enabled;setCameraOff(!t.enabled);}}

  return <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-3xl border border-rose-100 shadow-xs overflow-hidden">
    <div className="p-4 border-b border-rose-100 flex items-center justify-between bg-rose-50/40">
      <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-2xl bg-rose-500 text-white flex items-center justify-center"><MessageSquare className="w-4 h-4"/></div><div><h3 className="font-bold text-stone-900 text-sm">{currentCompany.name} • Team Chat</h3><p className="text-[11px] text-stone-400">Real-time messages, media and group calls</p></div></div>
      <div className="flex gap-2"><button onClick={()=>startCall('audio')} title="Group audio call" className="p-2 rounded-xl bg-white border border-rose-100 text-rose-600 hover:bg-rose-50"><Phone className="w-4 h-4"/></button><button onClick={()=>startCall('video')} title="Group video call" className="p-2 rounded-xl bg-white border border-rose-100 text-rose-600 hover:bg-rose-50"><VideoIcon className="w-4 h-4"/></button></div>
    </div>
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-stone-50/20">
      {messagesByTime.length===0?<div className="py-16 text-center text-stone-400"><MessageSquare className="w-8 h-8 mx-auto text-rose-200"/><p className="text-xs mt-2">No messages yet. Start the team chat.</p></div>:messagesByTime.map(msg=>{const me=msg.sender_id===currentUser.id;return <div key={msg.id} className={`flex gap-3 max-w-[80%] ${me?'ml-auto flex-row-reverse':''}`}><img src={msg.sender_avatar||FALLBACK_AVATAR} className="w-8 h-8 rounded-full object-cover self-end"/><div className="space-y-1 text-xs"><div className="flex gap-2 px-1"><span className="font-bold text-stone-800 text-[11px]">{msg.sender_name}</span><span className="text-[10px] text-stone-400">{new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span></div><div className={`p-3.5 rounded-2xl shadow-xs ${me?'bg-rose-600 text-white rounded-br-none':'bg-white text-stone-800 border border-rose-100 rounded-bl-none'}`}><p>{msg.text}</p>{msg.attachment_url&&<div className="mt-2">{msg.attachment_type==='image'?<img src={msg.attachment_url} className="max-w-[280px] rounded-xl"/>:msg.attachment_type==='video'?<video src={msg.attachment_url} controls className="max-w-[300px] rounded-xl"/>:msg.attachment_type==='audio'?<audio src={msg.attachment_url} controls/>:<a href={msg.attachment_url} target="_blank" rel="noreferrer" className="underline">📎 {msg.attachment_name||'Open file'}</a>}</div>}</div></div></div>})}<div ref={messagesEnd}/>
    </div>
    {error&&<div className="px-4 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">{error}</div>}
    {file&&<div className="px-4 py-2 bg-pink-50 border-t border-pink-100 flex items-center justify-between text-xs"><span className="font-semibold truncate">{file.name}</span><button onClick={()=>setFile(null)}><X className="w-4 h-4"/></button></div>}
    <form onSubmit={e=>{e.preventDefault();sendMessage()}} className="p-3 bg-white border-t border-rose-100 flex items-center gap-2">
      <input ref={fileRef} type="file" className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" onChange={e=>{const f=e.target.files?.[0];if(f)setFile(f);e.currentTarget.value='';}}/>
      <button type="button" onClick={()=>fileRef.current?.click()} disabled={recording} className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 disabled:opacity-40" title="Add file, photo, video or audio"><Paperclip className="w-4 h-4"/></button>
      {recording ? <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-red-50 border border-red-100 text-xs text-red-600"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/><span className="font-semibold">Recording {formatRecordingTime(recordingSeconds)}</span><button type="button" onClick={()=>stopRecording(true)} className="ml-auto text-stone-500 hover:text-red-600">Cancel</button></div> : <input value={input} onChange={e=>setInput(e.target.value)} placeholder={`Message ${currentCompany.name} team...`} className="flex-1 px-4 py-2.5 rounded-2xl bg-rose-50/50 border border-rose-100 text-xs"/>}
      {recording ? <button type="button" onClick={()=>stopRecording(false)} className="p-2.5 rounded-2xl bg-red-500 text-white" title="Stop and send voice message"><Mic className="w-4 h-4"/></button> : <button type="button" onClick={startRecording} className="p-2.5 rounded-2xl bg-rose-50 text-rose-600" title="Record voice message"><Mic className="w-4 h-4"/></button>}
      {!recording&&<button type="submit" disabled={!input.trim()&&!file} className="p-2.5 rounded-2xl bg-rose-600 disabled:bg-stone-200 text-white"><Send className="w-4 h-4"/></button>}
    </form>

    {incoming&&!call&&<div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"><div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center"><Users className="w-10 h-10 mx-auto text-rose-500"/><h3 className="font-black text-lg mt-3">Incoming group {incoming.type} call</h3><p className="text-xs text-stone-500 mt-1">{currentCompany.name} team</p><div className="flex gap-2 mt-5"><button onClick={()=>setIncoming(null)} className="flex-1 py-3 rounded-2xl bg-stone-100">Decline</button><button onClick={acceptIncoming} className="flex-1 py-3 rounded-2xl bg-rose-600 text-white font-bold">Join</button></div></div></div>}
    {call&&<div className="fixed inset-0 z-50 bg-stone-950 flex flex-col"><div className="p-4 flex items-center justify-between text-white"><div><div className="font-black">{call.type==='video'?'Group video call':'Group audio call'}</div><div className="text-xs text-white/60">{participants.length} participant{participants.length===1?'':'s'}</div></div><button onClick={()=>endCall(true)} className="p-2 rounded-xl bg-red-500"><PhoneOff className="w-5 h-5"/></button></div><div className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-auto">{call.type==='video'&&<div className="relative rounded-3xl overflow-hidden bg-stone-900 min-h-[180px]"><video ref={localVideo} autoPlay muted playsInline className="w-full h-full object-cover"/><span className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded-lg">You</span></div>}{Object.entries(remoteStreams).map(([id,stream])=><RemoteVideo key={id} id={id} stream={stream} video={call.type==='video'}/>) }{call.type==='audio'&&<div className="col-span-full flex items-center justify-center"><div className="text-center text-white"><Users className="w-16 h-16 mx-auto text-rose-400"/><p className="mt-3">Live group audio</p></div></div>}</div><div className="p-5 flex justify-center gap-3"><button onClick={toggleMute} className="p-4 rounded-full bg-white/10 text-white">{muted?<MicOff/>:<Mic/>}</button>{call.type==='video'&&<button onClick={toggleCamera} className="p-4 rounded-full bg-white/10 text-white">{cameraOff?<CameraOff/>:<Camera/>}</button>}<button onClick={()=>endCall(true)} className="p-4 rounded-full bg-red-500 text-white"><PhoneOff/></button></div></div>}
  </div>;
};

const RemoteVideo=({id,stream,video}:{id:string;stream:MediaStream;video:boolean})=>{const ref=useRef<HTMLVideoElement>(null);useEffect(()=>{if(ref.current){ref.current.srcObject=stream;ref.current.play().catch(()=>{});}},[stream]);return video?<div className="relative rounded-3xl overflow-hidden bg-stone-900 min-h-[180px]"><video ref={ref} autoPlay playsInline className="w-full h-full object-cover"/><span className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded-lg">Participant</span></div>:null;};
