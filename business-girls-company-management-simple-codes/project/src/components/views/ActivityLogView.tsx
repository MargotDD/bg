import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { History, Search, Filter, Shield, Clock, Calendar } from 'lucide-react';

export const ActivityLogView: React.FC = () => {
  const { state, currentCompany } = useApp();
  const [search, setSearch] = useState('');
  const [objectFilter, setObjectFilter] = useState('All');

  const logs = useMemo(() => {
    return state.activityLogs.filter(a => a.companyId === currentCompany.id);
  }, [state.activityLogs, currentCompany.id]);

  const objectTypes = useMemo(() => {
    const set = new Set(logs.map(l => l.objectType));
    return ['All', ...Array.from(set)];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchObj = objectFilter === 'All' || l.objectType === objectFilter;
      const matchSearch = l.details.toLowerCase().includes(search.toLowerCase()) || 
                          l.userName.toLowerCase().includes(search.toLowerCase()) ||
                          l.action.toLowerCase().includes(search.toLowerCase());
      return matchObj && matchSearch;
    });
  }, [logs, objectFilter, search]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-rose-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-rose-600" />
            <span>Activity History & Compliance Audit Log</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Immutable workspace event logs for all operational, financial, and inventory changes.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-3xl border border-rose-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search action or staff member..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-rose-100 bg-rose-50/40 text-xs text-stone-800"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {objectTypes.map(ot => (
            <button
              key={ot}
              onClick={() => setObjectFilter(ot)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                objectFilter === ot ? 'bg-rose-500 text-white shadow-xs' : 'bg-rose-50/60 text-stone-600 hover:bg-rose-100/50'
              }`}
            >
              {ot}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-rose-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-rose-100 bg-rose-50/40 text-stone-400 uppercase text-[10px] font-bold">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-3">Team Member</th>
                <th className="py-3 px-3">Module</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-4">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400">
                    <History className="w-8 h-8 mx-auto mb-2 text-rose-200" />
                    <p>No activity logs recorded matching criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-stone-800">
                      <span className="font-semibold block">{log.date}</span>
                      <span className="text-[10px] text-stone-400">{log.time}</span>
                    </td>

                    <td className="py-3 px-3 font-semibold text-stone-900 whitespace-nowrap">
                      {log.userName}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] uppercase">
                        {log.objectType}
                      </span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap font-medium text-stone-700">
                      {log.action}
                    </td>

                    <td className="py-3 px-4 text-stone-700 leading-relaxed max-w-md">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
