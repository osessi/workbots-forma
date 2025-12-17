import prisma from "@/lib/db/prisma";
import Link from "next/link";

// Stats Card Component
function StatsCard({
  title,
  value,
  change,
  changeType,
  icon,
  href,
}: {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  href?: string;
}) {
  const content = (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 hover:border-gray-300 dark:hover:border-gray-700 transition-all shadow-sm">
      <div className="flex items-center justify-between">
        <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800">
          {icon}
        </div>
        {change && (
          <span
            className={`text-sm font-medium px-2 py-1 rounded-lg ${
              changeType === "up"
                ? "text-green-600 dark:text-green-400 bg-green-500/10"
                : changeType === "down"
                ? "text-red-600 dark:text-red-400 bg-red-500/10"
                : "text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800"
            }`}
          >
            {change}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{title}</p>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

// Recent Activity Item
function ActivityItem({
  title,
  description,
  time,
  type,
}: {
  title: string;
  description: string;
  time: string;
  type: "organization" | "user" | "formation" | "system";
}) {
  const colors = {
    organization: "bg-blue-500",
    user: "bg-green-500",
    formation: "bg-purple-500",
    system: "bg-orange-500",
  };

  return (
    <div className="flex items-start gap-4 py-4 border-b border-gray-200 dark:border-gray-800 last:border-0">
      <div className={`w-2 h-2 mt-2 rounded-full ${colors[type]}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{title}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{time}</span>
    </div>
  );
}

export default async function AdminDashboard() {
  // Récupérer les statistiques
  const [
    organizationsCount,
    usersCount,
    formationsCount,
    recentOrganizations,
    recentUsers,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.formation.count(),
    prisma.organization.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, firstName: true, lastName: true, createdAt: true },
    }),
  ]);

  // Stats pour le graphique (mock pour l'instant)
  const monthlyStats = [
    { month: "Jan", formations: 12 },
    { month: "Fev", formations: 19 },
    { month: "Mar", formations: 15 },
    { month: "Avr", formations: 25 },
    { month: "Mai", formations: 32 },
    { month: "Juin", formations: 28 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Admin</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Vue d&apos;ensemble de la plateforme Automate Forma
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Organisations"
          value={organizationsCount}
          change="+12%"
          changeType="up"
          href="/admin/organizations"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 21V5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V21M4 21H20M4 21H2M20 21H22M8 7H10M8 11H10M14 7H16M14 11H16M10 21V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V21" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        />
        <StatsCard
          title="Utilisateurs"
          value={usersCount}
          change="+8%"
          changeType="up"
          href="/admin/users"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H6C4.93913 15 3.92172 15.4214 3.17157 16.1716C2.42143 16.9217 2 17.9391 2 19V21M22 21V19C22 18.1362 21.7044 17.2989 21.1614 16.6287C20.6184 15.9585 19.8607 15.4957 19 15.32M16 3.32C16.8604 3.49549 17.6184 3.9585 18.1614 4.62872C18.7044 5.29894 19 6.13623 19 7C19 7.86377 18.7044 8.70106 18.1614 9.37128C17.6184 10.0415 16.8604 10.5045 16 10.68M12.5 7C12.5 9.20914 10.7091 11 8.5 11C6.29086 11 4.5 9.20914 4.5 7C4.5 4.79086 6.29086 3 8.5 3C10.7091 3 12.5 4.79086 12.5 7Z" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        />
        <StatsCard
          title="Formations"
          value={formationsCount}
          change="+24%"
          changeType="up"
          href="/admin/organizations"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 14L21 9L12 4L3 9L12 14Z" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 9V15" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 11.5V16.5C6 16.5 8 19 12 19C16 19 18 16.5 18 16.5V11.5" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        />
        <StatsCard
          title="Revenus (MRR)"
          value="0 EUR"
          changeType="neutral"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        />
      </div>

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Formations cr&eacute;&eacute;es
          </h2>
          <div className="h-64 flex items-end justify-between gap-4">
            {monthlyStats.map((stat) => (
              <div key={stat.month} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-t from-orange-500/50 to-orange-500 rounded-t-lg transition-all hover:from-orange-400/50 hover:to-orange-400"
                  style={{ height: `${(stat.formations / 35) * 100}%` }}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">{stat.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Activit&eacute; r&eacute;cente
          </h2>
          <div className="space-y-0">
            {recentOrganizations.slice(0, 3).map((org) => (
              <ActivityItem
                key={org.id}
                title={org.name}
                description="Nouvelle organisation"
                time={new Date(org.createdAt).toLocaleDateString("fr-FR")}
                type="organization"
              />
            ))}
            {recentUsers.slice(0, 2).map((user) => (
              <ActivityItem
                key={user.id}
                title={`${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email}
                description="Nouvel utilisateur"
                time={new Date(user.createdAt).toLocaleDateString("fr-FR")}
                type="user"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Recent Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Organizations */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Organisations r&eacute;centes
            </h2>
            <Link
              href="/admin/organizations"
              className="text-sm text-orange-500 hover:text-orange-400"
            >
              Voir tout
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                  <th className="pb-3 font-medium">Nom</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {recentOrganizations.map((org) => (
                  <tr key={org.id} className="text-sm">
                    <td className="py-3 text-gray-900 dark:text-white">{org.name}</td>
                    <td className="py-3 text-gray-500 dark:text-gray-400">
                      {new Date(org.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
                {recentOrganizations.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-8 text-center text-gray-500">
                      Aucune organisation
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Users */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Utilisateurs r&eacute;cents
            </h2>
            <Link
              href="/admin/users"
              className="text-sm text-orange-500 hover:text-orange-400"
            >
              Voir tout
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                  <th className="pb-3 font-medium">Utilisateur</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {recentUsers.map((user) => (
                  <tr key={user.id} className="text-sm">
                    <td className="py-3">
                      <div>
                        <p className="text-gray-900 dark:text-white">
                          {`${user.firstName || ""} ${user.lastName || ""}`.trim() || "Sans nom"}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-3 text-gray-500 dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
                {recentUsers.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-8 text-center text-gray-500">
                      Aucun utilisateur
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
