import React from 'react';
import { ChevronDown } from 'lucide-react';
import './study.css';

/** Keep native keyboard and mobile selection, with a consistently spaced arrow. */
export default function StudySelect({ className = '', ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="study-select">
      <select {...props} className={`edus-input ${className}`} />
      <ChevronDown size={18} aria-hidden="true" />
    </span>
  );
}
