from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BoardViewSet, FeedbackViewSet, CommentViewSet, TagViewSet
from .views_auth import CustomTokenObtainPairView, register_user
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'boards', BoardViewSet, basename='boards')
router.register(r'feedback', FeedbackViewSet, basename='feedback')
router.register(r'comments', CommentViewSet, basename='comments')
router.register(r'tags', TagViewSet, basename='tags')

urlpatterns = [
    path('', include(router.urls)),
    
    # Auth endpoints
    path('auth/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Register
    path('register/', register_user, name='register_user'),
]
