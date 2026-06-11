'use client';

import React from 'react';
import { Bell, Search } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-[#0a0e1a]/80 backdrop-blur-md border-b border-white/10">
      <div className="flex-1 px-4 flex justify-between sm:px-6 lg:px-8">
        <div className="flex-1 flex">
          <form className="w-full flex md:ml-0" action="#" method="GET">
            <label htmlFor="search-field" className="sr-only">Search employees</label>
            <div className="relative w-full text-gray-400 focus-within:text-gray-200">
              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                <Search className="h-5 w-5" aria-hidden="true" />
              </div>
              <input
                id="search-field"
                className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-gray-200 placeholder-gray-500 bg-transparent focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-transparent sm:text-sm"
                placeholder="Search employees, departments, or insights..."
                type="search"
                name="search"
              />
            </div>
          </form>
        </div>
        <div className="ml-4 flex items-center md:ml-6">
          <button
            type="button"
            className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0e1a] focus:ring-blue-500 transition-colors relative"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5" aria-hidden="true" />
            <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#0a0e1a]" />
          </button>
        </div>
      </div>
    </header>
  );
}
