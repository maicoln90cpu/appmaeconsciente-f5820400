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

interface TrialProduct {
  product_title: string;
  trial_days: number;
  expires_at: Date;
}

interface TrialEmailProps {
  userName: string;
  trialProducts: TrialProduct[];
}

export const TrialEmail = ({
  userName,
  trialProducts,
}: TrialEmailProps) => (
  <Html>
    <Head />
    <Preview>Você ganhou acesso trial gratuito! 🎁</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🎁 Presente de Boas-Vindas!</Heading>
        
        <Text style={text}>
          Olá, <strong>{userName}</strong>!
        </Text>
        
        <Text style={text}>
          Como presente de boas-vindas, você ganhou acesso gratuito aos seguintes materiais:
        </Text>
        
        {trialProducts.map((product, index) => (
          <Section key={index} style={trialBox}>
            <Text style={productTitle}>{product.product_title}</Text>
            <Text style={trialInfo}>
              ⏰ <strong>{product.trial_days} dias</strong> de acesso gratuito
            </Text>
            <Text style={expiresInfo}>
              Expira em: {new Date(product.expires_at).toLocaleDateString('pt-BR')}
            </Text>
          </Section>
        ))}
        
        <Text style={text}>
          Aproveite ao máximo esse período para conhecer nossos conteúdos!
        </Text>
        
        <Link
          href="https://dashboard-enxovalcompleto.lovable.app/materiais"
          target="_blank"
          style={button}
        >
          Acessar Materiais
        </Link>
        
        <Text style={footer}>
          Equipe Mãe Consciente
        </Text>
      </Container>
    </Body>
  </Html>
)

export default TrialEmail

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

const trialBox = {
  backgroundColor: '#e8f5e9',
  borderRadius: '8px',
  padding: '20px',
  margin: '16px 0',
  borderLeft: '4px solid #4caf50',
}

const productTitle = {
  color: '#1b5e20',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px',
}

const trialInfo = {
  color: '#2e7d32',
  fontSize: '16px',
  margin: '8px 0',
}

const expiresInfo = {
  color: '#666',
  fontSize: '14px',
  margin: '8px 0 0',
  fontStyle: 'italic',
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
