import {
  Fragment,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";

interface MenuItem {
  label: string;
  onClick: () => void;
  className?: string;
}
interface MeatballsMenuProps {
  items: MenuItem[];
}

const MENU_VERTICAL_OFFSET_PX = 8;

type PlacementSyncProps = {
  open: boolean;
  buttonRef: RefObject<HTMLButtonElement>;
  menuRef: RefObject<HTMLDivElement>;
  setOpenUp: Dispatch<SetStateAction<boolean>>;
};

const PlacementSync = ({
  open,
  buttonRef,
  menuRef,
  setOpenUp,
}: PlacementSyncProps) => {
  useLayoutEffect(() => {
    if (!open) return;
    const button = buttonRef.current;
    const menu = menuRef.current;
    if (!button || !menu) return;

    const buttonRect = button.getBoundingClientRect();
    const spaceBelow = window.innerHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    const neededSpace = menu.scrollHeight + MENU_VERTICAL_OFFSET_PX;
    setOpenUp(spaceBelow < neededSpace && spaceAbove > spaceBelow);
  }, [open, buttonRef, menuRef, setOpenUp]);

  return null;
};

export default function MeatballsMenu({ items }: MeatballsMenuProps) {
  const [openUp, setOpenUp] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  return (
    <Menu as="div" className="relative inline-block text-left">
      {({ open }) => (
        <>
          <PlacementSync
            open={open}
            buttonRef={buttonRef}
            menuRef={menuRef}
            setOpenUp={setOpenUp}
          />
          <MenuButton
            ref={buttonRef}
            className="p-2 rounded-full hover:bg-gray-200"
          >
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
              ref={menuRef}
              className={`absolute right-0 w-40 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-50 ${
                openUp
                  ? "bottom-full mb-2 origin-bottom-right"
                  : "mt-2 origin-top-right"
              }`}
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
                      item.className || ""
                    }`
                  }
                >
                  {item.label}
                </MenuItem>
              ))}
            </MenuItems>
          </Transition>
        </>
      )}
    </Menu>
  );
}
