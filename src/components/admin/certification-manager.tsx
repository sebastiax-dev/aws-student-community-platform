"use client";

import { Award, Minus, Plus, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { setCertificationTotalAction } from "@/features/admin/actions";
import type { AdminUserSummary } from "@/features/admin/types";

type CertificationManagerProperties = Readonly<{
  users: readonly AdminUserSummary[];
}>;

type SelectedUser = Readonly<{
  displayName: string;
  total: number;
  userId: string;
}>;

export function CertificationManager({ users }: CertificationManagerProperties): React.ReactNode {
  const reducedMotion = useReducedMotion() === true;
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [total, setTotal] = useState(0);

  const openManager = (user: AdminUserSummary): void => {
    setSelectedUser({ displayName: user.display_name, total: user.total_certifications, userId: user.user_id });
    setTotal(user.total_certifications);
  };

  const closeManager = (): void => setSelectedUser(null);

  return (
    <>
      <div className="admin-user-list">
        {users.map((user) => (
          <article className="surface admin-user-card" key={user.user_id}>
            <div className="admin-user-card__identity"><span><Award size={18} /></span><div><h3>{user.display_name}</h3><p>{user.email}</p></div></div>
            <div className="admin-user-card__stats"><span>Certificaciones<strong>{user.total_certifications.toString().padStart(2, "0")}</strong></span><span>Asistencias<strong>{user.attendance_count}</strong></span><span>Puntos<strong>{user.total_points}</strong></span></div>
            <button className="button button--secondary" onClick={() => openManager(user)} type="button">Gestionar certificaciones</button>
          </article>
        ))}
      </div>
      <AnimatePresence>
        {selectedUser === null ? null : (
          <motion.div animate={{ opacity: 1 }} className="admin-modal-backdrop" exit={{ opacity: 0 }} initial={reducedMotion ? false : { opacity: 0 }}>
            <motion.section animate={{ opacity: 1, scale: 1, y: 0 }} aria-labelledby="certification-modal-title" aria-modal="true" className="admin-modal surface" exit={{ opacity: 0, scale: 0.96, y: 12 }} initial={reducedMotion ? false : { opacity: 0, scale: 0.96, y: 12 }} role="dialog">
              <button aria-label="Cerrar" className="icon-button admin-modal__close" onClick={closeManager} type="button"><X size={17} /></button>
              <span className="admin-modal__icon"><Award size={24} /></span>
              <p className="eyebrow">USUARIO</p>
              <h2 id="certification-modal-title">{selectedUser.displayName}</h2>
              <p>Certificaciones actuales</p>
              <form action={setCertificationTotalAction.bind(null, selectedUser.userId)}>
                <div className="certification-stepper">
                  <button aria-label="Restar certificación" disabled={total === 0} onClick={() => setTotal((currentTotal) => Math.max(0, currentTotal - 1))} type="button"><Minus /></button>
                  <output aria-live="polite">{total.toString().padStart(2, "0")}</output>
                  <button aria-label="Añadir certificación" disabled={total === 100} onClick={() => setTotal((currentTotal) => Math.min(100, currentTotal + 1))} type="button"><Plus /></button>
                </div>
                <input name="total" type="hidden" value={total} />
                <div className="admin-modal__actions"><button className="button button--secondary" onClick={closeManager} type="button">Cancelar</button><button className="button button--primary" type="submit">Guardar</button></div>
              </form>
              <small>Las certificaciones emitidas por eventos se conservan; el ajuste administra reconocimientos manuales.</small>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
