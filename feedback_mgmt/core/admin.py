from django.contrib import admin #tocloseissue2
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Board, Feedback, Comment, Tag, BoardMembership

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Role', {'fields': ('role',)}),
    )

@admin.register(Board)
class BoardAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_public', 'created_at')

@admin.register(BoardMembership)
class BoardMembershipAdmin(admin.ModelAdmin):
    list_display = ('user', 'board', 'joined_at')

@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('title', 'board', 'status', 'created_by', 'created_at')
    list_filter = ('status', 'feedback_type', 'board')
    search_fields = ('title', 'description')
    filter_horizontal = ('tags',) 
@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('feedback', 'created_by', 'created_at')

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)