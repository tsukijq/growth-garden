import Link from 'next/link';
import { NotificationBell } from '@/components/notifications/NotificationBell';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  // Auth check is handled by middleware — no need to duplicate here.
  // This removes a network round-trip on every page navigation.

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar with notification bell */}
      <header className="fixed top-0 left-0 right-0 bg-[#F7F8F2] px-4 py-2 z-50 flex items-center justify-end max-w-2xl mx-auto">
        <NotificationBell />
      </header>

      <main className="flex-1 pt-12 pb-20">
        {children}
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#F7F8F2] border-t border-[#e2e5da] px-4 py-3 z-50">
        <div className="max-w-lg mx-auto flex justify-around items-center">
          <Link href="/garden" className="flex flex-col items-center gap-1 text-[#6b7a6b] hover:text-[#4A7C59] transition-colors" prefetch={true}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <span className="text-[10px]">Garden</span>
          </Link>
          <Link href="/friends" className="flex flex-col items-center gap-1 text-[#6b7a6b] hover:text-[#4A7C59] transition-colors" prefetch={true}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <span className="text-[10px]">Friends</span>
          </Link>
          <Link href="/seeds" className="flex flex-col items-center gap-1 text-[#6b7a6b] hover:text-[#4A7C59] transition-colors" prefetch={true}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            <span className="text-[10px]">Seeds</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center gap-1 text-[#6b7a6b] hover:text-[#4A7C59] transition-colors" prefetch={true}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <span className="text-[10px]">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
