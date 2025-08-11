"use client"

import { useState } from "react"

const DropdownMenu = ({ trigger, options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-56 bg-n-1 border border-n-3 rounded-xl shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`w-full px-4 py-3 text-left hover:bg-n-2 transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl ${
                value === option.value ? "bg-color-1 text-n-1" : "text-n-8"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default DropdownMenu
