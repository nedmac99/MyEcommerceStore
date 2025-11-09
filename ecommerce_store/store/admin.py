from django.contrib import admin
from .models import Product, Order, OrderItem

# Customize Order admin
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
	list_display = ('id', 'user', 'status', 'total_price', 'created_at', 'paid_at')
	list_filter = ('status', 'created_at')
	search_fields = ('user__username', 'id', 'payment_intent_id', 'stripe_session_id')


admin.site.register(Product)
admin.site.register(OrderItem)

# Improve the Django User admin to show email and names in list
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin


class CustomUserAdmin(DjangoUserAdmin):
	list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff')
	# include first/last/email in the add user form used by admin
	add_fieldsets = (
		(None, {
			'classes': ('wide',),
			'fields': ('username', 'first_name', 'last_name', 'email', 'password1', 'password2'),
		}),
	)


# Unregister the default User admin and register our customized one
try:
	admin.site.unregister(User)
except admin.sites.NotRegistered:
	pass
admin.site.register(User, CustomUserAdmin)
