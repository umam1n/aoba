import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white flex flex-col">
      <header className="px-8 py-6 flex justify-between items-center border-b border-white/10">
        <div className="text-2xl font-bold tracking-tight">AOBA</div>
        <nav className="flex gap-6 items-center">
          <Link href="/login" className="text-gray-300 hover:text-white transition-colors">Sign In</Link>
          <Link href="/app/overview" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors">Go to Dashboard</Link>
        </nav>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-[20%] left-[10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[10%] w-[50%] h-[50%] rounded-full bg-cyan-600/20 blur-[120px] pointer-events-none" />

        <div className="z-10 max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-br from-white to-gray-400 text-transparent bg-clip-text leading-tight">
            Workforce Intelligence for the Modern Enterprise
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Identify retention risks, visualize department health, and surface actionable insights before they become problems.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/app/overview" className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg font-medium text-lg transition-colors">
              Enter Platform
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
