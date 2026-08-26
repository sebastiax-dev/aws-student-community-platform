import { ShieldCheck } from "lucide-react";
import Link from "next/link";

type AuthCardProperties = Readonly<{
  children: React.ReactNode;
  description: string;
  footer: React.ReactNode;
  message: string | null;
  title: string;
}>;

export function AuthCard({ children, description, footer, message, title }: AuthCardProperties): React.ReactNode {
  return (
    <main className="auth-shell content-wrap">
      <section className="auth-card surface">
        <Link className="auth-card__back" href="/">← Volver al inicio</Link>
        <span aria-hidden="true" className="auth-card__icon"><ShieldCheck size={28} /></span>
        <h1>{title}</h1>
        <p>{description}</p>
        {message === null ? null : <div aria-live="polite" className="auth-message">{message}</div>}
        {children}
        <div className="auth-card__footer">{footer}</div>
      </section>
    </main>
  );
}
