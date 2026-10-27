import React from 'react';

export const StudentLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <main className="flex-1 pb-16">{children}</main>
    </div>
  );
};
