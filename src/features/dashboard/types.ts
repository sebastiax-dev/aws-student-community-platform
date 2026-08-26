import type { AppRole } from "@/features/auth/session";
import type { RegistrationSource, RegistrationStatus } from "@/features/events/types";
import type { Database } from "@/types/database.generated";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

export type DashboardEvent = Readonly<Pick<EventRow,
  | "ends_at"
  | "id"
  | "image_path"
  | "is_published"
  | "location"
  | "modality"
  | "slug"
  | "starts_at"
  | "status"
  | "summary"
  | "title"
> & {
  image_url: string | null;
}>;

export type DashboardRegistration = Readonly<{
  event: DashboardEvent | null;
  id: string;
  registered_at: string;
  source: RegistrationSource;
  status: RegistrationStatus;
}>;

export type DashboardCertification = Readonly<{
  certificate_name: string;
  event_title: string | null;
  id: string;
  issued_at: string;
  revoked_at: string | null;
}>;

export type DashboardPointHistory = Readonly<{
  action: Database["public"]["Enums"]["point_action"];
  created_at: string;
  event_title: string | null;
  id: string;
  points: number;
}>;

export type DashboardStats = Readonly<{
  active_registrations: number;
  attended_events: number;
  total_certifications: number;
  total_points: number;
}>;

export type DashboardData = Readonly<{
  profile: Readonly<{
    created_at: string;
    display_name: string;
    total_certifications: number;
    total_points: number;
  }>;
  progress: Readonly<{
    certifications: readonly DashboardCertification[];
    points_history: readonly DashboardPointHistory[];
  }>;
  registrations: readonly DashboardRegistration[];
  role: AppRole;
  stats: DashboardStats;
}>;
