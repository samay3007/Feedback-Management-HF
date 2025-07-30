from rest_framework import serializers
from .models import User, Board, Feedback, Comment, Tag, BoardMembership
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'password']  # ✅ include password

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


# serializers.py

class FeedbackSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    upvote_count = serializers.SerializerMethodField()
    tags = TagSerializer(many=True, read_only=True)
    tag_names = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    board = serializers.PrimaryKeyRelatedField(queryset=Board.objects.all())
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(),
        many=True,
        write_only=True,
        source='tags'
    )

    class Meta:
        model = Feedback
        fields = [
            'id', 'title', 'description', 'status', 'feedback_type',
            'created_at', 'board', 'created_by', 'upvote_count',
            'tags', 'tag_names','tag_ids'
        ]

    def get_upvote_count(self, obj):
        return obj.upvotes.count()

    def create(self, validated_data):
        tag_names = validated_data.pop('tag_names', [])
        user = self.context['request'].user
        feedback = Feedback.objects.create(created_by=user, **validated_data)

        for name in tag_names:
            tag, _ = Tag.objects.get_or_create(name=name.strip())
            feedback.tags.add(tag)

        return feedback

    def update(self, instance, validated_data):
        tag_names = validated_data.pop('tag_names', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if tag_names is not None:
            instance.tags.clear()
            for name in tag_names:
                tag, _ = Tag.objects.get_or_create(name=name.strip())
                instance.tags.add(tag)

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
