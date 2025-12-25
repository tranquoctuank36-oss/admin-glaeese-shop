"use client";

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-1 focus:ring-blue-500 
          focus:border-transparent outline-none text-gray-800 placeholder-gray-500"
      />
    </div>
  );
}
