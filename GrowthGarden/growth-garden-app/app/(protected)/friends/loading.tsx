export default function FriendsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="h-8 w-24 bg-[#141820] rounded animate-pulse mb-6" />
      <div className="h-11 bg-[#141820] rounded-lg animate-pulse mb-6" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-[#141820] border border-[#252a38] rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
