import React from 'react';
import { Search, RefreshCw, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

const FilterBar = ({
  searchPlaceholder = 'Search...',
  onSearch,
  onRefresh,
  onExport,
  filterOptions = [],
  onFilterChange,
  dateRangeOptions = [],
  onDateRangeChange,
  selectedDateRange = '7d',
  extraButtons,
}) => {
  return (
    <div
      className="flex flex-col gap-3 p-3.5 rounded-xl"
      style={{
        background: 'rgba(8,15,35,0.72)',
        backdropFilter: 'blur(20px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        {filterOptions.length > 0 && (
          <Select onValueChange={onFilterChange} defaultValue={filterOptions[0]?.value}>
            <SelectTrigger className="w-[140px] sm:w-[170px] h-9 text-sm border-0" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="enterprise-input pl-9 h-9 text-sm w-full"
            onChange={e => onSearch?.(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 ml-auto flex-wrap">
          {extraButtons}
          {onRefresh && (
            <button onClick={onRefresh} className="btn-secondary text-xs h-9 px-3 flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
          {onExport && (
            <button onClick={onExport} className="btn-secondary text-xs h-9 px-3 flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}
        </div>
      </div>

      {dateRangeOptions.length > 0 && (
        <div className="flex items-center gap-0.5 p-1 rounded-lg self-start" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {dateRangeOptions.map(range => (
            <button
              key={range}
              onClick={() => onDateRangeChange?.(range)}
              className="px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200"
              style={selectedDateRange === range
                ? { background: 'rgba(59,130,246,0.2)', color: '#60a5fa', boxShadow: '0 0 12px rgba(59,130,246,0.15)' }
                : { color: 'rgba(255,255,255,0.35)' }
              }
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
