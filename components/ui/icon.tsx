import type { ReactNode } from "react";

export type IconName =
  | "home"
  | "inbox"
  | "clipboard"
  | "calendar"
  | "settings"
  | "alert"
  | "bell"
  | "menu"
  | "close"
  | "edit"
  | "power"
  | "trash"
  | "check"
  | "double-check"
  | "rejected"
  | "user";

const paths: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v11h14V9M9 20v-6h6v6" />
    </>
  ),
  inbox: (
    <>
      <path d="M4 4h16l2 11v5H2v-5L4 4Z" />
      <path d="M2 15h6l2 3h4l2-3h6" />
    </>
  ),
  clipboard: (
    <>
      <rect height="17" rx="2" width="14" x="5" y="4" />
      <path d="M9 4V2h6v2M9 10h6M9 14h6" />
    </>
  ),
  calendar: (
    <>
      <rect height="17" rx="2" width="18" x="3" y="4" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  settings: (
   <>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </>
  ),
  alert: (
    <>
      <path d="m12 3 10 18H2L12 3Z" />
      <path d="M12 9v5M12 17h.01" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  edit: <path d="m16 4 4 4L9 19H5v-4L16 4Z M14 6l4 4" />,
  power: <path d="M12 2v10M5.6 5.6a9 9 0 1 0 12.8 0" />,
  trash: <path d="M9.17065 4C9.58249 2.83481 10.6937 2 11.9999 2C13.3062 2 14.4174 2.83481 14.8292 4M20.5 6H3.49988M18.3735 15.3991C18.1965 18.054 18.108 19.3815 17.243 20.1907C16.378 21 15.0476 21 12.3868 21H11.6134C8.9526 21 7.6222 21 6.75719 20.1907C5.89218 19.3815 5.80368 18.054 5.62669 15.3991L5.16675 8.5M18.8334 8.5L18.6334 11.5M9.5 11L10 16M14.5 11L14 16" />,
  check: <path d="M20 6 9 17l-5-5" />,
  "double-check": <path d="M1.5 12.5L6.5 17.5L16.5 7.5M8.5 12.5L13.5 17.5L22.5 8.5" />,
  rejected: <path d="M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20ZM4.93 4.93l14.14 14.14" />,
};

export function Icon({
  className,
  name,
}: {
  className?: string;
  name: IconName;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="22"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
      width="22"
    >
      {paths[name]}
    </svg>
  );
}
