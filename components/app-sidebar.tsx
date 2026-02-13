'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  BookOpen,
  Building2,
  GitCompare,
  LayoutGrid,
  Layers,
  RefreshCw,
  Settings,
  Smartphone,
  Sparkles,
  Shield,
  Users,
  Lightbulb,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
  { name: 'Documentation', href: '/docs', icon: BookOpen },
  { name: 'Strategic Intel', href: '/strategy', icon: Shield },
  { name: 'Product Portfolio', href: '/portfolio', icon: Layers },
  { name: 'Mobile Intelligence', href: '/mobile', icon: Smartphone },
  { name: 'Segment Analysis', href: '/segments', icon: Users },
  { name: 'Providers', href: '/providers', icon: Building2 },
  { name: 'Matrix Compare', href: '/compare/matrix', icon: BarChart3 },
  { name: 'Head-to-Head', href: '/compare/head-to-head', icon: GitCompare },
  { name: 'Comcast Deep Dive', href: '/providers/comcast-business', icon: Sparkles },
  { name: 'Refresh Data', href: '/refresh', icon: RefreshCw },
  { name: 'Dev Requests', href: '/dev-requests', icon: Lightbulb },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 bg-slate-900 lg:block">
      <div className="flex h-16 items-center gap-2 px-6 border-b border-slate-800">
        <BarChart3 className="h-8 w-8 text-primary" />
        <span className="text-lg font-bold text-white">SMB Market Intel</span>
      </div>
      
      <nav className="flex flex-col gap-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="absolute bottom-4 left-4 right-4">
        <div className="text-center">
          <p className="text-xs text-slate-500">Built by <span className="font-semibold text-slate-400">CMACLABS</span></p>
        </div>
      </div>
    </aside>
  );
}
