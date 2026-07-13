# Lab System

A comprehensive laboratory management system for managing patients, visits, lab tests, results, and invoicing. Built with FastAPI backend and React frontend, fully containerized with Docker.

## Deployment and Database

Production is hosted on Azure:

- Frontend: Azure Static Web App
- Backend: Azure Container App
- Database: Azure Cosmos DB for MongoDB API

The backend reads the MongoDB connection string from `MONGODB_URL`. Local Docker development defaults to `mongodb://mongo:27017` when the variable is not set.

For Cosmos DB, the connection string must include:

```text
retryWrites=false
```

Cosmos DB for MongoDB does not support retryable writes. If this option is missing, read requests may work but write requests such as `POST /patients/` can fail with `500 Internal Server Error`.

Do not commit real database connection strings, Cosmos keys, Atlas credentials, JWT secrets, or refresh peppers. Store production values in Azure Container App secrets.

The backend requires separate `JWT_SECRET` and `REFRESH_PEPPER` values of at least 32 non-whitespace characters. Generate each independently with a cryptographically secure generator, for example:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Store the two generated values in the local `.env` file or the deployment secret store. The backend and Docker Compose fail fast when either value is missing or empty.

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
