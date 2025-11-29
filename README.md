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
- **Invoicing**: Generate invoices with automatic insurance calculations
- **Monthly Summaries**: View and export monthly financial summaries
- **PDF Generation**: Generate PDF reports for test results and invoices
- **Arabic Support**: Full support for Arabic text rendering in PDFs

## Tech Stack

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **MongoDB**: NoSQL database for flexible data storage
- **Beanie**: MongoDB ODM for Python
- **Pydantic**: Data validation using Python type annotations
- **Uvicorn**: ASGI server

### Frontend
- **React 19**: UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **React Router**: Client-side routing
- **TanStack Table**: Powerful table component
- **Tailwind CSS**: Utility-first CSS framework
- **React PDF**: PDF generation for invoices and results
- **Axios**: HTTP client

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Reverse proxy and load balancer
- **MongoDB 6.0**: Database container

## Project Structure

```
Lab-System/
├── backend/
│   ├── src/
│   │   ├── api/              # API route handlers
│   │   │   ├── patients.py
│   │   │   ├── visits.py
│   │   │   ├── lab_test_type.py
│   │   │   ├── lab_test_results.py
│   │   │   ├── lab_test_category.py
│   │   │   ├── lab_panel.py
│   │   │   ├── insurance_company.py
│   │   │   └── Invoice.py
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── models.py         # Beanie document models
│   │   ├── db.py             # Database initialization
│   │   └── main_app.py       # FastAPI application
│   ├── Dockerfile
│   ├── requirements.txt
│   └── settings.py
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── Patients/
│   │   │   ├── Visits/
│   │   │   ├── LabTest/
│   │   │   ├── LabPanel/
│   │   │   ├── Invoice/
│   │   │   ├── ResultPDF/
│   │   │   └── ...
│   │   ├── api.ts            # API client
│   │   └── App.tsx           # Main application component
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── nginx.conf
└── README.md
```

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local frontend development)
- Python 3.11+ (for local backend development)

## Installation

### Using Docker Compose (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd Lab-System
```

2. Create an environment file for the backend:
```bash
# Create backend/env file
echo "MONGODB_URI=mongodb://mongo:27017" > backend/env
echo "DEBUG=False" >> backend/env
```

3. Build and start all services:
```bash
docker-compose up --build
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Nginx (production): http://localhost:80

### Local Development

#### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
# Create env file
echo "MONGODB_URI=mongodb://localhost:27017" > env
echo "DEBUG=True" >> env
```

5. Start MongoDB (if not using Docker):
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:6.0
```

6. Run the backend server:
```bash
uvicorn src.main_app:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at http://localhost:5173

## API Endpoints

The API provides the following main endpoints:

- `GET /health` - Health check endpoint
- `/api/patients` - Patient management
- `/api/visits` - Visit management
- `/api/lab-test-type` - Lab test type management
- `/api/lab-test-results` - Test results management
- `/api/lab-test-category` - Test category management
- `/api/lab-panel` - Lab panel management
- `/api/insurance-company` - Insurance company management
- `/api/invoice` - Invoice management

Full API documentation is available at `/docs` when the backend is running.

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
   - Insurance discounts
   - Total amounts
4. Export as PDF

### Monthly Summaries

1. Go to the Month Summary page
2. Select a month and insurance company
3. View financial summaries
4. Export summary invoices

## Environment Variables

### Backend

- `MONGODB_URI`: MongoDB connection string (default: `mongodb://mongo:27017`)
- `DEBUG`: Enable debug mode (default: `False`)

## Docker Services

- **backend**: FastAPI application (port 8000)
- **frontend**: React development server (port 5173)
- **mongo**: MongoDB database (port 27017)
- **nginx**: Reverse proxy (port 80)

## Development

### Running the Application Locally

#### Backend

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Ensure MongoDB is running (see Local Development section above)

5. Set up environment variables:
```bash
# Create env file in backend directory
echo "MONGODB_URI=mongodb://localhost:27017" > env
echo "DEBUG=True" >> env
```

6. Run the backend server:
```bash
uvicorn src.main_app:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at http://localhost:8000
API documentation: http://localhost:8000/docs

#### Frontend

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at http://localhost:5173

### Testing

#### Backend API Tests

The backend includes a test script to verify API functionality:

1. Ensure the backend server is running (see above)

2. Run the test script:
```bash
cd backend
python src/test_api.py
```

This will test the patient API endpoints (create, read, update, delete operations).

#### Manual Testing

- **API Testing**: Use the interactive API documentation at http://localhost:8000/docs
- **Frontend Testing**: Navigate through the UI and test all features manually
- **Integration Testing**: Test the full flow from creating a patient → visit → adding tests → generating results and invoices

## License

This project is private and proprietary.

## Support

For issues and questions, please open an issue in the repository.

