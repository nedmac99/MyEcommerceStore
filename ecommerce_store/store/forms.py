from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, get_user_model
from django.utils.translation import gettext_lazy as _


class UsernameOrEmailAuthenticationForm(forms.Form):
    """Authentication form which accepts either username or email in the "username" field.

    This mirrors Django's AuthenticationForm behaviour but first tries to resolve an email
    to a username before calling authenticate().
    """
    username = forms.CharField(label=_("Username or email"))
    password = forms.CharField(label=_("Password"), strip=False, widget=forms.PasswordInput)

    error_messages = {
        'invalid_login': _(
            "Please enter a correct %(username)s and password. Note that both fields may be case-sensitive."
        ),
        'inactive': _("This account is inactive."),
    }

    def __init__(self, request=None, *args, **kwargs):
        self.request = request
        self.user_cache = None
        super().__init__(*args, **kwargs)

    def clean(self):
        username = self.cleaned_data.get('username')
        password = self.cleaned_data.get('password')

        if username and password:
            UserModel = get_user_model()
            # Prefer exact username match first; if not found, try email lookup (case-insensitive)
            username_to_auth = username
            try:
                # If someone enters an email address, find the associated username
                user_by_email = UserModel.objects.get(email__iexact=username)
                username_to_auth = user_by_email.get_username()
            except UserModel.DoesNotExist:
                # leave username as-is
                pass

            self.user_cache = authenticate(self.request, username=username_to_auth, password=password)
            if self.user_cache is None:
                raise forms.ValidationError(
                    self.error_messages['invalid_login'] % {'username': 'username or email'},
                    code='invalid_login',
                )
            else:
                self.confirm_login_allowed(self.user_cache)

        return self.cleaned_data

    def confirm_login_allowed(self, user):
        # Prevent login for inactive users (match Django's default behavior)
        if not getattr(user, 'is_active', None):
            raise forms.ValidationError(self.error_messages['inactive'], code='inactive')

    def get_user(self):
        """Return the authenticated user (cached after clean()).

        Django's LoginView expects the authentication form to expose get_user()
        (AuthenticationForm provides this). We implement a minimal version
        here so LoginView can access the authenticated user after form_valid().
        """
        return getattr(self, 'user_cache', None)



class CustomUserCreationForm(UserCreationForm):
    email = forms.EmailField(required=True, help_text='Required. Enter a valid email address.')
    first_name = forms.CharField(required=False, max_length=30)
    last_name = forms.CharField(required=False, max_length=150)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Add helpful placeholders and consistent ids/classes for styling
        self.fields['username'].widget.attrs.update({
            'placeholder': 'Username',
            'id': 'id_username',
            'class': 'form-control',
        })
        self.fields['email'].widget.attrs.update({
            'placeholder': 'Email',
            'id': 'id_email',
            'class': 'form-control',
        })
        self.fields['first_name'].widget.attrs.update({
            'placeholder': 'First Name',
            'id': 'id_first_name',
            'class': 'form-control',
        })
        self.fields['last_name'].widget.attrs.update({
            'placeholder': 'Last Name',
            'id': 'id_last_name',
            'class': 'form-control',
        })
        # password fields are PasswordInput widgets from UserCreationForm
        self.fields['password1'].widget.attrs.update({
            'placeholder': 'Password',
            'id': 'id_password1',
            'class': 'form-control',
        })
        self.fields['password2'].widget.attrs.update({
            'placeholder': 'Confirm Password',
            'id': 'id_password2',
            'class': 'form-control',
        })

    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 'password1', 'password2')

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data.get('email')
        user.first_name = self.cleaned_data.get('first_name', '')
        user.last_name = self.cleaned_data.get('last_name', '')
        if commit:
            user.save()
        return user
