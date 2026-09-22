import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Megaphone, Plus, Sparkles, Pin, CheckCircle2, AlertCircle, X, Users } from 'lucide-react';
import { Announcement } from '../../types';

export const AnnouncementsView: React.FC = () => {
  const { 
    state, currentCompany, currentUser, can, createAnnouncement, 
    acknowledgeAnnouncement 
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isImportant, setIsImportant] = useState(true);
  const [requiresAck, setRequiresAck] = useState(true);

  const announcements = useMemo(() => {
    return state.announcements.filter(a => a.companyId === currentCompany.id);
  }, [state.announcements, currentCompany.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    createAnnouncement({
      title: title.trim(),
      content: content.trim(),
      isPinned,
      isImportant,
      requiresAcknowledgement: requiresAck
    });
    setIsModalOpen(false);
    setTitle('');
    setContent('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-rose-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-rose-600" />
            <span>Admin Announcements & Noticeboard</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Broadcast operational directives, salon updates, and track team acknowledgements.
          </p>
        </div>

        {can('manage_announcements') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Broadcast Announcement</span>
          </button>
        )}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="py-16 text-center text-stone-400 bg-white rounded-3xl border border-rose-100 p-8">
            <Megaphone className="w-8 h-8 mx-auto mb-2 text-rose-200" />
            <p className="text-xs font-semibold">No announcements currently posted.</p>
          </div>
        ) : (
          announcements.map(ann => {
            const hasAcked = ann.acknowledgedUserIds.includes(currentUser.id);

            return (
              <div
                key={ann.id}
                className={`bg-white p-5 sm:p-6 rounded-3xl border shadow-xs transition-all space-y-4 ${
                  ann.isPinned ? 'border-rose-300 ring-2 ring-rose-200/50' : 'border-rose-100'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-stone-900 text-sm sm:text-base">{ann.title}</h3>
                        {ann.isPinned && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold flex items-center gap-1">
                            <Pin className="w-3 h-3" /> Pinned Notice
                          </span>
                        )}
                        {ann.isImportant && (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold">
                            High Priority
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Posted by <strong className="text-stone-700">{ann.createdByName}</strong> on {ann.createdAt.split('T')[0]}
                      </p>
                    </div>
                  </div>

                  {ann.requiresAcknowledgement && (
                    <button
                      onClick={() => acknowledgeAnnouncement(ann.id)}
                      disabled={hasAcked}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        hasAcked
                          ? 'bg-emerald-100 text-emerald-800 flex items-center gap-1.5'
                          : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs shadow-rose-200'
                      }`}
                    >
                      {hasAcked ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Acknowledged</span>
                        </>
                      ) : (
                        'I Understand (Got it)'
                      )}
                    </button>
                  )}
                </div>

                <div className="text-xs text-stone-700 leading-relaxed bg-rose-50/40 p-4 rounded-2xl border border-rose-100/70 whitespace-pre-wrap">
                  {ann.content}
                </div>

                {/* Acknowledgements Status */}
                {ann.requiresAcknowledgement && (
                  <div className="flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-rose-50">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-stone-400" />
                      <span>Acknowledged by {ann.acknowledgedUserIds.length} team member(s)</span>
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Broadcast Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <h3 className="font-bold text-stone-900 text-sm">Post Broadcast Announcement</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Notice Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Mandatory Weekend Inventory Reconciliation"
                  className="w-full px-3 py-2 rounded-xl border border-rose-200"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Announcement Message *</label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Write clear instructions or notice for the whole team..."
                  className="w-full px-3 py-2 rounded-xl border border-rose-200"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={e => setIsPinned(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="font-semibold text-stone-800">Pin to Top of Dashboard & Noticeboard</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiresAck}
                    onChange={e => setRequiresAck(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="font-semibold text-stone-800">Require Explicit "Got it" Staff Acknowledgement</span>
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-rose-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-rose-200 text-stone-600 hover:bg-rose-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs"
                >
                  Broadcast Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
