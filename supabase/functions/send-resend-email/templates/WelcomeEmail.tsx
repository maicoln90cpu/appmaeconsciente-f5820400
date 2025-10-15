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

interface WelcomeEmailProps {
  userName: string;
  email: string;
  password: string;
}

export const WelcomeEmail = ({
  userName,
  email,
  password,
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Bem-vindo(a) à Mãe Consciente!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🎉 Bem-vindo(a) à Mãe Consciente!</Heading>
        
        <Text style={text}>
          Olá, <strong>{userName}</strong>!
        </Text>
        
        <Text style={text}>
          Sua conta foi criada com sucesso! Use as credenciais abaixo para fazer login:
        </Text>
        
        <Section style={credentialsBox}>
          <Text style={credentialsLabel}>📧 Email:</Text>
          <Text style={credentialsValue}>{email}</Text>
          
          <Text style={credentialsLabel}>🔑 Senha Temporária:</Text>
          <Text style={passwordText}>{password}</Text>
        </Section>
        
        <Text style={warningText}>
          ⚠️ <strong>Importante:</strong> Recomendamos que você altere sua senha após o primeiro acesso.
        </Text>
        
        <Link
          href="https://dashboard-enxovalcompleto.lovable.app"
          target="_blank"
          style={button}
        >
          Acessar Plataforma
        </Link>
        
        <Text style={footer}>
          Se você tiver qualquer dúvida, entre em contato com nosso suporte.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default WelcomeEmail

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
  color: '#333',
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

const credentialsBox = {
  backgroundColor: '#f4f4f4',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  border: '2px solid hsl(263, 70%, 50%)',
}

const credentialsLabel = {
  color: '#666',
  fontSize: '14px',
  margin: '8px 0 4px',
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
  margin: '0',
  fontFamily: 'monospace',
  fontWeight: 'bold',
  backgroundColor: '#fff',
  padding: '12px',
  borderRadius: '4px',
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
  backgroundColor: 'hsl(263, 70%, 50%)',
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
