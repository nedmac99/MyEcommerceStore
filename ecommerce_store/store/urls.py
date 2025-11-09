from django.urls import path
from . import views
from django.contrib.auth import views as auth_views
from .forms import UsernameOrEmailAuthenticationForm

urlpatterns = [
    path('', views.homepage, name='homepage'),  # homepage
    path('category/<str:category_name>/', views.product_category, name='product_category'),  # category page
    path('product/<int:pk>-<slug:slug>/', views.product_detail, name='product_detail'),  # product detail page (hybrid id-slug)
    path('cart/add/<int:product_id>/', views.add_to_cart, name='add_to_cart'),
    path('cart/', views.cart, name='cart'),
    path('checkout/', views.checkout, name='checkout'),
    path('create-checkout-session/', views.create_checkout_session, name='create_checkout_session'),
    path('checkout/success/', views.checkout_success, name='checkout_success'),
    path('checkout/cancel/', views.checkout_cancel, name='checkout_cancel'),
    path('webhook/stripe/', views.stripe_webhook, name='stripe_webhook'),
    # auth
    path('accounts/register/', views.register, name='register'),
    path('accounts/login/', auth_views.LoginView.as_view(template_name='store/login.html', authentication_form=UsernameOrEmailAuthenticationForm), name='login'),
    path('accounts/logout/', auth_views.LogoutView.as_view(next_page='homepage'), name='logout'),
    path('cart/remove/<int:product_id>/', views.remove_from_cart, name='remove_from_cart'),
    path('cart/remove_all/<int:product_id>/', views.remove_all_from_cart, name='remove_all_from_cart'),
]
