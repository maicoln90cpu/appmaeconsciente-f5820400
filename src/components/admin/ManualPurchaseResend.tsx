import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Product {
  id: string;
  title: string;
}

export const ManualPurchaseResend = () => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [forceNewPassword, setForceNewPassword] = useState(false);
  const { toast } = useToast();

  // Carregar produtos
  useState(() => {
    const loadProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, title')
        .eq('is_active', true)
        .order('title');
      
      if (data) setProducts(data);
    };
    loadProducts();
  });

  const handleResend = async () => {
    if (!buyerEmail || !buyerName || !selectedProduct) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha email, nome e produto",
        variant: "destructive",
      });
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(buyerEmail)) {
      toast({
        title: "Email inválido",
        description: "Verifique o formato do email",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('resend-purchase-credentials', {
        body: {
          buyer_email: buyerEmail.toLowerCase().trim(),
          buyer_name: buyerName.trim(),
          product_id: selectedProduct,
          transaction_id: transactionId || undefined,
          force_new_password: forceNewPassword,
        }
      });

      if (error) {
        console.error('Erro ao reenviar:', error);
        toast({
          title: "Erro ao reenviar",
          description: error.message || "Erro desconhecido",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: data.success ? "✅ Sucesso!" : "⚠️ Parcialmente concluído",
        description: data.message || (
          <>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Acesso concedido</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-500" />
              <span>Email enviado para {buyerEmail}</span>
            </div>
            {data.isNewUser && (
              <div className="mt-2 text-sm text-muted-foreground">
                • Novo usuário criado
              </div>
            )}
            {data.passwordGenerated && (
              <div className="text-sm text-muted-foreground">
                • Nova senha gerada
              </div>
            )}
            {data.warning && (
              <div className="flex items-center gap-2 mt-2 text-yellow-600">
                <AlertCircle className="h-4 w-4" />
                <span>{data.warning}</span>
              </div>
            )}
          </>
        ),
      });

      // Limpar formulário
      setBuyerEmail("");
      setBuyerName("");
      setSelectedProduct("");
      setTransactionId("");
      setForceNewPassword(false);

    } catch (err: any) {
      console.error('Exceção ao reenviar:', err);
      toast({
        title: "Erro",
        description: err.message || "Erro ao processar requisição",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Reenviar Credenciais de Compra Manualmente
        </CardTitle>
        <CardDescription>
          Use esta ferramenta para reprocessar compras com erro ou reenviar credenciais manualmente.
          O sistema irá criar/atualizar o usuário, conceder acesso ao produto e enviar o email.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="buyer-email">Email do Comprador *</Label>
          <Input
            id="buyer-email"
            type="email"
            placeholder="isabela_vitoriass23@hotmail.com"
            value={buyerEmail}
            onChange={(e) => setBuyerEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="buyer-name">Nome do Comprador *</Label>
          <Input
            id="buyer-name"
            placeholder="Isabela Vitória"
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="product">Produto Comprado *</Label>
          <Select 
            value={selectedProduct} 
            onValueChange={setSelectedProduct}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o produto" />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="transaction-id">ID da Transação (Opcional)</Label>
          <Input
            id="transaction-id"
            placeholder="HP0991860675"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            ID da transação Hotmart para registro no histórico
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="force-password" 
            checked={forceNewPassword}
            onCheckedChange={(checked) => setForceNewPassword(checked === true)}
            disabled={loading}
          />
          <label
            htmlFor="force-password"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Gerar nova senha (mesmo se usuário já existir)
          </label>
        </div>

        <Button 
          onClick={handleResend} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Enviar Credenciais
            </>
          )}
        </Button>

        <div className="bg-muted p-4 rounded-lg text-sm">
          <p className="font-semibold mb-2">ℹ️ O que acontece ao clicar em "Enviar Credenciais":</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Cria usuário se não existir (ou usa existente)</li>
            <li>Gera senha aleatória segura (se novo ou forçado)</li>
            <li>Concede acesso ao produto selecionado</li>
            <li>Envia email com credenciais de acesso</li>
            <li>Registra a transação no histórico</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
