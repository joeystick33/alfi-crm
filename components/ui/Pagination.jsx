'use client';

import { cn } from '@/lib/utils';

const Pagination = ({ 
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  className 
}) => {
  const pages = [];
  const maxVisible = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  
  const PageButton = ({ page, children, disabled = false }) => (
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
    >
      {children}
    </button>
  );
  
  return (
    <nav className={cn('flex items-center gap-1', className)}>
      {showFirstLast && (
        <PageButton page={1} disabled={currentPage === 1}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </PageButton>
      )}
      
      <PageButton page={currentPage - 1} disabled={currentPage === 1}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </PageButton>
      
      {startPage > 1 && (
        <>
          <PageButton page={1}>1</PageButton>
          {startPage > 2 && (
            <span className="px-2 text-gray-500">...</span>
          )}
        </>
      )}
      
      {pages.map(page => (
        <PageButton key={page} page={page}>
          {page}
        </PageButton>
      ))}
      
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && (
            <span className="px-2 text-gray-500">...</span>
          )}
          <PageButton page={totalPages}>{totalPages}</PageButton>
        </>
      )}
      
      <PageButton page={currentPage + 1} disabled={currentPage === totalPages}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </PageButton>
      
      {showFirstLast && (
        <PageButton page={totalPages} disabled={currentPage === totalPages}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </PageButton>
      )}
    </nav>
  );
};

export default Pagination;
