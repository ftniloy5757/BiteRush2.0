// app/admin/create-admin/page.tsx
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import CreateAdminForm from "./CreateAdminForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function CreateAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    redirect("/sign-in?callbackUrl=/admin/create-admin");
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl px-4">
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Admin Dashboard
        </Link>
      </div>
      <CreateAdminForm />
    </div>
  );
}
