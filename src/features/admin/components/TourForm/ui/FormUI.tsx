import React from 'react';
import { useFormContext } from 'react-hook-form';
import { clsx } from 'clsx';

// === ОБЫЧНЫЙ INPUT ===
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  helperText?: string;
}

export const FormInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, name, className, helperText, ...props }, ref) => {
    const { register, formState: { errors } } = useFormContext();
    const error = errors[name]?.message as string;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-xs font-bold uppercase text-slate-600 flex items-center gap-2 tracking-wide">
          {label}
        </label>
        <input
          {...register(name)}
          {...props}
          className={clsx(
            "w-full rounded-lg px-4 py-3 text-sm font-semibold transition-all outline-none shadow-sm",
            // Цвета: Белый фон, серая рамка. При фокусе - бирюзовая рамка.
            "bg-white border placeholder:text-slate-300",
            error 
              ? "border-rose-500 focus:ring-4 focus:ring-rose-100 text-rose-900" 
              : "border-slate-300 hover:border-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 text-slate-800",
            className
          )}
        />
        {helperText && !error && <span className="text-[12px] text-slate-300 font-medium">{helperText}</span>}
        {error && <span className="text-xs text-rose-500 font-bold animate-fadeIn">{error}</span>}
      </div>
    );
  }
);
FormInput.displayName = "FormInput";

// === TEXTAREA (Расширяемая) ===
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  name: string;
}

export const FormTextarea = ({ label, name, className, ...props }: TextareaProps) => {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[name]?.message as string;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-xs font-bold uppercase text-slate-600 tracking-wide">{label}</label>
      <textarea
        {...register(name)}
        {...props}
        className={clsx(
          "w-full rounded-lg px-4 py-3 text-sm font-medium transition-all outline-none shadow-sm resize-y", // resize-y позволяет тянуть
          "bg-white border placeholder:text-slate-300 min-h-[100px]",
          error 
             ? "border-rose-500 focus:ring-4 focus:ring-rose-100" 
             : "border-slate-300 hover:border-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 text-slate-800",
          className
        )}
      />
      {error && <span className="text-xs text-rose-500 font-bold">{error}</span>}
    </div>
  );
};

// === SWITCH (TOGGLE) ===
export const FormSwitch = ({ name, label }: { name: string; label: string }) => {
  const { register, watch } = useFormContext();
  const checked = watch(name);

  return (
    <label className="flex items-center gap-3 cursor-pointer group select-none py-1">
      <div className="relative">
        <input type="checkbox" className="sr-only" {...register(name)} />
        <div className={clsx("w-11 h-6 rounded-full transition-colors shadow-inner", checked ? "bg-teal-500" : "bg-slate-300 group-hover:bg-slate-400")} />
        <div className={clsx("absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200", checked ? "translate-x-5" : "translate-x-0")} />
      </div>
      <span className={clsx("text-sm font-bold", checked ? "text-slate-800" : "text-slate-300")}>
        {label}
      </span>
    </label>
  );
};

// === SELECT ===
export const FormSelect = ({ name, label, options }: { name: string, label: string, options: { value: string, label: string }[] }) => {
  const { register } = useFormContext();
  
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase text-slate-600 tracking-wide">{label}</label>
      <div className="relative">
        <select 
          {...register(name)}
          className="w-full appearance-none rounded-lg px-4 py-3 text-sm font-bold bg-white border border-slate-300 hover:border-slate-400 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 text-slate-800 shadow-sm cursor-pointer"
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="absolute right-3 top-3.5 pointer-events-none text-slate-300">
           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
        </div>
      </div>
    </div>
  );
};