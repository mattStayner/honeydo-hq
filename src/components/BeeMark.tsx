export function BeeMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M32 6L54 18.5V43.5L32 56L10 43.5V18.5L32 6Z"
        stroke="#E8A317"
        strokeWidth="3"
        fill="#1A1612"
      />
      <path d="M22 28h20M22 36h20" stroke="#E8A317" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="20" r="3" fill="#E8A317" />
      <path
        d="M18 24c-6-2-10-8-8-12 4 1 8 5 8 12ZM46 24c6-2 10-8 8-12-4 1-8 5-8 12Z"
        stroke="#A89880"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  )
}
