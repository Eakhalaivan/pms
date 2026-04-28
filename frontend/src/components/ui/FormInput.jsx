import React from 'react';

export default function FormInput({ label, type = 'text', error, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-semibold text-gray-700">{label}</label>}
      <input 
        type={type}
        className={`px-3 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all ${
          error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-accent'
        }`}
        {...props}
      />
      {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
    </div>
  );
}
