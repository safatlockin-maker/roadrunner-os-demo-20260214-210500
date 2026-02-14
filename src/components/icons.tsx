type IconProps = {
  className?: string
}

export function LogoMarkIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="14" cy="14" r="13" stroke="white" strokeOpacity="0.88" strokeWidth="2" />
      <path
        d="M14 4.5C16.6 7.6 17 11.2 14 14C11 16.8 7.2 16.4 4.5 14"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M23.5 14C20.4 16.6 16.8 17 14 14C11.2 11 11.6 7.2 14 4.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M14 23.5C11.4 20.4 11 16.8 14 14C17 11.2 20.8 11.6 23.5 14"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function CartIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.5 3.5H4L5.4 10.2C5.5 10.8 6.1 11.2 6.7 11.2H12.8C13.4 11.2 13.9 10.8 14.1 10.2L15.2 5.4H4.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7.2" cy="14" r="1.1" fill="currentColor" />
      <circle cx="12.3" cy="14" r="1.1" fill="currentColor" />
    </svg>
  )
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.8 9H14.2M14.2 9L10.2 5M14.2 9L10.2 13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function MenuIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
