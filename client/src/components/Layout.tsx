import { Link, useLocation } from "wouter";
import { useAuth } from "../hooks/useAuth";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [loc] = useLocation();

  const nav = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/connections", label: "Connections" },
    { href: "/logs", label: "Logs" },
    { href: "/settings/email", label: "Email Accounts" },
    ...(user?.role === "admin"
      ? [
          { href: "/admin/credentials", label: "Admin Credentials" },
          { href: "/admin/stage-mapping", label: "Stage Mapping" },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r bg-white p-4 flex flex-col gap-2">
        <Link href="/" className="text-xl font-bold text-gray-900">
          SyncHub v1.1
        </Link>
        <nav className="flex flex-col gap-1">
          {nav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-2 rounded text-sm ${loc === href || (href === "/dashboard" && loc === "/") ? "bg-gray-100 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-4 border-t text-sm text-gray-500">
          {user?.email} {user?.role === "admin" && "(Admin)"}
        </div>
        <a
          href="/"
          className="text-sm text-red-600 hover:underline"
          onClick={(e) => {
            e.preventDefault();
            window.location.href = "/";
          }}
        >
          Sign out
        </a>
      </aside>
      <main className="flex-1 p-6 overflow-auto bg-gray-50">{children}</main>
    </div>
  );
}
