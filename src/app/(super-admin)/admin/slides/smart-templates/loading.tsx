export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-[#5141e5]/20 rounded-full"></div>
          <div className="w-12 h-12 border-4 border-[#5141e5] border-t-transparent rounded-full animate-spin absolute inset-0"></div>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Loading Smart Templates...</p>
      </div>
    </div>
  );
}
