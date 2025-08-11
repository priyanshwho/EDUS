"use client"

import { useState } from "react"

const Select = ({ value, onChange, options, placeholder = "Select option", className = "" }) => {
  const [isOpen, setIsOpen] = useState(false)

  const selectedOption = options.find((option) => option.value === value)

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-n-1 border border-n-3 rounded-xl text-left text-n-8 focus:outline-none focus:ring-2 focus:ring-color-1 focus:border-transparent transition-all duration-200 flex items-center justify-between"
      >
        <span className={selectedOption ? "text-n-8" : "text-n-4"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-5 h-5 text-n-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-n-1 border border-n-3 rounded-xl shadow-lg max-h-60 overflow-auto">
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

export default Select
