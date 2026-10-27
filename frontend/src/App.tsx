import React, { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import {
  Routes,
  Route,
  Link,
  NavLink,
  useMatch,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import "./App.css";
import MaintenanceMenu, { maintenanceNavItems } from "./components/MaintenanceMenu";
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
import { baseURLL, isSessionExpired } from "./api";
import LoginPage from "./components/LoginPage/LoginPage";
import {
  loginUser,
  refreshSession,
  logoutUser,
  updateOwnAccount,
} from "./components/utils";
import { AuthUser, Role } from "./components/types";
import UnauthorizedPage from "./components/UnauthorizedPage/UnauthorizedPage";
import UserVisitsPage from "./components/UserVisitsPage/UserVisitsPage";
import FinancialTransactionTable from "./components/AccountingPages/FinancialTransactionTable";
import EditFinancialTransaction from "./components/AccountingPages/EditFinancialTransaction";
import FinancialTransactionsSummary from "./components/AccountingPages/FinancialTransactionsSummary";
import FinancialTransactionsSummaryContainer from "./components/AccountingPages/FinancialTransactionsSummaryContainer";
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
    return (
      <UnauthorizedPage
        homePath={user.role === "admin" ? "/visits" : "/my-visits"}
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
        const res = await loginUser(username, password);
        if (!res.ok) throw new Error("The username or password is incorrect.");
        onLoginSuccess({
          user_id: res.user_id ?? "",
          username: res.username ?? username,
          role: res.role as Role,
        });
        navigate(res.role === "admin" ? "/visits" : "/my-visits", { replace: true });
      }}
    />
  );
}

function EditPatientAccountRoute({
  onAccountUpdated,
}: {
  onAccountUpdated: (username: string) => void;
}) {
  const navigate = useNavigate();
  return (
    <LoginPage
      title="Profile"
      buttonText="Update"
      onSubmit={async ({ username, password }) => {
        const updated = await updateOwnAccount(username, password);
        onAccountUpdated(updated.username);
        alert("Profile updated");
        navigate("/my-visits", { replace: true });
      }}
    />
  );
}

const navItemsAdmin: NavItem[] = [
  { to: "/visits", label: "Visits", end: true },
  { to: "/patients", label: "Patients" },
  { to: "/monthly-summary", label: "Month Summary" },
  { to: "/financial-transactions", label: "Financial Transactions", end: true },
];
const navItemsUser: NavItem[] = [
  { to: "/my-visits", label: "My Visits", end: true },
  { to: "/my-profile", label: "My profile", end: true },
];

const App: React.FC = () => {
  const isOnEdit = !!useMatch("/visits/:visit_id");
  const navigate = useNavigate();
  const activeClass =
    "px-3 py-2 rounded-md text-white bg-gradient-to-r from-blue-400 to-emerald-400 transition";
  const inactiveClass =
    "px-3 py-2 rounded-md text-gray-700 hover:text-white hover:bg-gradient-to-r from-blue-400 to-emerald-400 transition";
  const logoutButtonStyle =
    "px-3 py-2 rounded-md text-red-600 border border-red-600 hover:bg-red-700 hover:border-red-700 hover:text-white transition cursor-pointer";
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigationRef = useRef<HTMLElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("auth_user");
    if (!stored) return null;
    try {
      return JSON.parse(stored) as AuthUser;
    } catch {
      return null;
    }
  });
  const isAdmin = user?.role === "admin";
  const navItems = isAdmin ? navItemsAdmin : navItemsUser;
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMenuOpen(false);
  }, [location.key, user?.user_id]);

  useEffect(() => {
    // The longer admin navigation needs more room than the patient navigation.
    const desktop = window.matchMedia(isAdmin ? "(min-width: 80rem)" : "(min-width: 48rem)");
    const closeMenus = () => {
      setIsMobileMenuOpen(false);
      setIsMenuOpen(false);
    };
    desktop.addEventListener("change", closeMenus);
    return () => desktop.removeEventListener("change", closeMenus);
  }, [isAdmin]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !navigationRef.current?.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
        mobileMenuButtonRef.current?.focus();
      }
    };
    window.addEventListener("pointerdown", closeOutside);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("pointerdown", closeOutside);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMobileMenuOpen]);
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
      } catch (error) {
        // Temporary connection/server failures do not invalidate a session.
        if (isMounted && isSessionExpired(error)) {
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

  const handleAccountUpdated = (username: string) => {
    setUser((currentUser) => {
      if (!currentUser) return currentUser;
      const updatedUser = { ...currentUser, username };
      localStorage.setItem("auth_user", JSON.stringify(updatedUser));
      return updatedUser;
    });
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
        <nav ref={navigationRef} aria-label="Main navigation" className="w-full border-b bg-white shadow">
          <div className="flex h-20 items-center justify-between gap-3 px-4">
            <Link to="/" aria-label="Al Saha Lab home" className="shrink-0">
              <img src={`${baseURLL}/branding/logo`} alt="Al Saha Lab" className="h-18 w-auto" />
            </Link>

            <div className={isAdmin ? "hidden min-w-0 items-center justify-end gap-6 xl:flex" : "hidden min-w-0 items-center justify-end gap-6 md:flex"}>
              {navItems.map(({ to, label, end, dynamic }) => (
                <NavLink
                  key={to}
                  to={to}
                  {...(end ? { end: true } : {})}
                  className={({ isActive }) => `${(dynamic ? isOnEdit : isActive) ? activeClass : inactiveClass} whitespace-nowrap`}
                >
                  {label}
                </NavLink>
              ))}
              {isAdmin && <MaintenanceMenu isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />}
              <button type="button" onClick={handleLogout} className={`${logoutButtonStyle} whitespace-nowrap`}>
                Logout
              </button>
            </div>

            <button
              ref={mobileMenuButtonRef}
              type="button"
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setIsMobileMenuOpen(open => !open)}
              className={`inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${isAdmin ? "xl:hidden" : "md:hidden"}`}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
            </button>
          </div>

          <div id="mobile-navigation" hidden={!isMobileMenuOpen} className={`border-t border-gray-100 px-4 pb-4 pt-3 ${isAdmin ? "xl:hidden" : "md:hidden"}`}>
            <div className="flex flex-col gap-2">
              {navItems.map(({ to, label, end, dynamic }) => (
                <NavLink
                  key={to}
                  to={to}
                  {...(end ? { end: true } : {})}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => `flex min-h-11 items-center ${(dynamic ? isOnEdit : isActive) ? activeClass : inactiveClass}`}
                >
                  {label}
                </NavLink>
              ))}
              {isAdmin && (
                <div className="mt-1 flex flex-col gap-2 border-t border-gray-200 pt-3">
                  <p className="px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Maintenance</p>
                  {maintenanceNavItems.map(({ path, label }) => (
                    <NavLink key={path} to={path} onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) => `flex min-h-11 items-center ${isActive ? activeClass : inactiveClass}`}>
                      {label}
                    </NavLink>
                  ))}
                </div>
              )}
              <button type="button" className={`${logoutButtonStyle} mt-2 min-h-11 text-left`} onClick={() => {
                setIsMobileMenuOpen(false);
                void handleLogout();
              }}>
                Logout
              </button>
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
                <Navigate
                  to={user.role === "admin" ? "/visits" : "/my-visits"}
                  replace
                />
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
            path="/my-profile"
            element={
              <RequireAuth user={user} allowedRoles={["patient"]}>
                <EditPatientAccountRoute
                  onAccountUpdated={handleAccountUpdated}
                />
              </RequireAuth>
            }
          />
          <Route
            path="/financial-transactions"
            element={
              <RequireAuth user={user} allowedRoles={["admin"]}>
                <FinancialTransactionTable />
              </RequireAuth>
            }
          />
          <Route
            path="/financial-transactions/:transaction_id"
            element={
              <RequireAuth user={user} allowedRoles={["admin"]}>
                <EditFinancialTransaction title="Edit transaction" />
              </RequireAuth>
            }
          />
          <Route
            path="/financial-transactions/edit-patient/:transaction-id"
            element={
              <RequireAuth user={user} allowedRoles={["admin"]}>
                <EditFinancialTransaction title={"Edit Transaction"} />
              </RequireAuth>
            }
          />
          <Route
            path="/financial-transactions/create-transaction/:kind"
            element={
              <RequireAuth user={user} allowedRoles={["admin"]}>
                <EditFinancialTransaction title={"Create Transaction"} />
              </RequireAuth>
            }
          />
          <Route
            path="/financial-transactions/summary"
            element={
              <RequireAuth user={user} allowedRoles={["admin"]}>
                <FinancialTransactionsSummary />
              </RequireAuth>
            }
          />
          <Route
            path="/financial-transactions/summary/:type"
            element={
              <RequireAuth user={user} allowedRoles={["admin"]}>
                <FinancialTransactionsSummaryContainer />
              </RequireAuth>
            }
          />
          <Route
            path="/my-visits"
            element={
              <RequireAuth user={user} allowedRoles={["patient"]}>
                <UserVisitsPage />
              </RequireAuth>
            }
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
            path="/create-insurance-company"
            element={
              <RequireAuth user={user} allowedRoles={["admin"]}>
                <EditInsuranceCompany title="Create insurance company" />
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
              <RequireAuth user={user} allowedRoles={["admin", "patient"]}>
                <InvoiceContainer />
              </RequireAuth>
            }
          />
          <Route
            path="/result/:visit_id"
            element={
              <RequireAuth user={user} allowedRoles={["admin", "patient"]}>
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
                <Navigate
                  to={user.role === "admin" ? "/visits" : "/my-visits"}
                  replace
                />
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
