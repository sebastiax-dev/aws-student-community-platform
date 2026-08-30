import { Building2, Link2, Mail, Plus, Save, Trash2 } from "lucide-react";
import Image from "next/image";

import { SubmitButton } from "@/components/forms/submit-button";
import { createSocialLinkAction, deleteSocialLinkAction, updateContactContentAction, updateFooterContentAction, updateSocialLinkAction } from "@/features/admin/actions";
import { getSiteContent, listAdminSocialLinks } from "@/features/admin/queries";

export const dynamic = "force-dynamic";

type AdminContactPageProperties = Readonly<{
  searchParams: Promise<{ error?: string; status?: string }>;
}>;

const successMessages: Readonly<Record<string, string>> = {
  contact_updated: "La información de contacto fue actualizada.",
  institutional_updated: "La información institucional fue actualizada.",
  social_created: "La red social fue creada.",
  social_deleted: "La red social fue eliminada.",
  social_updated: "La red social fue actualizada.",
};

export default async function AdminContactPage({ searchParams }: AdminContactPageProperties): Promise<React.ReactNode> {
  const [content, socialLinks, parameters] = await Promise.all([getSiteContent(), listAdminSocialLinks(), searchParams]);
  const successMessage = parameters.status === undefined ? null : successMessages[parameters.status] ?? null;
  return (
    <section className="admin-section">
      {successMessage === null ? null : <div aria-live="polite" className="auth-message">{successMessage}</div>}
      {parameters.error === undefined ? null : <div aria-live="polite" className="auth-message auth-message--error">Revisa el formato de los datos ingresados.</div>}
      <div className="admin-section__heading"><div><h2>Gestión de contacto</h2><p>Administra correos, teléfonos, ubicación, atención y redes sociales públicas.</p></div></div>
      <form action={updateFooterContentAction} className="admin-form surface">
        <div className="admin-form__heading"><div><p className="eyebrow"><Building2 size={14} /> INFORMACIÓN INSTITUCIONAL</p><h2>Identidad pública</h2></div><SubmitButton className="button button--primary" pendingLabel="Guardando…"><Save size={15} /> Guardar información</SubmitButton></div>
        <div className="admin-form__grid">
          <label>Nombre institucional<input defaultValue={content.footer.institutionalName} maxLength={120} minLength={3} name="institutionalName" required /></label>
          <label className="admin-form__wide">Descripción institucional<textarea defaultValue={content.footer.tagline} maxLength={240} minLength={3} name="tagline" required rows={3} /></label>
        </div>
      </form>
      <form action={updateContactContentAction} className="admin-form surface">
        <div className="admin-form__heading"><div><p className="eyebrow"><Mail size={14} /> CONTACTOS</p><h2>Información de la comunidad</h2></div><SubmitButton className="button button--primary" pendingLabel="Guardando…"><Save size={15} /> Guardar contactos</SubmitButton></div>
        <div className="admin-form__grid">
          <label>Correo general<input defaultValue={content.contact.generalEmail} maxLength={254} name="generalEmail" placeholder="comunidad@dominio.com" type="email" /></label>
          <label>Correo de privacidad<input defaultValue={content.contact.privacyEmail} maxLength={254} name="privacyEmail" placeholder="privacidad@dominio.com" type="email" /></label>
          <label>Teléfono<input defaultValue={content.contact.phone} maxLength={120} name="phone" placeholder="+593 ..." /></label>
          <label>WhatsApp<input defaultValue={content.contact.whatsapp} maxLength={120} name="whatsapp" placeholder="+593 ..." /></label>
          <label>Ubicación<input defaultValue={content.contact.location} maxLength={120} name="location" /></label>
          <label>Horario de atención<input defaultValue={content.contact.officeHours} maxLength={120} name="officeHours" placeholder="Lunes a viernes, 09:00–17:00" /></label>
        </div>
      </form>
      <div className="admin-section__heading"><div><h2>Redes sociales</h2><p>{socialLinks.length} enlaces configurados.</p></div></div>
      <form action={createSocialLinkAction} className="admin-form surface admin-social-create" encType="multipart/form-data">
        <div className="admin-form__heading"><div><p className="eyebrow"><Plus size={14} /> NUEVA RED</p><h2>Añadir enlace</h2></div></div>
        <div className="admin-form__grid"><label>Nombre<input maxLength={60} minLength={2} name="name" placeholder="Instagram" required /></label><label>Identificador de icono<input maxLength={40} minLength={2} name="icon" placeholder="instagram" required /><small>Texto de respaldo cuando no se haya cargado una imagen.</small></label><label className="admin-form__wide">Imagen del icono<input accept="image/avif,image/jpeg,image/png,image/webp" name="iconImage" type="file" /><small>AVIF, JPG, PNG o WebP. Máximo 2 MiB.</small></label><label className="admin-form__wide">URL HTTPS<input name="url" placeholder="https://..." required type="url" /></label><label>Orden<input defaultValue="0" max="1000" min="0" name="sortOrder" required type="number" /></label><label className="admin-form__checkbox"><input defaultChecked name="active" type="checkbox" /> Enlace activo</label></div>
        <div className="admin-form__footer"><SubmitButton className="button button--primary" pendingLabel="Añadiendo…"><Plus size={15} /> Añadir red social</SubmitButton></div>
      </form>
      <div className="admin-social-list">{socialLinks.map((socialLink) => {
        const updateAction = updateSocialLinkAction.bind(null, socialLink.id);
        const deleteAction = deleteSocialLinkAction.bind(null, socialLink.id);
        return <article className="surface admin-social-card" key={socialLink.id}><form action={updateAction} className="admin-form" encType="multipart/form-data"><div className="admin-form__heading"><div><p className="eyebrow"><Link2 size={14} /> {socialLink.active ? "ACTIVA" : "INACTIVA"}</p><h2>{socialLink.name}</h2></div>{socialLink.icon_image_url === null ? null : <Image alt={`Icono actual de ${socialLink.name}`} className="admin-social-card__icon" height={44} src={socialLink.icon_image_url} unoptimized width={44} />}</div><div className="admin-form__grid"><label>Nombre<input defaultValue={socialLink.name} maxLength={60} minLength={2} name="name" required /></label><label>Identificador de icono<input defaultValue={socialLink.icon} maxLength={40} minLength={2} name="icon" required /></label><label className="admin-form__wide">Reemplazar imagen del icono<input accept="image/avif,image/jpeg,image/png,image/webp" name="iconImage" type="file" /><small>Déjalo vacío para conservar la imagen actual. Máximo 2 MiB.</small></label><label className="admin-form__wide">URL HTTPS<input defaultValue={socialLink.url} name="url" required type="url" /></label><label>Orden<input defaultValue={socialLink.sort_order} max="1000" min="0" name="sortOrder" required type="number" /></label><label className="admin-form__checkbox"><input defaultChecked={socialLink.active} name="active" type="checkbox" /> Enlace activo</label></div><div className="admin-form__footer"><SubmitButton className="button button--secondary" pendingLabel="Guardando…"><Save size={15} /> Guardar</SubmitButton></div></form><form action={deleteAction} className="admin-social-card__delete"><SubmitButton className="button button--danger" pendingLabel="Eliminando…"><Trash2 size={15} /> Eliminar</SubmitButton></form></article>;
      })}</div>
    </section>
  );
}
