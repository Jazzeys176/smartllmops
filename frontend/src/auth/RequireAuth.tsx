// src/auth/RequireAuth.tsx
import { useMsal } from "@azure/msal-react";
import { Navigate } from "react-router-dom";

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const { accounts } = useMsal();

  if (!accounts || accounts.length === 0) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
