import * as React from "react";
import { Phone } from "lucide-react";
import { Input } from "./input";
import { cn } from "@/lib/utils";
import { formatWhatsApp } from "@/lib/validators/auth";

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value, onChange, error, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatWhatsApp(e.target.value);
      onChange(formatted);
    };

    return (
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={ref}
          type="tel"
          value={value}
          onChange={handleChange}
          placeholder="(11) 99999-9999"
          className={cn(
            "pl-10",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
