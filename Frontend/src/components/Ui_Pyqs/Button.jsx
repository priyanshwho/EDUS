const Button = ({ children, variant = "primary", size = "md", className = "", ...props }) => {
  const baseClasses =
    "button inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"

  const variants = {
    primary: "bg-gradient-to-r from-color-1 to-color-5 text-n-1 hover:shadow-lg focus:ring-color-1",
    secondary: "bg-n-6 text-n-1 hover:bg-n-5 focus:ring-n-6",
    outline: "border border-n-3 text-n-6 hover:bg-n-2 hover:border-color-1 focus:ring-color-1",
    ghost: "text-n-6 hover:bg-n-2 focus:ring-n-4",
  }

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3",
    lg: "px-8 py-4 text-lg",
  }

  return (
    <button className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}

export default Button
