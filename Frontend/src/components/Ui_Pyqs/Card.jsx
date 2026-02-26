const Card = ({ children, className = "", ...props }) => {
  return (
    <div className={`bg-n-1 border border-n-3 rounded-2xl shadow-sm ${className}`} {...props}>
      {children}
    </div>
  )
}

export default Card
