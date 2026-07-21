import { ReactNode } from 'react';

interface CampoProps {
  id: string;
  label: string;
  erro?: string;
  children: ReactNode;
}

export function Campo({ id, label, erro, children }: CampoProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
      {erro && (
        <p id={`${id}-erro`} role="alert" className="text-sm text-red-600">
          {erro}
        </p>
      )}
    </div>
  );
}
