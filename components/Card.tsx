export default function Card({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
      {children}
    </div>
  );
}