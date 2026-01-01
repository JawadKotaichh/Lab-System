import React, { useEffect, useState } from "react";
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
import { loginUser, refreshSession, logoutUser } from "./components/utils";
import { AuthUser, Role } from "./components/types";
import UnauthorizedPage from "./components/UnauthorizedPage/UnauthorizedPage";
type NavItem = {
  to: string;
  label: string;
  end?: boolean;
  dynamic?: boolean;
};

function RequireAuth({
  user,
  allowedRoles,
  children,
}: {
  user: AuthUser | null;
  allowedRoles?: Role[];
  children: React.ReactNode;
}) {
  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // if user tries to access a page not allowed for their role
    return (
      <UnauthorizedPage
        homePath={user.role === "admin" ? "/visits" : "/login"}
      />
    );
  }

  return <>{children}</>;
}

function LoginRoute({
  onLoginSuccess,
}: {
  onLoginSuccess: (user: AuthUser) => void;
}) {
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
            onLoginSuccess({
              user_id: res.user_id ?? "",
              username: res.username ?? username,
              role: res.role as Role,
            });
            if (res.role == "admin") {
              navigate("/visits", { replace: true });
            } else {
              navigate("/visits", { replace: true });
            }
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
  const navigate = useNavigate();
  const activeClass =
    "px-3 py-2 rounded-md text-white bg-gradient-to-r from-blue-400 to-emerald-400 transition";
  const inactiveClass =
    "px-3 py-2 rounded-md text-gray-700 hover:text-white hover:bg-gradient-to-r from-blue-400 to-emerald-400 transition";
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("auth_user");
    if (!stored) return null;
    try {
      return JSON.parse(stored) as AuthUser;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    const ensureSession = async () => {
      try {
        const ok = await refreshSession();
        if (!ok && isMounted) {
          setUser(null);
          localStorage.removeItem("auth_user");
        }
      } catch {
        if (isMounted) {
          setUser(null);
          localStorage.removeItem("auth_user");
        }
      }
    };

    void ensureSession();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleLoginSuccess = (nextUser: AuthUser) => {
    setUser(nextUser);
    localStorage.setItem("auth_user", JSON.stringify(nextUser));
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("auth_user");
      setUser(null);
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {user && (
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
                <button
                  type="button"
                  onClick={handleLogout}
                  className={inactiveClass}
                >
                  Logout
                </button>
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
              user ? (
                <Navigate to="/visits" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/login"
            element={<LoginRoute onLoginSuccess={handleLoginSuccess} />}
          />
          <Route
            path="/visits"
            element={
              <RequireAuth user={user} allowedRoles={["admin"]}>
                <VisitsTable />
              </RequireAuth>
            }
          />
          <Route
            path="/visits/:visit_id"
            element={
              <RequireAuth user={user} allowedRoles={["admin"]}>
                <EditVisitPage />
              </RequireAuth>
            }
          />
          <Route
            path="/patients"
            element={
              <RequireAuth user={user} allowedRoles={["admin"]}>
                <PatientTable />
              </RequireAuth>
            }
          />
          <Route
            path="/insurance-companies"
            element={
              <RequireAuth user={user} allowedRoles={["admin"]}>
                <InsuranceCompanyTable />
              </RequireAuth>
            }
          />
          <Route
            path="/patients/create-patient"
            element={
              <RequireAuth user={user} allowedRoles={["admin"]}>
                <EditPatientPage title="Create Patient" />
              </RequireAuth>
            }
          />
          <Route
            path="/patients/edit-patient/:patient_id"
            element={
              <RequireAuth user={user} allowedRoles={["admin"]}>
                <EditPatientPage title="Edit Patient" />
              </RequireAuth>
            }
          />
          <Route
            path="/edit-insurance-company/:insurance_company_id"
            element={
              <RequireAuth user={user} allowedRoles={["admin"]}>
                <EditInsuranceCompany title="Edit Insurance Company" />
              </RequireAuth>
            }
          />
          <Route
            path="/lab-tests"
            element={
              <RequireAuth user={user} allowedRoles={["admin"]}>
                <LabTestTable />
              </RequireAuth>
            }
          />
          <Route
            path="/edit-lab-test/:lab_test_id"
            element={
              <RequireAuth user={user} allowedRoles={["admin"]}>
                <EditLabTest title="Edit Lab Test" />
              </RequireAuth>
            }
          />
          <Route
            path="/create-lab-test"
            element={
              <RequireAuth user={user} allowedRoles={["admin"]}>
                <EditLabTest title="Create Lab Test" />
              </RequireAuth>
            }
          />
          <Route
            path="/lab-panels"
            element={
              <RequireAuth user={user} allowedRoles={["admin"]}>
                <LabPanelsList />
              </RequireAuth>
            }
          />
          <Route
            path="/create-lab-panel"
            element={
              <RequireAuth user={user} allowedRoles={["admin"]}>
                <EditLabPanel title="Create Lab Panel" />
              </RequireAuth>
            }
          />
          <Route
            path="/edit-lab-panel/:lab_panel_id"
            element={
              <RequireAuth user={user} allowedRoles={["admin"]}>
                <EditLabPanel title="Edit Lab Panel" />
              </RequireAuth>
            }
          />
          <Route
            path="/lab-test-categories"
            element={
              <RequireAuth user={user} allowedRoles={["admin"]}>
                <LabTestCategoryTable />
              </RequireAuth>
            }
          />
          <Route
            path="/edit-lab-test-category/:lab_test_category_id"
            element={
              <RequireAuth user={user} allowedRoles={["admin"]}>
                <EditLabTestCategory title="Edit Lab Test Category" />
              </RequireAuth>
            }
          />
          <Route
            path="/create-lab-test-category"
            element={
              <RequireAuth user={user} allowedRoles={["admin"]}>
                <EditLabTestCategory title="Create Lab Test Category" />
              </RequireAuth>
            }
          />
          <Route
            path="/invoice/:visit_id"
            element={
              <RequireAuth user={user} allowedRoles={["admin"]}>
                <InvoiceContainer />
              </RequireAuth>
            }
          />
          <Route
            path="/result/:visit_id"
            element={
              <RequireAuth user={user} allowedRoles={["admin"]}>
                <ResultContainer />
              </RequireAuth>
            }
          />
          <Route
            path="/monthly-summary"
            element={
              <RequireAuth user={user} allowedRoles={["admin"]}>
                <MonthSummary />
              </RequireAuth>
            }
          />
          <Route
            path="/summary-invoice/:insurance_company_id"
            element={
              <RequireAuth user={user} allowedRoles={["admin"]}>
                <InvoiceSummaryContainer />
              </RequireAuth>
            }
          />
          <Route
            path="*"
            element={
              user ? (
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
