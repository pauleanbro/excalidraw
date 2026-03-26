import { redirect } from "next/navigation";

import { auth } from "@/auth";
import Sidebar from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar
        user={{
          name: session.user.name,
          image: session.user.image,
          email: session.user.email,
        }}
      />
      <main className="min-h-screen lg:ml-[272px]">{children}</main>
    </div>
  );
}
