import * as React from 'react'
import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors',
        'placeholder:text-gray-400',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:border-purple-400 focus-visible:ring-offset-0',
        'disabled:cursor-not-allowed disabled:opacity-50 resize-none',
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
