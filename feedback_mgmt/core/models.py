from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    # Add role choices: Admin, Moderator, Contributor
    ADMIN = 'admin'
    MODERATOR = 'moderator'
    CONTRIBUTOR = 'contributor'

    ROLE_CHOICES = [
        (ADMIN, 'Admin'),
        (MODERATOR, 'Moderator'),
        (CONTRIBUTOR, 'Contributor'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=CONTRIBUTOR)

    def __str__(self):
        return f"{self.username} ({self.role})"


class Board(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=True)

    members = models.ManyToManyField(
        User,
        related_name='boards',
        through='BoardMembership',
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
  
    def __str__(self):
        return self.name


class BoardMembership(models.Model):
    """
    Through model to add members to boards with metadata if required later.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    board = models.ForeignKey(Board, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'board')


class Feedback(models.Model):
    STATUS_OPEN = 'open'
    STATUS_PROGRESS = 'in_progress'
    STATUS_COMPLETED = 'completed'

    STATUS_CHOICES = [
        (STATUS_OPEN, 'Open'),
        (STATUS_PROGRESS, 'In Progress'),
        (STATUS_COMPLETED, 'Completed'),
    ]

    TYPE_FEATURE = 'feature'
    TYPE_BUG = 'bug'
    TYPE_SUGGESTION = 'suggestion'

    TYPE_CHOICES = [
        (TYPE_FEATURE, 'Feature Request'),
        (TYPE_BUG, 'Bug Report'),
        (TYPE_SUGGESTION, 'Suggestion'),
    ]

    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='feedbacks')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_feedbacks')

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    feedback_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_FEATURE)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_OPEN)

    upvotes = models.ManyToManyField(User, related_name='upvoted_feedbacks', blank=True)  # voters

    tags = models.ManyToManyField('Tag', blank=True, related_name='feedbacks')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def upvote_count(self):
        return self.upvotes.count()

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"


class Comment(models.Model):
    feedback = models.ForeignKey(Feedback, on_delete=models.CASCADE, related_name='comments')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='comments')

    content = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Comment by {self.created_by} on {self.feedback}"


class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name