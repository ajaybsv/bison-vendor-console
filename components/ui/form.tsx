"use client";

import { Icon } from "@/components/ui/icon";

export function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="sv-check">
      <span className="sv-check__box">
        <input type="checkbox" className="sv-check__input" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="sv-check__mark">
          <Icon name="check" size={13} />
        </span>
      </span>
      <span>{children}</span>
    </label>
  );
}

export function Select({
  id,
  value,
  options,
  placeholder,
  onChange,
}: {
  id?: string;
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="sv-select__wrap">
      <select id={id} className="sv-field__input sv-select__input" value={value} onChange={(e) => onChange(e.target.value)}>
        {placeholder != null && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <span className="sv-select__icon">
        <Icon name="chevronDown" size={16} />
      </span>
    </div>
  );
}

export function SearchInput({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="sv-search">
      <Icon name="search" size={16} />
      <input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} aria-label={placeholder} />
    </div>
  );
}

/** A table row that navigates or acts on click and on Enter, as in the design's clickable rows. */
export function ClickRow({ onActivate, children }: { onActivate: () => void; children: React.ReactNode }) {
  return (
    <tr className="click" tabIndex={0} onClick={onActivate} onKeyDown={(e) => e.key === "Enter" && onActivate()}>
      {children}
    </tr>
  );
}
