from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
import re


class CustomerBase(BaseModel):
    full_name: str
    email: str
    phone: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, v):
            raise ValueError("Invalid email address")
        return v.lower()

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        if len(v.strip()) < 7:
            raise ValueError("Phone number is too short")
        return v.strip()


class CustomerCreate(CustomerBase):
    pass


class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}
