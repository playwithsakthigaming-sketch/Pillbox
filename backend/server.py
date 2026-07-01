from fastapi import FastAPI, APIRouter, HTTPException, Header, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
import requests
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Configure logging up-front
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Team Pillbox EMS API")
api_router = APIRouter(prefix="/api")


# ===================== MODELS =====================
class CityExperience(BaseModel):
    city: str
    grade: str = ""
    months: int = 0


class StaffMember(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    callsign: str
    rank: str
    role: str
    badge_number: str
    years_served: int = 0
    photo_url: str = ""
    bio: str = ""
    certifications: List[str] = Field(default_factory=list)
    specialties: List[str] = Field(default_factory=list)
    experience_cities: List[CityExperience] = Field(default_factory=list)
    is_command: bool = False
    contact_discord: Optional[str] = None


class StaffCreate(BaseModel):
    name: str
    callsign: str
    rank: str
    role: str
    badge_number: str
    years_served: int = 0
    photo_url: str = ""
    bio: str = ""
    certifications: List[str] = Field(default_factory=list)
    specialties: List[str] = Field(default_factory=list)
    experience_cities: List[CityExperience] = Field(default_factory=list)
    is_command: bool = False
    contact_discord: Optional[str] = None


class StaffUpdate(BaseModel):
    name: Optional[str] = None
    callsign: Optional[str] = None
    rank: Optional[str] = None
    role: Optional[str] = None
    badge_number: Optional[str] = None
    years_served: Optional[int] = None
    photo_url: Optional[str] = None
    bio: Optional[str] = None
    certifications: Optional[List[str]] = None
    specialties: Optional[List[str]] = None
    experience_cities: Optional[List[CityExperience]] = None
    is_command: Optional[bool] = None
    contact_discord: Optional[str] = None


class ApplicationCreate(BaseModel):
    full_name: str
    in_game_name: str
    age: int
    discord: str
    discord_user_id: Optional[str] = ""
    steam_hex: Optional[str] = ""
    timezone: str
    prior_experience: str
    why_join: str
    availability: str


class Application(ApplicationCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "pending"
    review_message: Optional[str] = ""
    reviewed_at: Optional[datetime] = None
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ApplicationStatusUpdate(BaseModel):
    status: str  # accepted | rejected | interview | pending
    message: Optional[str] = ""


class GalleryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    image_data: str  # data URL (data:image/...;base64,...)
    caption: str = ""
    source: str = "admin"  # "admin" | "discord"
    uploaded_by: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class GalleryCreate(BaseModel):
    image_data: str
    caption: str = ""
    uploaded_by: str = ""


class AdminLogin(BaseModel):
    token: str


# ===================== AUTH =====================
def require_admin(x_admin_token: Optional[str] = Header(None)):
    expected = os.environ.get("ADMIN_TOKEN", "")
    if not expected or not x_admin_token or x_admin_token != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True


# ===================== DISCORD WEBHOOK =====================
def _send_discord_application(application: Application) -> None:
    """Synchronous webhook send — runs in thread executor."""
    webhook_url = os.environ.get("DISCORD_WEBHOOK_URL", "").strip()
    if not webhook_url:
        logger.info("DISCORD_WEBHOOK_URL not set — skipping Discord notification.")
        return
    embed = {
        "title": "New EMS Application Received",
        "description": f"**Ref ID:** `{application.id[:8].upper()}`",
        "color": 0x2A6DF4,
        "fields": [
            {"name": "Full Name", "value": application.full_name or "—", "inline": True},
            {"name": "In-Game Name", "value": application.in_game_name or "—", "inline": True},
            {"name": "Age", "value": str(application.age), "inline": True},
            {"name": "Discord", "value": application.discord or "—", "inline": True},
            {"name": "Steam Hex", "value": application.steam_hex or "—", "inline": True},
            {"name": "Timezone", "value": application.timezone or "—", "inline": True},
            {"name": "Availability", "value": (application.availability or "—")[:1024], "inline": False},
            {"name": "Prior Experience", "value": (application.prior_experience or "—")[:1024], "inline": False},
            {"name": "Why Join", "value": (application.why_join or "—")[:1024], "inline": False},
        ],
        "footer": {"text": "Team Pillbox · EMS Recruitment"},
        "timestamp": application.submitted_at.isoformat(),
    }
    payload = {
        "username": "Pillbox EMS Recruitment",
        "embeds": [embed],
    }
    try:
        r = requests.post(webhook_url, json=payload, timeout=10)
        if r.status_code >= 300:
            logger.warning(f"Discord webhook returned {r.status_code}: {r.text[:200]}")
    except Exception as e:
        logger.warning(f"Discord webhook failed: {e}")


async def send_discord_application(application: Application) -> None:
    await asyncio.get_event_loop().run_in_executor(None, _send_discord_application, application)


# ===================== DISCORD STATUS UPDATE WEBHOOK =====================
STATUS_COLORS = {
    "accepted": 0x22C55E,   # green
    "rejected": 0xEF4444,   # red
    "interview": 0xFFB703,  # amber
    "pending":  0x6B7280,   # gray
}

STATUS_LABELS = {
    "accepted": "ACCEPTED",
    "rejected": "REJECTED",
    "interview": "INTERVIEW SCHEDULED",
    "pending":  "RE-OPENED (PENDING)",
}


def _send_discord_status(application: Application, status: str, message: str) -> None:
    webhook_url = os.environ.get("DISCORD_WEBHOOK_URL", "").strip()
    if not webhook_url:
        return
    embed = {
        "title": f"Application {STATUS_LABELS.get(status, status.upper())}",
        "description": f"**Ref ID:** `{application.id[:8].upper()}`\n**Applicant:** {application.full_name} ({application.in_game_name})",
        "color": STATUS_COLORS.get(status, 0x2A6DF4),
        "fields": [
            {"name": "Discord", "value": application.discord or "—", "inline": True},
            {"name": "Status", "value": STATUS_LABELS.get(status, status), "inline": True},
        ],
        "footer": {"text": "Team Pillbox · EMS Recruitment"},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    if message:
        embed["fields"].append({"name": "Note from Command", "value": message[:1024], "inline": False})

    try:
        r = requests.post(webhook_url, json={"username": "Pillbox EMS Recruitment", "embeds": [embed]}, timeout=10)
        if r.status_code >= 300:
            logger.warning(f"Discord status webhook {r.status_code}: {r.text[:200]}")
    except Exception as e:
        logger.warning(f"Discord status webhook failed: {e}")


async def send_discord_status(application: Application, status: str, message: str) -> None:
    await asyncio.get_event_loop().run_in_executor(None, _send_discord_status, application, status, message)


# ===================== DISCORD BOT DM =====================
def _send_bot_dm(user_id: str, content: str) -> bool:
    """Open a DM channel with user_id and send `content`. Returns True on success."""
    token = os.environ.get("DISCORD_BOT_TOKEN", "").strip()
    if not token or not user_id:
        return False
    headers = {
        "Authorization": f"Bot {token}",
        "Content-Type": "application/json",
        "User-Agent": "PillboxEMS (https://pillbox-ems, 1.0)",
    }
    try:
        # 1. Open / get DM channel
        r = requests.post(
            "https://discord.com/api/v10/users/@me/channels",
            headers=headers,
            json={"recipient_id": str(user_id)},
            timeout=10,
        )
        if r.status_code >= 300:
            logger.warning(f"Open DM failed {r.status_code}: {r.text[:200]}")
            return False
        channel_id = r.json().get("id")
        if not channel_id:
            return False
        # 2. Send the message
        r2 = requests.post(
            f"https://discord.com/api/v10/channels/{channel_id}/messages",
            headers=headers,
            json={"content": content},
            timeout=10,
        )
        if r2.status_code >= 300:
            logger.warning(f"Send DM failed {r2.status_code}: {r2.text[:200]}")
            return False
        return True
    except Exception as e:
        logger.warning(f"Bot DM failed: {e}")
        return False


async def send_bot_dm(user_id: str, content: str) -> bool:
    return await asyncio.get_event_loop().run_in_executor(None, _send_bot_dm, user_id, content)


# ===================== DISCORD GALLERY WEBHOOK =====================
import base64
import re

DATA_URL_RE = re.compile(r"^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$", re.DOTALL)


def _send_gallery_webhook(image_data: str, caption: str) -> None:
    webhook_url = os.environ.get("DISCORD_WEBHOOK_URL", "").strip()
    if not webhook_url:
        return
    m = DATA_URL_RE.match(image_data or "")
    if not m:
        return
    mime, b64 = m.group(1), m.group(2)
    try:
        binary = base64.b64decode(b64, validate=False)
    except Exception:
        return
    ext = mime.split("/")[-1].lower()
    if ext == "jpeg":
        ext = "jpg"
    filename = f"gallery.{ext}"
    payload_json = {
        "username": "Pillbox EMS Gallery",
        "content": (caption or "")[:1900] or None,
    }
    try:
        r = requests.post(
            webhook_url,
            data={"payload_json": __import__("json").dumps(payload_json)},
            files={"file": (filename, binary, mime)},
            timeout=15,
        )
        if r.status_code >= 300:
            logger.warning(f"Gallery webhook {r.status_code}: {r.text[:200]}")
    except Exception as e:
        logger.warning(f"Gallery webhook failed: {e}")


async def send_gallery_webhook(image_data: str, caption: str) -> None:
    await asyncio.get_event_loop().run_in_executor(None, _send_gallery_webhook, image_data, caption)


# ===================== DISCORD ID-CARD DOWNLOAD LOG =====================
def _send_idcard_log(data: dict) -> None:
    webhook_url = os.environ.get("DISCORD_WEBHOOK_URL", "").strip()
    if not webhook_url:
        return
    embed = {
        "title": "ID Card Issued",
        "description": f"**{data.get('full_name') or '—'}** · `{data.get('badge_number') or '—'}`",
        "color": 0x2A6DF4,
        "fields": [
            {"name": "Callsign", "value": data.get("callsign") or "—", "inline": True},
            {"name": "Rank", "value": data.get("rank") or "—", "inline": True},
            {"name": "Blood", "value": data.get("blood_type") or "—", "inline": True},
            {"name": "Issued", "value": data.get("issued") or "—", "inline": True},
            {"name": "Expires", "value": data.get("expires") or "—", "inline": True},
            {"name": "Division", "value": data.get("division") or "TEAM PILLBOX", "inline": True},
        ],
        "footer": {"text": "Team Pillbox · ID Card download log"},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    try:
        r = requests.post(
            webhook_url,
            json={"username": "Pillbox EMS · ID Issuance", "embeds": [embed]},
            timeout=10,
        )
        if r.status_code >= 300:
            logger.warning(f"ID-card webhook {r.status_code}: {r.text[:200]}")
    except Exception as e:
        logger.warning(f"ID-card webhook failed: {e}")


async def send_idcard_log(data: dict) -> None:
    await asyncio.get_event_loop().run_in_executor(None, _send_idcard_log, data)


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
        "experience_cities": [{"city": "Los Santos", "grade": "Senior", "months": 24}, {"city": "Paleto Bay", "grade": "Intermediate", "months": 8}],
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
        "experience_cities": [{"city": "Los Santos", "grade": "Senior", "months": 24}, {"city": "Paleto Bay", "grade": "Intermediate", "months": 8}],
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
        "experience_cities": [{"city": "Los Santos", "grade": "Senior", "months": 24}, {"city": "Paleto Bay", "grade": "Intermediate", "months": 8}],
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
        "experience_cities": [{"city": "Los Santos", "grade": "Senior", "months": 24}, {"city": "Paleto Bay", "grade": "Intermediate", "months": 8}],
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
        "experience_cities": [{"city": "Los Santos", "grade": "Senior", "months": 24}, {"city": "Paleto Bay", "grade": "Intermediate", "months": 8}],
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
        "experience_cities": [{"city": "Los Santos", "grade": "Senior", "months": 24}, {"city": "Paleto Bay", "grade": "Intermediate", "months": 8}],
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
        "experience_cities": [{"city": "Los Santos", "grade": "Senior", "months": 24}, {"city": "Paleto Bay", "grade": "Intermediate", "months": 8}],
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
        "experience_cities": [{"city": "Los Santos", "grade": "Senior", "months": 24}, {"city": "Paleto Bay", "grade": "Intermediate", "months": 8}],
        "is_command": False,
        "contact_discord": "priya.a",
    },
]


@app.on_event("startup")
async def seed_staff():
    # Migration: drop legacy response_count, ensure experience_cities exists.
    try:
        await db.staff.update_many(
            {"response_count": {"$exists": True}},
            {"$unset": {"response_count": ""}},
        )
        await db.staff.update_many(
            {"experience_cities": {"$exists": False}},
            {"$set": {"experience_cities": []}},
        )
    except Exception as e:
        logger.warning(f"Staff migration failed: {e}")

    existing = await db.staff.count_documents({})
    if existing == 0:
        docs = [StaffMember(**s).model_dump() for s in SEED_STAFF]
        if docs:
            await db.staff.insert_many(docs)
        logger.info(f"Seeded {len(docs)} staff members")


# ===================== PUBLIC ROUTES =====================
@api_router.get("/")
async def root():
    return {"message": "Team Pillbox EMS API", "status": "10-8 in service"}


@api_router.get("/staff", response_model=List[StaffMember])
async def list_staff():
    cursor = db.staff.find({}, {"_id": 0})
    items = await cursor.to_list(500)
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
    # Fire-and-forget Discord notification
    asyncio.create_task(send_discord_application(app_obj))
    return app_obj


@api_router.get("/applications/status/{ref}")
async def application_status(ref: str):
    """Public lookup. `ref` may be the full UUID or the 8-character short ref."""
    ref = ref.strip().lower()
    if not ref or len(ref) < 4:
        raise HTTPException(status_code=400, detail="Reference too short")
    if len(ref) >= 32:
        doc = await db.applications.find_one({"id": ref}, {"_id": 0})
    else:
        # Match by uuid prefix (first 8 hex chars)
        doc = await db.applications.find_one(
            {"id": {"$regex": f"^{ref}"}}, {"_id": 0}
        )
    if not doc:
        raise HTTPException(status_code=404, detail="No application found for that reference")
    return {
        "ref_id": doc["id"][:8].upper(),
        "applicant": doc.get("full_name", ""),
        "in_game_name": doc.get("in_game_name", ""),
        "status": doc.get("status", "pending"),
        "review_message": doc.get("review_message", "") or "",
        "submitted_at": doc.get("submitted_at"),
        "reviewed_at": doc.get("reviewed_at"),
    }


@api_router.get("/stats")
async def stats():
    staff_count = await db.staff.count_documents({})
    # Count distinct cities across all staff experience_cities entries
    distinct_cities = await db.staff.distinct("experience_cities.city")
    return {
        "active_personnel": staff_count,
        "teams_in_cities": len(distinct_cities),
        "years_in_service": 8,
    }


# ===================== ADMIN ROUTES =====================
@api_router.post("/admin/login")
async def admin_login(payload: AdminLogin):
    expected = os.environ.get("ADMIN_TOKEN", "")
    if not expected or payload.token != expected:
        raise HTTPException(status_code=401, detail="Invalid admin token")
    return {"ok": True, "token": expected}


@api_router.get("/admin/applications", response_model=List[Application])
async def list_applications(_: bool = Depends(require_admin)):
    cursor = db.applications.find({}, {"_id": 0}).sort("submitted_at", -1)
    items = await cursor.to_list(500)
    for it in items:
        if isinstance(it.get("submitted_at"), str):
            try:
                it["submitted_at"] = datetime.fromisoformat(it["submitted_at"])
            except Exception:
                pass
    return items


@api_router.post("/admin/staff", response_model=StaffMember)
async def admin_create_staff(payload: StaffCreate, _: bool = Depends(require_admin)):
    member = StaffMember(**payload.model_dump())
    await db.staff.insert_one(member.model_dump())
    return member


@api_router.patch("/admin/staff/{staff_id}", response_model=StaffMember)
async def admin_update_staff(staff_id: str, payload: StaffUpdate, _: bool = Depends(require_admin)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    res = await db.staff.update_one({"id": staff_id}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Staff member not found")
    doc = await db.staff.find_one({"id": staff_id}, {"_id": 0})
    return doc


@api_router.delete("/admin/staff/{staff_id}")
async def admin_delete_staff(staff_id: str, _: bool = Depends(require_admin)):
    res = await db.staff.delete_one({"id": staff_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return {"ok": True, "deleted": staff_id}


@api_router.delete("/admin/applications/{application_id}")
async def admin_delete_application(application_id: str, _: bool = Depends(require_admin)):
    res = await db.applications.delete_one({"id": application_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"ok": True, "deleted": application_id}


# ===================== GALLERY =====================
MAX_GALLERY_BYTES = 5 * 1024 * 1024  # 5 MB after base64 decode


@api_router.get("/gallery")
async def gallery_list():
    cursor = db.gallery.find({}, {"_id": 0}).sort("created_at", -1).limit(200)
    items = await cursor.to_list(200)
    for it in items:
        if isinstance(it.get("created_at"), str):
            # leave as-is for JSON; client handles parse
            pass
    return items


@api_router.post("/admin/gallery", response_model=GalleryItem)
async def admin_gallery_create(payload: GalleryCreate, _: bool = Depends(require_admin)):
    if not payload.image_data or not payload.image_data.startswith("data:image/"):
        raise HTTPException(status_code=400, detail="image_data must be a data:image/...;base64 URL")
    m = DATA_URL_RE.match(payload.image_data)
    if not m:
        raise HTTPException(status_code=400, detail="Invalid image data URL")
    try:
        size = len(base64.b64decode(m.group(2), validate=False))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 payload")
    if size > MAX_GALLERY_BYTES:
        raise HTTPException(status_code=413, detail=f"Image too large (max {MAX_GALLERY_BYTES // 1024 // 1024} MB)")

    item = GalleryItem(
        image_data=payload.image_data,
        caption=(payload.caption or "")[:500],
        source="admin",
        uploaded_by=(payload.uploaded_by or "command")[:80],
    )
    doc = item.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.gallery.insert_one(doc)

    # Fire-and-forget Discord post with the actual image
    asyncio.create_task(send_gallery_webhook(payload.image_data, payload.caption or ""))
    return item


@api_router.delete("/admin/gallery/{item_id}")
async def admin_gallery_delete(item_id: str, _: bool = Depends(require_admin)):
    res = await db.gallery.delete_one({"id": item_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Gallery item not found")
    return {"ok": True, "deleted": item_id}


# ===================== ID-CARD DOWNLOAD LOG =====================
class IdCardLogPayload(BaseModel):
    full_name: str = ""
    callsign: str = ""
    rank: str = ""
    badge_number: str = ""
    blood_type: str = ""
    issued: str = ""
    expires: str = ""
    division: str = "TEAM PILLBOX"


@api_router.post("/admin/idcard/log")
async def admin_idcard_log(payload: IdCardLogPayload, _: bool = Depends(require_admin)):
    data = payload.model_dump()
    # Persist a record + fire Discord embed
    record = {
        **data,
        "id": str(uuid.uuid4()),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        await db.idcard_logs.insert_one(record)
    except Exception as e:
        logger.warning(f"idcard log insert failed: {e}")
    asyncio.create_task(send_idcard_log(data))
    return {"ok": True, "id": record["id"]}


@api_router.patch("/admin/applications/{application_id}", response_model=Application)
async def admin_update_application_status(
    application_id: str,
    payload: ApplicationStatusUpdate,
    _: bool = Depends(require_admin),
):
    status_value = payload.status.lower().strip()
    if status_value not in {"accepted", "rejected", "interview", "pending"}:
        raise HTTPException(status_code=400, detail="Invalid status")

    now_iso = datetime.now(timezone.utc).isoformat()
    res = await db.applications.update_one(
        {"id": application_id},
        {"$set": {
            "status": status_value,
            "review_message": payload.message or "",
            "reviewed_at": now_iso,
        }},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")

    doc = await db.applications.find_one({"id": application_id}, {"_id": 0})
    # Coerce stored ISO strings back to datetimes for the response model
    for field in ("submitted_at", "reviewed_at"):
        if isinstance(doc.get(field), str):
            try:
                doc[field] = datetime.fromisoformat(doc[field])
            except Exception:
                pass
    app_obj = Application(**doc)

    # Fire-and-forget Discord notifications
    asyncio.create_task(send_discord_status(app_obj, status_value, payload.message or ""))

    # DM the applicant if we have their Discord user id
    user_id = (app_obj.discord_user_id or "").strip()
    if user_id and status_value != "pending":
        ref = app_obj.id[:8].upper()
        title = STATUS_LABELS.get(status_value, status_value.upper())
        dm_body = (
            f"**Team Pillbox EMS — Application {title}**\n"
            f"Ref ID: `{ref}`\n"
            f"Applicant: {app_obj.full_name} ({app_obj.in_game_name})\n"
        )
        if payload.message:
            dm_body += f"\nNote from Command:\n>>> {payload.message}\n"
        dm_body += "\nYou can re-check your status anytime on the website using your Ref ID."
        asyncio.create_task(send_bot_dm(user_id, dm_body))

    return app_obj


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
