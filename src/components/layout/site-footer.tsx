import Link from "next/link";
import Image from "next/image";

import { getSiteContent, listPublicSocialLinks } from "@/features/admin/queries";

function getWhatsappHref(value: string): string {
  const digits = value.replace(/[^0-9]/gu, "");
  if (digits.length === 0) {
    throw new Error("A configured WhatsApp contact must contain at least one digit.");
  }
  return `https://wa.me/${digits}`;
}

export async function SiteFooter(): Promise<React.ReactNode> {
  const [content, socialLinks] = await Promise.all([getSiteContent(), listPublicSocialLinks()]);
  return (
    <footer className="site-footer">
      <div className="content-wrap site-footer__inner">
        <div className="site-footer__identity"><strong>{content.footer.institutionalName}</strong><p>{content.footer.tagline}</p>{content.contact.location.length === 0 ? null : <span>{content.contact.location}</span>}</div>
        <div className="site-footer__contacts">{content.contact.generalEmail.length === 0 ? null : <a href={`mailto:${content.contact.generalEmail}`}>{content.contact.generalEmail}</a>}{content.contact.privacyEmail.length === 0 ? null : <a href={`mailto:${content.contact.privacyEmail}`}>Privacidad: {content.contact.privacyEmail}</a>}{content.contact.phone.length === 0 ? null : <a href={`tel:${content.contact.phone}`}>{content.contact.phone}</a>}{content.contact.whatsapp.length === 0 ? null : <a href={getWhatsappHref(content.contact.whatsapp)} rel="noreferrer" target="_blank">WhatsApp</a>}{content.contact.officeHours.length === 0 ? null : <span>{content.contact.officeHours}</span>}</div>
        <nav aria-label="Redes sociales" className="site-footer__socials">{socialLinks.map((socialLink) => <a aria-label={socialLink.name} href={socialLink.url} key={socialLink.id} rel="noreferrer" target="_blank"><span aria-hidden="true" className="site-footer__social-icon-frame">{socialLink.icon_image_url === null ? <span className="site-footer__social-fallback">{socialLink.name.slice(0, 1).toUpperCase()}</span> : <Image alt="" className="site-footer__social-icon" height={32} src={socialLink.icon_image_url} unoptimized width={32} />}</span><span className="site-footer__social-label">{socialLink.name}</span></a>)}</nav>
        <nav aria-label="Información legal" className="site-footer__legal">
          <Link href="/privacidad">Privacidad</Link>
          <Link href="/terminos">Términos</Link>
          <Link href="/cookies">Cookies</Link>
        </nav>
      </div>
    </footer>
  );
}
