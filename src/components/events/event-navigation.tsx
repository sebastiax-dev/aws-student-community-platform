"use client";

import { CalendarDays, CheckCircle2, ChevronDown, Clock3, MapPin, Monitor } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type EventFilter = "all" | "finished" | "in_person" | "upcoming" | "virtual";
export type EventOrder = "newest" | "oldest" | "upcoming";

type EventNavigationProperties = Readonly<{
  activeFilter: EventFilter;
  activeOrder: EventOrder;
}>;

const filterItems: readonly Readonly<{
  filter: EventFilter;
  label: string;
  Icon: typeof CalendarDays;
}>[] = [
  { filter: "all", label: "Todos los eventos", Icon: CalendarDays },
  { filter: "in_person", label: "Presenciales", Icon: MapPin },
  { filter: "virtual", label: "Virtuales", Icon: Monitor },
  { filter: "upcoming", label: "Próximos", Icon: Clock3 },
  { filter: "finished", label: "Finalizados", Icon: CheckCircle2 },
];

function buildFilterHref(filter: EventFilter, order: EventOrder): string {
  const parameters = new URLSearchParams();
  if (filter !== "all") {
    parameters.set("filtro", filter);
  }
  if (order !== "newest") {
    parameters.set("orden", order);
  }
  const query = parameters.toString();
  return query.length === 0 ? "/eventos" : `/eventos?${query}`;
}

export function EventNavigation({ activeFilter, activeOrder }: EventNavigationProperties): React.ReactNode {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reducedMotion = useReducedMotion() === true;

  const updateOrder = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const parameters = new URLSearchParams(searchParams.toString());
    const order = event.target.value as EventOrder;
    if (order === "newest") {
      parameters.delete("orden");
    } else {
      parameters.set("orden", order);
    }
    const query = parameters.toString();
    router.replace(query.length === 0 ? pathname : `${pathname}?${query}`, { scroll: false });
  };

  return (
    <nav aria-label="Filtros y orden de eventos" className="events-toolbar">
      <div className="events-toolbar__filters">
        {filterItems.map(({ Icon, filter, label }, index) => (
          <motion.div initial={reducedMotion ? false : { opacity: 0, x: -12 }} key={filter} transition={{ delay: index * 0.055, duration: 0.32 }} whileHover={reducedMotion ? undefined : { scale: 1.035, y: -2 }} whileInView={reducedMotion ? undefined : { opacity: 1, x: 0 }} whileTap={reducedMotion ? undefined : { scale: 0.97 }}>
            <Link aria-current={filter === activeFilter ? "page" : undefined} className="filter-chip" data-active={filter === activeFilter} href={buildFilterHref(filter, activeOrder)}><Icon size={15} /> {label}</Link>
          </motion.div>
        ))}
      </div>
      <label className="events-toolbar__sort">
        <span className="sr-only">Ordenar eventos</span>
        <select onChange={updateOrder} value={activeOrder}>
          <option value="newest">Más recientes</option>
          <option value="upcoming">Más próximos</option>
          <option value="oldest">Más antiguos</option>
        </select>
        <ChevronDown aria-hidden="true" size={15} />
      </label>
    </nav>
  );
}
