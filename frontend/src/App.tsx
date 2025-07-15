import React, { useState } from "react";
import { Routes, Route, Link, NavLink, useMatch } from "react-router-dom";
import logo from "./assets/logo.png";
import "./App.css";
import Visits from "./components/Visits/VisitsPage";
import MaintenanceMenu from "./components/MaintenanceMenu";
import EditPatientPage from "./components/Patients/EditPatient";
import EditVisitPage from "./components/EditVisitPage/EditVisitPage";
import EditInsuranceCompany from "./components/InsuranceCompany/EditInsuranceCompany";
import EditLabTest from "./components/LabTest/EditLabTest";
import LabPanelsList from "./components/LabTest/LabPanelsList";
import EditLabPanel from "./components/LabTest/EditLabPanel";
import EditLabTestCategory from "./components/LabTest/EditLabTestCategory";
import LabTestCategoryList from "./components/LabTest/LabTestCategoryList";
import InsuranceCompanyTable from "./components/InsuranceCompany/InsuranceCompanyTable";
import PatientTable from "./components/Patients/PatientTable";
import LabTestTable from "./components/LabTest/LabTestTable";

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
          <Route path="/patients" element={<PatientTable />} />
          <Route
            path="/insurance-companies"
            element={<InsuranceCompanyTable />}
          />
          <Route
            path="/create-insurance-company"
            element={<EditInsuranceCompany title="Create Insurance Company" />}
          />
          <Route
            path="/patients/create-patient"
            element={<EditPatientPage title="Create Patient" />}
          />
          <Route
            path="/patients/edit-patient/:patient_id"
            element={<EditPatientPage title="Edit Patient" />}
          />
          <Route
            path="/edit-insurance-company/:insurance_company_id"
            element={<EditInsuranceCompany title="Edit Insurance Company" />}
          />
          <Route path="/lab-tests" element={<LabTestTable />} />
          <Route
            path="/edit-lab-test/:lab_test_id"
            element={<EditLabTest title="Edit Lab Test" />}
          />
          <Route
            path="/create-lab-test"
            element={<EditLabTest title="Create Lab Test" />}
          />
          <Route path="/lab-panels" element={<LabPanelsList />} />
          <Route
            path="/create-lab-panel"
            element={<EditLabPanel title="Create Lab Panel" />}
          />
          <Route
            path="/edit-lab-panel/:lab_panel_id"
            element={<EditLabPanel title="Edit Lab Panel" />}
          />
          <Route
            path="/edit-lab-panel/:lab_panel_id"
            element={<EditLabPanel title="Edit Lab Panel" />}
          />
          <Route path="lab-test-categories" element={<LabTestCategoryList />} />
          <Route
            path="/edit-lab-test-category/:lab_test_category_id"
            element={<EditLabTestCategory title="Edit Lab Test Category" />}
          />
          <Route
            path="/create-lab-test-category"
            element={<EditLabTestCategory title="Create Lab Test Category" />}
          />
          {/* <Route path='/edit-lab-test-type' element={<EditLabTestTypePage/>}/> */}
          <Route path="*" element={<h2 className="p-8">Page not found</h2>} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
