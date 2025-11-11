
import Sidebar from "@/components/Sidebar";
import AdminGuard from "@/components/AdminGuard"; // new client component

export const metadata = {
  title: "Admin Panel - Furniture Web",
  description: "Admin panel for Furniture Web",
};

export default function AdminLayout({ children }) {
  return (
    // AdminGuard handles login/auth logic on the client
    <AdminGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 pl-0 sm:pl-48">{children}</main>
      </div>
    </AdminGuard>
  );
}
