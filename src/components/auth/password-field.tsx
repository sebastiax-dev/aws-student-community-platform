"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type PasswordFieldProperties = Readonly<{
  autoComplete: string;
  minLength: number;
  name: string;
}>;

export function PasswordField({ autoComplete, minLength, name }: PasswordFieldProperties): React.ReactNode {
  const [isVisible, setIsVisible] = useState(false);
  const label = isVisible ? "Ocultar contraseña" : "Mostrar contraseña";

  return (
    <span className="password-field">
      <input autoComplete={autoComplete} minLength={minLength} name={name} required type={isVisible ? "text" : "password"} />
      <button aria-label={label} aria-pressed={isVisible} className="password-field__toggle" onClick={() => setIsVisible((visible) => !visible)} type="button">
        {isVisible ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
      </button>
    </span>
  );
}
