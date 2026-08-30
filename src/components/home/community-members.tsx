import { UserRound } from "lucide-react";
import Image from "next/image";

import type { TeamMember } from "@/features/admin/types";

type CommunityMembersProperties = Readonly<{
  members: readonly TeamMember[];
}>;

export function CommunityMembers({ members }: CommunityMembersProperties): React.ReactNode {
  if (members.length === 0) {
    return null;
  }
  return (
    <section aria-labelledby="community-members-title" className="community-members">
      <div className="section-heading"><h2 id="community-members-title">Personas que construyen la comunidad</h2></div>
      <div className="community-members__grid">{members.map((member) => <article className="surface community-member-card" key={member.id}><div className="community-member-card__image">{member.image_url === null ? <UserRound aria-hidden="true" size={30} /> : <Image alt={`Fotografía de ${member.name}`} fill sizes="(min-width: 960px) 25vw, (min-width: 700px) 50vw, 100vw" src={member.image_url} unoptimized />}</div><div><p className="eyebrow">{member.role_title}</p><h3>{member.name}</h3><p>{member.description}</p></div></article>)}</div>
    </section>
  );
}
