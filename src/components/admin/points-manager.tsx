"use client";

import { Minus, Plus, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { adjustUserPointsAction } from "@/features/admin/actions";
import type { AdminUserSummary } from "@/features/admin/types";

type PointsManagerProperties = Readonly<{
  users: readonly AdminUserSummary[];
}>;

type SelectedUser = Readonly<{
  displayName: string;
  totalPoints: number;
  userId: string;
}>;

export function PointsManager({ users }: PointsManagerProperties): React.ReactNode {
  const reducedMotion = useReducedMotion() === true;
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);

  return (
    <>
      <div className="admin-user-list">
        {users.map((user) => <article className="surface admin-user-card" key={user.user_id}>
          <div className="admin-user-card__identity"><span><Sparkles size={18} /></span><div><h3>{user.display_name}</h3><p>{user.email}</p></div></div>
          <div className="admin-user-card__stats"><span>Puntos actuales<strong>{user.total_points}</strong></span><span>Asistencias<strong>{user.attendance_count}</strong></span><span>Eventos<strong>{user.registration_count}</strong></span><span>Certificaciones<strong>{user.total_certifications}</strong></span></div>
          <button className="button button--secondary" onClick={() => setSelectedUser({ displayName: user.display_name, totalPoints: user.total_points, userId: user.user_id })} type="button">Gestionar puntos</button>
        </article>)}
      </div>
      <AnimatePresence>
        {selectedUser === null ? null : <motion.div animate={{ opacity: 1 }} className="admin-modal-backdrop" exit={{ opacity: 0 }} initial={reducedMotion ? false : { opacity: 0 }}>
          <motion.section animate={{ opacity: 1, scale: 1, y: 0 }} aria-labelledby="points-modal-title" aria-modal="true" className="admin-modal surface" exit={{ opacity: 0, scale: 0.96, y: 12 }} initial={reducedMotion ? false : { opacity: 0, scale: 0.96, y: 12 }} role="dialog">
            <button aria-label="Cerrar" className="icon-button admin-modal__close" onClick={() => setSelectedUser(null)} type="button"><X size={17} /></button>
            <span className="admin-modal__icon"><Sparkles size={24} /></span>
            <p className="eyebrow">USUARIO</p>
            <h2 id="points-modal-title">{selectedUser.displayName}</h2>
            <p>Puntos actuales: <strong>{selectedUser.totalPoints}</strong></p>
            <form action={adjustUserPointsAction.bind(null, selectedUser.userId)} className="admin-form points-adjustment-form">
              <label>Ajuste de puntos<input max="1000" min="-1000" name="points" placeholder="Ej. 25 o -10" required type="number" /></label>
              <small><Plus size={12} /> Usa un valor positivo para sumar. <Minus size={12} /> Usa uno negativo para restar.</small>
              <label>Motivo<textarea maxLength={240} minLength={5} name="reason" placeholder="Describe por qué se realiza este ajuste" required rows={3} /></label>
              <div className="admin-modal__actions"><button className="button button--secondary" onClick={() => setSelectedUser(null)} type="button">Cancelar</button><button className="button button--primary" type="submit">Guardar ajuste</button></div>
            </form>
            <small>Cada ajuste queda registrado en el historial y en la auditoría administrativa.</small>
          </motion.section>
        </motion.div>}
      </AnimatePresence>
    </>
  );
}
