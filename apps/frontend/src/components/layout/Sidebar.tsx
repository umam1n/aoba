'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Activity, 
  FileSpreadsheet, 
  Settings,
  ShieldCheck,
  BarChart3
} from 'lucide-react';
import { cn } from '../ui/GlassPanel';

const navigation = [
  { name: 'Overview', href: '/overview', icon: LayoutDashboard },
  { name: 'Risk Analytics', href: '/risk', icon: Activity },
  { name: 'Department Deep Dive', href: '/overview/department', icon: BarChart3 },
  { name: 'Employee Directory', href: '/employees', icon: Users },
  { name: 'Data Import', href: '/import', icon: FileSpreadsheet },
  { name: 'Surveys', href: '/surveys', icon: FileSpreadsheet },
  { name: 'Compliance & Charter', href: '/compliance', icon: ShieldCheck },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-[#0a0e1a] border-r border-white/10 pt-5 pb-4">
      <div className="flex items-center flex-shrink-0 px-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">AOBA</span>
        </div>
      </div>
      <div className="mt-8 flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive 
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent',
                  'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors'
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? 'text-blue-400' : 'text-gray-400 group-hover:text-white',
                    'mr-3 flex-shrink-0 h-5 w-5 transition-colors'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="flex-shrink-0 flex border-t border-white/10 p-4">
        <a href="#" className="flex-shrink-0 w-full group block">
          <div className="flex items-center">
            <div>
              <div className="inline-block h-9 w-9 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-300 font-medium">
                HR
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">HR Admin</p>
              <p className="text-xs font-medium text-gray-400 group-hover:text-gray-300">View profile</p>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}
