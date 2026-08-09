from rest_framework.throttling import AnonRateThrottle


class LoginBurstRateThrottle(AnonRateThrottle):
    scope = "login_burst"


class LoginSustainedRateThrottle(AnonRateThrottle):
    scope = "login_sustained"