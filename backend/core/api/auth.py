from rest_framework_simplejwt.views import TokenObtainPairView

from core.api.throttles import (
    LoginBurstRateThrottle,
    LoginSustainedRateThrottle,
)


class LoginTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [
        LoginBurstRateThrottle,
        LoginSustainedRateThrottle,
    ]