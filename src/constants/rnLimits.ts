import { RNLimit } from "@/types/enxoval";

export const DEFAULT_RN_LIMITS: RNLimit[] = [
  { 
    item: "Bodies (curta+longa)", 
    limite: 6, 
    quando_aumentar: "+2 se clima frio", 
    observacoes: "Priorize tamanho P no restante do enxoval." 
  },
  { 
    item: "Mijões/Calças", 
    limite: 4, 
    quando_aumentar: "+2 se clima frio", 
    observacoes: "Elástico suave; prefira com pé reversível." 
  },
  { 
    item: "Macacões", 
    limite: 3, 
    quando_aumentar: "+1 se clima frio", 
    observacoes: "Abertura frontal facilita trocas." 
  },
  { 
    item: "Meias", 
    limite: 6, 
    quando_aumentar: "+2 no frio", 
    observacoes: "Dispensa \"sapato RN\"." 
  },
  { 
    item: "Gorro", 
    limite: 1, 
    quando_aumentar: "1 se frio", 
    observacoes: "Use só em ambientes frios." 
  },
  { 
    item: "Luvas", 
    limite: 0, 
    quando_aumentar: "1 par se quiser", 
    observacoes: "Melhor manter unhas aparadas (mais confortável)." 
  },
  { 
    item: "Casaquinho/Coletes", 
    limite: 1, 
    quando_aumentar: "1 no frio", 
    observacoes: "Evite peças volumosas." 
  },
  { 
    item: "Saída de maternidade", 
    limite: 1, 
    quando_aumentar: "—", 
    observacoes: "Opte por conjunto reutilizável." 
  },
  { 
    item: "Bodies RN manga curta", 
    limite: 3, 
    quando_aumentar: "+1 no calor", 
    observacoes: "Pode combinar com manga longa para 6 no total." 
  },
  { 
    item: "Bodies RN manga longa", 
    limite: 3, 
    quando_aumentar: "+1 no frio", 
    observacoes: "—" 
  },
  { 
    item: "Shorts/culotes leves", 
    limite: 2, 
    quando_aumentar: "+2 no calor", 
    observacoes: "Só se for verão intenso." 
  },
  { 
    item: "Sapatos RN", 
    limite: 0, 
    quando_aumentar: "—", 
    observacoes: "Dispensável; use meias." 
  },
];
