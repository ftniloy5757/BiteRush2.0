// app/admin/create-admin/page.tsx
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import CreateAdminForm from "./CreateAdminForm";

export default async function CreateAdminPage() {
  // Check if user is authenticated and is admin on the server

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Admin Management</h1>
      <CreateAdminForm />
    </div>
  );
}
