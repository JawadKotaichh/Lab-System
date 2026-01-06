import { Fragment } from "react";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { PlusIcon } from "@heroicons/react/24/outline";

type PlusAction = {
  label: string;
  onClick: () => void;
  className?: string;
};

type PlusButtonProps = {
  actions: PlusAction[];
  variant?: "toolbar" | "fab";
  label?: string;
  className?: string;
  menuSide?: "left" | "right";
};

export default function PlusButtonMenu({
  actions,
  variant = "toolbar",
  label,
  className = "",
  menuSide = "right",
}: PlusButtonProps) {
  const isFab = variant === "fab";

  const btnBase =
    "group inline-flex items-center justify-center select-none transition " +
    "active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2";

  const btnToolbar =
    "h-10 px-4 gap-2 rounded-xl text-white shadow-sm hover:shadow-md " +
    "bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700";

  const btnFab =
    "h-14 w-14 rounded-2xl text-white shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 " +
    "bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700";

  const menuPos = isFab
    ? "absolute bottom-16 right-0 origin-bottom-right"
    : menuSide === "right"
    ? "absolute right-0 mt-2 origin-top-right"
    : "absolute left-0 mt-2 origin-top-left";

  return (
    <Menu
      as="div"
      className={
        isFab ? "fixed bottom-6 right-6 z-50" : "relative inline-block"
      }
    >
      <MenuButton
        className={[btnBase, isFab ? btnFab : btnToolbar, className].join(" ")}
        aria-label={isFab ? "Add" : `Add ${label ?? ""}`}
      >
        <PlusIcon
          className={
            (isFab ? "h-7 w-7" : "h-5 w-5") +
            " transition-transform group-hover:rotate-90"
          }
        />
        {!isFab && <span className="text-sm font-semibold">{label}</span>}
      </MenuButton>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-120"
        enterFrom="opacity-0 translate-y-1 scale-95"
        enterTo="opacity-100 translate-y-0 scale-100"
        leave="transition ease-in duration-90"
        leaveFrom="opacity-100 translate-y-0 scale-100"
        leaveTo="opacity-0 translate-y-1 scale-95"
      >
        <MenuItems
          className={[
            menuPos,
            "z-50 w-56 rounded-2xl bg-white/95 backdrop-blur shadow-xl ring-1 ring-black/5 p-1",
          ].join(" ")}
        >
          {actions.map((a) => (
            <MenuItem key={a.label}>
              {({ active }) => (
                <button
                  type="button"
                  onClick={a.onClick}
                  className={[
                    "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium",
                    active ? "bg-slate-100 text-slate-900" : "text-slate-700",
                    "hover:bg-slate-50",
                    a.className ?? "",
                  ].join(" ")}
                >
                  {a.label}
                </button>
              )}
            </MenuItem>
          ))}
        </MenuItems>
      </Transition>
    </Menu>
  );
}
