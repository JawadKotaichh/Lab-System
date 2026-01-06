import { Fragment } from "react";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";

type MenuAction = {
  label: string;
  onClick: () => void;
  className?: string;
};

export default function MeatballsMenu({ items }: { items: MenuAction[] }) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton className="p-2 rounded-full hover:bg-gray-200">
        <EllipsisVerticalIcon className="h-5 w-5 text-gray-600" />
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
          portal
          anchor="bottom end"
          className="w-40 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-50"
        >
          {items.map((item, idx) => (
            <MenuItem
              as="button"
              key={idx}
              onClick={item.onClick}
              className={({ active }) =>
                `${
                  active ? "bg-gray-100" : ""
                } block w-full text-left px-4 py-2 text-sm ${
                  item.className ?? ""
                }`
              }
            >
              {item.label}
            </MenuItem>
          ))}
        </MenuItems>
      </Transition>
    </Menu>
  );
}
