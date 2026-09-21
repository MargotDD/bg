import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, CheckCheck, X, ShoppingBag, AlertTriangle, CreditCard, Megaphone, Target, ArrowRight } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const { state, currentCompany, markNotificationAsRead, markAllNotificationsAsRead, setActiveView } = useApp();

  if (!isOpen) return null;

  const notifications = state.notifications.filter(n => n.companyId === currentCompany.id);

  const getIcon = (type: string) => {
    switch (type) {
      case 'sale': return ShoppingBag;
      case 'stock': return AlertTriangle;
      case 'spending': return CreditCard;
      case 'announcement': return Megaphone;
      case 'goal': return Target;
      default: return Bell;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end sm:p-4 bg-stone-900/30 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full sm:max-w-md h-full sm:h-auto sm:max-h-[85vh] bg-white sm:rounded-3xl shadow-2xl border border-rose-100 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-rose-100 flex items-center justify-between bg-rose-50/40">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-rose-600" />
            <h3 className="font-bold text-stone-900 text-sm">Notifications</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllNotificationsAsRead}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
            <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-rose-50">
          {notifications.length === 0 ? (
            <div className="py-16 text-center text-stone-400">
              <Bell className="w-8 h-8 mx-auto mb-2 text-rose-200" />
              <p className="text-xs">No notifications yet.</p>
            </div>
          ) : (
            notifications.map(notif => {
              const Icon = getIcon(notif.type);
              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    markNotificationAsRead(notif.id);
                    if (notif.linkView) {
                      setActiveView(notif.linkView);
                      onClose();
                    }
                  }}
                  className={`pt-2 p-3 rounded-2xl cursor-pointer transition-colors ${
                    !notif.isRead ? 'bg-rose-50/70 border border-rose-100/80' : 'hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl mt-0.5 ${!notif.isRead ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-900">{notif.title}</span>
                        <span className="text-[10px] text-stone-400">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 mt-0.5">{notif.message}</p>
                      {notif.linkView && (
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-rose-600 hover:underline">
                          <span>View Section</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
