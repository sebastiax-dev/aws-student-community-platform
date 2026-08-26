export type EventStatus = "open" | "past" | "soon";
export type EventTone = "blue" | "teal" | "violet";

export type EventFixture = Readonly<{
  date: string;
  day: string;
  description: string;
  id: string;
  location: string;
  modality: "Presencial" | "Virtual";
  month: string;
  status: EventStatus;
  title: string;
  tone: EventTone;
}>;

export const eventFixtures: readonly EventFixture[] = [
  { id: "01", day: "24", month: "MAY", date: "24 MAY 2025", title: "AWSome Day 2025", description: "Un día completo de aprendizaje, charlas y talleres prácticos sobre servicios de AWS.", modality: "Presencial", location: "Auditorio Principal · PUCE", status: "open", tone: "blue" },
  { id: "02", day: "28", month: "JUN", date: "28 JUN 2025", title: "DevOps en AWS", description: "Automatiza, despliega y escala aplicaciones en la nube con herramientas DevOps.", modality: "Virtual", location: "Google Meet", status: "soon", tone: "violet" },
  { id: "03", day: "19", month: "JUL", date: "19 JUL 2025", title: "Serverless Workshop", description: "Construye aplicaciones escalables sin preocuparte por los servidores.", modality: "Presencial", location: "Laboratorio 3 · PUCE", status: "soon", tone: "blue" },
  { id: "04", day: "16", month: "AGO", date: "16 AGO 2025", title: "IA Generativa con AWS", description: "Explora el potencial de la inteligencia artificial en la nube.", modality: "Virtual", location: "Zoom", status: "soon", tone: "teal" },
  { id: "05", day: "20", month: "SEP", date: "20 SEP 2025", title: "AWS Community Day", description: "Conoce proyectos, casos de éxito y líderes inspiradores.", modality: "Presencial", location: "Campus PUCE", status: "soon", tone: "blue" },
  { id: "06", day: "18", month: "OCT", date: "18 OCT 2024", title: "Hackathon AWS", description: "24 horas creando soluciones en la nube junto a la comunidad.", modality: "Presencial", location: "Campus PUCE", status: "past", tone: "violet" },
];
