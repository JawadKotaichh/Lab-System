import React, { useState } from "react";
import { Routes, Route, Link, NavLink, useMatch } from "react-router-dom";
import logo from "./assets/logo.png";
import "./App.css";
import Visits from "./components/Pages/VisitsPage/VisitsPage";
import PatientPage from "./components/Pages/Patients/PatientsPage";
import EditPatientPage from "./components/Pages/EditPatientPage/EditPatientPage";
// import CreatePatientPage from "./components/Pages/CreatePatientPage/CreatePatientPage";
// import MaintenancePage from "./components/Pages/MaintenancePage/MaintenancePage";
import CreateLabTestTypePage from "./components/Pages/MaintenancePage/CreateLabTestType";
import EditVisitPage from "./components/Pages/EditVisitPage/EditVisitPage";
import type { optionsMenuPages } from "./components/types";
import MaintenanceMenu from "./components/Pages/MaintenanceMenu";
import InsuranceCompanyPage from "./components/Pages/CreateInsuranceCompany/InsuranceCompanyPage";
import CreateInsuranceCompanyPage from "./components/Pages/CreateInsuranceCompany/CreatePageInsuranceCompany";
import CreatePatient from "./components/Pages/Tempo/CreatePatient";
import EditInsuranceCompany from "./components/Pages/CreateInsuranceCompany/EditInsuranceCompany";
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
            path="/patients/create-patient"
            element={<CreatePatient />}
          />
          <Route
            path="/create-lab-test-type"
            element={<CreateLabTestTypePage />}
          />
          <Route
            path="/insurance-companies"
            element={<InsuranceCompanyPage />}
          />
          <Route
            path="/create-insurance-company"
            element={<CreateInsuranceCompanyPage />}
          />
          <Route
            path="/edit-insurance-company/:insurance_company_id"
            element={<EditInsuranceCompany />}
          />
          {/* <Route path='/edit-lab-test-type' element={<EditLabTestTypePage/>}/> */}
          <Route path="*" element={<h2 className="p-8">Page not found</h2>} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
