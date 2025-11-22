'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * PageTabs - Navigation par onglets pour les pages
 */
export default function PageTabs({ tabs }) {
  const pathname = usePathname();

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`
                group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium
                ${
                  isActive
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              {Icon && (
                <Icon
                  className={`
                    -ml-0.5 mr-2 h-5 w-5
                    ${
                      isActive
                        ? 'text-primary-500 dark:text-primary-400'
                        : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                    }
                  `}
                  aria-hidden="true"
                />
              )}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`
                    ml-3 rounded-full py-0.5 px-2.5 text-xs font-medium
                    ${
                      isActive
                        ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300'
                        : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-300'
                    }
                  `}
                >
                  {tab.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
