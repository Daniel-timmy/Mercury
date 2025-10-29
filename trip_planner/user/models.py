from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.core.exceptions import ValidationError
import uuid

class UserManager(BaseUserManager):
    def create_user(self, email, password, name=None, role='driver', **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        email = self.normalize_email(email)
        user = self.model(email=email, name=name, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, name=None, **extra_fields):
        extra_fields.setdefault('role', 'admin')
        user = self.create_user(email, password, name, **extra_fields)
        user.is_superuser = True
        user.is_staff = True
        user.save(using=self._db)
        return user

class User(AbstractBaseUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('driver', 'Driver'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='driver')
    date_joined = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    manager = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        limit_choices_to={'role': 'manager'},
        related_name='drivers'
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name', 'password']

    objects = UserManager()

    def clean(self):
        """
        Ensure that manager is only set if the user role is 'driver'.
        """
        if self.manager and self.role != 'driver':
            raise ValidationError("Manager can only be set for users with role 'driver'.")
        if self.manager and self.manager.role != 'manager':
            raise ValidationError("Assigned manager must have role 'manager'.")

    def __str__(self):
        return self.email

    def has_perm(self, perm, obj=None):
        return self.is_superuser

    def has_module_perms(self, app_label):
        return self.is_superuser

    def save(self, *args, **kwargs):
        # Ensure password is hashed before saving
        if self.password and not self.password.startswith('pbkdf2_'):
            self.set_password(self.password)
        super().save(*args, **kwargs)