import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
import { Button } from './button';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';

const DataTable = ({
  columns,
  data,
  title,
  description,
  pageSize = 10,
  actions,
  expandedRowId,
  expandedRowContent,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  const sortedData = useMemo(() => {
    let sortableItems = [...(Array.isArray(data) ? data : [])];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending'
      ? <ChevronUp className="ml-1 h-3.5 w-3.5 inline-block" />
      : <ChevronDown className="ml-1 h-3.5 w-3.5 inline-block" />;
  };

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const colSpanTotal = columns.length + (actions ? 1 : 0);

  return (
    <div className="w-full">
      {(title || description) && (
        <div className="p-4 sm:p-6">
          {title && <h3 className="text-lg font-semibold tracking-tight">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      )}
      {/* Horizontal scroll wrapper for mobile */}
      <div className="w-full overflow-x-auto -webkit-overflow-scrolling-touch">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow className="border-b border-border">
              {columns.map((column) => (
                <TableHead
                  key={column.accessor}
                  className="h-10 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                >
                  {column.sortable ? (
                    <button
                      className="flex items-center hover:text-foreground transition-colors cursor-pointer bg-transparent border-0 p-0 font-semibold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
                      onClick={() => requestSort(column.accessor)}
                    >
                      {column.header}
                      {getSortIcon(column.accessor)}
                    </button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
              {actions && (
                <TableHead className="h-10 px-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, index) => (
                <React.Fragment key={row.id ?? index}>
                  <TableRow className="border-b border-border transition-colors hover:bg-white/[0.025]">
                    {columns.map((column) => (
                      <TableCell key={column.accessor} className="p-3 align-middle">
                        {column.cell ? column.cell(row) : row[column.accessor]}
                      </TableCell>
                    ))}
                    {actions && (
                      <TableCell className="p-3 align-middle text-right">
                        {actions(row)}
                      </TableCell>
                    )}
                  </TableRow>
                  {expandedRowContent && expandedRowId != null && expandedRowId === (row.id ?? index) && (
                    <TableRow className="border-b-0 bg-transparent hover:bg-transparent">
                      <TableCell colSpan={colSpanTotal} className="p-0">
                        {expandedRowContent(row)}
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={colSpanTotal} className="h-24 text-center text-sm text-muted-foreground">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <span className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages} ({sortedData.length} total)
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
