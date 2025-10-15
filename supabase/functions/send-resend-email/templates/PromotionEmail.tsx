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

interface PromotionEmailProps {
  userName: string;
  promotionName: string;
  productTitle: string;
  durationDays: number;
  expiresAt: Date;
}

export const PromotionEmail = ({
  userName,
  promotionName,
  productTitle,
  durationDays,
  expiresAt,
}: PromotionEmailProps) => (
  <Html>
    <Head />
    <Preview>🎉 Promoção especial: {promotionName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🎉 {promotionName}</Heading>
        
        <Text style={text}>
          Olá, <strong>{userName}</strong>!
        </Text>
        
        <Text style={highlightText}>
          Temos uma surpresa especial para você! 🎁
        </Text>
        
        <Section style={promoBox}>
          <Text style={promoTitle}>Acesso Liberado:</Text>
          <Text style={productName}>{productTitle}</Text>
          <Text style={durationText}>
            ⏰ {durationDays} dias de acesso gratuito
          </Text>
          <Text style={expiresText}>
            Válido até: <strong>{new Date(expiresAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            })}</strong>
          </Text>
        </Section>
        
        <Text style={text}>
          Não perca essa oportunidade! Acesse agora e aproveite ao máximo esse período especial.
        </Text>
        
        <Link
          href="https://dashboard-enxovalcompleto.lovable.app/materiais"
          target="_blank"
          style={button}
        >
          Acessar Agora
        </Link>
        
        <Text style={footer}>
          Com carinho,<br />
          Equipe Mãe Consciente ❤️
        </Text>
      </Container>
    </Body>
  </Html>
)

export default PromotionEmail

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
  color: '#d32f2f',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 30px',
  padding: '0',
  textAlign: 'center' as const,
  textTransform: 'uppercase' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const highlightText = {
  color: '#d32f2f',
  fontSize: '18px',
  lineHeight: '28px',
  margin: '24px 0',
  textAlign: 'center' as const,
  fontWeight: '600',
}

const promoBox = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: '12px',
  padding: '32px 24px',
  margin: '32px 0',
  textAlign: 'center' as const,
}

const promoTitle = {
  color: '#fff',
  fontSize: '16px',
  margin: '0 0 16px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
}

const productName = {
  color: '#fff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 20px',
}

const durationText = {
  color: '#fff',
  fontSize: '18px',
  margin: '16px 0',
  fontWeight: '600',
}

const expiresText = {
  color: 'rgba(255, 255, 255, 0.9)',
  fontSize: '14px',
  margin: '16px 0 0',
}

const button = {
  backgroundColor: '#d32f2f',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '18px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '16px 24px',
  margin: '32px 0',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
}

const footer = {
  color: '#898989',
  fontSize: '14px',
  lineHeight: '22px',
  marginTop: '32px',
  textAlign: 'center' as const,
}
