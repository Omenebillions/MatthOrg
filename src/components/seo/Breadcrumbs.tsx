import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-[13px] sm:text-sm text-gray-600 overflow-x-auto py-2 ${className}`}>
      <ol className="flex items-center space-x-1.5 whitespace-nowrap">
        <li className="inline-flex items-center">
          <button
            onClick={() => {
              if (items[0]?.onClick) {
                items[0].onClick();
              } else if (items[0]?.href) {
                window.location.href = items[0].href;
              }
            }}
            className="inline-flex items-center gap-1.5 text-gray-600 hover:text-[#3D74D9] font-medium transition-colors whitespace-nowrap"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>
        </li>

        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="inline-flex items-center">
              <ChevronRight className="w-4 h-4 text-gray-400 mx-1 flex-shrink-0" />
              {isLast || (!item.href && !item.onClick) ? (
                <span className="font-semibold text-gray-900 truncate max-w-[200px] md:max-w-none" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <button
                  onClick={item.onClick}
                  className="font-medium text-gray-600 hover:text-[#3D74D9] transition-colors truncate max-w-[160px] md:max-w-none"
                >
                  {item.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
