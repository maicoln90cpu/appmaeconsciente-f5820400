import { useCallback } from 'react';

export const SkipLink = () => {
  const handleSkip = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const main = document.getElementById('main-content');
    if (main) {
      main.focus();
      main.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <a href="#main-content" className="skip-link" onClick={handleSkip}>
      Pular para o conteúdo principal
    </a>
  );
};
