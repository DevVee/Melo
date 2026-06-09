/**
 * MonthYearPicker — two accessible selects (Month + Year).
 * Works great on mobile; avoids the inconsistent native type="month" input.
 *
 * Value format: "YYYY-MM"  (same as HTML input type="month")
 * Empty value:  ""
 */

const MONTHS = [
  { value: '01', label: 'January'   },
  { value: '02', label: 'February'  },
  { value: '03', label: 'March'     },
  { value: '04', label: 'April'     },
  { value: '05', label: 'May'       },
  { value: '06', label: 'June'      },
  { value: '07', label: 'July'      },
  { value: '08', label: 'August'    },
  { value: '09', label: 'September' },
  { value: '10', label: 'October'   },
  { value: '11', label: 'November'  },
  { value: '12', label: 'December'  },
]

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 50 }, (_, i) => CURRENT_YEAR - i) // last 50 years

interface MonthYearPickerProps {
  value: string            // "YYYY-MM" or ""
  onChange: (val: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

const selectCls =
  'flex-1 min-w-0 rounded-xl px-3 py-2.5 text-sm text-gray-900 border border-gray-200 ' +
  'outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 ' +
  'bg-white appearance-none cursor-pointer transition-all ' +
  'disabled:cursor-not-allowed disabled:opacity-50'

export function MonthYearPicker({
  value,
  onChange,
  disabled,
  className = '',
}: MonthYearPickerProps) {
  const [yyyy, mm] = value ? value.split('-') : ['', '']

  function emit(newYyyy: string, newMm: string) {
    if (!newYyyy && !newMm) { onChange(''); return }
    if (newYyyy && newMm)   { onChange(`${newYyyy}-${newMm}`); return }
    // Partial: one side filled — store what we have so user sees progress
    if (newYyyy) onChange(`${newYyyy}-${newMm || '01'}`)
    else         onChange(`${newYyyy || CURRENT_YEAR}-${newMm}`)
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* Month */}
      <select
        value={mm ?? ''}
        disabled={disabled}
        onChange={e => emit(yyyy ?? '', e.target.value)}
        className={selectCls}
        aria-label="Month"
      >
        <option value="">Month</option>
        {MONTHS.map(m => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>

      {/* Year */}
      <select
        value={yyyy ?? ''}
        disabled={disabled}
        onChange={e => emit(e.target.value, mm ?? '')}
        className={selectCls}
        aria-label="Year"
      >
        <option value="">Year</option>
        {YEARS.map(y => (
          <option key={y} value={String(y)}>{y}</option>
        ))}
      </select>
    </div>
  )
}
