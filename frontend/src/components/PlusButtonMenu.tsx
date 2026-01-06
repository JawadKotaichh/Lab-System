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
    "rounded-full grid place-items-center transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed";
  const btnToolbar =
    "h-10 px-4 gap-2 inline-flex bg-blue-600 text-white hover:bg-blue-700";
  const btnFab = "h-14 w-14 shadow-lg bg-blue-600 text-white hover:bg-blue-700";

  const menuPos = isFab
    ? "absolute bottom-16 right-0"
    : menuSide === "right"
    ? "absolute right-0 mt-2"
    : "absolute left-0 mt-2";

  return (
    <Menu
      as="div"
      className={
        isFab ? "fixed bottom-6 right-6 z-50" : "relative inline-block"
      }
    >
      <MenuButton
        className={[btnBase, isFab ? btnFab : btnToolbar, className].join(" ")}
        aria-label={isFab ? "Add" : `Add ${label}`}
      >
        <PlusIcon className={isFab ? "h-7 w-7" : "h-5 w-5"} />
        {!isFab && <span className="text-sm font-medium">{label}</span>}
      </MenuButton>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <MenuItems
          className={[
            menuPos,
            "z-50 w-52 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black/5 p-1 focus:outline-none",
          ].join(" ")}
        >
          {actions.map((a) => (
            <MenuItem key={a.label}>
              {({ active }) => (
                <button
                  type="button"
                  onClick={a.onClick}
                  className={[
                    "w-full text-left rounded-lg px-3 py-2 text-sm",
                    active ? "bg-gray-100" : "",
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
