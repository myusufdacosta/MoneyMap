from pydantic import BaseModel

class IncomeBase(BaseModel):
    source: str
    amount: float
    date: str

class IncomeCreate(IncomeBase):
    pass

class IncomeRead(IncomeBase):
    id: int
    class Config:
        from_attributes = True

class ExpenseBase(BaseModel):
    description: str
    amount: float
    category: str
    date: str
    type: str

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseRead(ExpenseBase):
    id: int
    class Config:
        from_attributes = True

class LoanBase(BaseModel):
    name: str
    original_amount: float
    balance: float
    monthly_payment: float
    interest_rate: float

class LoanCreate(LoanBase):
    pass

class LoanRead(LoanBase):
    id: int
    class Config:
        from_attributes = True

class RecurringBase(BaseModel):
    name: str
    amount: float
    day_of_month: int

class RecurringCreate(RecurringBase):
    pass

class RecurringRead(RecurringBase):
    id: int
    class Config:
        from_attributes = True