'use client';

import type { ReactNode } from 'react';
import { cn } from '@/app/_common/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  className?: string;
}

interface PageButtonProps {
  page: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  children: ReactNode;
  disabled?: boolean;
}

function PageButton({ page, currentPage, onPageChange, children, disabled = false }: PageButtonProps) {
  return (
    <button
      onClick={() => !disabled && onPageChange(page)}
      disabled={disabled}
      className={cn(
        'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        page === currentPage
          ? 'bg-primary-600 text-white'
          : 'text-gray-700 hover:bg-gray-100',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      aria-label={typeof children === 'number' ? `Page ${children}` : undefined}
      aria-current={page === currentPage ? 'page' : undefined}
    >
      {children}
    </button>
  );
}

export function Pagination({ 
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  className 
}: PaginationProps) {
  const pages: number[] = [];
  const maxVisible = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  const endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  
  return (
    <nav className={cn('flex items-center gap-1', className)} aria-label="Pagination">
      {showFirstLast && (
        <PageButton page={1} currentPage={currentPage} onPageChange={onPageChange} disabled={currentPage === 1}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
          <span className="sr-only">Première page</span>
        </PageButton>
      )}
      
      <PageButton page={currentPage - 1} currentPage={currentPage} onPageChange={onPageChange} disabled={currentPage === 1}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="sr-only">Page précédente</span>
      </PageButton>
      
      {startPage > 1 && (
        <>
          <PageButton page={1} currentPage={currentPage} onPageChange={onPageChange}>1</PageButton>
          {startPage > 2 && (
            <span className="px-2 text-gray-500" aria-hidden="true">...</span>
          )}
        </>
      )}
      
      {pages.map(page => (
        <PageButton key={page} page={page} currentPage={currentPage} onPageChange={onPageChange}>
          {page}
        </PageButton>
      ))}
      
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && (
            <span className="px-2 text-gray-500" aria-hidden="true">...</span>
          )}
          <PageButton page={totalPages} currentPage={currentPage} onPageChange={onPageChange}>{totalPages}</PageButton>
        </>
      )}
      
      <PageButton page={currentPage + 1} currentPage={currentPage} onPageChange={onPageChange} disabled={currentPage === totalPages}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="sr-only">Page suivante</span>
      </PageButton>
      
      {showFirstLast && (
        <PageButton page={totalPages} currentPage={currentPage} onPageChange={onPageChange} disabled={currentPage === totalPages}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
          <span className="sr-only">Dernière page</span>
        </PageButton>
      )}
    </nav>
  );
}

export default Pagination;
