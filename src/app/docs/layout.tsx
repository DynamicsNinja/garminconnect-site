import "./shiki.css";
import styles from "./docs.module.css";
import { DocsNav } from "@/components/DocsNav";

export default function DocsLayout({ children }: LayoutProps<"/docs">) {
  return (
    <div className={`container ${styles.shell}`}>
      <DocsNav />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
