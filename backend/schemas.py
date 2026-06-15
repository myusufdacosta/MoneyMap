from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserRead(BaseModel):
    id: int
    name: str
    email: str
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserRead

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

class LoanUpdate(BaseModel):
    balance: Optional[float] = None
    monthly_payment: Optional[float] = None
    interest_rate: Optional[float] = None

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

class BudgetTargetBase(BaseModel):
    category: str
    target: float

class BudgetTargetCreate(BudgetTargetBase):
    pass

class BudgetTargetRead(BudgetTargetBase):
    id: int
    class Config:
        from_attributes = True

class SavingsGoalBase(BaseModel):
    name: str
    target: float
    saved: float
    deadline: str

class SavingsGoalCreate(SavingsGoalBase):
    pass

class SavingsGoalRead(SavingsGoalBase):
    id: int
    class Config:
        from_attributes = True