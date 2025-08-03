from django.db import models
from rest_framework import viewsets, filters, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import User, Board, Feedback, Comment, Tag, BoardMembership
from .serializers import (
    UserSerializer, BoardSerializer, FeedbackSerializer, CommentSerializer, TagSerializer
)
from .permissions import IsAdmin, IsOwnerOrAdmin, IsBoardMemberOrPublic
from rest_framework import viewsets, permissions
from .models import Tag
from .serializers import TagSerializer
from .permissions import IsAdmin


class BoardViewSet(viewsets.ModelViewSet):
    """
    Boards: list and retrieve accessible by all members or public.
    Create, update, delete restricted to admins only.
    """
    queryset = Board.objects.all()
    serializer_class = BoardSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['name', 'is_public']
    search_fields = ['name', 'description']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'add_member']:
            permission_classes = [IsAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated, IsBoardMemberOrPublic]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        return Board.objects.filter(
            models.Q(is_public=True) | 
            models.Q(members=user)
        ).distinct()

    @action(detail=True, methods=['post'], url_path='add-member', permission_classes=[IsAdmin])
    def add_member(self, request, pk=None):
        board = self.get_object()
        username = request.data.get('username')
        if not username:
            return Response({'detail': 'username required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user_to_add = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        BoardMembership.objects.get_or_create(user=user_to_add, board=board)
        return Response({'detail': f'User {username} added to board.'})


from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, CharFilter
from .models import Feedback
from .serializers import FeedbackSerializer
from .permissions import IsBoardMemberOrPublic, IsOwnerOrAdmin


# Custom FilterSet to enable tag_name filtering
class FeedbackFilter(FilterSet):
    tag_name = CharFilter(field_name='tags__name', lookup_expr='icontains')

    class Meta:
        model = Feedback
        fields = ['status', 'feedback_type', 'board', 'tags', 'tag_name']


class FeedbackViewSet(viewsets.ModelViewSet):
    serializer_class = FeedbackSerializer
    queryset = Feedback.objects.all()

    # Filtering, searching, ordering
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter,
    ]
    filterset_class = FeedbackFilter  # ✅ Use custom filter
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'upvotes', 'title', 'status']
    ordering = ['-upvotes']

    def get_queryset(self):
        user = self.request.user
        return Feedback.objects.select_related('board', 'created_by') \
            .prefetch_related('tags', 'upvotes') \
            .filter(
                models.Q(board__is_public=True) |
                models.Q(board__members=user)
            ).distinct()

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsOwnerOrAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated, IsBoardMemberOrPublic]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


    @action(detail=True, methods=['post'], url_path='upvote', permission_classes=[permissions.IsAuthenticated])
    def upvote(self, request, pk=None):
        feedback = self.get_object()
        user = request.user

        if feedback.upvotes.filter(id=user.id).exists():
            feedback.upvotes.remove(user)
            return Response({'detail': 'Upvote removed.'})
        else:
            feedback.upvotes.add(user)
            return Response({'detail': 'Upvoted successfully.'})

    @action(detail=True, methods=['post'], url_path='move', permission_classes=[permissions.IsAuthenticated])
    def move(self, request, pk=None):
        feedback = self.get_object()
        user = request.user

        if user.role != 'admin':
            return Response({'detail': 'Only admins can move feedbacks.'}, status=status.HTTP_403_FORBIDDEN)

        new_status = request.data.get('status')
        if new_status not in dict(Feedback.STATUS_CHOICES):
            return Response({'detail': 'Invalid status.'}, status=status.HTTP_400_BAD_REQUEST)

        feedback.status = new_status
        feedback.save()
        return Response({'detail': f'Status changed to {new_status}', 'new_status': new_status})




from rest_framework import viewsets, permissions
from django.db import models
from .models import Comment
from .serializers import CommentSerializer
from .permissions import IsOwnerOrAdmin, IsBoardMemberOrPublic


class CommentViewSet(viewsets.ModelViewSet):
    """
    Comments: list/retrieve allowed for board members or public.
    Updates/deletes allowed for comment creator or admins.
    """
    serializer_class = CommentSerializer

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsOwnerOrAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated, IsBoardMemberOrPublic]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        feedback_id = self.request.query_params.get('feedback')

        queryset = Comment.objects.filter(
            models.Q(feedback__board__is_public=True) |
            models.Q(feedback__board__members=user)
        ).select_related('feedback', 'created_by')

        if feedback_id:
            queryset = queryset.filter(feedback_id=feedback_id)

        return queryset.order_by('created_at')  # oldest to newest

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class TagViewSet(viewsets.ModelViewSet):
    """
    Tag API:
    - Anyone (even unauthenticated) can list and retrieve tags.
    - Authenticated users can create new tags.
    - Only admins can update or delete tags.
    """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]



