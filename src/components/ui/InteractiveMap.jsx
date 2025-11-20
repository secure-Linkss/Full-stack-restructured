import React from 'react';
import { Card } from './card';

// Simple placeholder for InteractiveMap component
// This can be enhanced with react-leaflet or react-simple-maps later
const InteractiveMap = ({ data = [] }) => {
  return (
    <Card className="p-4">
      <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Interactive Map</p>
          <p className="text-sm text-muted-foreground mt-2">
            {data.length} locations tracked
          </p>
        </div>
      </div>
    </Card>
  );
};

export default InteractiveMap;