import { Bell, LogOut, MessageSquare, Search, Settings, UserRound, UsersRound } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth-store";
import { cn } from "../lib/utils";

const links = [
  { to: "/", label: "Chats", icon: MessageSquare },
  { to: "/groups", label: "Groups", icon: UsersRound },
  { to: "/profile", label: "Profile", icon: UserRound },
  { to: "/settings", label: "Settings", icon: Settings }
];

export function AppShell() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-white lg:block">
        <div className="flex h-16 items-center gap-3 px-5">
          <div className="grid size-9 place-items-center rounded-md bg-primary text-white">
            <MessageSquare size={20} />
          </div>
          <div>
            <div className="font-semibold">FlowChat</div>
            <div className="text-xs text-slate-500">Enterprise</div>
          </div>
        </div>
        <nav className="space-y-1 px-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600",
                  isActive && "bg-muted text-slate-950"
                )
              }
            >
              <link.icon size={18} />
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="lg:hidden grid size-9 place-items-center rounded-md bg-primary text-white">
              <MessageSquare size={19} />
            </div>
            <div className="hidden items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm text-slate-500 sm:flex">
              <Search size={16} />
              Search users, groups, messages
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="grid size-9 place-items-center rounded-md border border-border bg-white" aria-label="Notifications">
              <Bell size={17} />
            </button>
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold">{user?.displayName}</div>
              <div className="text-xs text-slate-500">@{user?.username}</div>
            </div>
            <button className="grid size-9 place-items-center rounded-md border border-border bg-white" onClick={handleLogout} aria-label="Logout">
              <LogOut size={17} />
            </button>
          </div>
        </header>
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

