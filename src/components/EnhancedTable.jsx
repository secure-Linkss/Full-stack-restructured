import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

/**
 * Enhanced table component for admin panels
 * Supports sorting, filtering, and actions
 */
export const EnhancedTable = ({
  columns,
  data,
  onRowClick,
  loading = false,
  emptyMessage = 'No data available'
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-slate-400">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="rounded-md border border-slate-700 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-800 border-slate-700 hover:bg-slate-800">
            {columns.map((column, index) => (
              <TableHead
                key={index}
                className="text-slate-300 font-semibold"
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow
              key={rowIndex}
              onClick={() => onRowClick && onRowClick(row)}
              className={`border-slate-700 ${
                onRowClick ? 'cursor-pointer hover:bg-slate-800' : ''
              }`}
            >
              {columns.map((column, colIndex) => (
                <TableCell key={colIndex} className="text-slate-300">
                  {column.render
                    ? column.render(row[column.accessor], row)
                    : row[column.accessor]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

/**
 * Status Badge Component
 */
export const StatusBadge = ({ status }) => {
  const statusColors = {
    active: 'bg-green-900/20 text-green-400 border-green-700',
    inactive: 'bg-slate-700 text-slate-400 border-slate-600',
    pending: 'bg-yellow-900/20 text-yellow-400 border-yellow-700',
    suspended: 'bg-red-900/20 text-red-400 border-red-700',
    verified: 'bg-blue-900/20 text-blue-400 border-blue-700',
    resolved: 'bg-green-900/20 text-green-400 border-green-700',
  }

  const colorClass = statusColors[status?.toLowerCase()] || statusColors.inactive

  return (
    <Badge variant="outline" className={`${colorClass} text-xs`}>
      {status}
    </Badge>
  )
}

/**
 * Role Badge Component
 */
export const RoleBadge = ({ role }) => {
  const roleColors = {
    main_admin: 'bg-purple-900/20 text-purple-400 border-purple-700',
    admin: 'bg-blue-900/20 text-blue-400 border-blue-700',
    sub_admin: 'bg-cyan-900/20 text-cyan-400 border-cyan-700',
    user: 'bg-slate-700 text-slate-400 border-slate-600',
  }

  const colorClass = roleColors[role?.toLowerCase()] || roleColors.user

  return (
    <Badge variant="outline" className={`${colorClass} text-xs`}>
      {role?.replace('_', ' ').toUpperCase()}
    </Badge>
  )
}

export default EnhancedTable

export default EnhancedTable
