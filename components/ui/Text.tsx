
type TextProps = {
  children: React.ReactNode;
  className?: string;
};

// ✅ Normal text (content)
export function Text({ children, className = "" }: TextProps) {
  return (
    <p
      className={`text-gray-900 leading-relaxed ${className}`}
      style={{ color: "#111" }} // force visible on iOS
    >
      {children}
    </p>
  );
}

// ✅ Label text (titles like "Case ID")
export function Label({ children, className = "" }: TextProps) {
  return (
    <p
      className={`text-gray-700 font-semibold ${className}`}
      style={{ color: "#374151" }}
    >
      {children}
    </p>
  );
}