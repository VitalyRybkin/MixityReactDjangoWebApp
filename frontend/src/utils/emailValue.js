import EmailLink from '../components/ui/EmailLink'

export const emailValue = (email) =>
    email ? <EmailLink email={email} sx={{ fontSize: '1.2rem', lineHeight: 1.1 }} /> : null