import React from 'react';
import { Button } from './button'; // Assuming button component
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'; // Assuming tooltip component

const ActionIconGroup = ({ actions }) => {
  return (
    <TooltipProvider>
      <div className="flex space-x-1">
        {actions.map((action, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-muted"
                onClick={action.onClick}
                disabled={action.disabled}
              >
                <action.icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{action.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};

export default ActionIconGroup;
