import React from 'react';
import Notifications from './Notifications'; // Reusing the Notifications component

const SupportTickets = () => {
  // The Notifications component already handles the Support Tickets tab internally.
  // We can render it and set the default tab to 'tickets' if needed, but for simplicity
  // and to avoid prop drilling, we'll rely on the user navigating to the correct tab
  // within the Notifications component, or we can simply render the Notifications component
  // which contains the full functionality.

  // Since the user requested a dedicated route for the Support tab in the dropdown,
  // we'll create a simple wrapper that renders the main component.
  // NOTE: The App.jsx routing needs to be updated to handle a /tickets route.
  
  return (
    <Notifications defaultTab="tickets" />
  );
};

export default SupportTickets;
