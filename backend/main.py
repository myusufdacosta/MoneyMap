from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from database import engine, get_db, Base
import models, schemas

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

# Income
@app.get("/income", response_model=List[schemas.IncomeRead])
def get_income(db: Session = Depends(get_db)):
    return db.query(models.Income).all()

@app.post("/income", response_model=schemas.IncomeRead)
def add_income(income: schemas.IncomeCreate, db: Session = Depends(get_db)):
    db_income = models.Income(**income.model_dump())
    db.add(db_income)
    db.commit()
    db.refresh(db_income)
    return db_income

@app.delete("/income/{id}")
def delete_income(id: int, db: Session = Depends(get_db)):
    item = db.query(models.Income).filter(models.Income.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"ok": True}

# Expenses
@app.get("/expenses", response_model=List[schemas.ExpenseRead])
def get_expenses(db: Session = Depends(get_db)):
    return db.query(models.Expense).all()

@app.post("/expenses", response_model=schemas.ExpenseRead)
def add_expense(expense: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    db_expense = models.Expense(**expense.model_dump())
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@app.delete("/expenses/{id}")
def delete_expense(id: int, db: Session = Depends(get_db)):
    item = db.query(models.Expense).filter(models.Expense.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"ok": True}

# Loans
@app.get("/loans", response_model=List[schemas.LoanRead])
def get_loans(db: Session = Depends(get_db)):
    return db.query(models.Loan).all()

@app.post("/loans", response_model=schemas.LoanRead)
def add_loan(loan: schemas.LoanCreate, db: Session = Depends(get_db)):
    db_loan = models.Loan(**loan.model_dump())
    db.add(db_loan)
    db.commit()
    db.refresh(db_loan)
    return db_loan

@app.delete("/loans/{id}")
def delete_loan(id: int, db: Session = Depends(get_db)):
    item = db.query(models.Loan).filter(models.Loan.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"ok": True}

# Recurring
@app.get("/recurring", response_model=List[schemas.RecurringRead])
def get_recurring(db: Session = Depends(get_db)):
    return db.query(models.RecurringPayment).all()

@app.post("/recurring", response_model=schemas.RecurringRead)
def add_recurring(payment: schemas.RecurringCreate, db: Session = Depends(get_db)):
    db_payment = models.RecurringPayment(**payment.model_dump())
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment

@app.delete("/recurring/{id}")
def delete_recurring(id: int, db: Session = Depends(get_db)):
    item = db.query(models.RecurringPayment).filter(models.RecurringPayment.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"ok": True}

# Dashboard summary
@app.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):
    income = db.query(models.Income).all()
    expenses = db.query(models.Expense).all()
    loans = db.query(models.Loan).all()
    recurring = db.query(models.RecurringPayment).all()

    total_income = sum(i.amount for i in income)
    total_expenses = sum(e.amount for e in expenses)
    total_debt = sum(l.balance for l in loans)
    total_recurring = sum(r.amount for r in recurring)
    needs = sum(e.amount for e in expenses if e.type == "Need")
    wants = sum(e.amount for e in expenses if e.type == "Want")

    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "remaining": total_income - total_expenses,
        "total_debt": total_debt,
        "total_recurring": total_recurring,
        "needs": needs,
        "wants": wants,
        "leakage_pct": round((wants / total_expenses * 100) if total_expenses > 0 else 0, 1)
    }