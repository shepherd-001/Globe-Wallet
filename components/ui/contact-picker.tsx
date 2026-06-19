"use client"

import { Contact } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { User, X } from "lucide-react"

interface ContactPickerProps {
  contacts: Contact[]
  selected: Contact | null
  query: string
  onQueryChange: (q: string) => void
  onSelect: (c: Contact | null) => void
}

export function ContactPicker({
  contacts,
  selected,
  query,
  onQueryChange,
  onSelect,
}: ContactPickerProps) {
  if (selected) {
    return (
      <div
        role="status"
        aria-label={`Selected contact: ${selected.name}`}
        data-testid="selected-contact"
        className="flex items-center justify-between rounded-md border border-primary/40 bg-primary/5 px-3 py-2"
      >
        <div className="flex items-center gap-2 text-sm">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold"
          >
            {selected.initials}
          </span>
          <span className="font-medium">{selected.name}</span>
          <span className="text-muted-foreground">{selected.handle}</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Remove selected contact"
          data-testid="clear-contact"
          className="h-6 w-6"
          onClick={() => onSelect(null)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <div data-testid="contact-picker">
      <Input
        placeholder="Search contacts…"
        aria-label="Search contacts"
        data-testid="contact-search"
        value={query}
        onChange={e => onQueryChange(e.target.value)}
        onInput={e => onQueryChange(e.currentTarget.value)}
        autoComplete="off"
        className="bg-background/50"
      />
      {query.length > 0 && (
        <ul
          role="listbox"
          aria-label="Contact suggestions"
          data-testid="contact-list"
          className="mt-1 max-h-40 overflow-y-auto rounded-md border bg-popover shadow-md"
        >
          {contacts.length === 0 ? (
            <li role="option" aria-selected={false} className="px-3 py-2 text-sm text-muted-foreground">
              No contacts found
            </li>
          ) : (
            contacts.map(c => (
              <li
                key={c.id}
                role="option"
                aria-selected={false}
                data-testid={`contact-option-${c.id}`}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                onClick={() => onSelect(c)}
                onKeyDown={e => e.key === "Enter" && onSelect(c)}
                tabIndex={0}
              >
                <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="font-medium">{c.name}</span>
                <span className="text-muted-foreground">{c.handle}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
