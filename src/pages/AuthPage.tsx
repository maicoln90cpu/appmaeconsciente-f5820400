import { Auth } from "@/components/Auth";

const AuthPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
            Maternidade Consciente
          </h1>
          <p className="text-muted-foreground">
            Entre ou crie sua conta para começar
          </p>
        </div>
        <Auth />
      </div>
    </div>
  );
};

export default AuthPage;
