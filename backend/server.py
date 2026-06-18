from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Team Pillbox EMS API")
api_router = APIRouter(prefix="/api")


# ===================== MODELS =====================
class StaffMember(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    callsign: str
    rank: str           # e.g. "Chief", "Captain", "Paramedic", "EMT"
    role: str           # short role label
    badge_number: str
    years_served: int
    photo_url: str
    bio: str
    certifications: List[str]
    specialties: List[str]
    response_count: int = 0
    is_command: bool = False
    contact_discord: Optional[str] = None


class ApplicationCreate(BaseModel):
    full_name: str
    in_game_name: str
    age: int
    discord: str
    steam_hex: Optional[str] = ""
    timezone: str
    prior_experience: str
    why_join: str
    availability: str


class Application(ApplicationCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "pending"
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ===================== SEED DATA =====================
SEED_STAFF: List[dict] = [
    {
        "name": "Marcus 'Doc' Reyes",
        "callsign": "EMS-01",
        "rank": "Chief of EMS",
        "role": "Department Commander",
        "badge_number": "P-001",
        "years_served": 8,
        "photo_url": "https://images.pexels.com/photos/8942239/pexels-photo-8942239.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "bio": "Founder of the Pillbox EMS division. Veteran first responder with a calm head and a sharp tactical mind. Built the SOP playbook the rest of the department runs on.",
        "certifications": ["Advanced Cardiac Life Support", "Trauma Specialist", "Incident Commander", "Hazmat Lvl-3"],
        "specialties": ["Mass-casualty triage", "Command operations", "Department training"],
        "response_count": 4112,
        "is_command": True,
        "contact_discord": "doc.reyes",
    },
    {
        "name": "Lena Vasquez",
        "callsign": "EMS-02",
        "rank": "Deputy Chief",
        "role": "Operations Lead",
        "badge_number": "P-002",
        "years_served": 6,
        "photo_url": "https://images.unsplash.com/photo-1780570348905-908c8525ff0b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NDh8MHwxfHNlYXJjaHwyfHxwYXJhbWVkaWMlMjBwb3J0cmFpdHxlbnwwfHx8fDE3ODE3ODkyMDV8MA&ixlib=rb-4.1.0&q=85",
        "bio": "Runs day-to-day field ops. Known for night-shift heroics and a no-nonsense approach to triage during multi-vehicle incidents downtown.",
        "certifications": ["Critical Care Paramedic", "Tactical Medic", "Helicopter Operations"],
        "specialties": ["Field operations", "Air-rescue coordination"],
        "response_count": 3201,
        "is_command": True,
        "contact_discord": "lena.v",
    },
    {
        "name": "Hiro Tanaka",
        "callsign": "EMS-07",
        "rank": "Captain",
        "role": "Training Officer",
        "badge_number": "P-007",
        "years_served": 5,
        "photo_url": "https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "bio": "Designs the academy curriculum every new EMT runs through. Calm instructor on the radio, brutal evaluator on the practice mat.",
        "certifications": ["Lead Instructor", "ACLS", "Pediatric Advanced Life Support"],
        "specialties": ["New-hire onboarding", "Skills certification"],
        "response_count": 1880,
        "is_command": True,
        "contact_discord": "hiro.t",
    },
    {
        "name": "Sasha Okafor",
        "callsign": "EMS-12",
        "rank": "Paramedic",
        "role": "Senior Field Medic",
        "badge_number": "P-012",
        "years_served": 4,
        "photo_url": "https://images.pexels.com/photos/4173324/pexels-photo-4173324.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "bio": "City-wide reputation for impossible saves. First on-scene at the Vinewood pile-up. Carries a personal trauma kit upgraded with her own custom mods.",
        "certifications": ["Advanced Trauma", "ACLS"],
        "specialties": ["Trauma response", "High-speed transport"],
        "response_count": 1564,
        "is_command": False,
        "contact_discord": "sasha.o",
    },
    {
        "name": "Diego Marin",
        "callsign": "EMS-18",
        "rank": "Paramedic",
        "role": "Air Operations",
        "badge_number": "P-018",
        "years_served": 3,
        "photo_url": "https://images.pexels.com/photos/4173265/pexels-photo-4173265.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "bio": "Helicopter pilot turned paramedic. Coordinates Pillbox-1 air rescue. Has logged more rotor hours than anyone else in the department.",
        "certifications": ["Air Medical Crew", "Critical Care"],
        "specialties": ["Air rescue", "Mountain extraction"],
        "response_count": 902,
        "is_command": False,
        "contact_discord": "diego.m",
    },
    {
        "name": "Rin Kowalski",
        "callsign": "EMS-24",
        "rank": "EMT",
        "role": "Field Medic",
        "badge_number": "P-024",
        "years_served": 2,
        "photo_url": "https://images.pexels.com/photos/4173258/pexels-photo-4173258.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "bio": "Sharp eye for spotting overdose calls in the alleys behind Strawberry. Volunteered for the night-shift block almost every week last quarter.",
        "certifications": ["EMT-B", "Naloxone Lead"],
        "specialties": ["Street response", "Overdose intervention"],
        "response_count": 612,
        "is_command": False,
        "contact_discord": "rin.k",
    },
    {
        "name": "Owen Blackwell",
        "callsign": "EMS-29",
        "rank": "EMT",
        "role": "Field Medic",
        "badge_number": "P-029",
        "years_served": 1,
        "photo_url": "https://images.pexels.com/photos/8942566/pexels-photo-8942566.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "bio": "Came up through the academy under Captain Tanaka. Quietly competent, never panics on the radio.",
        "certifications": ["EMT-B"],
        "specialties": ["Patient transport", "Scene support"],
        "response_count": 188,
        "is_command": False,
        "contact_discord": "owen.b",
    },
    {
        "name": "Priya Anand",
        "callsign": "EMS-31",
        "rank": "Probationary EMT",
        "role": "Rookie",
        "badge_number": "P-031",
        "years_served": 0,
        "photo_url": "https://images.pexels.com/photos/4173248/pexels-photo-4173248.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "bio": "Just out of the academy. Ride-alongs only for now, but already shows the instincts of someone twice her service time.",
        "certifications": ["EMT-B (Probationary)"],
        "specialties": ["Learning"],
        "response_count": 24,
        "is_command": False,
        "contact_discord": "priya.a",
    },
]


@app.on_event("startup")
async def seed_staff():
    existing = await db.staff.count_documents({})
    if existing == 0:
        docs = []
        for s in SEED_STAFF:
            member = StaffMember(**s)
            docs.append(member.model_dump())
        if docs:
            await db.staff.insert_many(docs)
        logger.info(f"Seeded {len(docs)} staff members")


# ===================== ROUTES =====================
@api_router.get("/")
async def root():
    return {"message": "Team Pillbox EMS API", "status": "10-8 in service"}


@api_router.get("/staff", response_model=List[StaffMember])
async def list_staff():
    cursor = db.staff.find({}, {"_id": 0})
    items = await cursor.to_list(500)
    # Sort: command first, then by years_served desc
    items.sort(key=lambda x: (not x.get("is_command", False), -x.get("years_served", 0)))
    return items


@api_router.get("/staff/{staff_id}", response_model=StaffMember)
async def get_staff(staff_id: str):
    doc = await db.staff.find_one({"id": staff_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return doc


@api_router.post("/applications", response_model=Application)
async def create_application(payload: ApplicationCreate):
    app_obj = Application(**payload.model_dump())
    doc = app_obj.model_dump()
    doc["submitted_at"] = doc["submitted_at"].isoformat()
    await db.applications.insert_one(doc)
    return app_obj


@api_router.get("/applications", response_model=List[Application])
async def list_applications():
    cursor = db.applications.find({}, {"_id": 0}).sort("submitted_at", -1)
    items = await cursor.to_list(500)
    for it in items:
        if isinstance(it.get("submitted_at"), str):
            try:
                it["submitted_at"] = datetime.fromisoformat(it["submitted_at"])
            except Exception:
                pass
    return items


@api_router.get("/stats")
async def stats():
    staff_count = await db.staff.count_documents({})
    apps_count = await db.applications.count_documents({})
    total_responses_cursor = db.staff.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$response_count"}}}
    ])
    total_responses = 0
    async for row in total_responses_cursor:
        total_responses = row.get("total", 0)
    return {
        "active_personnel": staff_count,
        "applications_received": apps_count,
        "total_responses": total_responses,
        "years_in_service": 8,
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
