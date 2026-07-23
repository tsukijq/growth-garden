export default function HabitsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-24 bg-[#e2e5da] rounded animate-pulse" />
        <div className="h-9 w-28 bg-[#e2e5da] rounded-lg animate-pulse" />
      </div>
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 bg-white border border-[#e2e5da] rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#e2e5da] rounded-full animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-[#e2e5da] rounded animate-pulse mb-2" />
                <div className="h-3 w-24 bg-[#e2e5da] rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
