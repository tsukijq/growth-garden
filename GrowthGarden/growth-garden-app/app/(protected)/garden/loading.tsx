export default function GardenLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="h-12 bg-[#141820] rounded-lg animate-pulse mb-4" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[#141820] border border-[#252a38] rounded-xl h-40 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
