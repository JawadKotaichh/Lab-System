import { useLocation, useNavigate } from "react-router-dom";
import type { MenuParams } from "../types";
import { useEffect } from "react";

const MaintenanceMenu = ({
  isMenuOpen,
  setIsMenuOpen,
  options,
}: MenuParams) => {
  const navigate = useNavigate();
  const location = useLocation();

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
