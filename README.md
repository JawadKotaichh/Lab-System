# Lab System

A comprehensive laboratory management system for managing patients, visits, lab tests, results, and invoicing. Built with FastAPI backend and React frontend, fully containerized with Docker.

## Features

- **Patient Management**: Create, edit, and search patients with insurance information
- **Visit Management**: Track patient visits with visit dates and report dates
- **Lab Test Management**:
  - Create and manage lab test types with normal value ranges
  - Organize tests by categories
  - Support for gender-specific normal values
  - Multiple normal value types (ranges, bounds, descriptions, positive/negative)
- **Lab Panels**: Group multiple tests into panels for easier ordering
- **Test Results**: Record and manage lab test results for patient visits
- **Insurance Companies**: Manage insurance companies with coverage rates
- **Invoicing**: Generate invoices as PDF with automatic insurance calculations
- **Monthly Summaries**: View and export monthly financial summaries
- **PDF Generation**: Generate PDF reports for test results and invoices

## Usage

### Managing Patients

1. Navigate to the Patients page
2. Click "Create Patient" to add a new patient
3. Fill in patient information including name, gender, date of birth, phone number, and insurance company
4. Use the search functionality to find existing patients

### Creating Visits

1. Go to the Visits page
2. Create a new visit for a patient
3. Add lab tests or lab panels to the visit
4. Enter test results
5. Generate invoices and result PDFs

### Managing Lab Tests

1. Access Lab Tests from the Maintenance menu
2. Create test types with normal value ranges
3. Organize tests into categories
4. Create lab panels that group multiple tests together

### Generating Invoices

1. Navigate to a visit
2. Click on the invoice option
3. The system automatically calculates:
   - Individual test prices
   - Panel prices
   - Total amounts
4. Export as PDF

### Monthly Summaries

1. Go to the Month Summary page
2. Select a month and insurance company
3. View financial summaries
4. Export summary invoices
