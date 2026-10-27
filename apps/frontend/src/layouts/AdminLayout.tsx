import React from 'react';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-orange-500">TimeToMeal Admin Engine</h1>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
};
