'use client';

import { cn } from '@/lib/utils';

const Table = ({ children, className }) => (
  <div className="w-full overflow-x-auto scrollbar-thin">
    <table className={cn('w-full border-collapse', className)}>
      {children}
    </table>
  </div>
);

const TableHeader = ({ children, className }) => (
  <thead className={cn('bg-gray-50 border-b border-gray-200', className)}>
    {children}
  </thead>
);

const TableBody = ({ children, className }) => (
  <tbody className={cn('divide-y divide-gray-200', className)}>
    {children}
  </tbody>
);

const TableRow = ({ children, onClick, className }) => (
  <tr 
    onClick={onClick}
    className={cn(
      'transition-colors',
      onClick && 'cursor-pointer hover:bg-gray-50',
      className
    )}
  >
    {children}
  </tr>
);

const TableHead = ({ children, className }) => (
  <th 
    className={cn(
      'px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider',
      className
    )}
  >
    {children}
  </th>
);

const TableCell = ({ children, className }) => (
  <td className={cn('px-6 py-4 text-sm text-gray-900', className)}>
    {children}
  </td>
);

const TableEmpty = ({ children, colSpan, className }) => (
  <tr>
    <td 
      colSpan={colSpan}
      className={cn('px-6 py-12 text-center text-gray-500', className)}
    >
      {children || 'Aucune donnée disponible'}
    </td>
  </tr>
);

Table.Header = TableHeader;
Table.Body = TableBody;
Table.Row = TableRow;
Table.Head = TableHead;
Table.Cell = TableCell;
Table.Empty = TableEmpty;

export default Table;
