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


class FeedbackSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    upvote_count = serializers.SerializerMethodField()
    tags = TagSerializer(many=True, required=False)
    board = serializers.PrimaryKeyRelatedField(queryset=Board.objects.all())

    class Meta:
        model = Feedback
        fields = [
            'id', 'board', 'created_by', 'title', 'description',
            'feedback_type', 'status', 'upvote_count', 'tags', 
            'created_at', 'updated_at'
        ]

    def get_upvote_count(self, obj):
        return obj.upvotes.count()

    def create(self, validated_data):
        tags_data = validated_data.pop('tags', [])
        validated_data['created_by'] = self.context['request'].user
        feedback = Feedback.objects.create(**validated_data)

        for tag_data in tags_data:
            tag_name = tag_data.get('name')
            tag_obj, _ = Tag.objects.get_or_create(name=tag_name)
            feedback.tags.add(tag_obj)

        return feedback


    def update(self, instance, validated_data):
        tags_data = validated_data.pop('tags', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if tags_data is not None:
            instance.tags.clear()
            for tag_data in tags_data:
                tag_name = tag_data.get('name')
                tag_obj, _ = Tag.objects.get_or_create(name=tag_name)
                instance.tags.add(tag_obj)

        return instance


class CommentSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    feedback = serializers.PrimaryKeyRelatedField(queryset=Feedback.objects.all())

    class Meta:
        model = Comment
        fields = ['id', 'feedback', 'created_by', 'content', 'created_at', 'updated_at']



class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['role'] = user.role
        token['is_superuser'] = user.is_superuser
        return token
