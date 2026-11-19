import { KubernetesSidebar } from "@/components/kubernetes-sidebar";

export default function KubernetesLayout({ children }: LayoutProps<"/kubernetes">) {
  return (
    <div className="mx-auto flex w-full max-w-6xl gap-10 px-4 py-10 sm:px-6">
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-20">
          <KubernetesSidebar />
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
