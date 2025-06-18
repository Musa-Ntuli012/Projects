# Stock Management System

A web-based stock management system with different user roles:
- Front Packer
- Back Packer
- Manager

## Features
- User authentication with role-based access
- Stock inventory management
- Stock movement tracking
- Reports generation
- User management (Manager only)

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## User Roles

### Front Packer
- View stock levels
- Record stock movements
- Generate packing lists

### Back Packer
- View stock levels
- Record stock movements
- Generate packing lists
- Access back warehouse inventory

### Manager
- All Front and Back Packer permissions
- User management
- Generate reports
- Stock level adjustments
- System configuration 