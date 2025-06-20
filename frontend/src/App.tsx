import React from 'react';
import { Routes, Route, Link,NavLink, useMatch } from 'react-router-dom';
import logo from './assets/logo.png';
import './App.css';
import Visits from './components/Pages/Visits/VisitsPage';
import PatientPage from './components/Pages/Patients/PatientsPage';
import EditPatientPage from './components/Pages/EditPatientPage/EditPatientPage';
import CreatePatientPage from './components/Pages/CreatePatientPage/CreatePatientPage';
import MaintenancePage from './components/Pages/MaintenancePage/MaintenancePage';
import CreateLabTestTypePage from './components/Pages/MaintenancePage/CreateLabTestType';
import EditVisitPage from './components/Pages/EditVisit/EditVisitPage';
// import EditLabTestTypePage from './components/Pages/EditLabTestPage/EditLabTestPage';

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
  dynamic?: boolean;
};

const navItems: NavItem[] = [
  { to: '/visits', label: 'Visits', end: true },
  { to: '/patients', label: 'Patients' },
  { to : '/maintenance', label : 'Maintenance'},
  { to : '/edit-visit', label : 'Edit Visit'},
];

const App: React.FC = () => {
  const isOnEdit = !!useMatch('/edit-result/patients/:patient_id/:visit_id');
  const activeClass = 'px-3 py-2 rounded-md text-white bg-gradient-to-r from-blue-400 to-emerald-400 transition';
  const inactiveClass = 'px-3 py-2 rounded-md text-gray-700 hover:text-white hover:bg-gradient-to-r from-blue-400 to-emerald-400 transition';

  return (
  <div className="min-h-screen bg-gray-50">
    <nav className="bg-white shadow w-full border-b">
      <div className="flex items-center h-20">
        <div className="pl-4">
          <Link to="/">
            <img src={logo} alt="logo" className="h-12 w-auto" />
          </Link>
        </div>

        <div className="flex-1">
          <div className="max-w-7xl mx-auto px-4 flex justify-end items-center space-x-6">
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
          </div>
        </div>
      </div>
    </nav>

    <main>
      <Routes>
        <Route path="/visits" element={<Visits />} />
        <Route path="/edit-visit/patients/:patient_id/:visit_id" element={<EditVisitPage />}/>
        <Route path="/patients" element={<PatientPage/>}/>
        <Route path="/patients/edit-patient/:patient_id" element={<EditPatientPage/>}/>
        <Route path="/patients/create-patient" element={<CreatePatientPage/>}/>
        <Route path="/maintenance" element={<MaintenancePage/>}/>
        <Route path='/create-lab-test-type' element={<CreateLabTestTypePage/>}/>
        {/* <Route path='/edit-lab-test-type' element={<EditLabTestTypePage/>}/> */}
        <Route path="*" element={<h2 className="p-8">Page not found</h2>} />
      </Routes>
    </main>
    
  </div>
)};

export default App;
