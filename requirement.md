# Pharmacy POS System - Requirements & Plan

## 1. Project Overview
A complete Point of Sale (POS) and Inventory Management system tailored for a local pharmacy. The system features two roles (Admin, Cashier) and is designed to be highly intuitive, extremely fast for cashiers, and features a premium, modern, and beautiful user interface.

## 2. User Roles & Permissions
- **Admin**: Full access to all modules, including reports, user management, and settings.
- **Cashier**: Restricted access primarily to the POS system, customer returns, and basic inventory viewing.

## 3. Core Modules & Features

### 3.1. Authentication & User Management (New)
- Secure login for Admin and Cashier.
- Admin dashboard to add/edit/remove cashier accounts.

### 3.2. POS (Point of Sale) - Main Feature
- **Fast Search**: Debounced, instantaneous product search by name or barcode.
- **Keyboard Optimization**: F1 shortcut for POS, arrow keys for navigation, Enter to add to cart, Ctrl+P to print.
- **Cart Management**: Adjust quantities, remove items, auto-calculate totals.
- **Payment Methods**: Cash, Easypaisa, Jazzcash, Bank Transfer.
- **Checkout Flow**: Generates unique invoice, updates stock automatically, prints receipt.

### 3.3. Inventory & Stock Management
- **Medicine Details**: Name, Expiry Date, Purchase Price, Sale Price, Quantity, Batch Number.
- **Stock Tracking**: Auto-deduct on sale, auto-increment on return.
- **Management**: Add, edit, delete, and search inventory items.

### 3.4. Dashboard
- **Key Metrics**: Today's sales, approximate total profit.
- **Alerts**: Low stock warnings, expiring soon medicines.

### 3.5. Customer Return System (Enhanced)
- **Invoice Listing**: Display a list of recent invoices directly on the page.
- **Invoice Details**: Click on an invoice to view purchased items and process returns.
- **Search**: Find specific invoices via search.
- **Return Processing**: Select quantities to return, auto-calculate refund, restock inventory, and print return receipt.

### 3.6. Reports
- Daily/Monthly sales and profit reports.
- Best-selling medicines.
- Low stock and expiry product lists.
- Export to Print/PDF.

### 3.7. Settings / Configuration (New)
- Store details (Name, Address, Logo) for the printed invoice.
- System configurations (Tax rates, currency formats).

## 4. UI/UX Guidelines (Premium & Modern)
- **Color Palette**: Sophisticated medical/pharmacy theme (e.g., deep greens, slate grays, clean white) avoiding overly vibrant, generic colors.
- **Typography**: Modern, highly legible fonts (e.g., Inter, Roboto) with clear hierarchy and proper sizing for readability.
- **Interactions**: Smooth micro-animations, hover states, and clear feedback messages (toasts).
- **Layout**: Spacious, uncluttered designs. The POS screen must be optimized for speed, avoiding cramped fields.
- **Component Quality**: High-quality shadows, rounded corners, and consistent spacing to emulate a professional graphic designer's work.

## 5. Technology Stack
- **Frontend**: React (Vite), Tailwind CSS, React Router.
- **Backend**: (To be planned - Node.js/Express or Python/FastAPI suggested).
- **Database**: (To be planned - PostgreSQL or MongoDB suggested).

## 6. Development Phases
1. **Phase 1**: UI/UX Overhaul & Frontend Completion (Current).
2. **Phase 2**: Backend API Development & Database Setup.
3. **Phase 3**: Integration of Frontend and Backend.
4. **Phase 4**: Testing, Bug Fixing, and Deployment.
