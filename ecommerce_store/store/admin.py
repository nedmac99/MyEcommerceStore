from django.contrib import admin
from .models import Product, Order, OrderItem


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
	list_display = ('id', 'user', 'status', 'total_price', 'created_at', 'paid_at')
	list_filter = ('status', 'created_at')
	search_fields = ('user__username', 'id', 'payment_intent_id', 'stripe_session_id')


admin.site.register(Product)
admin.site.register(OrderItem)
