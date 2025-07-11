import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import type { MenuParams, optionsMenuPages } from "./types";

const MaintenanceMenu = ({ isMenuOpen, setIsMenuOpen }: MenuParams) => {
  const navigate = useNavigate();
  const location = useLocation();
  const options: optionsMenuPages[] = [
    { label: "Insurance Companies", path: "/insurance-companies" },
    { label: "Lab Panels", path: "/lab-panels" },
    { label: "Lab Tests", path: "/lab-tests" },
    { label: "Lab Tests Categories", path: "/lab-test-categories" },
  ];
  const toggleMenu = () => setIsMenuOpen((isMenuOpen) => !isMenuOpen);
  const handleSelect = (path: string) => {
    navigate(path);
  };
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname, setIsMenuOpen]);

  return (
    <div className="relative bg-white">
      <i
        className="bx bx-menu block text-3xl cursor-pointer"
        onClick={() => toggleMenu()}
      >
        <div
          className={`absolute top-16 right-0 w-fit bg-white flex flex-col items-center gap-2 transform transition-transform shadow-lg rounded-md ${
            isMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          style={{
            transition: "transform 0.3s ease, opacity 0.3s ease",
            zIndex: 1000,
            display: isMenuOpen ? "flex" : "none",
          }}
        >
          {options.map((opt) => (
            <li
              key={opt.path}
              className="list-none w-full text-lg text-center border rounded-sm p-4 hover:text-white  hover:bg-gradient-to-r from-blue-400 to-emerald-400"
              onClick={() => handleSelect(opt.path)}
            >
              {opt.label}
            </li>
          ))}
        </div>
      </i>
    </div>
  );
};
export default MaintenanceMenu;
