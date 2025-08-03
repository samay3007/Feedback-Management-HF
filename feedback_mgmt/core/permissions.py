#implemented role based user models

from rest_framework import permissions
from .models import Board, BoardMembership

from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    """
    Allows access only to users with role 'admin'.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'



class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission to allow only the creator or admin to edit/delete.
    Assumes model instance has 'created_by' attribute.
    """
    def has_object_permission(self, request, view, obj):
        return request.user.role == 'admin' or obj.created_by == request.user

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated


class IsBoardMemberOrPublic(permissions.BasePermission):
    """
    Allows access if board is public or user is a member of the board.
    Applies to object-level permissions on Board, Feedback, Comment.
    """

    def has_object_permission(self, request, view, obj):
        # Determine the board for this object
        board = getattr(obj, 'board', None)
        if board is None and isinstance(obj, Board):
            board = obj

        if board.is_public:
            return True

        # Check membership if board is private
        return BoardMembership.objects.filter(board=board, user=request.user).exists()

    def has_permission(self, request, view):
        # For list views, permission is granted, filtering happens at queryset level
        return request.user and request.user.is_authenticated