"use client";
import React from "react";
import Link from "next/link";
import { useAutomate } from "@/context/AutomateContext";

export const RecentFormationsTable: React.FC = () => {
  const { formations } = useAutomate();

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] card-hover-glow overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Dernières formations créées
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Nom de la formation
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Dernière modification
              </th>
              <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {formations.map((formation) => (
              <tr
                key={formation.id}
                className="hover:bg-brand-50/30 dark:hover:bg-brand-500/5 transition-colors"
              >
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formation.titre}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
                    {formation.dateCreation}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/create?id=${formation.id}`}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 active:scale-[0.98] transition-all dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
                  >
                    Éditer
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentFormationsTable;
