import React from 'react';
import { Search, RefreshCw, Download } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';
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
    <div className="flex flex-col gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-card border border-border shadow-sm">
      {/* Row 1: Search + Filter select */}
      <div className="flex flex-wrap items-center gap-2">
        {filterOptions.length > 0 && (
          <Select onValueChange={onFilterChange} defaultValue={filterOptions[0]?.value}>
            <SelectTrigger className="w-[140px] sm:w-[180px] bg-background text-sm h-9">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            className="pl-9 bg-background h-9 text-sm"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        {/* Action buttons cluster — right side */}
        <div className="flex items-center gap-1.5 ml-auto flex-wrap">
          {extraButtons}
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} className="h-9 text-xs px-2.5">
              <RefreshCw className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          )}
          {onExport && (
            <Button variant="secondary" size="sm" onClick={onExport} className="h-9 text-xs px-2.5">
              <Download className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          )}
        </div>
      </div>

      {/* Row 2: Date range buttons — only render if options provided */}
      {dateRangeOptions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {dateRangeOptions.map(range => (
            <Button
              key={range}
              variant={selectedDateRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => onDateRangeChange(range)}
              className="text-xs px-2 h-7"
            >
              {range}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
