from django.db import models
from django.contrib.auth.models import User
from django.template.defaultfilters import slugify
from django.urls import reverse
from django.utils import timezone

class Product(models.Model):
    CATEGORY_CHOICES = [
        ('driver', 'Driver'),
        ('wood', 'Wood'),
        ('hybrid', 'Hybrid'),
        ('iron', 'Iron'),
        ('wedge', 'Wedge'),
        ('putter', 'Putter'),
    ]

    name = models.CharField(max_length=100)
    description = models.TextField()
    price = models.DecimalField(max_digits=8, decimal_places=2)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='driver')
    image = models.ImageField(upload_to='products/')
    slug = models.SlugField(max_length=120, unique=False, blank=True, null=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # auto-generate a unique slug if it's not set
        if not self.slug:
            base = slugify(self.name)[:110]
            slug_candidate = base
            counter = 1
            while Product.objects.filter(slug=slug_candidate).exists():
                slug_candidate = f"{base}-{counter}"
                counter += 1
            self.slug = slug_candidate
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse('product_detail', args=[self.id, self.slug])

class Order(models.Model):
    STATUS = (
        ('Pending', 'Pending'),
        ('Completed', 'Completed'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)
    # Stripe / payment tracking
    stripe_session_id = models.CharField(max_length=255, blank=True, null=True)
    payment_intent_id = models.CharField(max_length=255, blank=True, null=True)
    paid_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Order #{self.id} - {self.user.username} - {self.status}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)