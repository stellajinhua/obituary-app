"use client";

export default function TestPage() {
  return (
    <div style={{ padding: 100 }}>
      <h1>Dropdown Test</h1>

      <select style={{ appearance: "auto", padding: 10 }}>
        <option value="">Select</option>
        <option value="1">ONE</option>
        <option value="2">TWO</option>
        <option value="3">THREE</option>
      </select>
    </div>
  );
}