import { loading } from "../assets"

const Generating = ({className}) => {
  return (
    <div className={`flex items-center  h-[3.5rem] border border-neutral-500 px-6 bg-white/20 rounded-[1.7rem] ${className || ''}`} >
        <img
        className="w-5 h-5 mr-4"
        src={loading} alt="loading" />
        <span className="text-n-1">Academics Comeback</span>
    </div>
  )
}

export default Generating