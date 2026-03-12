import EmailLink from '../components/ui/buttons/EmailLink.jsx'

export const emailValue = (email) =>
    email ? <EmailLink email={email} sx={{ fontSize: '1.2rem', lineHeight: 1.1 }} /> : null
