import React from 'react';

const baseProps = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const make = (paths) => (props) => (
  <svg {...baseProps} {...props}>{paths}</svg>
);

export const IconDumbbell = make(
  <>
    <path d="M6 6v12" />
    <path d="M2 9v6" />
    <path d="M18 6v12" />
    <path d="M22 9v6" />
    <path d="M6 12h12" />
  </>
);

export const IconChart = make(
  <>
    <path d="M3 3v18h18" />
    <path d="M7 14l3-3 4 4 5-6" />
  </>
);

export const IconDroplet = make(
  <path d="M12 2.5s6.5 7 6.5 11.5a6.5 6.5 0 1 1-13 0C5.5 9.5 12 2.5 12 2.5z" />
);

export const IconCheckSquare = make(
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M8 12l3 3 5-6" />
  </>
);

export const IconTrophy = make(
  <>
    <path d="M8 21h8" />
    <path d="M12 17v4" />
    <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
    <path d="M17 5h3v3a3 3 0 0 1-3 3" />
    <path d="M7 5H4v3a3 3 0 0 0 3 3" />
  </>
);

export const IconLogout = make(
  <>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </>
);

export const IconPlus = make(
  <>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </>
);

export const IconCheck = make(<path d="M5 12l5 5L20 7" />);

export const IconX = make(
  <>
    <path d="M18 6L6 18" />
    <path d="M6 6l12 12" />
  </>
);

export const IconClock = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>
);

export const IconCalendar = make(
  <>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18" />
    <path d="M8 3v4" />
    <path d="M16 3v4" />
  </>
);

export const IconFlame = make(
  <path d="M12 22s7-4 7-10c0-4-3-7-3-7s-1 3-3 3-2-5-2-5-7 4-7 10c0 5 4 9 8 9z" />
);

export const IconSparkle = make(
  <>
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
    <path d="M12 8.5L13.5 12 17 13.5 13.5 15 12 18.5 10.5 15 7 13.5 10.5 12z" />
  </>
);

export const IconScale = make(
  <>
    <path d="M4 7h16l-2 12H6L4 7z" />
    <path d="M9 11h6" />
  </>
);

export const IconList = make(
  <>
    <path d="M8 6h13" />
    <path d="M8 12h13" />
    <path d="M8 18h13" />
    <circle cx="4" cy="6" r="1" />
    <circle cx="4" cy="12" r="1" />
    <circle cx="4" cy="18" r="1" />
  </>
);

export const IconAlert = make(
  <>
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
    <path d="M10.3 3.86l-8.07 13.97A2 2 0 0 0 4 21h16a2 2 0 0 0 1.77-3.17L13.7 3.86a2 2 0 0 0-3.4 0z" />
  </>
);

export const IconWallet = make(
  <>
    <rect x="2" y="7" width="20" height="14" rx="3" />
    <path d="M16 14a1 1 0 1 0 2 0 1 1 0 0 0-2 0z" fill="currentColor" />
    <path d="M2 10h20" />
    <path d="M6 3l4-1 4 1 4-1" />
  </>
);

export const IconArrowUpCircle = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 16V8" />
    <path d="M8 12l4-4 4 4" />
  </>
);

export const IconArrowDownCircle = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v8" />
    <path d="M8 12l4 4 4-4" />
  </>
);

export const IconUsers = make(
  <>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </>
);

export const IconFlag = make(
  <>
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </>
);

export const IconBank = make(
  <>
    <path d="M3 21h18" />
    <path d="M3 10h18" />
    <path d="M5 6l7-3 7 3" />
    <path d="M4 10v11" />
    <path d="M20 10v11" />
    <path d="M8 14v3" />
    <path d="M12 14v3" />
    <path d="M16 14v3" />
  </>
);

export const IconLogo = (props) => (
  <svg {...props} viewBox="0 0 64 64" fill="none">
    <path
      d="M14 48V16h15a8 8 0 0 1 8 8 8 8 0 0 1-5 7.4L42 48"
      stroke="#FFFFFF"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M44 16l8 8M52 24v-8h-8"
      stroke="#C5FF3D"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect x="42" y="38" width="3" height="8" rx="1" fill="#C5FF3D" />
    <rect x="47" y="34" width="3" height="12" rx="1" fill="#C5FF3D" />
    <rect x="52" y="30" width="3" height="16" rx="1" fill="#C5FF3D" />
  </svg>
);
