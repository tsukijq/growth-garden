'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getNotifications, getUnreadCount, markAllRead, Notification } from '@/lib/actions/notifications';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

const typeIcons: Record<string, string> = {
  social: '💧',
  milestone: '🌸',
  nudge: '🌙',
  digest: '📋',
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Load unread count on mount
  useEffect(() => {
    getUnreadCount().then(setUnread);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  async function handleOpen() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    setLoading(true);
    const data = await getNotifications(15);
    setNotifications(data);
    setLoading(false);

    if (unread > 0) {
      await markAllRead();
      setUnread(0);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f0f2ea] transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5 text-[#6b7a6b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {/* Unread dot — soft green, no number */}
        {unread > 0 && (
          <motion.div
            className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full"
            style={{ background: '#4A7C59' }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500 }}
          />
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 top-11 w-80 max-h-[400px] overflow-y-auto rounded-xl border border-[#e2e5da] bg-white shadow-xl z-[80]"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 py-3 border-b border-[#e2e5da]">
              <p className="text-sm font-medium text-[#1F2A1F]">Notifications</p>
            </div>

            {loading && (
              <div className="px-4 py-8 text-center">
                <p className="text-xs text-[#6b7a6b]">Loading...</p>
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="px-4 py-8 text-center">
                <span className="text-2xl block mb-2">🌱</span>
                <p className="text-xs text-[#6b7a6b]">Nothing yet. Your garden is quiet.</p>
              </div>
            )}

            {!loading && notifications.length > 0 && (
              <div className="divide-y divide-[#f0f2ea]">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 flex gap-3 items-start ${!n.read ? 'bg-[#f8faf5]' : ''}`}
                  >
                    <span className="text-lg flex-shrink-0 mt-0.5">{typeIcons[n.type] || '🌿'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#1F2A1F] leading-snug">{n.title}</p>
                      <p className="text-[11px] text-[#6b7a6b] mt-0.5 leading-snug">{n.body}</p>
                      <p className="text-[10px] text-[#a0a898] mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
