from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from database import engine, get_db, Base
import models, schemas
from auth import hash_password, verify_password, create_token, get_current_user
from math import ceil
from datetime import datetime, timedelta

Base.metadata.create_all(bind=engine)

app = FastAPI(title="MoneyMap API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"app": "MoneyMap", "status": "running"}

@app.post("/register", response_model=schemas.Token)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    db_user = models.User(name=user.name, email=user.email, password=hash_password(user.password))
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    token = create_token({"sub": str(db_user.id)})
    return {"access_token": token, "token_type": "bearer", "user": db_user}

@app.post("/login", response_model=schemas.Token)
def login(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token({"sub": str(db_user.id)})
    return {"access_token": token, "token_type": "bearer", "user": db_user}

# Income
@app.get("/income", response_model=List[schemas.IncomeRead])
def get_income(month: Optional[int] = None, year: Optional[int] = None, db: Session = Depends(get_db), user=Depends(get_current_user)):
    q = db.query(models.Income).filter(models.Income.user_id == user.id)
    if month and year:
        prefix = f"{year}-{str(month).zfill(2)}"
        q = q.filter(models.Income.date.startswith(prefix))
    return q.all()

@app.post("/income", response_model=schemas.IncomeRead)
def add_income(income: schemas.IncomeCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    item = models.Income(**income.model_dump(), user_id=user.id)
    db.add(item); db.commit(); db.refresh(item)
    return item

@app.put("/income/{id}", response_model=schemas.IncomeRead)
def update_income(id: int, income: schemas.IncomeCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    item = db.query(models.Income).filter(models.Income.id == id, models.Income.user_id == user.id).first()
    if not item: raise HTTPException(status_code=404, detail="Not found")
    item.source = income.source
    item.amount = income.amount
    item.date = income.date
    db.commit(); db.refresh(item)
    return item

@app.delete("/income/{id}")
def delete_income(id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    item = db.query(models.Income).filter(models.Income.id == id, models.Income.user_id == user.id).first()
    if not item: raise HTTPException(status_code=404, detail="Not found")
    db.delete(item); db.commit()
    return {"ok": True}

# Expenses
@app.get("/expenses", response_model=List[schemas.ExpenseRead])
def get_expenses(month: Optional[int] = None, year: Optional[int] = None, db: Session = Depends(get_db), user=Depends(get_current_user)):
    q = db.query(models.Expense).filter(models.Expense.user_id == user.id)
    if month and year:
        prefix = f"{year}-{str(month).zfill(2)}"
        q = q.filter(models.Expense.date.startswith(prefix))
    return q.all()

@app.post("/expenses", response_model=schemas.ExpenseRead)
def add_expense(expense: schemas.ExpenseCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    item = models.Expense(**expense.model_dump(), user_id=user.id)
    db.add(item); db.commit(); db.refresh(item)
    return item

@app.put("/expenses/{id}", response_model=schemas.ExpenseRead)
def update_expense(id: int, expense: schemas.ExpenseCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    item = db.query(models.Expense).filter(models.Expense.id == id, models.Expense.user_id == user.id).first()
    if not item: raise HTTPException(status_code=404, detail="Not found")
    item.description = expense.description
    item.amount = expense.amount
    item.category = expense.category
    item.date = expense.date
    item.type = expense.type
    db.commit(); db.refresh(item)
    return item

@app.delete("/expenses/{id}")
def delete_expense(id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    item = db.query(models.Expense).filter(models.Expense.id == id, models.Expense.user_id == user.id).first()
    if not item: raise HTTPException(status_code=404, detail="Not found")
    db.delete(item); db.commit()
    return {"ok": True}

# Loans
@app.get("/loans", response_model=List[schemas.LoanRead])
def get_loans(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(models.Loan).filter(models.Loan.user_id == user.id).all()

@app.post("/loans", response_model=schemas.LoanRead)
def add_loan(loan: schemas.LoanCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    item = models.Loan(**loan.model_dump(), user_id=user.id)
    db.add(item); db.commit(); db.refresh(item)
    return item

@app.put("/loans/{id}", response_model=schemas.LoanRead)
def update_loan(id: int, loan: schemas.LoanUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    item = db.query(models.Loan).filter(models.Loan.id == id, models.Loan.user_id == user.id).first()
    if not item: raise HTTPException(status_code=404, detail="Not found")
    if loan.balance is not None: item.balance = loan.balance
    if loan.monthly_payment is not None: item.monthly_payment = loan.monthly_payment
    if loan.interest_rate is not None: item.interest_rate = loan.interest_rate
    db.commit(); db.refresh(item)
    return item

@app.delete("/loans/{id}")
def delete_loan(id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    item = db.query(models.Loan).filter(models.Loan.id == id, models.Loan.user_id == user.id).first()
    if not item: raise HTTPException(status_code=404, detail="Not found")
    db.delete(item); db.commit()
    return {"ok": True}

# Recurring
@app.get("/recurring", response_model=List[schemas.RecurringRead])
def get_recurring(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(models.RecurringPayment).filter(models.RecurringPayment.user_id == user.id).all()

@app.post("/recurring", response_model=schemas.RecurringRead)
def add_recurring(payment: schemas.RecurringCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    item = models.RecurringPayment(**payment.model_dump(), user_id=user.id)
    db.add(item); db.commit(); db.refresh(item)
    return item

@app.delete("/recurring/{id}")
def delete_recurring(id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    item = db.query(models.RecurringPayment).filter(models.RecurringPayment.id == id, models.RecurringPayment.user_id == user.id).first()
    if not item: raise HTTPException(status_code=404, detail="Not found")
    db.delete(item); db.commit()
    return {"ok": True}

# Budget targets
@app.get("/budget-targets", response_model=List[schemas.BudgetTargetRead])
def get_targets(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(models.BudgetTarget).filter(models.BudgetTarget.user_id == user.id).all()

@app.post("/budget-targets", response_model=schemas.BudgetTargetRead)
def set_target(target: schemas.BudgetTargetCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    existing = db.query(models.BudgetTarget).filter(models.BudgetTarget.user_id == user.id, models.BudgetTarget.category == target.category).first()
    if existing:
        existing.target = target.target
        db.commit(); db.refresh(existing)
        return existing
    item = models.BudgetTarget(**target.model_dump(), user_id=user.id)
    db.add(item); db.commit(); db.refresh(item)
    return item

# Savings goals
@app.get("/savings-goals", response_model=List[schemas.SavingsGoalRead])
def get_goals(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(models.SavingsGoal).filter(models.SavingsGoal.user_id == user.id).all()

@app.post("/savings-goals", response_model=schemas.SavingsGoalRead)
def add_goal(goal: schemas.SavingsGoalCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    item = models.SavingsGoal(**goal.model_dump(), user_id=user.id)
    db.add(item); db.commit(); db.refresh(item)
    return item

@app.put("/savings-goals/{id}", response_model=schemas.SavingsGoalRead)
def update_goal(id: int, goal: schemas.SavingsGoalCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    item = db.query(models.SavingsGoal).filter(models.SavingsGoal.id == id, models.SavingsGoal.user_id == user.id).first()
    if not item: raise HTTPException(status_code=404, detail="Not found")
    item.name = goal.name
    item.target = goal.target
    item.saved = goal.saved
    item.deadline = goal.deadline
    db.commit(); db.refresh(item)
    return item

@app.delete("/savings-goals/{id}")
def delete_goal(id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    item = db.query(models.SavingsGoal).filter(models.SavingsGoal.id == id, models.SavingsGoal.user_id == user.id).first()
    if not item: raise HTTPException(status_code=404, detail="Not found")
    db.delete(item); db.commit()
    return {"ok": True}

# Dashboard
@app.get("/dashboard")
def dashboard(month: Optional[int] = None, year: Optional[int] = None, db: Session = Depends(get_db), user=Depends(get_current_user)):
    now = datetime.now()
    m = month or now.month
    y = year or now.year
    prefix = f"{y}-{str(m).zfill(2)}"

    income = db.query(models.Income).filter(models.Income.user_id == user.id, models.Income.date.startswith(prefix)).all()
    expenses = db.query(models.Expense).filter(models.Expense.user_id == user.id, models.Expense.date.startswith(prefix)).all()
    loans = db.query(models.Loan).filter(models.Loan.user_id == user.id).all()
    recurring = db.query(models.RecurringPayment).filter(models.RecurringPayment.user_id == user.id).all()

    total_income = sum(i.amount for i in income)
    total_expenses = sum(e.amount for e in expenses)
    total_debt = sum(l.balance for l in loans)
    total_recurring = sum(r.amount for r in recurring)
    needs = sum(e.amount for e in expenses if e.type == "Need")
    wants = sum(e.amount for e in expenses if e.type == "Want")

    loan_details = []
    for l in loans:
        if l.monthly_payment > 0:
            months = ceil(l.balance / l.monthly_payment)
            payoff_date = (datetime.now() + timedelta(days=months * 30)).strftime("%b %Y")
        else:
            months = 0
            payoff_date = "Unknown"
        loan_details.append({
            "id": l.id,
            "name": l.name,
            "balance": l.balance,
            "monthly_payment": l.monthly_payment,
            "months_remaining": months,
            "payoff_date": payoff_date
        })

    return {
        "month": m,
        "year": y,
        "total_income": total_income,
        "total_expenses": total_expenses,
        "remaining": total_income - total_expenses,
        "total_debt": total_debt,
        "total_recurring": total_recurring,
        "needs": needs,
        "wants": wants,
        "leakage_pct": round((wants / total_expenses * 100) if total_expenses > 0 else 0, 1),
        "loan_details": loan_details
    }