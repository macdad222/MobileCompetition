'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  BookOpen,
  Building2,
  GitCompare,
  LayoutGrid,
  Layers,
  Lightbulb,
  Menu,
  RefreshCw,
  Settings,
  Smartphone,
  Sparkles,
  Shield,
  Users,
  X,
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

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open navigation menu</span>
        </Button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        {/* Backdrop */}
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />

        {/* Slide-in panel */}
        <DialogPrimitive.Content
          className="fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left duration-300"
        >
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-primary" />
              <span className="text-base font-bold text-white">SMB Market Intel</span>
            </div>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogPrimitive.Close>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col gap-1 p-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
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

          {/* Footer */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="text-center">
              <p className="text-xs text-slate-500">
                Built by <span className="font-semibold text-slate-400">CMACLABS</span>
              </p>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

