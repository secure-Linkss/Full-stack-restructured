# Design System and Component Plan

## 1. Brand Consistency and Color Palette

Based on the provided images, the design will follow a **dark theme** with a focus on a sleek, professional, and data-driven aesthetic.

- **Primary Color (Accent):** A vibrant, deep blue/purple (e.g., `#6366F1` - Indigo 500 or similar) to be used for buttons, active states, charts, and the logo accent.
- **Background Color (Dark):** A very dark, near-black color (e.g., `#0F172A` - Slate 900 or similar) for the main background.
- **Card/Panel Color (Slightly Lighter):** A dark slate color (e.g., `#1E293B` - Slate 800 or similar) for containers, cards, and panels to provide depth.
- **Text Color (Primary):** White or very light gray (e.g., `#F8FAFC` - Slate 50) for high contrast.
- **Text Color (Secondary):** Light gray (e.g., `#94A3B8` - Slate 400) for labels, descriptions, and secondary information.
- **Logo:** Ensure the "Brain Link Tracker" logo with the brain and link icon is consistently used across the sidebar and header.

## 2. Typography

- **Font:** A clean, modern sans-serif font (e.g., Inter, which is common in modern web apps).
- **Hierarchy:** Clear hierarchy for titles, subtitles, and body text. Use bold and varying sizes for KPIs and data points.

## 3. New/Enhanced UI Components

The existing components will be refactored and new ones will be created using the established design system (likely based on Radix UI and Tailwind CSS) to meet the advanced requirements.

| Component Category | Component Name | Purpose |
| :--- | :--- | :--- |
| **Layout** | `Sidebar` | Redesigned dark sidebar with logo, navigation links, and active state indicators (e.g., badge counts). |
| | `Header` | Sleek top bar with user profile dropdown (including avatar), notifications, and breadcrumbs. |
| | `Layout` | Main wrapper component to handle responsiveness (mobile sidebar, tablet optimization). |
| **Data Display** | `MetricCard` | Sleek cards for displaying KPIs (Total Clicks, Real Visitors, etc.) with icons and small trend indicators. |
| | `DataTable` | Advanced, feature-rich table component for User Management, Tracking Links, etc., with sorting, pagination, and filtering. |
| | `ChartContainer` | Wrapper for data visualizations (Recharts) with a consistent dark theme style. |
| **Forms & Input** | `InputWithIcon` | Enhanced input fields for search and forms. |
| | `SelectDomain` | Custom select component for domain preferences. |
| | `FormModal` | Reusable modal for forms like "Create New Link" (as seen in `IMG_5375.jpeg`). |
| | `FilterBar` | Component for date range selection (7d, 30d, 90d) and general filtering/search. |
| **Actions** | `ActionButton` | Primary, secondary, and destructive button styles. |
| | `ActionIconGroup` | Group of small icon buttons for actions like Regenerate, Copy, Test Link, Edit, Delete (e.g., on Tracking Links table rows). |
| | `ToggleSwitch` | Custom switch for settings like 2FA, Enable Stripe, etc. |
| **Feedback** | `LoadingState` | Full-page and component-level loading indicators. |
| | `EmptyState` | Informative and visually appealing components for empty data sets. |
| | `ToastNotification` | Consistent use of `sonner` for success/error/info messages. |
| **Specific** | `AvatarUpload` | Component for handling profile picture upload, preview, and storage. |
| | `ActivityLogItem` | Component for displaying log entries (Audit Logs, Live Activity). |

## 4. Implementation Strategy

1.  **Refactor/Update Tailwind Config:** Ensure the color palette and typography are correctly configured in `tailwind.config.cjs`.
2.  **Create Mock API Service:** Develop a service (`src/services/mockApi.js`) to return structured data for all required endpoints, ensuring the frontend components are built against a consistent API contract.
3.  **Component Development:** Build the new components in `src/components/ui/` and `src/components/` based on the plan.
4.  **Page Implementation:** Integrate the new components into the main application pages (Dashboard, Tracking Links, AdminPanel, etc.).
