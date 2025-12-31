import React, { useState } from "react";
import {
  Routes,
  Route,
  Link,
  NavLink,
  useMatch,
  Navigate,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import MaintenanceMenu from "./components/MaintenanceMenu";
import EditPatientPage from "./components/Patients/EditPatient";
import EditVisitPage from "./components/EditVisitPage/EditVisitPage";
import EditInsuranceCompany from "./components/InsuranceCompany/EditInsuranceCompany";
import EditLabTest from "./components/LabTest/EditLabTest";
import EditLabTestCategory from "./components/LabCategory/EditLabTestCategory";
import InsuranceCompanyTable from "./components/InsuranceCompany/InsuranceCompanyTable";
import PatientTable from "./components/Patients/PatientTable";
import LabTestTable from "./components/LabTest/LabTestTable";
import EditLabPanel from "./components/LabPanel/EditLabPanel";
import LabPanelsList from "./components/LabPanel/LabPanelsList";
import LabTestCategoryTable from "./components/LabCategory/LabTestCategoryTable";
import VisitsTable from "./components/Visits/VisitsTable";
import InvoiceContainer from "./components/Invoice/InvoiceContainer";
import ResultContainer from "./components/ResultPDF/ResultContainer";
import InvoiceSummaryContainer from "./components/MonthlySummary/InvoiceSummaryContainer";
import MonthSummary from "./components/MonthlySummary/MonthSummary";
import { baseURLL } from "./api";
import LoginPage from "./components/LoginPage/LoginPage";
import { loginUser } from "./components/utils";
type NavItem = {
  to: string;
  label: string;
  end?: boolean;
  dynamic?: boolean;
};
function RequireAuth({
  isAuthed,
  children,
}: {
  isAuthed: boolean;
  children: React.ReactNode;
}) {
  if (!isAuthed) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// function LoginRoute({ onLoginSuccess }: { onLoginSuccess: () => void }) {
//   const navigate = useNavigate();

//   return (
//     <LoginPage
//       onSubmit={async ({ username, password }) => {
//         if (!username.trim() || !password.trim()) {
//           alert("Please fill username and password");
//           return false;
//         }

//         try {
//           const res = await loginUser(username, password);

//           if (res.ok) {
//             onLoginSuccess();
//             navigate("/visits", { replace: true });
//             return true;
//           }

//           alert("Invalid credentials");
//           return false;
//         } catch (error) {
//           console.error("Login error:", error);
//           alert("Invalid credentials");
//           return false;
//         }
//       }}
//     />
//   );
// }
function LoginRoute({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const navigate = useNavigate();

  return (
    <LoginPage
      onSubmit={async ({ username, password }) => {
        if (!username.trim() || !password.trim()) {
          alert("Please fill username and password");
          return;
        }

        try {
          const res = await loginUser(username, password);

          if (res.ok) {
            onLoginSuccess();
            navigate("/visits", { replace: true });
            return;
          }

          alert("Invalid credentials");
          return;
        } catch (error) {
          console.error("Login error:", error);
          alert("Login failed. Please try again.");
          return;
        }
      }}
    />
  );
}

const navItems: NavItem[] = [
  { to: "/visits", label: "Visits", end: true },
  { to: "/patients", label: "Patients" },
  { to: "/monthly-summary", label: "Month Summary" },
];

const App: React.FC = () => {
  const isOnEdit = !!useMatch("/visits/:visit_id");
  const activeClass =
    "px-3 py-2 rounded-md text-white bg-gradient-to-r from-blue-400 to-emerald-400 transition";
  const inactiveClass =
    "px-3 py-2 rounded-md text-gray-700 hover:text-white hover:bg-gradient-to-r from-blue-400 to-emerald-400 transition";
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isAuthed, setIsAuthed] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {isAuthed && (
        <nav className="bg-white shadow w-full border-b">
          <div className="flex items-center h-20">
            <div className="pl-4">
              <Link to="/">
                <img
                  src={`${baseURLL}/branding/logo`}
                  alt="logo"
                  className="h-12 w-auto"
                />
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
      )}
      <main>
        <Routes>
          <Route
            path="/"
            element={
              isAuthed ? (
                <Navigate to="/visits" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/login"
            element={<LoginRoute onLoginSuccess={() => setIsAuthed(true)} />}
          />
          <Route
            path="/visits"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <VisitsTable />
              </RequireAuth>
            }
          />
          <Route
            path="/visits/:visit_id"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <EditVisitPage />
              </RequireAuth>
            }
          />
          <Route
            path="/patients"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <PatientTable />
              </RequireAuth>
            }
          />
          <Route
            path="/insurance-companies"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <InsuranceCompanyTable />
              </RequireAuth>
            }
          />
          <Route
            path="/patients/create-patient"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <EditPatientPage title="Create Patient" />
              </RequireAuth>
            }
          />
          <Route
            path="/patients/edit-patient/:patient_id"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <EditPatientPage title="Edit Patient" />
              </RequireAuth>
            }
          />
          <Route
            path="/edit-insurance-company/:insurance_company_id"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <EditInsuranceCompany title="Edit Insurance Company" />
              </RequireAuth>
            }
          />
          <Route
            path="/lab-tests"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <LabTestTable />
              </RequireAuth>
            }
          />
          <Route
            path="/edit-lab-test/:lab_test_id"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <EditLabTest title="Edit Lab Test" />
              </RequireAuth>
            }
          />
          <Route
            path="/create-lab-test"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <EditLabTest title="Create Lab Test" />
              </RequireAuth>
            }
          />
          <Route
            path="/lab-panels"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <LabPanelsList />
              </RequireAuth>
            }
          />
          <Route
            path="/create-lab-panel"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <EditLabPanel title="Create Lab Panel" />
              </RequireAuth>
            }
          />
          <Route
            path="/edit-lab-panel/:lab_panel_id"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <EditLabPanel title="Edit Lab Panel" />
              </RequireAuth>
            }
          />
          <Route
            path="/lab-test-categories"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <LabTestCategoryTable />
              </RequireAuth>
            }
          />
          <Route
            path="/edit-lab-test-category/:lab_test_category_id"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <EditLabTestCategory title="Edit Lab Test Category" />
              </RequireAuth>
            }
          />
          <Route
            path="/create-lab-test-category"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <EditLabTestCategory title="Create Lab Test Category" />
              </RequireAuth>
            }
          />
          <Route
            path="/invoice/:visit_id"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <InvoiceContainer />
              </RequireAuth>
            }
          />
          <Route
            path="/result/:visit_id"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <ResultContainer />
              </RequireAuth>
            }
          />
          <Route
            path="/monthly-summary"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <MonthSummary />
              </RequireAuth>
            }
          />
          <Route
            path="/summary-invoice/:insurance_company_id"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <InvoiceSummaryContainer />
              </RequireAuth>
            }
          />
          <Route
            path="*"
            element={
              isAuthed ? (
                <Navigate to="/visits" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </main>
    </div>
  );
};

export default App;
