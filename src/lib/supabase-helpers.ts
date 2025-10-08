import { supabase } from "@/integrations/supabase/client";

// Helper para contornar problemas de tipos do Supabase quando o schema não está sincronizado
// @ts-ignore
export const supabaseQuery = {
  from: (table: string) => {
    // @ts-ignore
    return supabase.from(table);
  },
};
