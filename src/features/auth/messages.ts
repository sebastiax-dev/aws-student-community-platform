export type AuthMessageCode = "check_email" | "invalid_callback" | "invalid_credentials" | "invalid_input" | "password_updated" | "rate_limited" | "reset_email_sent";

const authMessages: Readonly<Record<AuthMessageCode, string>> = {
  check_email: "Revisa tu correo y confirma la cuenta antes de iniciar sesión.",
  invalid_callback: "El enlace de autenticación es inválido o expiró. Solicita uno nuevo.",
  invalid_credentials: "No fue posible iniciar sesión con esas credenciales.",
  invalid_input: "Revisa los campos e inténtalo nuevamente.",
  password_updated: "Tu contraseña fue actualizada correctamente.",
  rate_limited: "Se alcanzó el límite temporal de solicitudes. Espera un momento antes de intentar otra vez.",
  reset_email_sent: "Si la cuenta existe, recibirás instrucciones para restablecer la contraseña.",
};

export function getAuthMessage(code: string | undefined): string | null {
  if (code === undefined || !Object.hasOwn(authMessages, code)) {
    return null;
  }

  return authMessages[code as AuthMessageCode];
}
