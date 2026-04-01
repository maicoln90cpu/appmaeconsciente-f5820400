import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmailFieldProps {
  email: string;
  setEmail: (v: string) => void;
  loading: boolean;
  error?: string;
}

export const EmailField = ({ email, setEmail, loading, error }: EmailFieldProps) => (
  <div className="space-y-2">
    <Label htmlFor="email">Email</Label>
    <div className="relative">
      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        id="email"
        type="email"
        placeholder="seu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={loading}
        className={cn("pl-10", error && "border-destructive focus-visible:ring-destructive")}
      />
    </div>
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);
