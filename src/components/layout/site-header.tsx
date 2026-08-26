import { Boxes, CalendarDays, Grid2X2, House, Moon, UsersRound } from "lucide-react";
import Link from "next/link";

export type SitePage = "community" | "dashboard-preview" | "events" | "home";

type SiteHeaderProperties = Readonly<{
  activePage: SitePage;
}>;

type NavigationItem = Readonly<{
  href: string;
  label: string;
  page: SitePage;
}>;

const navigationItems: readonly NavigationItem[] = [
  { href: "/", label: "Inicio", page: "home" },
  { href: "/eventos", label: "Eventos", page: "events" },
  { href: "/#comunidad", label: "Comunidad", page: "community" },
  { href: "/dashboard", label: "Dashboard", page: "dashboard-preview" },
];

export function SiteHeader({ activePage }: SiteHeaderProperties): React.ReactNode {
  return (
    <>
      <header className="site-header">
        <div className="content-wrap site-header__inner">
          <Link aria-label="Ir al inicio" className="brand" href="/">
            <span aria-hidden="true" className="brand__mark"><Boxes size={24} /></span>
            <span className="brand__name"><strong>AWS</strong><span>STUDENT COMMUNITY<br />PUCE</span></span>
          </Link>
          <nav aria-label="Navegación principal" className="header-nav">
            {navigationItems.map((item) => <Link data-active={item.page === activePage} href={item.href} key={item.page}>{item.label}</Link>)}
          </nav>
          <div className="header-actions">
            <span aria-hidden="true" className="button button--secondary"><Moon size={16} /></span>
            <Link className="button button--secondary" href="/login">Iniciar sesión</Link>
            <Link className="button button--primary" href="/registro">Únete ahora</Link>
          </div>
        </div>
      </header>
      <nav aria-label="Navegación móvil" className="mobile-nav">
        <Link data-active={activePage === "home"} href="/"><House size={19} /><span>Inicio</span></Link>
        <Link data-active={activePage === "events"} href="/eventos"><CalendarDays size={19} /><span>Eventos</span></Link>
        <Link data-active={activePage === "community"} href="/#comunidad"><UsersRound size={19} /><span>Comunidad</span></Link>
        <Link data-active={activePage === "dashboard-preview"} href="/dashboard"><Grid2X2 size={19} /><span>Dashboard</span></Link>
      </nav>
    </>
  );
}
