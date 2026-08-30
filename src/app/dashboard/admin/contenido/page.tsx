import { Building2, Home, ImageUp, Plus, Save, Trash2, UserRound } from "lucide-react";
import Image from "next/image";

import { SubmitButton } from "@/components/forms/submit-button";
import { createTeamMemberAction, deleteTeamMemberAction, updateBrandingAction, updateHomeContentAction, updateInstitutionalContentAction, updateTeamMemberAction } from "@/features/admin/actions";
import { getSiteContent, listAdminTeamMembers } from "@/features/admin/queries";

export const dynamic = "force-dynamic";

type AdminContentPageProperties = Readonly<{
  searchParams: Promise<{ error?: string; status?: string }>;
}>;

const successMessages: Readonly<Record<string, string>> = {
  branding_updated: "El logotipo público fue actualizado.",
  home_updated: "El contenido principal de la página fue actualizado.",
  institutional_updated: "La información institucional y el footer fueron actualizados.",
  team_member_created: "El miembro de comunidad fue creado.",
  team_member_deleted: "El miembro de comunidad fue eliminado.",
  team_member_updated: "El miembro de comunidad fue actualizado.",
};

export default async function AdminContentPage({ searchParams }: AdminContentPageProperties): Promise<React.ReactNode> {
  const [content, teamMembers, parameters] = await Promise.all([getSiteContent(), listAdminTeamMembers(), searchParams]);
  const successMessage = parameters.status === undefined ? null : successMessages[parameters.status] ?? null;
  return (
    <section className="admin-section">
      {successMessage === null ? null : <div aria-live="polite" className="auth-message">{successMessage}</div>}
      {parameters.error === undefined ? null : <div aria-live="polite" className="auth-message auth-message--error">Revisa los campos obligatorios, las rutas internas y el archivo de imagen.</div>}
      <div className="admin-section__heading"><div><h2>Gestión de contenido web</h2><p>Edita textos públicos sin modificar código ni desplegar una nueva versión.</p></div></div>
      <div className="admin-content-grid">
        <form action={updateBrandingAction} className="admin-form surface" encType="multipart/form-data">
          <div className="admin-form__heading"><div><p className="eyebrow"><ImageUp size={14} /> IDENTIDAD VISUAL</p><h2>Logotipo de la web</h2><p>Reemplaza el símbolo junto al nombre de la comunidad en la barra superior.</p></div><SubmitButton className="button button--primary" pendingLabel="Guardando…"><Save size={15} /> Guardar logotipo</SubmitButton></div>
          <div className="admin-form__grid">
            <label className="admin-form__wide">Nombre de la comunidad<input defaultValue={content.branding.brandName} maxLength={120} minLength={3} name="brandName" required /></label>
            <label className="admin-form__wide">Nueva imagen de logotipo<input accept="image/avif,image/jpeg,image/png,image/webp" name="logoImage" type="file" /><small>AVIF, JPG, PNG o WebP. Máximo 2 MiB.</small></label>
            <label className="admin-form__checkbox"><input name="removeLogo" type="checkbox" /> Restablecer el símbolo predeterminado</label>
            {content.branding.logoImageUrl === null ? <p className="admin-empty-copy">Actualmente se usa el símbolo predeterminado de la plataforma.</p> : <div className="admin-branding-preview"><Image alt="Logotipo actual" height={96} src={content.branding.logoImageUrl} unoptimized width={96} /><span>Logotipo actual</span></div>}
          </div>
        </form>
        <form action={updateHomeContentAction} className="admin-form surface">
          <div className="admin-form__heading"><div><p className="eyebrow"><Home size={14} /> HOME</p><h2>Hero y llamadas a la acción</h2></div><SubmitButton className="button button--primary" pendingLabel="Guardando…"><Save size={15} /> Guardar Home</SubmitButton></div>
          <div className="admin-form__grid">
            <label className="admin-form__wide">Etiqueta superior<input defaultValue={content.home.eyebrow} maxLength={80} minLength={3} name="eyebrow" required /></label>
            <label>Título inicial<input defaultValue={content.home.titleLead} maxLength={60} minLength={2} name="titleLead" required /></label>
            <label>Título destacado<input defaultValue={content.home.titleAccent} maxLength={60} minLength={2} name="titleAccent" required /></label>
            <label className="admin-form__wide">Sufijo del título<input defaultValue={content.home.titleSuffix} maxLength={40} minLength={2} name="titleSuffix" required /></label>
            <label className="admin-form__wide">Descripción<textarea defaultValue={content.home.description} maxLength={500} minLength={20} name="description" required rows={4} /></label>
            <label>CTA principal<input defaultValue={content.home.primaryCtaLabel} maxLength={60} minLength={2} name="primaryCtaLabel" required /></label>
            <label>Ruta CTA principal<input defaultValue={content.home.primaryCtaHref} maxLength={240} name="primaryCtaHref" required /></label>
            <label>CTA secundario<input defaultValue={content.home.secondaryCtaLabel} maxLength={60} minLength={2} name="secondaryCtaLabel" required /></label>
            <label>Ruta CTA secundario<input defaultValue={content.home.secondaryCtaHref} maxLength={240} name="secondaryCtaHref" required /></label>
          </div>
        </form>
        <form action={updateInstitutionalContentAction} className="admin-form surface">
          <div className="admin-form__heading"><div><p className="eyebrow"><Building2 size={14} /> INSTITUCIONAL</p><h2>Comunidad y Footer</h2></div><SubmitButton className="button button--primary" pendingLabel="Guardando…"><Save size={15} /> Guardar información</SubmitButton></div>
          <div className="admin-form__grid">
            <label className="admin-form__wide">Título de comunidad<input defaultValue={content.community.title} maxLength={100} minLength={3} name="communityTitle" required /></label>
            <label className="admin-form__wide">Descripción de comunidad<textarea defaultValue={content.community.description} maxLength={600} minLength={20} name="communityDescription" required rows={4} /></label>
            <label>Miembros activos<input defaultValue={content.community.activeMembers} maxLength={20} minLength={1} name="activeMembers" required /></label>
            <label>Eventos por ciclo<input defaultValue={content.community.eventsPerCycle} maxLength={20} minLength={1} name="eventsPerCycle" required /></label>
            <label>Certificaciones emitidas<input defaultValue={content.community.certificatesIssued} maxLength={20} minLength={1} name="certificatesIssued" required /></label>
            <label>Proyectos desarrollados<input defaultValue={content.community.projectsDeveloped} maxLength={20} minLength={1} name="projectsDeveloped" required /></label>
            <label className="admin-form__wide">Nombre institucional<input defaultValue={content.footer.institutionalName} maxLength={120} minLength={3} name="institutionalName" required /></label>
            <label className="admin-form__wide">Texto del Footer<textarea defaultValue={content.footer.tagline} maxLength={240} minLength={3} name="tagline" required rows={3} /></label>
          </div>
        </form>
      </div>
      <div className="admin-section__heading"><div><h2>Miembros de la comunidad</h2><p>Administra las personas que aparecen en la presentación pública.</p></div><span className="admin-count">{teamMembers.length}</span></div>
      <form action={createTeamMemberAction} className="admin-form surface admin-social-create" encType="multipart/form-data"><div className="admin-form__heading"><div><p className="eyebrow"><Plus size={14} /> NUEVO MIEMBRO</p><h2>Añadir perfil</h2></div></div><div className="admin-form__grid"><label>Nombre<input maxLength={80} minLength={2} name="name" required /></label><label>Cargo<input maxLength={100} minLength={2} name="roleTitle" required /></label><label className="admin-form__wide">Descripción<textarea maxLength={600} minLength={10} name="description" required rows={3} /></label><label className="admin-form__wide">Fotografía del miembro<input accept="image/avif,image/jpeg,image/png,image/webp" name="memberImage" type="file" /><small>AVIF, JPG, PNG o WebP. Máximo 2 MiB.</small></label><label>Orden<input defaultValue="0" max="1000" min="0" name="sortOrder" required type="number" /></label><label className="admin-form__checkbox"><input defaultChecked name="active" type="checkbox" /> Perfil visible</label></div><div className="admin-form__footer"><SubmitButton className="button button--primary" pendingLabel="Añadiendo…"><Plus size={15} /> Añadir miembro</SubmitButton></div></form>
      <div className="admin-social-list">{teamMembers.map((member) => {
        const updateAction = updateTeamMemberAction.bind(null, member.id);
        const deleteAction = deleteTeamMemberAction.bind(null, member.id);
        return <article className="surface admin-social-card" key={member.id}><form action={updateAction} className="admin-form" encType="multipart/form-data"><div className="admin-form__heading"><div><p className="eyebrow"><UserRound size={14} /> {member.active ? "VISIBLE" : "OCULTO"}</p><h2>{member.name}</h2></div>{member.image_public_url === null ? null : <Image alt={`Fotografía actual de ${member.name}`} className="admin-social-card__icon" height={44} src={member.image_public_url} unoptimized width={44} />}</div><div className="admin-form__grid"><label>Nombre<input defaultValue={member.name} maxLength={80} minLength={2} name="name" required /></label><label>Cargo<input defaultValue={member.role_title} maxLength={100} minLength={2} name="roleTitle" required /></label><label className="admin-form__wide">Descripción<textarea defaultValue={member.description} maxLength={600} minLength={10} name="description" required rows={3} /></label><label className="admin-form__wide">Reemplazar fotografía<input accept="image/avif,image/jpeg,image/png,image/webp" name="memberImage" type="file" /><small>Déjalo vacío para conservar la foto actual. Máximo 2 MiB.</small></label><label className="admin-form__checkbox"><input name="removeImage" type="checkbox" /> Quitar fotografía actual</label><label>Orden<input defaultValue={member.sort_order} max="1000" min="0" name="sortOrder" required type="number" /></label><label className="admin-form__checkbox"><input defaultChecked={member.active} name="active" type="checkbox" /> Perfil visible</label></div><div className="admin-form__footer"><SubmitButton className="button button--secondary" pendingLabel="Guardando…"><Save size={15} /> Guardar</SubmitButton></div></form><form action={deleteAction} className="admin-social-card__delete"><SubmitButton className="button button--danger" pendingLabel="Eliminando…"><Trash2 size={15} /> Eliminar</SubmitButton></form></article>;
      })}</div>
    </section>
  );
}
