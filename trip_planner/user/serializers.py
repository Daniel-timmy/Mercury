from rest_framework import serializers
# from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import exceptions
from .models import User
import re

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the custom User model.
    Serializes all fields including manager, which is a nested user object.
    """
    manager = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='manager'),
        required=False,
        allow_null=True
    )

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'name',
            'role',
            'date_joined',
            'manager',
            'password',
            'is_active',
            'is_staff',
            'is_superuser',
        ]
        read_only_fields = ['id', 'date_joined', 'is_active', 'is_staff', 'is_superuser']
        write_only_fields = ['password']

    def validate_email(self, value):
        """
        Validate the email field.
        """
        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"

        if not value or not re.match(email_pattern, value):
            raise serializers.ValidationError("A valid email address is required.")
        if User.objects.filter(email=value).exclude(pk=self.instance.pk if self.instance else None).exists():
            raise serializers.ValidationError("Email already exists.")
        return value

    def validate_name(self, value):
        """
        Validate the name field.
        """
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("Name is required.")
        return value

    def validate_role(self, value):
        """
        Validate the role field.
        """
        valid_roles = ['admin', 'manager', 'driver']
        if value not in valid_roles:
            raise serializers.ValidationError(f"Role must be one of {valid_roles}.")
        return value

    def validate_manager(self, value):
        """
        Validate the manager field.
        Ensure that manager is only set if the user role is 'driver'.
        """
        role = self.initial_data.get('role') if hasattr(self, 'initial_data') and self.initial_data else None
        if role != 'driver' and value is not None:
            raise serializers.ValidationError("Manager can only be set for users with role 'driver'.")
        # Check if manager exists in DB and has role 'manager'
        if value is not None:
            try:
                manager_obj = User.objects.get(pk=value.pk, role='manager')
                return manager_obj
            except User.DoesNotExist:
                return None
        return value

    def validate(self, attrs):
        """
        Validate all non-read-only fields.
        """
        # Validate all non-read-only fields
        if 'email' in attrs:
            self.validate_email(attrs['email'])
        if 'name' in attrs:
            self.validate_name(attrs['name'])
        if 'role' in attrs:
            self.validate_role(attrs['role'])
        
        # manager validation is handled in validate_manager
        return attrs


# User = get_user_model()

# class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    # username_field = User.get_email_field_name()  

    # def validate(self, attrs):
    #     # Pop email and treat it as username
    #     print("CustomTokenObtainPairSerializer initialized with username_field:")

    #     email = attrs.get('email')
    #     password = attrs.get('password')

    #     if email and password:
    #         try:
    #             user = User.objects.get(email=email)
    #             print(user.password)
    #             if not user.check_password(password):
    #                 raise exceptions.AuthenticationFailed('No active account found with the given credentials')
    #             if not user.is_active:
    #                 raise exceptions.AuthenticationFailed('No active account found with the given credentials')
    #         except User.DoesNotExist:
    #             raise exceptions.AuthenticationFailed('No active account found with the given credentials')

    #         attrs['user'] = user
    #     else:
    #         raise exceptions.AuthenticationFailed('Must include email and password')
    #     print("CustomTokenObtainPairSerializer initialized with username_field:")
        

    #     return super().validate(attrs)