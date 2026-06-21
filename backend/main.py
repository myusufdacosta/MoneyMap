from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from database import engine, get_db, Base, run_lightweight_migrations
import models, schemas
from auth import hash_password, verify_password, create_token, get_current_user, get_current_advisor
from math import ceil
from datetime import datetime, timedelta
import os
import json
import base64
import secrets
from groq import Groq
import fitz  # PyMuPDF — renders PDF pages to images server-side, since Groq's vision API only accepts images, not raw PDFs

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
# Configurable so a model rename/deprecation on Groq's side is a one-line env var
# fix rather than a code change. meta-llama/llama-4-scout-17b-16e-instruct is
# Groq's current lightweight vision-capable model as of this build.
GROQ_VISION_MODEL = os.environ.get("GROQ_VISION_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")
EXPENSE_CATEGORIES = ["Groceries", "Transport", "Utilities", "Entertainment", "Medical", "Loan Payment", "Rent", "Takeaways", "Other"]
NEED_DEFAULT_CATEGORIES = {"Groceries", "Transport", "Utilities", "Medical", "Loan Payment", "Rent"}
MAX_PDF_PAGES = 6  # caps cost/latency on long statements; UI surfaces a "truncated" notice past this
INVITE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # excludes 0/O/1/I to avoid mistypes
INVITE_CODE_LENGTH = 8
INVITE_EXPIRY_DAYS = 7

Base.metadata.create_all(bind=engine)
run_lightweight_migrations()

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
    role = "advisor" if user.is_advisor else "individual"
    db_user = models.User(name=user.name, email=user.email, password=hash_password(user.password), role=role)
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
def compute_dashboard(db: Session, user_id: int, month: Optional[int] = None, year: Optional[int] = None):
    now = datetime.now()
    m = month or now.month
    y = year or now.year
    prefix = f"{y}-{str(m).zfill(2)}"

    income = db.query(models.Income).filter(models.Income.user_id == user_id, models.Income.date.startswith(prefix)).all()
    expenses = db.query(models.Expense).filter(models.Expense.user_id == user_id, models.Expense.date.startswith(prefix)).all()
    loans = db.query(models.Loan).filter(models.Loan.user_id == user_id).all()
    recurring = db.query(models.RecurringPayment).filter(models.RecurringPayment.user_id == user_id).all()

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

@app.get("/dashboard")
def dashboard(month: Optional[int] = None, year: Optional[int] = None, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return compute_dashboard(db, user.id, month, year)

def compute_financial_health(db: Session, user_id: int, month: Optional[int] = None, year: Optional[int] = None):
    now = datetime.now()
    m = month or now.month
    y = year or now.year
    prefix = f"{y}-{str(m).zfill(2)}"

    income = db.query(models.Income)\
        .filter(models.Income.user_id == user_id, models.Income.date.startswith(prefix))\
        .all()

    expenses = db.query(models.Expense)\
        .filter(models.Expense.user_id == user_id, models.Expense.date.startswith(prefix))\
        .all()

    loans = db.query(models.Loan)\
        .filter(models.Loan.user_id == user_id)\
        .all()

    goals = db.query(models.SavingsGoal)\
        .filter(models.SavingsGoal.user_id == user_id)\
        .all()

    total_income = sum(i.amount for i in income)
    total_expenses = sum(e.amount for e in expenses)

    debt_payment = sum(l.monthly_payment for l in loans)

    savings_balance = sum(g.saved for g in goals)

    # Debt Score

    if total_income > 0:
        debt_ratio = (debt_payment / total_income) * 100
        debt_score = max(0, min(100, round(100 - debt_ratio)))
    else:
        debt_score = 0

    # Savings Score

    if total_income > 0:
        savings_rate = (savings_balance / total_income) * 100
        savings_score = min(100, round(savings_rate * 5))
    else:
        savings_score = 0

    # Budget Score

    wants = sum(
        e.amount
        for e in expenses
        if e.type == "Want"
    )

    leakage_pct = (
        (wants / total_expenses) * 100
        if total_expenses > 0
        else 0
    )

    budget_score = max(
        0,
        min(100, round(100 - leakage_pct))
    )

    # Emergency Fund Score

    if total_expenses > 0:
        months_cover = savings_balance / total_expenses
        emergency_score = min(
            100,
            round((months_cover / 6) * 100)
        )
    else:
        emergency_score = 0

    overall = round(
        debt_score * 0.30 +
        savings_score * 0.25 +
        budget_score * 0.25 +
        emergency_score * 0.20
    )

    if overall >= 90:
        grade = "Excellent"
    elif overall >= 75:
        grade = "Strong"
    elif overall >= 60:
        grade = "Fair"
    elif overall >= 40:
        grade = "At Risk"
    else:
        grade = "Critical"

    return {
        "overall": overall,
        "grade": grade,
        "debt_score": debt_score,
        "savings_score": savings_score,
        "budget_score": budget_score,
        "emergency_score": emergency_score
    }

@app.get("/financial-health", response_model=schemas.FinancialHealth)
def financial_health(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    return compute_financial_health(db, user.id, month, year)

@app.get("/quick-wins", response_model=schemas.QuickWins)
def quick_wins(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    recommendations = []

    loans = db.query(models.Loan)\
        .filter(models.Loan.user_id == user.id)\
        .all()

    expenses = db.query(models.Expense)\
        .filter(models.Expense.user_id == user.id)\
        .all()

    goals = db.query(models.SavingsGoal)\
        .filter(models.SavingsGoal.user_id == user.id)\
        .all()

    if len(goals) == 0:
        recommendations.append(
            "Add a savings goal to improve your Financial Health score"
        )

    wants = [e for e in expenses if e.type == "Want"]

    if len(expenses) > 0 and len(wants) == len(expenses):
        recommendations.append(
            "Categorise expenses as Needs and Wants for better insights"
        )

    if loans:
        highest = max(loans, key=lambda l: l.balance)

        recommendations.append(
            f"Pay an extra R500 toward {highest.name} to reduce debt faster"
        )

    if not recommendations:
        recommendations.append(
            "Great work. Your finances are on track this month."
        )

    return {
        "recommendations": recommendations
    }

# Receipt / bank statement scanning
@app.post("/scan-receipt", response_model=schemas.ScanResponse)
def scan_receipt(payload: schemas.ScanRequest, user=Depends(get_current_user)):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="Receipt scanning isn't configured on the server yet (missing GROQ_API_KEY).")

    file_data = payload.file
    if not file_data or not file_data.startswith("data:") or "," not in file_data:
        raise HTTPException(status_code=400, detail="No valid file was provided.")

    header, b64data = file_data.split(",", 1)
    is_pdf = "application/pdf" in header
    is_image = header.startswith("data:image")

    if not is_pdf and not is_image:
        raise HTTPException(status_code=400, detail="Only image or PDF files are supported.")

    image_data_urls = []
    truncated = False

    if is_pdf:
        try:
            pdf_bytes = base64.b64decode(b64data)
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        except Exception:
            raise HTTPException(status_code=400, detail="Couldn't open that PDF — it may be corrupted or password-protected.")

        if len(doc) == 0:
            doc.close()
            raise HTTPException(status_code=422, detail="That PDF has no pages.")

        truncated = len(doc) > MAX_PDF_PAGES
        page_count = min(len(doc), MAX_PDF_PAGES)

        for i in range(page_count):
            pix = doc[i].get_pixmap(dpi=150)
            png_b64 = base64.b64encode(pix.tobytes("png")).decode()
            image_data_urls.append(f"data:image/png;base64,{png_b64}")
        doc.close()
        default_doc_type = "statement"
    else:
        image_data_urls.append(file_data)
        default_doc_type = "receipt"

    today = datetime.now().strftime("%Y-%m-%d")
    current_year = datetime.now().year

    prompt = f"""You are reading {"a multi-page bank or card statement, with pages provided in order" if is_pdf else "a photo of either a single till slip/receipt or a bank/card statement"} from a South African user.

Extract every distinct purchase across all provided pages as a JSON array. Each item must have exactly these fields:
- "description": short merchant or item name (string)
- "amount": the transaction amount in Rands as a plain number, no currency symbol or commas (number)
- "date": the transaction date as YYYY-MM-DD. If no year is visible, assume {current_year}. If no date is visible at all, use {today}.
- "category": exactly one of {json.dumps(EXPENSE_CATEGORIES)}
- "type": exactly "Need" or "Want"

Use these South African merchant examples as a guide for category, and apply the same reasoning to similar merchants you recognise that aren't listed:
- Groceries: Checkers, Woolworths, Pick n Pay, Shoprite, Spar, Food Lover's Market, Boxer, USave
- Transport: Uber, Bolt, Gautrain, MyCiti, fuel stations (Engen, Shell, Sasol, BP, Caltex, Total), tolls, parking
- Utilities: Eskom, City Power, prepaid electricity, municipal rates/water, Telkom, Vodacom, MTN, Cell C, Rain, fibre/internet, airtime, data
- Entertainment: Netflix, DStv, Showmax, Spotify, Ster-Kinekor, Nu Metro, gaming/app store purchases
- Medical: Clicks pharmacy, Dis-Chem, doctor/dentist/optometrist visits, medical aid premiums (Discovery Health, Bonitas, Momentum, GEMS)
- Loan Payment: bank loan repayments, vehicle finance (WesBank, MFC), store accounts (Edgars, Mr Price, Foschini, Truworths, Jet), credit card payments, bond/home loan instalments
- Rent: rent paid to a landlord or property manager
- Takeaways: McDonald's, KFC, Nando's, Steers, Debonairs, Mr D Food, Uber Eats, Romans Pizza, Chicken Licken, Wimpy
- Other: anything that doesn't clearly fit above, e.g. bank fees, cash withdrawals, transfers

Default "type" by category unless the description clearly says otherwise: Groceries, Utilities, Medical, Loan Payment, Rent, and Transport are usually "Need"; Entertainment and Takeaways are usually "Want"; for "Other", use your best judgement.

Ignore subtotals, tax lines, payment method lines, and running balances — only list actual purchases or charges.

Respond with ONLY a JSON object of this exact shape, nothing else, no markdown fences:
{{"document_type": "receipt" or "statement", "transactions": [{{"description": "...", "amount": 0, "date": "YYYY-MM-DD", "category": "...", "type": "..."}}]}}"""

    content = [{"type": "text", "text": prompt}]
    for url in image_data_urls:
        content.append({"type": "image_url", "image_url": {"url": url}})

    try:
        client = Groq(api_key=GROQ_API_KEY)
        completion = client.chat.completions.create(
            model=GROQ_VISION_MODEL,
            messages=[{"role": "user", "content": content}],
            temperature=0.2,
            max_completion_tokens=4096,
        )
        raw = completion.choices[0].message.content or ""
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Couldn't reach the AI scanner: {str(e)}")

    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.lower().startswith("json"):
            raw = raw[4:].strip()

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        start, end = raw.find("{"), raw.rfind("}")
        parsed = None
        if start != -1 and end != -1 and end > start:
            try:
                parsed = json.loads(raw[start:end + 1])
            except json.JSONDecodeError:
                parsed = None
        if parsed is None:
            raise HTTPException(status_code=502, detail="Couldn't read that file clearly — try a sharper photo or a cleaner PDF.")

    raw_transactions = parsed.get("transactions", []) if isinstance(parsed, dict) else []
    document_type = parsed.get("document_type") if isinstance(parsed, dict) else None
    if document_type not in ("receipt", "statement"):
        document_type = default_doc_type

    cleaned = []
    for t in raw_transactions:
        if not isinstance(t, dict):
            continue
        try:
            amount = float(t.get("amount", 0))
        except (TypeError, ValueError):
            continue
        if amount <= 0:
            continue

        description = str(t.get("description") or "Unknown").strip()[:100] or "Unknown"

        category = t.get("category")
        if category not in EXPENSE_CATEGORIES:
            category = "Other"

        type_ = t.get("type")
        if type_ not in ("Need", "Want"):
            type_ = "Need" if category in NEED_DEFAULT_CATEGORIES else "Want"

        date = t.get("date")
        try:
            datetime.strptime(date, "%Y-%m-%d")
        except (ValueError, TypeError):
            date = today

        cleaned.append({
            "description": description,
            "amount": round(amount, 2),
            "date": date,
            "category": category,
            "type": type_,
        })

    if not cleaned:
        raise HTTPException(status_code=422, detail="Couldn't find any transactions in that file — try a clearer photo or a different PDF.")

    return {"transactions": cleaned, "document_type": document_type, "truncated": truncated}

# Advisor / client linking — Phase 1 of the advisor SaaS roadmap. This is
# deliberately just the relationship plumbing: an advisor can generate an
# invite code, a client can redeem one to link to that advisor, and the
# advisor can see who's linked. No client financial data is exposed here —
# that's a later phase, built on top of this link once it's verified to work.

@app.post("/advisor/invite", response_model=schemas.AdvisorInviteRead)
def create_advisor_invite(db: Session = Depends(get_db), advisor=Depends(get_current_advisor)):
    code = "".join(secrets.choice(INVITE_CODE_CHARS) for _ in range(INVITE_CODE_LENGTH))
    expires_at = (datetime.now() + timedelta(days=INVITE_EXPIRY_DAYS)).strftime("%Y-%m-%d")
    invite = models.AdvisorInvite(code=code, advisor_id=advisor.id, expires_at=expires_at)
    db.add(invite)
    db.commit()
    return {"code": code, "expires_at": expires_at}

@app.post("/client/link-advisor")
def link_advisor(payload: schemas.LinkAdvisorRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role == "advisor":
        raise HTTPException(status_code=400, detail="Advisor accounts can't link to another advisor.")

    existing_link = db.query(models.AdvisorClient)\
        .filter(models.AdvisorClient.client_id == user.id, models.AdvisorClient.status == "active")\
        .first()
    if existing_link:
        raise HTTPException(status_code=400, detail="This account is already linked to an advisor.")

    invite = db.query(models.AdvisorInvite)\
        .filter(models.AdvisorInvite.code == payload.code.strip().upper())\
        .first()
    if not invite:
        raise HTTPException(status_code=404, detail="That invite code wasn't found. Check it and try again.")
    if invite.used_by_client_id is not None:
        raise HTTPException(status_code=400, detail="That invite code has already been used.")
    try:
        expired = datetime.strptime(invite.expires_at, "%Y-%m-%d") < datetime.now()
    except (ValueError, TypeError):
        expired = True
    if expired:
        raise HTTPException(status_code=400, detail="That invite code has expired — ask your advisor for a new one.")

    link = models.AdvisorClient(advisor_id=invite.advisor_id, client_id=user.id, status="active", created_at=datetime.now().strftime("%Y-%m-%d"))
    db.add(link)
    invite.used_by_client_id = user.id
    user.role = "client"
    db.commit()
    return {"linked": True}

def get_linked_client(client_id: int, db: Session, advisor: models.User):
    """Confirms an active AdvisorClient link exists before any client data is
    returned. Deliberately raises 404 rather than 403 for an unlinked client —
    a 403 would confirm to the advisor that a given client_id exists at all,
    which is more information than they should get for an account they have
    no relationship with."""
    link = db.query(models.AdvisorClient)\
        .filter(models.AdvisorClient.advisor_id == advisor.id, models.AdvisorClient.client_id == client_id, models.AdvisorClient.status == "active")\
        .first()
    if not link:
        raise HTTPException(status_code=404, detail="Client not found.")
    client = db.query(models.User).filter(models.User.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found.")
    return client

@app.get("/advisor/clients", response_model=List[schemas.AdvisorClientRead])
def list_advisor_clients(db: Session = Depends(get_db), advisor=Depends(get_current_advisor)):
    links = db.query(models.AdvisorClient)\
        .filter(models.AdvisorClient.advisor_id == advisor.id, models.AdvisorClient.status == "active")\
        .all()
    result = []
    for link in links:
        client = db.query(models.User).filter(models.User.id == link.client_id).first()
        if client:
            health = compute_financial_health(db, client.id)
            dash = compute_dashboard(db, client.id)
            result.append({
                "id": client.id,
                "name": client.name,
                "email": client.email,
                "status": link.status,
                "linked_since": link.created_at,
                "health_score": health["overall"],
                "total_debt": dash["total_debt"],
            })
    return result

@app.get("/advisor/clients/{client_id}/dashboard")
def advisor_client_dashboard(client_id: int, month: Optional[int] = None, year: Optional[int] = None, db: Session = Depends(get_db), advisor=Depends(get_current_advisor)):
    get_linked_client(client_id, db, advisor)
    return compute_dashboard(db, client_id, month, year)

@app.get("/advisor/clients/{client_id}/financial-health", response_model=schemas.FinancialHealth)
def advisor_client_financial_health(client_id: int, month: Optional[int] = None, year: Optional[int] = None, db: Session = Depends(get_db), advisor=Depends(get_current_advisor)):
    get_linked_client(client_id, db, advisor)
    return compute_financial_health(db, client_id, month, year)

@app.get("/advisor/clients/{client_id}/loans", response_model=List[schemas.LoanRead])
def advisor_client_loans(client_id: int, db: Session = Depends(get_db), advisor=Depends(get_current_advisor)):
    get_linked_client(client_id, db, advisor)
    return db.query(models.Loan).filter(models.Loan.user_id == client_id).all()