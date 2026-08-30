"use client";

import { Award, CalendarCheck2, CalendarDays, FileLock2, LayoutDashboard, Mail, MonitorCog, Sparkles, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  { href: "/dashboard/admin/eventos", label: "Eventos", Icon: CalendarDays },
  { href: "/dashboard/admin/usuarios", label: "Usuarios", Icon: UsersRound },
  { href: "/dashboard/admin/asistencias", label: "Asistencias", Icon: CalendarCheck2 },
  { href: "/dashboard/admin/certificaciones", label: "Certificaciones", Icon: Award },
  { href: "/dashboard/admin/puntos", label: "Puntos", Icon: Sparkles },
  { href: "/dashboard/admin/contenido", label: "Contenido web", Icon: MonitorCog },
  { href: "/dashboard/admin/contacto", label: "Contacto", Icon: Mail },
  { href: "/dashboard/admin/legal", label: "Privacidad y legal", Icon: FileLock2 },
] as const;

export function AdminNavigation(): React.ReactNode {
  const pathname = usePathname();
  return (
    <nav aria-label="Navegación administrativa" className="admin-nav">
      {navigationItems.map(({ Icon, href, label }) => <Link data-active={pathname.startsWith(href)} href={href} key={href}><Icon size={16} /> {label}</Link>)}
      <Link href="/dashboard"><LayoutDashboard size={16} /> Dashboard personal</Link>
    </nav>
  );
}
