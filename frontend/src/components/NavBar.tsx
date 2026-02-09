import AuthButtons from "../auth/AuthButtons";

export default function Navbar() {
  return (
    <div className="flex justify-between items-center px-6 py-4 bg-[#0e1117] text-white border-b border-[#1e2330]">
      <h1 className="text-xl font-bold">Smart Factory Admin</h1>
      <AuthButtons />
    </div>
  );
}
