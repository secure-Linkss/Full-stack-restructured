import React from 'react';
import { Search, RefreshCw, Download } from 'lucide-react';
import { Input } from './input'; // Assuming input component
import { Button } from './button'; // Assuming button component
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'; // Assuming select component

const FilterBar = ({
  searchPlaceholder = 'Search...',
  onSearch,
  onRefresh,
  onExport,
  filterOptions = [], // e.g., [{ value: 'all', label: 'All' }, ...]
  onFilterChange,
  dateRangeOptions = ['7d', '30d', '90d', 'All'],
  onDateRangeChange,
  selectedDateRange = '7d',
  extraButtons, // Array of extra button components
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg bg-card shadow-sm border border-border">
      {/* Filter Select */}
      {filterOptions.length > 0 && (
        <Select onValueChange={onFilterChange} defaultValue={filterOptions[0].value}>
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder="Select Filter" />
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

      {/* Search Input */}
      <div className="relative flex-grow min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={searchPlaceholder}
          className="pl-10 bg-background"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      {/* Date Range Buttons */}
      <div className="flex space-x-1">
        {dateRangeOptions.map(range => (
          <Button
            key={range}
            variant={selectedDateRange === range ? 'default' : 'outline'}
            size="sm"
            onClick={() => onDateRangeChange(range)}
          >
            {range}
          </Button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3 ml-auto">
        {extraButtons}
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button variant="secondary" size="sm" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
    </div>
  );
};

export default FilterBar;
