export default function ProfileLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="h-8 w-20 bg-[#141820] rounded animate-pulse mb-6" />
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-[#141820] animate-pulse" />
        <div className="flex flex-col gap-2">
          <div className="h-5 w-24 bg-[#141820] rounded animate-pulse" />
          <div className="h-3 w-32 bg-[#141820] rounded animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-[#141820] border border-[#252a38] rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
