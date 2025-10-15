import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface PurchaseApprovedEmailProps {
  userName: string;
  email: string;
  password: string;
  productTitle: string;
  expiresAt?: Date;
}

export const PurchaseApprovedEmail = ({
  userName,
  email,
  password,
  productTitle,
  expiresAt,
}: PurchaseApprovedEmailProps) => (
  <Html>
    <Head />
    <Preview>Compra aprovada - Bem-vindo(a)!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>✅ Compra Aprovada!</Heading>
        
        <Text style={text}>
          Olá, <strong>{userName}</strong>!
        </Text>
        
        <Text style={successText}>
          🎉 Sua compra do produto <strong>{productTitle}</strong> foi confirmada com sucesso!
        </Text>
        
        <Section style={accessBox}>
          <Text style={accessTitle}>Seus Dados de Acesso:</Text>
          
          <Text style={credentialsLabel}>📧 Email:</Text>
          <Text style={credentialsValue}>{email}</Text>
          
          <Text style={credentialsLabel}>🔑 Senha:</Text>
          <Text style={passwordText}>{password}</Text>
          
          {expiresAt && (
            <Text style={expiresInfo}>
              ⏰ Seu acesso expira em: {new Date(expiresAt).toLocaleDateString('pt-BR')}
            </Text>
          )}
          
          {!expiresAt && (
            <Text style={lifetimeText}>
              ♾️ Você tem acesso vitalício a este produto!
            </Text>
          )}
        </Section>
        
        <Text style={warningText}>
          ⚠️ <strong>Importante:</strong> Por segurança, recomendamos que você altere sua senha após o primeiro acesso.
        </Text>
        
        <Link
          href="https://dashboard-enxovalcompleto.lovable.app"
          target="_blank"
          style={button}
        >
          Acessar Plataforma
        </Link>
        
        <Text style={footer}>
          Se você tiver qualquer dúvida, entre em contato com nosso suporte.<br />
          Equipe Mãe Consciente
        </Text>
      </Container>
    </Body>
  </Html>
)

export default PurchaseApprovedEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  marginBottom: '64px',
  maxWidth: '600px',
  borderRadius: '8px',
}

const h1 = {
  color: '#4caf50',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 30px',
  padding: '0',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const successText = {
  color: '#2e7d32',
  fontSize: '18px',
  lineHeight: '28px',
  margin: '24px 0',
  padding: '20px',
  backgroundColor: '#e8f5e9',
  borderRadius: '8px',
  textAlign: 'center' as const,
}

const accessBox = {
  backgroundColor: '#f4f4f4',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  border: '2px solid #4caf50',
}

const accessTitle = {
  color: '#2e7d32',
  fontSize: '18px',
  margin: '0 0 16px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
}

const credentialsLabel = {
  color: '#666',
  fontSize: '14px',
  margin: '12px 0 4px',
  fontWeight: '600',
}

const credentialsValue = {
  color: '#333',
  fontSize: '16px',
  margin: '0 0 16px',
  fontFamily: 'monospace',
}

const passwordText = {
  color: '#333',
  fontSize: '20px',
  margin: '0 0 16px',
  fontFamily: 'monospace',
  fontWeight: 'bold',
  backgroundColor: '#fff',
  padding: '12px',
  borderRadius: '4px',
}

const expiresInfo = {
  color: '#d97706',
  fontSize: '14px',
  margin: '16px 0 0',
  textAlign: 'center' as const,
  fontStyle: 'italic',
}

const lifetimeText = {
  color: '#2e7d32',
  fontSize: '16px',
  margin: '16px 0 0',
  textAlign: 'center' as const,
  fontWeight: 'bold',
}

const warningText = {
  color: '#d97706',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '24px 0',
  padding: '16px',
  backgroundColor: '#fef3c7',
  borderRadius: '6px',
}

const button = {
  backgroundColor: '#4caf50',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '14px 20px',
  margin: '24px 0',
  fontWeight: '600',
}

const footer = {
  color: '#898989',
  fontSize: '14px',
  lineHeight: '22px',
  marginTop: '32px',
  textAlign: 'center' as const,
}
