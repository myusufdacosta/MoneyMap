from sqlalchemy import Column, Integer, String, Float, Date
from database import Base

class Income(Base):
    __tablename__ = "income"
    id = Column(Integer, primary_key=True, index=True)
    source = Column(String)
    amount = Column(Float)
    date = Column(String)

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    description = Column(String)
    amount = Column(Float)
    category = Column(String)
    date = Column(String)
    type = Column(String)  # Need or Want

class Loan(Base):
    __tablename__ = "loans"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    original_amount = Column(Float)
    balance = Column(Float)
    monthly_payment = Column(Float)
    interest_rate = Column(Float)

class RecurringPayment(Base):
    __tablename__ = "recurring"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    amount = Column(Float)
    day_of_month = Column(Integer)