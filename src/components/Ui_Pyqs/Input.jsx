const Input = ({ className = "", type = "text", ...props }) => {
  return (
    <input
      type={type}
      className={`w-full px-4 py-3 bg-n-1 border border-n-3 rounded-xl text-n-8 placeholder-n-4 focus:outline-none focus:ring-2 focus:ring-color-1 focus:border-transparent transition-all duration-200 ${className}`}
      {...props}
    />
  )
}

export default Input
