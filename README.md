# 🛒 Golf Equipment E-Commerce Store

A full-stack e-commerce web application built with **Django** for selling golf equipment. Features product catalog management, shopping cart functionality, user authentication, and order processing.

![Django](https://img.shields.io/badge/Django-092E20?logo=django&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.x-blue?logo=python&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?logo=sqlite&logoColor=white)

---

## ✨ Features

### 🏪 Product Catalog
- Browse products by category (Drivers, Woods, Hybrids, Irons, Wedges, Putters)
- Product detail pages with images, descriptions, and pricing
- Featured products on homepage

### 🛍️ Shopping Cart
- Add/remove items from cart
- Quantity management
- Real-time total price calculation

### 👤 User Authentication
- User registration and login
- Protected routes for cart and checkout
- Django's built-in authentication system

### 📦 Order Management
- Order creation and tracking
- Pending/Completed order status
- Order history for users

---

## 🏗️ Project Structure

```
ecommerce_store/
├── ecommerce/              # Django project settings
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── store/                  # Main application
│   ├── models.py           # Product, Order, OrderItem models
│   ├── views.py            # Homepage, category, cart, checkout views
│   ├── urls.py             # URL routing
│   ├── templates/store/    # HTML templates
│   │   ├── base.html
│   │   ├── homepage.html
│   │   ├── category.html
│   │   ├── cart.html
│   │   └── checkout.html
│   └── migrations/
└── manage.py
```

---

## 📊 Database Models

### Product
```python
- name: CharField
- description: TextField
- price: DecimalField
- category: CharField (choices: driver, wood, hybrid, iron, wedge, putter)
- image: ImageField
```

### Order
```python
- user: ForeignKey (User)
- total_price: DecimalField
- status: CharField (Pending/Completed)
- created_at: DateTimeField
```

### OrderItem
```python
- order: ForeignKey (Order)
- product: ForeignKey (Product)
- quantity: PositiveIntegerField
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- pip

### Installation

```bash
# Clone the repository
git clone https://github.com/nedmac99/MyEcommerceStore.git
cd MyEcommerceStore/ecommerce_store

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install django pillow

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser (for admin access)
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

### Access the Application
- **Store:** http://localhost:8000/
- **Admin Panel:** http://localhost:8000/admin/

---

## 🛠️ Technologies Used

| Technology | Purpose |
|------------|---------|
| **Django** | Web framework |
| **SQLite** | Database |
| **HTML/CSS** | Frontend templates |
| **Pillow** | Image handling |

---

## 🔮 Future Enhancements

- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] Product search and filtering
- [ ] User reviews and ratings
- [ ] Inventory management
- [ ] Email notifications
- [ ] Responsive mobile design