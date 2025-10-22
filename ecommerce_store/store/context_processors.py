from .models import Order


def cart_item_count(request):
    if not request.user.is_authenticated:
        return {'cart_item_count': 0}
    order = Order.objects.filter(user=request.user, status='Pending').first()
    if not order:
        return {'cart_item_count': 0}
    count = sum(item.quantity for item in order.items.all())
    return {'cart_item_count': count}
