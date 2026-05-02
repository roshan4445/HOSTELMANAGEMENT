import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = ({ text = "Loading your data..." }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="relative">
        <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-50 rounded-full animate-pulse"></div>
        <Loader2 size={48} className="text-indigo-600 animate-spin relative z-10" />
      </div>
      <p className="text-gray-500 dark:text-gray-400 font-medium tracking-wide animate-pulse">{text}</p>
    </div>
  );
};

export default Loader;
