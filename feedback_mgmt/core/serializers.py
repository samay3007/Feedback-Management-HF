from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Board, Feedback, Comment, Tag, BoardMembership


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            role=validated_data.get('role', 'contributor'),
        )
        return user


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']


class BoardSerializer(serializers.ModelSerializer):
    members = UserSerializer(many=True, read_only=True)

    class Meta:
        model = Board
        fields = ['id', 'name', 'description', 'is_public', 'members', 'created_at', 'updated_at']

    def create(self, validated_data):
        board = Board.objects.create(**validated_data)
        user = self.context['request'].user
        BoardMembership.objects.create(user=user, board=board)
        return board


class FeedbackSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    upvote_count = serializers.SerializerMethodField()

    tags = TagSerializer(many=True, read_only=True)

    tag_names = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
        help_text="List of new tag names to create or reuse"
    )
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(),
        many=True,
        write_only=True,
        required=False,
        help_text="List of existing tag IDs to link"
    )

    board = serializers.PrimaryKeyRelatedField(queryset=Board.objects.all())

    class Meta:
        model = Feedback
        fields = [
            'id', 'title', 'description', 'status', 'feedback_type',
            'created_at', 'created_by', 'created_by_username',
            'board', 'tags', 'tag_ids', 'tag_names', 'upvote_count'
        ]

    def get_upvote_count(self, obj):
        return obj.upvotes.count()

    def _process_tags(self, instance, tag_names=None, tag_ids=None):
        all_tags = list(tag_ids) if tag_ids else []

        if tag_names:
            for name in tag_names:
                clean_name = name.strip()
                if clean_name:
                    tag, _ = Tag.objects.get_or_create(
                        name__iexact=clean_name,
                        defaults={'name': clean_name}
                    )
                    if tag not in all_tags:
                        all_tags.append(tag)

        instance.tags.set(all_tags)

    def create(self, validated_data):
        tag_names = validated_data.pop('tag_names', [])
        tag_ids = validated_data.pop('tag_ids', [])

        # Ensure created_by doesn't sneak in and cause double pass
        validated_data.pop('created_by', None)

        user = self.context['request'].user
        feedback = Feedback.objects.create(created_by=user, **validated_data)

        self._process_tags(feedback, tag_names, tag_ids)
        return feedback

    def update(self, instance, validated_data):
        tag_names = validated_data.pop('tag_names', None)
        tag_ids = validated_data.pop('tag_ids', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if tag_names is not None or tag_ids is not None:
            self._process_tags(instance, tag_names or [], tag_ids or [])

        return instance


class CommentSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'content', 'feedback', 'created_by', 'created_at']
        read_only_fields = ['created_by', 'created_at']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['role'] = user.role
        token['is_superuser'] = user.is_superuser
        return token
