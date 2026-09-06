// app/admin/page.tsx
import Link from "next/link";
import { Users, Utensils, ShoppingBag, UserPlus, ShieldCheck, ArrowRight } from "lucide-react";

interface DashboardCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
}

const DashboardCard = ({
  href,
  icon,
  title,
  description,
  badge,
}: DashboardCardProps) => {
  return (
    <Link href={href} className="group">
      <div className="h-full p-6 bg-white dark:bg-gray-900 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-800 group-hover:border-orange-500/50 group-hover:shadow-xl transition-all flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950 text-orange-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              {icon}
            </div>
            {badge && (
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
                {badge}
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
            {title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 group-hover:translate-x-1 transition-transform">
          Open Panel <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </Link>
  );
};

export default function AdminDashboard() {
  const dashboardItems = [
    {
      href: "/admin/users",
      icon: <Users className="h-6 w-6" />,
      title: "Users Management",
      description: "Inspect customer, restaurant, rider, and admin profiles with RSA-decrypted PII and role management.",
      badge: "Core",
    },
    {
      href: "/admin/products",
      icon: <Utensils className="h-6 w-6" />,
      title: "Products Management",
      description: "Manage the complete 13-dish menu catalogue, adjust pricing, manage stock, and toggle feed features.",
      badge: "Menu",
    },
    {
      href: "/admin/orders",
      icon: <ShoppingBag className="h-6 w-6" />,
      title: "Orders Management",
      description: "Track live customer orders, update delivery progress, mark payments collected, and inspect items.",
      badge: "Operations",
    },
    {
      href: "/admin/create-admin",
      icon: <UserPlus className="h-6 w-6" />,
      title: "Provision Admin",
      description: "Create new administrative accounts with automated RSA profile encryption and bcrypt credential hashing.",
      badge: "Access",
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-3xl p-8 sm:p-10 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold">
            <ShieldCheck className="h-4 w-4" /> System Administration Portal
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Admin Operations Center
          </h1>
          <p className="text-orange-100 text-xs sm:text-sm leading-relaxed">
            Manage users, menu items, live customer orders, and access control across BiteRush 2.0.
          </p>
        </div>
      </div>

      {/* Grid of Control Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardItems.map((item) => (
          <DashboardCard
            key={item.href}
            href={item.href}
            icon={item.icon}
            title={item.title}
            description={item.description}
            badge={item.badge}
          />
        ))}
      </div>
    </div>
  );
}