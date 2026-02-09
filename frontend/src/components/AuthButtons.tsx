import { useMsal } from "@azure/msal-react";

export default function AuthButtons() {
  const { instance, accounts } = useMsal();
  const isLoggedIn = accounts.length > 0;

  const login = () => {
    instance.loginPopup();
  };

  const logout = () => {
    instance.logoutPopup();
  };

  return (
    <div className="flex items-center gap-4">
      {!isLoggedIn && (
        <button
          onClick={login}
          className="px-4 py-2 bg-[#13bba4] text-black rounded-lg"
        >
          Login
        </button>
      )}

      {isLoggedIn && (
        <>
          <span className="text-gray-300 text-sm">
            {accounts[0].username}
          </span>

          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg"
          >
            Logout
          </button>
        </>
      )}
    </div>
  );
}
