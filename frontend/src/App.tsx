import React, { useState } from "react";
import { Routes, Route, Link, NavLink, useMatch } from "react-router-dom";
import logo from "./assets/logo.png";
import "./App.css";
import Visits from "./components/Pages/VisitsPage/VisitsPage";
import PatientPage from "./components/Pages/PatientsPage/PatientsPage";
// import CreatePatientPage from "./components/Pages/CreatePatientPage/CreatePatientPage";
// import MaintenancePage from "./components/Pages/MaintenancePage/MaintenancePage";
import CreateLabTestTypePage from "./components/Pages/PageToRemove/MaintenancePage/CreateLabTestType";
import EditVisitPage from "./components/Pages/EditVisitPage/EditVisitPage";
import type { optionsMenuPages } from "./components/types";
import MaintenanceMenu from "./components/MaintenanceMenu";
import EditPatientPage from "./components/Pages/ModifyPatient/EditPatientPage";
import CreatePatientPage from "./components/Pages/ModifyPatient/CreatePatientPage";
import MainLabTestPage from "./components/Pages/ModifyLabTest/MainLabTestPage";
import EditLabTestPage from "./components/Pages/ModifyLabTest/EditLabTestPage";
import CreateLabTestPage from "./components/Pages/ModifyLabTest/CreateLabTestPage";
import EditInsuranceCompany from "./components/Pages/InsuranceCompany/EditInsuranceCompany";
import InsuranceCompanyList from "./components/Pages/InsuranceCompany/InsuranceCompanyList";
// import EditLabTestTypePage from './components/Pages/EditLabTestPage/EditLabTestPage';

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
  dynamic?: boolean;
};

const navItems: NavItem[] = [
  { to: "/visits", label: "Visits", end: true },
  { to: "/patients", label: "Patients" },
];
const menuPages: optionsMenuPages[] = [
  { label: "Insurance Companies", path: "/insurance-companies" },
  { label: "Lab Tests", path: "/lab-tests" },
];

const App: React.FC = () => {
  const isOnEdit = !!useMatch("/visits/:visit_id");
  const activeClass =
    "px-3 py-2 rounded-md text-white bg-gradient-to-r from-blue-400 to-emerald-400 transition";
  const inactiveClass =
    "px-3 py-2 rounded-md text-gray-700 hover:text-white hover:bg-gradient-to-r from-blue-400 to-emerald-400 transition";
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow w-full border-b">
        <div className="flex items-center h-20">
          <div className="pl-4">
            <Link to="/">
              <img src={logo} alt="logo" className="h-12 w-auto" />
            </Link>
          </div>

          <div className="flex-1 justify-end">
            <div className="mx-auto px-4 flex justify-end items-center space-x-6">
              {navItems.map(({ to, label, end, dynamic }) => (
                <NavLink
                  key={to}
                  to={to}
                  {...(end ? { end: true } : {})}
                  className={({ isActive: navIsActive }) => {
                    const isActive = dynamic ? isOnEdit : navIsActive;
                    return isActive ? activeClass : inactiveClass;
                  }}
                >
                  {label}
                </NavLink>
              ))}
              <MaintenanceMenu
                options={menuPages}
                isMenuOpen={isMenuOpen}
                setIsMenuOpen={setIsMenuOpen}
              />
            </div>
          </div>
        </div>
      </nav>

      <main>
        <Routes>
          <Route path="/visits" element={<Visits />} />
          <Route path="/visits/:visit_id" element={<EditVisitPage />} />
          <Route path="/patients" element={<PatientPage />} />
          <Route
            path="/patients/edit-patient/:patient_id"
            element={<EditPatientPage />}
          />
          <Route
            path="/create-lab-test-type"
            element={<CreateLabTestTypePage />}
          />
          <Route
            path="/insurance-companies"
            element={<InsuranceCompanyList />}
          />
          <Route
            path="/create-insurance-company"
            element={<EditInsuranceCompany title="Create Insurance Company" />}
          />
          <Route
            path="/patients/create-patient"
            element={<CreatePatientPage />}
          />
          <Route
            path="/edit-insurance-company/:insurance_company_id"
            element={<EditInsuranceCompany title="Edit Insurance Company" />}
          />
          <Route
            path="/patients/edit-patient/:patient_id"
            element={<EditPatientPage />}
          />
          <Route path="/lab-tests" element={<MainLabTestPage />} />
          <Route
            path="/edit-lab-test/:lab_test_id"
            element={<EditLabTestPage />}
          />

          <Route path="/create-lab-test" element={<CreateLabTestPage />} />

          {/* <Route path='/edit-lab-test-type' element={<EditLabTestTypePage/>}/> */}
          <Route path="*" element={<h2 className="p-8">Page not found</h2>} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
