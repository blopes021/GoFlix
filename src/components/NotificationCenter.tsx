import React from 'react';
import { Bell, X, Check, Info, AlertCircle, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Notification, markNotificationAsRead, deleteNotification, auth } from '../firebase';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationCenterProps {
  notifications: Notification[];
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, isOpen, onClose }) => {
  const user = auth.currentUser;

  const handleMarkAsRead = async (id: string) => {
    if (!user) return;
    await markNotificationAsRead(user.uid, id);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    await deleteNotification(user.uid, id);
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-surface border-l border-border z-[70] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text">Notificações</h2>
                  <p className="text-sm text-text-muted">
                    {notifications.filter(n => !n.read).length} não lidas
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/5 text-text-muted transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 bg-surface-light rounded-full flex items-center justify-center mb-4">
                    <Bell className="w-10 h-10 text-text-muted/20" />
                  </div>
                  <h3 className="text-lg font-medium text-text">Tudo limpo por aqui!</h3>
                  <p className="text-text-muted text-sm mt-2">
                    Você não tem nenhuma notificação no momento.
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl border transition-all relative group ${
                      notification.read 
                        ? 'bg-surface-light/50 border-border/50' 
                        : 'bg-surface-light border-brand/30 shadow-lg shadow-brand/5'
                    }`}
                  >
                    {!notification.read && (
                      <div className="absolute top-4 right-4 w-2 h-2 bg-brand rounded-full" />
                    )}
                    
                    <div className="flex gap-4">
                      <div className="mt-1">{getIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-bold text-sm ${notification.read ? 'text-text/70' : 'text-text'}`}>
                          {notification.title}
                        </h4>
                        <p className="text-sm text-text-muted mt-1 leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-text-muted/50">
                            {formatDistanceToNow(notification.timestamp.toDate(), { addSuffix: true, locale: ptBR })}
                          </span>
                          
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.read && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="p-1.5 rounded-lg hover:bg-brand/10 text-brand transition-colors"
                                title="Marcar como lida"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(notification.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
