const Badge = ({ children, variant = "primary", className = "", ...props }) => {
  const baseClasses = "caption inline-flex items-center px-3 py-1 rounded-full font-semibold"

  const variants = {
    primary: "bg-gradient-to-r from-color-1 to-color-5 text-n-1",
    secondary: "bg-color-2 text-n-8",
    outline: "border border-n-3 text-n-6 bg-n-1",
    success: "bg-color-4 text-n-8",
    warning: "bg-color-2 text-n-8",
    error: "bg-color-3 text-n-1",
  }

  return (
    <span className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  )
}

export default Badge
