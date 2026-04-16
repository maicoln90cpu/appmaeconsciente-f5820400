# 🤝 Guia de Contribuição

Obrigado por considerar contribuir para o projeto! Este documento fornece diretrizes para manter a qualidade e consistência do código.

## 📋 Antes de Começar

1. Leia o `README.md` para entender o projeto
2. Verifique as issues existentes antes de criar uma nova
3. Para mudanças grandes, abra uma issue para discussão primeiro

## 🔧 Configuração do Ambiente

```bash
# Clone o repositório
git clone <repo-url>

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

## 📁 Estrutura de Arquivos

### Criando um Novo Componente

```
src/components/meu-modulo/
├── MeuComponente.tsx      # Componente principal
├── MeuComponente.test.tsx # Testes (opcional)
└── index.ts               # Re-export (se necessário)
```

### Criando um Novo Hook

```
src/hooks/
└── useMeuHook.ts          # Hook com JSDoc
```

## ✍️ Padrões de Código

### TypeScript

- Use tipos explícitos para props e retornos de função
- Prefira `interface` para objetos, `type` para unions
- Evite `any` - use `unknown` quando necessário

```typescript
// ✅ Bom
interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
}

// ❌ Evitar
const handleClick = (data: any) => { ... }
```

### React

- Use componentes funcionais
- Prefira composição sobre herança
- Extraia lógica complexa para hooks customizados

```typescript
// ✅ Bom - Hook extraído
function useFormValidation() {
  // lógica de validação
}

function MyForm() {
  const { validate, errors } = useFormValidation();
  // ...
}
```

### Estilização

- Use classes Tailwind
- Use tokens semânticos do design system
- Evite estilos inline

```typescript
// ✅ Bom - Tokens semânticos
<div className="bg-background text-foreground">

// ❌ Evitar - Cores hardcoded
<div className="bg-white text-black">
```

### Imports

Siga a ordem:
1. React
2. Bibliotecas externas
3. Componentes internos (@/components)
4. Hooks (@/hooks)
5. Utilitários (@/lib)
6. Types

## 🧪 Testes

### Executando Testes

```bash
# Todos os testes
npm run test

# Com watch mode
npm run test -- --watch

# Com coverage
npm run test -- --coverage
```

### Escrevendo Testes

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## 📝 Commits

Use mensagens descritivas:

```
feat: adiciona filtro de categorias na lista de produtos
fix: corrige validação de email no formulário de cadastro
docs: atualiza documentação do hook useProfile
refactor: extrai lógica de cálculo para função utilitária
test: adiciona testes para componente Button
```

## 🔍 Code Review

Antes de submeter:

- [ ] Código segue os padrões estabelecidos
- [ ] Testes passando (`npm run test`)
- [ ] Sem erros de lint (`npm run lint`)
- [ ] Documentação atualizada (se aplicável)
- [ ] Componentes acessíveis (labels, ARIA)

## 🐛 Reportando Bugs

Inclua:
1. Descrição clara do problema
2. Passos para reproduzir
3. Comportamento esperado vs atual
4. Screenshots (se aplicável)
5. Ambiente (navegador, OS)

## 💡 Sugerindo Features

1. Verifique se já não existe uma issue similar
2. Descreva o problema que a feature resolve
3. Proponha uma solução (opcional)
4. Considere impacto em outras áreas do sistema

## 📚 Recursos Úteis

- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Vitest](https://vitest.dev)
- [Testing Library](https://testing-library.com)

---

Dúvidas? Abra uma issue ou entre em contato com a equipe!
