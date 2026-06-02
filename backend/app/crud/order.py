from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from decimal import Decimal
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.customer import Customer
from app.schemas.order import OrderCreate


def get_orders(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(Order)
        .options(joinedload(Order.customer), joinedload(Order.items).joinedload(OrderItem.product))
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_order(db: Session, order_id: int):
    order = (
        db.query(Order)
        .options(joinedload(Order.customer), joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


def create_order(db: Session, order: OrderCreate):
    # Validate customer exists
    customer = db.query(Customer).filter(Customer.id == order.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Validate products and stock
    order_items = []
    total_amount = Decimal("0.00")

    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with ID {item.product_id} not found")
        if product.quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{product.name}'. Available: {product.quantity}, Requested: {item.quantity}"
            )
        line_total = Decimal(str(product.price)) * item.quantity
        total_amount += line_total
        order_items.append((product, item.quantity, Decimal(str(product.price))))

    # Create order
    db_order = Order(
        customer_id=order.customer_id,
        total_amount=total_amount,
        status="pending"
    )
    db.add(db_order)
    db.flush()  # Get the order ID

    # Create order items and deduct stock
    for product, quantity, unit_price in order_items:
        db_item = OrderItem(
            order_id=db_order.id,
            product_id=product.id,
            quantity=quantity,
            unit_price=unit_price
        )
        db.add(db_item)
        product.quantity -= quantity

    db.commit()
    db.refresh(db_order)
    return get_order(db, db_order.id)


def delete_order(db: Session, order_id: int):
    db_order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.id == order_id)
        .first()
    )
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Restore stock
    for item in db_order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.quantity += item.quantity

    db.delete(db_order)
    db.commit()
    return {"message": "Order cancelled and stock restored"}
