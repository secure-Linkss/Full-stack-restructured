import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { ArrowUp, ArrowDown, TrendingUp, Minus } from 'lucide-react';

const MetricCard = ({ title, value, icon: Icon, change, unit = '', description, className = '' }) => {
  const changeValue = parseFloat(change);
  const isPositive = changeValue > 0;
  const isNegative = changeValue < 0;

  const ChangeIcon = isPositive ? ArrowUp : isNegative ? ArrowDown : Minus;
  const changeColor = isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-muted-foreground';

  return (
    <Card className={`hover:shadow-lg transition-shadow ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-5 w-5 text-primary" />}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">
          {value}
          {unit && <span className="text-base font-normal text-muted-foreground ml-1">{unit}</span>}
        </div>
        {change !== undefined && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center">
            <ChangeIcon className={`h-4 w-4 mr-1 ${changeColor}`} />
            <span className={changeColor}>{Math.abs(changeValue)}%</span>
            <span className="ml-1">from last period</span>
          </p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;
