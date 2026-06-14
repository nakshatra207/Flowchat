import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/auth-store";

export function ProtectedRoute() {
  const { user, loading } = useAuthStore();

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Loading FlowChat</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

