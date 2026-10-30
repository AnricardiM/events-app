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
      <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
      <path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1 0 2Z" />
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
