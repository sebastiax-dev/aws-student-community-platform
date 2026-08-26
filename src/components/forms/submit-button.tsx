"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProperties = Readonly<{
  ariaLabel?: string;
  children: React.ReactNode;
  className: string;
  pendingLabel: string;
}>;

export function SubmitButton({ ariaLabel, children, className, pendingLabel }: SubmitButtonProperties): React.ReactNode {
  const { pending } = useFormStatus();

  return <button aria-disabled={pending} aria-label={ariaLabel} className={className} disabled={pending} type="submit">{pending ? pendingLabel : children}</button>;
}
