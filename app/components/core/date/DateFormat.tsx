import React from 'react';
import { format, isValid, parseISO } from 'date-fns';

interface DateFormatProps {
  value: string | Date | null;
  formatStr?: string;
  className?: string;
}

/**
 * DateFormat component for consistent date formatting across the application
 * 
 * @param value - Date string or Date object to format
 * @param formatStr - date-fns format string (default: 'dd MMM yyyy, hh:mm a')
 * @param className - Additional CSS classes
 */
const DateFormat: React.FC<DateFormatProps> = ({
  value,
  formatStr = 'dd MMM yyyy, hh:mm a',
  className = '',
}) => {
  if (!value) return null;

  try {
    const dateValue = typeof value === 'string' ? parseISO(value) : value;
    
    if (!isValid(dateValue)) return null;

    return (
      <span className={className}>
        {format(dateValue, formatStr)}
      </span>
    );
  } catch (error) {
    return null;
  }
};

export default DateFormat;