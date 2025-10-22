from django.urls import path
from . import views

urlpatterns = [
    path('', views.homepage, name='homepage'),  # homepage
    path('category/<str:category_name>/', views.product_category, name='product_category'),  # category page
    path('product/<int:pk>-<slug:slug>/', views.product_detail, name='product_detail'),  # product detail page (hybrid id-slug)
    path('cart/add/<int:product_id>/', views.add_to_cart, name='add_to_cart'),
    path('cart/', views.cart, name='cart'),
    path('checkout/', views.checkout, name='checkout'),
    path('cart/remove/<int:product_id>/', views.remove_from_cart, name='remove_from_cart'),
]
