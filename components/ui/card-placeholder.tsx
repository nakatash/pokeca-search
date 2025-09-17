interface CardPlaceholderProps {
  className?: string
}

export function CardPlaceholder({ className }: CardPlaceholderProps) {
  return (
    <div className={`bg-gray-200 rounded flex items-center justify-center ${className}`}>
      <svg
        width="60"
        height="84"
        viewBox="0 0 60 84"
        className="text-gray-400"
        fill="currentColor"
      >
        <rect width="60" height="84" rx="4" fill="currentColor" opacity="0.1" />
        <path
          d="M30 20c-8.3 0-15 6.7-15 15s6.7 15 15 15 15-6.7 15-15-6.7-15-15-15zm0 25c-5.5 0-10-4.5-10-10s4.5-10 10-10 10 4.5 10 10-4.5 10-10 10z"
          opacity="0.3"
        />
        <circle cx="30" cy="35" r="3" opacity="0.3" />
        <rect x="15" y="55" width="30" height="4" rx="2" opacity="0.2" />
        <rect x="20" y="65" width="20" height="3" rx="1.5" opacity="0.2" />
      </svg>
    </div>
  )
}