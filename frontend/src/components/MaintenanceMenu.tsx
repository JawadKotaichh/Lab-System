import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
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

  const wrapperRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const handleSelect = (path: string) => navigate(path);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname, setIsMenuOpen]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!isMenuOpen) return;
      const target = e.target as Node;
      if (wrapperRef.current && !wrapperRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [isMenuOpen, setIsMenuOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setIsMenuOpen]);

  return (
    <div ref={wrapperRef} className="relative bg-white">
      <button
        type="button"
        className="bx bx-menu block text-3xl cursor-pointer"
        onClick={toggleMenu}
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        aria-controls="maintenance-menu"
      />

      <ul
        id="maintenance-menu"
        role="menu"
        className={`absolute top-16 right-0 w-fit bg-white flex flex-col items-center gap-2 transform transition-transform shadow-lg rounded-md ${
          isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{
          transition: "transform 0.3s ease, opacity 0.3s ease",
          zIndex: 1000,
          display: isMenuOpen ? "flex" : "none",
        }}
      >
        {options.map((opt) => (
          <li key={opt.path} role="none" className="list-none w-full">
            <button
              role="menuitem"
              type="button"
              className="w-full text-lg text-center border rounded-sm p-4 hover:text-white hover:bg-gradient-to-r from-blue-400 to-emerald-400"
              onClick={() => handleSelect(opt.path)}
            >
              {opt.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MaintenanceMenu;
