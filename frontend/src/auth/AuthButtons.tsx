// src/components/AuthButtons.tsx
import { useMsal } from "@azure/msal-react";

export default function AuthButtons() {
  const { instance, accounts } = useMsal();

  const handleLogin = () => {
    instance.loginRedirect().catch(console.error);
  };

  const handleLogout = () => {
    instance.logoutRedirect().catch(console.error);
  };

  const user = accounts[0];

  return (
    <div className="flex items-center gap-4">
      {user && (
        <span className="text-sm text-gray-300">
          {user?.username}
        </span>
      )}

      {!user ? (
        <button
          onClick={handleLogin}
          className="bg-[#13bba4] px-4 py-2 rounded text-black font-semibold hover:bg-[#0fae98]"
        >
          Login
        </button>
      ) : (
        <button
          onClick={handleLogout}
          className="bg-red-500 px-4 py-2 rounded text-white font-semibold hover:bg-red-600"
        >
          Logout
        </button>
      )}
    </div>
  );
}
