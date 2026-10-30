import { Plus } from "lucide-react"
import { notification1 } from "../assets"

const Creators = ({ className, title }) => {
  return (
    <div
      className={`${
        className || ""
      } flex items-center p-3 pr-5 bg-n-9/40 backdrop-blur border border-n-1/10 rounded-2xl gap-3.5`}
    >
      <img
        src={notification1}
        width={44}
        height={44}
        alt="EduSphere platform preview"
        loading="lazy"
        decoding="async"
        className="w-11 h-11 rounded-lg shrink-0 object-contain"
      />
      <div className="flex-1">
        <p className="mb-1 font-semibold text-n-1 justify-between">{title}</p>

        <div className="flex items-center justify-between">
          <ul className="flex items-center -m-0.5">
            <li className="flex w-6 h-6 border-2 border-n-12 rounded-full overflow-hidden">
              <img
                src="/priyanshu.webp"
                className="w-full h-full object-cover"
                width={20}
                height={20}
                loading="lazy"
                decoding="async"
                alt="EduSphere creator Priyanshu"
              />
            </li>
            <li className="flex items-center justify-center w-6 h-6 border-2 border-n-12 rounded-full bg-n-7 text-n-1 text-xs">
              <Plus className="w-3.5 h-3.5 text-n-1" />
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Creators
