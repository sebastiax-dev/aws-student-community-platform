import { Cloud, Database, Workflow } from "lucide-react";

export function CloudScene(): React.ReactNode {
  return (
    <div aria-label="Ilustración abstracta de servicios cloud" className="cloud-scene grid-pattern" role="img">
      <div className="cloud-scene__cloud" />
      <span className="cloud-scene__word">aws</span>
      <span className="cloud-scene__node cloud-scene__node--one"><Database /></span>
      <span className="cloud-scene__node cloud-scene__node--two"><Workflow /></span>
      <span className="cloud-scene__node cloud-scene__node--three"><Cloud /></span>
    </div>
  );
}
