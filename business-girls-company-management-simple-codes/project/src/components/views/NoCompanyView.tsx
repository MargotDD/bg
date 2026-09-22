import React from 'react';
import { Building2 } from 'lucide-react';
import { ProfileView } from './ProfileView';
import { NewCompanyModal } from '../common/NewCompanyModal';
import { useState } from 'react';

export const NoCompanyView: React.FC = () => {
  const [open,setOpen]=useState(false);
  return <div className="min-h-screen bg-[linear-gradient(135deg,#fff8fc,#ffe6f4,#ffc4f5)] p-5 sm:p-8">
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 rounded-3xl bg-white/90 border border-[#F9CAD4] p-5 shadow-sm"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-2xl bg-[#fb429c] text-white flex items-center justify-center"><Building2/></div><div><h1 className="text-2xl font-black text-[#3E2027]">Business Girls</h1><p className="text-sm text-[#9E6775]">Welcome! Set up your profile and create a company when you're ready.</p></div></div></div>
      <ProfileView onCreateCompany={()=>setOpen(true)}/>
      <NewCompanyModal isOpen={open} onClose={()=>setOpen(false)}/>
    </div>
  </div>;
};
