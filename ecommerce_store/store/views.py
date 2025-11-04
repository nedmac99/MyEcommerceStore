from django.shortcuts import render, get_object_or_404, redirect
from .models import Product, Order, OrderItem
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseRedirect, JsonResponse, HttpResponseBadRequest
from django.views.decorators.http import require_POST
from django.conf import settings
try:
    import stripe
except Exception:
    stripe = None
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from django.urls import reverse
from django.contrib.auth import login as auth_login
from django.contrib.auth.forms import UserCreationForm
from django.shortcuts import redirect
from django.contrib import messages
from django.utils import timezone


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


@require_POST
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

    # If AJAX request, return JSON so frontend can update without reload
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        count = sum(i.quantity for i in order.items.all())
        return JsonResponse({
            'cart_item_count': count,
            'order_total': str(order.total_price),
            'product_name': product.name,
            'product_id': product_id,
        })

    return redirect('cart')


@login_required
@require_POST
def remove_from_cart(request, product_id):
    # Remove or decrement the product from the user's pending order
    order = Order.objects.filter(user=request.user, status='Pending').first()
    if not order:
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'error': 'no_order'}, status=400)
        return redirect('cart')
    try:
        item = OrderItem.objects.get(order=order, product__id=product_id)
    except OrderItem.DoesNotExist:
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'error': 'item_not_found'}, status=404)
        return redirect('cart')

    # If quantity > 1, decrement, else remove
    if item.quantity > 1:
        item.quantity -= 1
        item.save()
        new_quantity = item.quantity
    else:
        item.delete()
        new_quantity = 0

    # Update total price
    order.total_price = sum(i.product.price * i.quantity for i in order.items.all())
    order.save()

    # If AJAX request, return JSON so frontend can update without reload
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        count = sum(i.quantity for i in order.items.all())
        return JsonResponse({
            'cart_item_count': count,
            'order_total': str(order.total_price),
            'product_id': product_id,
            'item_quantity': new_quantity,
        })

    return redirect('cart')


@login_required
@require_POST
def remove_all_from_cart(request, product_id):
    # Remove the OrderItem entirely
    order = Order.objects.filter(user=request.user, status='Pending').first()
    if not order:
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'error': 'no_order'}, status=400)
        return redirect('cart')
    try:
        item = OrderItem.objects.get(order=order, product__id=product_id)
    except OrderItem.DoesNotExist:
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'error': 'item_not_found'}, status=404)
        return redirect('cart')

    item.delete()

    # Update total price
    order.total_price = sum(i.product.price * i.quantity for i in order.items.all())
    order.save()

    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        count = sum(i.quantity for i in order.items.all())
        return JsonResponse({
            'cart_item_count': count,
            'order_total': str(order.total_price),
            'product_id': product_id,
            'item_quantity': 0,
        })

    return redirect('cart')

@login_required
def cart(request):
    order = Order.objects.filter(user=request.user, status='Pending').first()
    return render(request, 'store/cart.html', {'order': order})

@login_required
def checkout(request):
    # Show pending order (acts as a cart) and let user initiate payment.
    order = Order.objects.filter(user=request.user, status='Pending').first()
    if not order or order.items.count() == 0:
        return render(request, 'store/checkout.html', {'order': None, 'stripe_configured': bool(settings.STRIPE_SECRET_KEY)})

    return render(request, 'store/checkout.html', {'order': order, 'stripe_configured': bool(settings.STRIPE_SECRET_KEY)})


@login_required
@require_POST
def create_checkout_session(request):
    if not settings.STRIPE_SECRET_KEY or stripe is None:
        return JsonResponse({'error': 'Stripe not configured'}, status=500)

    stripe.api_key = settings.STRIPE_SECRET_KEY

    order = Order.objects.filter(user=request.user, status='Pending').first()
    if not order or order.items.count() == 0:
        return JsonResponse({'error': 'no_order'}, status=400)

    # Build line items
    line_items = []
    for item in order.items.select_related('product').all():
        line_items.append({
            'price_data': {
                'currency': 'usd',
                'product_data': {'name': item.product.name},
                'unit_amount': int(item.product.price * 100),
            },
            'quantity': int(item.quantity),
        })

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            mode='payment',
            line_items=line_items,
            success_url=request.build_absolute_uri(reverse('checkout_success')) + '?session_id={CHECKOUT_SESSION_ID}',
            cancel_url=request.build_absolute_uri(reverse('checkout_cancel')),
            metadata={'order_id': str(order.id)},
        )
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

    # Save the session id to the order so we have a record and can reconcile later
    try:
        order.stripe_session_id = getattr(session, 'id', None)
        # ensure total_price saved (in case JS changes occurred)
        order.total_price = sum(i.product.price * i.quantity for i in order.items.all())
        order.save()
    except Exception:
        # non-fatal; continue returning session info
        pass

    return JsonResponse({'id': getattr(session, 'id', None), 'url': getattr(session, 'url', None)})


@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')
    event = None

    if settings.STRIPE_WEBHOOK_SECRET and stripe is not None:
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
        except Exception:
            return HttpResponse(status=400)
    else:
        import json
        try:
            event = json.loads(payload)
        except Exception:
            return HttpResponse(status=400)

    typ = event.get('type') if isinstance(event, dict) else getattr(event, 'type', None)
    data = event.get('data', {}).get('object', {}) if isinstance(event, dict) else event.data.object

    if typ == 'checkout.session.completed' or typ == 'payment_intent.succeeded':
        metadata = data.get('metadata', {})
        order_id = metadata.get('order_id')
        if order_id:
            try:
                order = Order.objects.get(id=order_id)
                if order.status != 'Completed':
                    # record payment/session identifiers and mark completed
                    # attempt to pull payment intent / session id from the event data
                    sess_id = data.get('id') or data.get('session_id') or None
                    if sess_id and not order.stripe_session_id:
                        order.stripe_session_id = sess_id

                    payment_intent = data.get('payment_intent') or data.get('payment_intent_id') or None
                    if payment_intent:
                        order.payment_intent_id = payment_intent

                    order.status = 'Completed'
                    order.paid_at = timezone.now()
                    order.save()
            except Order.DoesNotExist:
                pass

    return HttpResponse(status=200)


def checkout_success(request):
    # Stripe will redirect here after payment. The template can read session_id from query params.
    session_id = request.GET.get('session_id')

    # If we have a session_id and Stripe is available, retrieve it to reconcile the order.
    if session_id and settings.STRIPE_SECRET_KEY and stripe is not None:
        try:
            stripe.api_key = settings.STRIPE_SECRET_KEY
            # expand payment_intent so we can capture its id if present
            sess = stripe.checkout.Session.retrieve(session_id, expand=['payment_intent'])
            metadata = getattr(sess, 'metadata', {}) or {}
            order_id = metadata.get('order_id')
            payment_intent = getattr(sess, 'payment_intent', None)

            if order_id:
                try:
                    order = Order.objects.get(id=order_id)
                    if order.status != 'Completed':
                        order.stripe_session_id = sess.id
                        if payment_intent:
                            # payment_intent may be an id string or object depending on expand
                            if isinstance(payment_intent, str):
                                order.payment_intent_id = payment_intent
                            else:
                                order.payment_intent_id = getattr(payment_intent, 'id', None)
                        order.status = 'Completed'
                        order.paid_at = timezone.now()
                        order.save()
                except Order.DoesNotExist:
                    pass
        except Exception:
            # Don't raise for user-facing redirect failures; webhook should reconcile later.
            pass

    return render(request, 'store/checkout_success.html')


def checkout_cancel(request):
    # Stripe will redirect here if the user cancels payment.
    return render(request, 'store/checkout_cancel.html')


def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            auth_login(request, user)
            messages.success(request, 'Registration successful. You are now logged in.')
            return redirect('homepage')
    else:
        form = UserCreationForm()

    return render(request, 'store/register.html', {'form': form})