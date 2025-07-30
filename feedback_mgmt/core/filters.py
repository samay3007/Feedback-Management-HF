# core/filters.py

import django_filters
from .models import Feedback

class FeedbackFilter(django_filters.FilterSet):
    tag_name = django_filters.CharFilter(field_name='tags__name', lookup_expr='icontains')

    class Meta:
        model = Feedback
        fields = ['tags', 'tag_name', 'status', 'feedback_type', 'board']
