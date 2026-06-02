from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate


def get_customers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Customer).offset(skip).limit(limit).all()


def get_customer(db: Session, customer_id: int):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


def create_customer(db: Session, customer: CustomerCreate):
    existing = db.query(Customer).filter(Customer.email == customer.email.lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail="A customer with this email already exists")
    db_customer = Customer(**customer.model_dump())
    db.add(db_customer)
    try:
        db.commit()
        db.refresh(db_customer)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A customer with this email already exists")
    return db_customer


def delete_customer(db: Session, customer_id: int):
    db_customer = get_customer(db, customer_id)
    db.delete(db_customer)
    db.commit()
    return {"message": "Customer deleted successfully"}
