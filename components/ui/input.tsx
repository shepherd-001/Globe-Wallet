import * as React from 'react'

import { cn } from '@/lib/utils'

interface InputProps extends React.ComponentProps<'input'> {
  errorMessage?: string
}

function Input({ className, type, 'aria-invalid': ariaInvalid, errorMessage, id, ...props }: InputProps) {
  const errorId = errorMessage && id ? `${id}-error` : undefined

  return (
    <div className="relative w-full">
      <input
        type={type}
        id={id}
        data-slot="input"
        aria-invalid={ariaInvalid ?? (errorMessage ? true : undefined)}
        aria-describedby={errorId}
        className={cn(
          'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-10 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-sm transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20',
          (ariaInvalid || errorMessage) && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20',
          className,
        )}
        {...props}
      />
      {errorMessage ? (
        <p id={errorId} className="mt-1 text-xs text-destructive" role="alert" data-testid={props['data-testid'] ? `${props['data-testid']}-error` : 'input-error'}>
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}

export { Input }
