from django.shortcuts import render, get_object_or_404
from .models import Product
from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required
from .models import Product, Order, OrderItem
from django.http import HttpResponseRedirect


def homepage(request):
    categories = ['driver', 'wood', 'hybrid', 'iron', 'wedge', 'putter']
    featured_products = {}
    for cat in categories:
        featured_products[cat] = Product.objects.filter(category=cat)[:3]
    return render(request, 'store/homepage.html', {'featured_products': featured_products})

def product_category(request, category_name):
    products = Product.objects.filter(category=category_name)
    return render(request, 'store/category.html', {'products': products, 'category': category_name.capitalize()})


def product_detail(request, pk, slug):
    product = get_object_or_404(Product, id=pk)
    # Redirect to canonical URL if slug doesn't match
    if product.slug != slug:
        return HttpResponseRedirect(product.get_absolute_url())
    return render(request, 'store/product_detail.html', {'product': product})


@login_required
def add_to_cart(request, product_id):
    product = Product.objects.get(id=product_id)
    
    # Check if user has an open order
    order, created = Order.objects.get_or_create(user=request.user, status='Pending', defaults={'total_price': 0})
    
    # Check if the product is already in the order
    order_item, item_created = OrderItem.objects.get_or_create(order=order, product=product)
    
    if not item_created:
        order_item.quantity += 1
        order_item.save()
    
    # Update total price
    order.total_price = sum(item.product.price * item.quantity for item in order.items.all())
    order.save()
    
    return redirect('cart')


@login_required
def remove_from_cart(request, product_id):
    # Remove or decrement the product from the user's pending order
    order = Order.objects.filter(user=request.user, status='Pending').first()
    if not order:
        return redirect('cart')
    try:
        item = OrderItem.objects.get(order=order, product__id=product_id)
    except OrderItem.DoesNotExist:
        return redirect('cart')

    # If quantity > 1, decrement, else remove
    if item.quantity > 1:
        item.quantity -= 1
        item.save()
    else:
        item.delete()

    # Update total price
    order.total_price = sum(i.product.price * i.quantity for i in order.items.all())
    order.save()
    return redirect('cart')

@login_required
def cart(request):
    order = Order.objects.filter(user=request.user, status='Pending').first()
    return render(request, 'store/cart.html', {'order': order})

@login_required
def checkout(request):
    order = Order.objects.filter(user=request.user, status='Pending').first()
    if order:
        order.status = 'Completed'
        order.save()
    return render(request, 'store/checkout.html', {'order': order})