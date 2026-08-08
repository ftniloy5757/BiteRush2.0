// app/admin/page.tsx
import Link from "next/link";
import { User, Package } from "lucide-react";

interface DashboardCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const DashboardCard = ({
  href,
  icon,
  title,
  description,
}: DashboardCardProps) => {
  return (
    <Link href={href}>
      <div className="p-6 bg-card hover:bg-muted rounded-lg shadow-sm transition-all border border-border hover:border-primary">
        <div className="flex items-center mb-4">
          <div className="mr-4 p-3 bg-primary/10 text-primary rounded-full">
            {icon}
          </div>
          <h3 className="text-xl font-medium">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
};

export default function AdminDashboard() {
  const dashboardItems = [
    {
      href: "/admin/users",
      icon: <User size={24} />,
      title: "Users Management",
      description: "View and manage user accounts, roles, and permissions",
    },
    {
      href: "/admin/products",
      icon: <Package size={24} />,
      title: "Products Management",
      description: "Add, edit, and organize your product catalog",
    },
    {
      href: "/admin/orders",
      icon: <Package size={24} />,
      title: "Orders Management",
      description: "View and manage customer orders and transactions",
    },
   
    // You can add more items here later
  ];

  return (
    <div className="space-y-6 mt-5">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to your administration dashboard. Select a section to manage.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardItems.map((item) => (
          <DashboardCard
            key={item.href}
            href={item.href}
            icon={item.icon}
            title={item.title}
            description={item.description}
          />
        ))}
      </div>
    </div>
  );
}