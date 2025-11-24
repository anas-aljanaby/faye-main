import React from 'react';
import { Link } from 'react-router-dom';

const BellIcon = () => (
    <div className="relative">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-xs font-bold text-primary">1</span>
    </div>
);

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="sticky top-0 z-10 bg-primary shadow-md">
      <div className="flex justify-between items-center h-16 px-6 text-white">
        <div className="flex items-center gap-4">
           <button onClick={onMenuClick} className="p-2 md:hidden" aria-label="Open menu">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
           </button>
           <div className="hidden md:flex items-center gap-6">
              <div className="text-center">
                  <p className="font-bold text-lg">مدير النظام</p>
                  <p className="text-sm opacity-80">مدير النظام</p>
              </div>
              <BellIcon />
            </div>
        </div>
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold transition-transform hover:scale-105" aria-label="العودة للصفحة الرئيسية">
          <span>فيء</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
          </svg>
        </Link>
      </div>
    </header>
  );
};

export default Header;