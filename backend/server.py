from fastapi import FastAPI, APIRouter, HTTPException, Query, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import jwt, JWTError
import re
import requests
from urllib.parse import urljoin, urlparse

try:
    from bs4 import BeautifulSoup
except Exception:
    BeautifulSoup = None

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api = APIRouter(prefix="/api")

pwd_ctx = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
JWT_SECRET = os.environ.get("JWT_SECRET", "dev_secret_change_me")
JWT_ALG = "HS256"
JWT_EXPIRE_MIN = int(os.environ.get("JWT_EXPIRES_MINUTES", "10080"))
bearer_scheme = HTTPBearer(auto_error=False)


def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def to_int(value: str) -> Optional[int]:
    if value is None:
        return None
    s = str(value).strip().lower()
    if s == "" or s == "none":
        return None
    mult = 1
    if any(k in s for k in ["m", "млн", "million", "миллион"]):
        mult = 1_000_000
    elif any(k in s for k in ["k", "тыс", "thousand"]):
        mult = 1_000
    num = re.findall(r"[\d]+(?:[\.,]\d+)?", s)
    if not num:
        return None
    n = num[0].replace(",", ".")
    try:
        if "." in n:
            return int(float(n) * mult)
        return int(int(n) * mult)
    except Exception:
        return None


def to_float(value: str) -> Optional[float]:
    if value is None:
        return None
    s = str(value).strip().replace(",", ".")
    try:
        return float(s)
    except Exception:
        return None


def prepare_for_mongo(data: Dict[str, Any]) -> Dict[str, Any]:
    data = dict(data)
    for k in ["created_at", "updated_at", "link_last_checked", "dead_at", "last_post_at"]:
        if isinstance(data.get(k), datetime):
            data[k] = data[k].astimezone(timezone.utc).isoformat()
    return data


def parse_from_mongo(item: Dict[str, Any]) -> Dict[str, Any]:
    item = dict(item)
    item.pop("_id", None)
    return item

# -------------------- Models --------------------

class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: str = Field(default_factory=utcnow_iso)

class StatusCheckCreate(BaseModel):
    client_name: str

ChannelStatus = Literal["draft", "approved", "rejected"]

class ChannelBase(BaseModel):
    name: str
    link: str
    avatar_url: Optional[str] = None
    category: Optional[str] = None
    language: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    subscribers: int = 0
    er: Optional[float] = None
    price_rub: Optional[int] = None
    cpm_rub: Optional[float] = None
    growth_30d: Optional[float] = None
    last_post_at: Optional[str] = None
    short_description: Optional[str] = None
    seo_description: Optional[str] = None
    status: ChannelStatus = "approved"
    is_featured: bool = False
    growth_score: Optional[float] = None
    link_status: Optional[Literal["alive", "dead"]] = None
    link_last_checked: Optional[str] = None
    dead_at: Optional[str] = None

class ChannelCreate(ChannelBase):
    name: str
    link: str

class ChannelUpdate(BaseModel):
    name: Optional[str] = None
    link: Optional[str] = None
    avatar_url: Optional[str] = None
    category: Optional[str] = None
    language: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    subscribers: Optional[int] = None
    er: Optional[float] = None
    price_rub: Optional[int] = None
    cpm_rub: Optional[float] = None
    growth_30d: Optional[float] = None
    last_post_at: Optional[str] = None
    short_description: Optional[str] = None
    seo_description: Optional[str] = None
    status: Optional[ChannelStatus] = None
    is_featured: Optional[bool] = None
    growth_score: Optional[float] = None
    link_status: Optional[Literal["alive", "dead"]] = None

class ChannelResponse(ChannelBase):
    id: str
    created_at: str
    updated_at: str

class PaginatedChannels(BaseModel):
    items: List[ChannelResponse]
    total: int
    page: int
    limit: int
    has_more: bool

class UserBase(BaseModel):
    email: EmailStr
    role: Literal["admin", "editor"] = "admin"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    created_at: str

class PasteLinksPayload(BaseModel):
    links: List[str]
    category: Optional[str] = None

# -------------------- Creator Models --------------------

CreatorRole = Literal["owner", "editor", "member"]
PriorityLevel = Literal["normal", "featured", "premium"]

class CreatorPricing(BaseModel):
    min_price: Optional[int] = None
    max_price: Optional[int] = None
    currency: str = "RUB"

class CreatorAudienceStats(BaseModel):
    gender_male_percent: Optional[float] = None
    gender_female_percent: Optional[float] = None
    geo_russia_percent: Optional[float] = None
    geo_ukraine_percent: Optional[float] = None
    geo_belarus_percent: Optional[float] = None
    geo_other_percent: Optional[float] = None
    age_18_24_percent: Optional[float] = None
    age_25_34_percent: Optional[float] = None
    age_35_44_percent: Optional[float] = None
    age_45_plus_percent: Optional[float] = None

class CreatorContacts(BaseModel):
    email: Optional[str] = None
    tg_username: Optional[str] = None
    other_links: List[str] = Field(default_factory=list)

class CreatorExternal(BaseModel):
    website: Optional[str] = None
    telegram_username: Optional[str] = None
    telegram_url: Optional[str] = None
    instagram: Optional[str] = None
    youtube: Optional[str] = None

class CreatorMetrics(BaseModel):
    channels_count: int = 0
    subscribers_total: int = 0
    avg_er_percent: Optional[float] = None
    min_price_rub: Optional[int] = None
    avg_price_rub: Optional[int] = None
    avg_cpm_rub: Optional[int] = None
    last_post_at_min: Optional[str] = None

class CreatorFlags(BaseModel):
    featured: bool = False
    verified: bool = False
    active: bool = True

class CreatorBase(BaseModel):
    name: str
    slug: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    category: Optional[str] = None
    tags: List[str] = Field(default_factory=list, max_items=20)
    country: Optional[str] = None
    language: Optional[str] = None
    external: CreatorExternal = Field(default_factory=CreatorExternal)
    pricing: CreatorPricing = Field(default_factory=CreatorPricing)
    audience_stats: CreatorAudienceStats = Field(default_factory=CreatorAudienceStats)
    contacts: CreatorContacts = Field(default_factory=CreatorContacts)
    priority_level: PriorityLevel = "normal"
    flags: CreatorFlags = Field(default_factory=CreatorFlags)

class CreatorCreate(CreatorBase):
    name: str

class CreatorUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = Field(None, max_items=20)
    country: Optional[str] = None
    language: Optional[str] = None
    external: Optional[CreatorExternal] = None
    pricing: Optional[CreatorPricing] = None
    audience_stats: Optional[CreatorAudienceStats] = None
    contacts: Optional[CreatorContacts] = None
    priority_level: Optional[PriorityLevel] = None
    flags: Optional[CreatorFlags] = None

class ChannelMinimal(BaseModel):
    id: str
    name: str
    link: str
    subscribers: int
    price_rub: Optional[int] = None
    er: Optional[float] = None
    last_post_at: Optional[str] = None
    link_status: Optional[str] = None
    category: Optional[str] = None

class CreatorResponse(CreatorBase):
    id: str
    metrics: CreatorMetrics = Field(default_factory=CreatorMetrics)
    created_at: str
    updated_at: str
    channels: Optional[List[ChannelMinimal]] = None

class PaginatedCreators(BaseModel):
    items: List[CreatorResponse]
    meta: Dict[str, Any]

class CreatorChannelLinkBase(BaseModel):
    creator_id: str
    channel_id: str
    role: Optional[CreatorRole] = None
    primary: bool = False

class CreatorChannelLinkCreate(CreatorChannelLinkBase):
    pass

class CreatorChannelLinkResponse(CreatorChannelLinkBase):
    id: str
    created_at: str

class LinkChannelsPayload(BaseModel):
    channel_ids: List[str]
    primary_id: Optional[str] = None

class VerifyCreatorPayload(BaseModel):
    verified: bool = True

class FeatureCreatorPayload(BaseModel):
    priority_level: PriorityLevel

# -------------------- Creator Utilities --------------------

def generate_slug(name: str) -> str:
    """Generate URL-safe slug from name"""
    import unicodedata
    # Remove accents and convert to lowercase
    slug = unicodedata.normalize('NFKD', name.lower())
    # Replace spaces and special chars with hyphens
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[\s_-]+', '-', slug)
    # Remove leading/trailing hyphens
    slug = slug.strip('-')
    return slug or "creator"

async def ensure_unique_slug(base_slug: str, creator_id: Optional[str] = None) -> str:
    """Ensure slug is unique by appending number if needed"""
    slug = base_slug
    counter = 1
    while True:
        query = {"slug": slug}
        if creator_id:
            query["id"] = {"$ne": creator_id}
        existing = await db.creators.find_one(query)
        if not existing:
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1

async def recompute_creator_metrics(creator_id: str) -> CreatorMetrics:
    """Recompute metrics for a creator based on linked channels"""
    # Get all channel links for this creator
    links_cursor = db.creator_channel_links.find({"creator_id": creator_id})
    links = await links_cursor.to_list(length=None)
    
    if not links:
        return CreatorMetrics()
    
    # Get all linked channels that are approved/published
    channel_ids = [link["channel_id"] for link in links]
    channels_cursor = db.channels.find({
        "id": {"$in": channel_ids},
        "status": {"$in": ["approved"]}
    })
    channels = await channels_cursor.to_list(length=None)
    
    if not channels:
        return CreatorMetrics()
    
    # Compute metrics
    metrics = CreatorMetrics()
    metrics.channels_count = len(channels)
    
    # Sum subscribers (only alive channels)
    alive_channels = [ch for ch in channels if ch.get("link_status") != "dead"]
    if not alive_channels:
        alive_channels = channels  # fallback to all if status unknown
    
    metrics.subscribers_total = sum(ch.get("subscribers", 0) for ch in alive_channels)
    
    # Weighted average ER
    er_channels = [(ch.get("er", 0), ch.get("subscribers", 0)) 
                   for ch in channels if ch.get("er") is not None and ch.get("er") > 0]
    if er_channels:
        total_weighted_er = sum(er * subs for er, subs in er_channels)
        total_subs = sum(subs for _, subs in er_channels)
        if total_subs > 0:
            metrics.avg_er_percent = round(total_weighted_er / total_subs, 3)
    
    # Price metrics
    prices = [ch.get("price_rub") for ch in channels 
              if ch.get("price_rub") is not None and ch.get("price_rub") > 0]
    if prices:
        metrics.min_price_rub = min(prices)
        metrics.avg_price_rub = int(sum(prices) / len(prices))
    
    # Weighted average CPM
    cpm_channels = [(ch.get("cpm_rub", 0), ch.get("subscribers", 0)) 
                    for ch in channels if ch.get("cpm_rub") is not None and ch.get("cpm_rub") > 0]
    if cpm_channels:
        total_weighted_cpm = sum(cpm * subs for cpm, subs in cpm_channels)
        total_subs = sum(subs for _, subs in cpm_channels)
        if total_subs > 0:
            metrics.avg_cpm_rub = int(total_weighted_cpm / total_subs)
    
    # Most recent post date
    post_dates = [ch.get("last_post_at") for ch in channels if ch.get("last_post_at")]
    if post_dates:
        # Get the most recent (max) post date
        metrics.last_post_at_min = max(post_dates)
    
    # Update creator record with new metrics
    await db.creators.update_one(
        {"id": creator_id},
        {"$set": {"metrics": metrics.dict(), "updated_at": utcnow_iso()}}
    )
    
    return metrics

# -------------------- Indexes --------------------

async def create_indexes():
    try:
        # Existing indexes
        await db.users.create_index("email", unique=True)
        await db.channels.create_index("id", unique=True)
        await db.channels.create_index([("status", 1), ("subscribers", -1)])
        await db.channels.create_index([("created_at", -1)])
        await db.channels.create_index([("price_rub", -1)])
        await db.channels.create_index([("er", -1)])
        await db.channels.create_index(
            [("name", "text"), ("short_description", "text"), ("seo_description", "text")],
            default_language="ru",
            language_override="textLang",
            name="channels_text_idx",
        )
        await db.categories.create_index("name", unique=True)
        
        # New creator indexes
        await db.creators.create_index("id", unique=True)
        await db.creators.create_index("slug", unique=True)
        await db.creators.create_index(
            [("name", "text"), ("tags", "text")],
            default_language="ru",
            language_override="textLang",
            name="creators_text_idx",
        )
        await db.creators.create_index([("category", 1), ("language", 1)])
        await db.creators.create_index([("metrics.subscribers_total", -1)])
        await db.creators.create_index([("metrics.avg_er_percent", -1)])
        await db.creators.create_index([("metrics.min_price_rub", 1)])
        await db.creators.create_index([("created_at", -1)])
        
        # Creator-channel link indexes
        await db.creator_channel_links.create_index("id", unique=True)
        await db.creator_channel_links.create_index([("creator_id", 1), ("channel_id", 1)], unique=True)
        await db.creator_channel_links.create_index("channel_id")
    except Exception:
        pass

# -------------------- Auth Helpers --------------------

def make_token(user: Dict[str, Any]) -> str:
    payload = {
        "sub": user["id"],
        "email": user["email"],
        "role": user.get("role", "admin"),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MIN),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)) -> Dict[str, Any]:
    if not credentials:
        raise HTTPException(401, detail="Not authenticated")
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        uid = payload.get("sub")
        if not uid:
            raise HTTPException(401, detail="Invalid token")
        user = await db.users.find_one({"id": uid})
        if not user:
            raise HTTPException(401, detail="User not found")
        return parse_from_mongo(user)
    except JWTError:
        raise HTTPException(401, detail="Invalid token")

async def get_current_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if user.get("role") != "admin":
        raise HTTPException(403, detail="Admin required")
    return user

# -------------------- Defaults --------------------

DEFAULT_CATEGORIES = ["Новости", "Технологии", "Крипто", "Бизнес", "Развлечения"]

# -------------------- Routes --------------------

@api.get("/health")
async def health():
    return {"ok": True, "time": utcnow_iso()}

@api.get("/")
async def root():
    return {"message": "TeleIndex API"}

@api.get("/auth/can-register")
async def can_register():
    count = await db.users.count_documents({})
    return {"allowed": count == 0}

@api.post("/auth/register", response_model=UserResponse)
async def register(user: UserCreate):
    existing_count = await db.users.count_documents({})
    if existing_count > 0:
        raise HTTPException(403, detail="Registration disabled. Ask an admin.")
    data = {
        "id": str(uuid.uuid4()),
        "email": str(user.email).lower(),
        "password_hash": pwd_ctx.hash(user.password),
        "role": user.role,
        "created_at": utcnow_iso(),
        "updated_at": utcnow_iso(),
    }
    try:
        await db.users.insert_one(data)
    except Exception:
        raise HTTPException(400, detail="User exists")
    return UserResponse(id=data["id"], email=data["email"], role=data["role"], created_at=data["created_at"])    

@api.post("/auth/login")
async def login(payload: UserLogin):
    user = await db.users.find_one({"email": str(payload.email).lower()})
    if not user or not pwd_ctx.verify(payload.password, user.get("password_hash", "")):
        raise HTTPException(401, detail="Invalid credentials")
    token = make_token(parse_from_mongo(user))
    return {"access_token": token, "token_type": "bearer", "user": UserResponse(id=user["id"], email=user["email"], role=user["role"], created_at=user["created_at"]) }

@api.get("/auth/me", response_model=UserResponse)
async def me(user: Dict[str, Any] = Depends(get_current_user)):
    return UserResponse(id=user["id"], email=user["email"], role=user.get("role", "admin"), created_at=user.get("created_at", utcnow_iso()))

@api.get("/categories", response_model=List[str])
async def list_categories():
    count = await db.categories.count_documents({})
    if count == 0:
        try:
            from pymongo import UpdateOne
            ops = [UpdateOne({"name": c}, {"$set": {"name": c}}, upsert=True) for c in DEFAULT_CATEGORIES]
            if ops:
                await db.categories.bulk_write(ops)
        except Exception:
            pass
    cats = await db.categories.find().sort("name", 1).to_list(1000)
    return [c.get("name") for c in cats]

@api.post("/channels", response_model=ChannelResponse)
async def create_channel(payload: ChannelCreate):
    if not payload.link.startswith("http") and not payload.link.startswith("t.me"):
        raise HTTPException(400, detail="Invalid link. Provide t.me or https URL")
    now = utcnow_iso()
    item = {"id": str(uuid.uuid4()), **payload.model_dump(), "created_at": now, "updated_at": now}
    await db.channels.insert_one(prepare_for_mongo(item))
    return ChannelResponse(**item)

@api.get("/channels/trending", response_model=List[ChannelResponse])
async def trending_channels(limit: int = Query(4, ge=1, le=8)):
    # Prefer featured, then highest growth_30d, then subscribers
    featured = await db.channels.find({"status": "approved", "is_featured": True}).sort("updated_at", -1).limit(limit).to_list(length=limit)
    out = featured[:]
    if len(out) < limit:
        left = limit - len(out)
        extra = await db.channels.find({"status": "approved", "is_featured": {"$ne": True}}).sort([
            ("growth_30d", -1), ("subscribers", -1)
        ]).limit(left).to_list(length=left)
        out.extend(extra)
    return [ChannelResponse(**parse_from_mongo(i)) for i in out]

@api.get("/channels/top", response_model=List[ChannelResponse])
async def top_channels(limit: int = Query(10, ge=1, le=50)):
    cursor = db.channels.find({"status": "approved"}).sort("subscribers", -1).limit(limit)
    items_raw = await cursor.to_list(length=limit)
    return [ChannelResponse(**parse_from_mongo(i)) for i in items_raw]

@api.get("/channels", response_model=PaginatedChannels)
async def list_channels(
    q: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[ChannelStatus] = "approved",
    sort: Literal["popular", "new", "name", "price", "er"] = "popular",
    page: int = Query(1, ge=1),
    limit: int = Query(24, ge=1, le=48),
    min_subscribers: Optional[int] = Query(None, ge=0),
    max_subscribers: Optional[int] = Query(None, ge=0),
    min_price: Optional[int] = Query(None, ge=0),
    max_price: Optional[int] = Query(None, ge=0),
    min_er: Optional[float] = Query(None, ge=0),
    max_er: Optional[float] = Query(None, ge=0),
    only_featured: Optional[bool] = False,
    only_alive: Optional[bool] = False,
):
    query: Dict[str, Any] = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    if only_featured:
        query["is_featured"] = True
    if only_alive:
        query["link_status"] = "alive"
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"short_description": {"$regex": q, "$options": "i"}},
            {"seo_description": {"$regex": q, "$options": "i"}},
        ]

    # numeric ranges
    if min_subscribers is not None or max_subscribers is not None:
        rng: Dict[str, Any] = {}
        if min_subscribers is not None:
            rng["$gte"] = int(min_subscribers)
        if max_subscribers is not None:
            rng["$lte"] = int(max_subscribers)
        query["subscribers"] = rng
    if min_price is not None or max_price is not None:
        rng: Dict[str, Any] = {}
        if min_price is not None:
            rng["$gte"] = int(min_price)
        if max_price is not None:
            rng["$lte"] = int(max_price)
        query["price_rub"] = rng
    if min_er is not None or max_er is not None:
        rng: Dict[str, Any] = {}
        if min_er is not None:
            rng["$gte"] = float(min_er)
        if max_er is not None:
            rng["$lte"] = float(max_er)
        query["er"] = rng

    if sort == "popular":
        sort_spec = [("subscribers", -1)]
    elif sort == "name":
        sort_spec = [("name", 1)]
    elif sort == "price":
        sort_spec = [("price_rub", -1)]
    elif sort == "er":
        sort_spec = [("er", -1)]
    else:
        sort_spec = [("created_at", -1)]

    skip = (page - 1) * limit
    total = await db.channels.count_documents(query)
    cursor = db.channels.find(query).sort(sort_spec).skip(skip).limit(limit)
    items_raw = await cursor.to_list(length=limit)
    items = [ChannelResponse(**parse_from_mongo(i)) for i in items_raw]
    return PaginatedChannels(items=items, total=total, page=page, limit=limit, has_more=(skip + len(items)) < total)

@api.get("/channels/{channel_id}", response_model=ChannelResponse)
async def get_channel(channel_id: str):
    doc = await db.channels.find_one({"id": channel_id})
    if not doc:
        raise HTTPException(404, detail="Channel not found")
    return ChannelResponse(**parse_from_mongo(doc))

@api.patch("/channels/{channel_id}", response_model=ChannelResponse)
async def update_channel(channel_id: str, payload: ChannelUpdate):
    existing = await db.channels.find_one({"id": channel_id})
    if not existing:
        raise HTTPException(404, detail="Channel not found")
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    updates["updated_at"] = utcnow_iso()
    await db.channels.update_one({"id": channel_id}, {"$set": prepare_for_mongo(updates)})
    doc = await db.channels.find_one({"id": channel_id})
    return ChannelResponse(**parse_from_mongo(doc))

# -------------------- Admin --------------------

@api.get("/admin/summary")
async def admin_summary(user: Dict[str, Any] = Depends(get_current_admin)):
    draft = await db.channels.count_documents({"status": "draft"})
    approved = await db.channels.count_documents({"status": "approved"})
    dead = await db.channels.count_documents({"link_status": "dead"})
    return {"draft": draft, "approved": approved, "dead": dead}

@api.get("/admin/dead", response_model=List[ChannelResponse])
async def list_dead_links(limit: int = 50, user: Dict[str, Any] = Depends(get_current_admin)):
    cursor = db.channels.find({"link_status": "dead"}).sort("dead_at", -1).limit(limit)
    items_raw = await cursor.to_list(length=limit)
    return [ChannelResponse(**parse_from_mongo(i)) for i in items_raw]

@api.get("/admin/channels", response_model=PaginatedChannels)
async def admin_list_channels(status: Optional[ChannelStatus] = None, page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100), user: Dict[str, Any] = Depends(get_current_admin)):
    query: Dict[str, Any] = {}
    if status:
        query["status"] = status
    total = await db.channels.count_documents(query)
    skip = (page - 1) * limit
    cursor = db.channels.find(query).sort("updated_at", -1).skip(skip).limit(limit)
    items_raw = await cursor.to_list(length=limit)
    items = [ChannelResponse(**parse_from_mongo(i)) for i in items_raw]
    return PaginatedChannels(items=items, total=total, page=page, limit=limit, has_more=(skip + len(items)) < total)

@api.post("/admin/channels", response_model=ChannelResponse)
async def admin_create_channel(payload: ChannelCreate, user: Dict[str, Any] = Depends(get_current_admin)):
    now = utcnow_iso()
    item = {"id": str(uuid.uuid4()), **payload.model_dump(), "status": payload.status or "draft", "created_at": now, "updated_at": now}
    await db.channels.insert_one(prepare_for_mongo(item))
    return ChannelResponse(**item)

@api.patch("/admin/channels/{channel_id}", response_model=ChannelResponse)
async def admin_update_channel(channel_id: str, payload: ChannelUpdate, user: Dict[str, Any] = Depends(get_current_admin)):
    existing = await db.channels.find_one({"id": channel_id})
    if not existing:
        raise HTTPException(404, detail="Channel not found")
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    updates["updated_at"] = utcnow_iso()
    await db.channels.update_one({"id": channel_id}, {"$set": prepare_for_mongo(updates)})
    doc = await db.channels.find_one({"id": channel_id})
    return ChannelResponse(**parse_from_mongo(doc))

@api.post("/admin/channels/{channel_id}/approve", response_model=ChannelResponse)
async def admin_approve_channel(channel_id: str, user: Dict[str, Any] = Depends(get_current_admin)):
    existing = await db.channels.find_one({"id": channel_id})
    if not existing:
        raise HTTPException(404, detail="Channel not found")
    await db.channels.update_one({"id": channel_id}, {"$set": {"status": "approved", "updated_at": utcnow_iso()}})
    doc = await db.channels.find_one({"id": channel_id})
    return ChannelResponse(**parse_from_mongo(doc))

@api.post("/admin/channels/{channel_id}/reject", response_model=ChannelResponse)
async def admin_reject_channel(channel_id: str, user: Dict[str, Any] = Depends(get_current_admin)):
    existing = await db.channels.find_one({"id": channel_id})
    if not existing:
        raise HTTPException(404, detail="Channel not found")
    await db.channels.update_one({"id": channel_id}, {"$set": {"status": "rejected", "updated_at": utcnow_iso()}})
    doc = await db.channels.find_one({"id": channel_id})
    return ChannelResponse(**parse_from_mongo(doc))

# -------------------- Scraper helpers --------------------

def absolutize(src: Optional[str], base: str) -> Optional[str]:
    if not src:
        return None
    if src.startswith("//"):
        return (urlparse(base).scheme or "https") + ":" + src
    if src.startswith("http"):
        return src
    try:
        return urljoin(base, src)
    except Exception:
        return src


def extract_card_generic(card, base_url: str) -> Dict[str, Any]:
    link = None
    a = card.select_one('a[href*="t.me"], a[href*="telegram.me"]')
    if a and a.get('href'):
        link = a.get('href').strip()
    else:
        text = card.get_text(" ", strip=True)
        m = re.search(r"@([A-Za-z0-9_]{4,})", text)
        if m:
            link = f"https://t.me/{m.group(1)}"
    if not link:
        return {}
    name = None
    for sel in ['.title', 'h3', 'h2', 'h4', 'a', '.name']:
        el = card.select_one(sel)
        if el and el.get_text(strip=True):
            name = el.get_text(strip=True)
            break
    if not name:
        name = link.rsplit('/', 1)[-1]
    img = card.select_one('img')
    avatar = None
    if img:
        avatar = img.get('src') or img.get('data-src') or img.get('data-original') or img.get('data-lazy')
    avatar = absolutize(avatar, base_url)
    subs_text = card.get_text(" ", strip=True).lower()
    m2 = re.search(r"([\d\s.,]+)\s*(подписчик|подписчиков|subs|subscribers)", subs_text)
    subs = to_int(m2.group(1)) if m2 else 0
    cat = None
    for el in card.select('.tag, .badge, .label, .category, [class*="tag"], [class*="badge"], [class*="category"]'):
        t = el.get_text(strip=True)
        if t:
            cat = t
            break
    return {"name": name, "link": link, "avatar_url": avatar, "subscribers": subs, "category": cat}


def parse_telemetr_html(html: str, base_url: str) -> List[Dict[str, Any]]:
    soup = BeautifulSoup(html, "lxml")
    candidates = soup.select('article, .card, .channel, .list-item, .ch-list, .list, .row, .col, div')
    results = []
    for c in candidates:
        data = extract_card_generic(c, base_url)
        if data:
            results.append(data)
    uniq = {}
    for it in results:
        uniq[it['link']] = it
    return list(uniq.values())


def parse_tgstat_html(html: str, base_url: str) -> List[Dict[str, Any]]:
    soup = BeautifulSoup(html, "lxml")
    results = []
    for a in soup.select('a[href*="t.me"], a[href*="telegram.me"]'):
        card = a
        for _ in range(3):
            if card.parent:
                card = card.parent
        data = extract_card_generic(card, base_url)
        if data:
            results.append(data)
    for a in soup.select('a[href*="/channel/"]'):
        href = a.get('href', '')
        m = re.search(r"/@([A-Za-z0-9_]{4,})", href)
        if not m:
            continue
        username = m.group(1)
        card = a
        for _ in range(3):
            if card.parent:
                card = card.parent
        data = extract_card_generic(card, base_url)
        if not data:
            data = {"name": username, "link": f"https://t.me/{username}", "avatar_url": None, "subscribers": 0, "category": None}
        else:
            data['link'] = f"https://t.me/{username}"
        results.append(data)
    uniq = {}
    for it in results:
        uniq[it['link']] = it
    return list(uniq.values())


def parse_telega_html(html: str, base_url: str) -> List[Dict[str, Any]]:
    soup = BeautifulSoup(html, "lxml")
    results = []
    for card in soup.select('article, .card, .channel, .list-item, .card-body, .row, div'):
        data = extract_card_generic(card, base_url)
        if data:
            results.append(data)
    uniq = {}
    for it in results:
        uniq[it['link']] = it
    return list(uniq.values())

# -------------------- Parser endpoints --------------------

@api.post("/parser/telemetr")
async def parse_telemetr(list_url: str, category: Optional[str] = None, limit: int = 50, user: Dict[str, Any] = Depends(get_current_admin)):
    try:
        resp = requests.get(list_url, timeout=20, headers={"User-Agent": "Mozilla/5.0"})
        if resp.status_code != 200:
            raise HTTPException(400, detail=f"Fetch failed: {resp.status_code}")
        items = parse_telemetr_html(resp.text, list_url) if BeautifulSoup else []
        inserted = 0
        now = utcnow_iso()
        for it in items[:limit]:
            channel = {
                "id": str(uuid.uuid4()),
                "name": it.get("name") or "Без названия",
                "link": it.get("link"),
                "avatar_url": it.get("avatar_url"),
                "subscribers": int(it.get("subscribers") or 0),
                "category": category or it.get("category"),
                "language": "Русский",
                "short_description": None,
                "seo_description": None,
                "status": "draft",
                "created_at": now,
                "updated_at": now,
            }
            await db.channels.update_one({"link": channel["link"]}, {"$setOnInsert": prepare_for_mongo(channel)}, upsert=True)
            inserted += 1
        return {"ok": True, "inserted": inserted}
    except Exception as e:
        raise HTTPException(400, detail=str(e))

@api.post("/parser/tgstat")
async def parse_tgstat(list_url: str, category: Optional[str] = None, limit: int = 50, user: Dict[str, Any] = Depends(get_current_admin)):
    try:
        resp = requests.get(list_url, timeout=20, headers={"User-Agent": "Mozilla/5.0"})
        if resp.status_code != 200:
            raise HTTPException(400, detail=f"Fetch failed: {resp.status_code}")
        items = parse_tgstat_html(resp.text, list_url) if BeautifulSoup else []
        inserted = 0
        now = utcnow_iso()
        for it in items[:limit]:
            channel = {
                "id": str(uuid.uuid4()),
                "name": it.get("name") or "Без названия",
                "link": it.get("link"),
                "avatar_url": it.get("avatar_url"),
                "subscribers": int(it.get("subscribers") or 0),
                "category": category or it.get("category"),
                "language": "Русский",
                "short_description": None,
                "seo_description": None,
                "status": "draft",
                "created_at": now,
                "updated_at": now,
            }
            await db.channels.update_one({"link": channel["link"]}, {"$setOnInsert": prepare_for_mongo(channel)}, upsert=True)
            inserted += 1
        return {"ok": True, "inserted": inserted}
    except Exception as e:
        raise HTTPException(400, detail=str(e))

@api.post("/parser/telega")
async def parse_telega(list_url: str, category: Optional[str] = None, limit: int = 50, user: Dict[str, Any] = Depends(get_current_admin)):
    try:
        resp = requests.get(list_url, timeout=20, headers={"User-Agent": "Mozilla/5.0"})
        if resp.status_code != 200:
            raise HTTPException(400, detail=f"Fetch failed: {resp.status_code}")
        items = parse_telega_html(resp.text, list_url) if BeautifulSoup else []
        inserted = 0
        now = utcnow_iso()
        for it in items[:limit]:
            channel = {
                "id": str(uuid.uuid4()),
                "name": it.get("name") or "Без названия",
                "link": it.get("link"),
                "avatar_url": it.get("avatar_url"),
                "subscribers": int(it.get("subscribers") or 0),
                "category": category or it.get("category"),
                "language": "Русский",
                "short_description": None,
                "seo_description": None,
                "status": "draft",
                "created_at": now,
                "updated_at": now,
            }
            await db.channels.update_one({"link": channel["link"]}, {"$setOnInsert": prepare_for_mongo(channel)}, upsert=True)
            inserted += 1
        return {"ok": True, "inserted": inserted}
    except Exception as e:
        raise HTTPException(400, detail=str(e))

@api.post("/parser/links")
async def parse_links(payload: PasteLinksPayload, user: Dict[str, Any] = Depends(get_current_admin)):
    if not payload.links:
        return {"ok": True, "inserted": 0}
    now = utcnow_iso()
    inserted = 0
    for raw in payload.links:
        link = (raw or "").strip()
        if not link:
            continue
        if not (link.startswith("http") or link.startswith("t.me")):
            link = f"t.me/{link}"
        name = link.rsplit('/', 1)[-1]
        channel = {
            "id": str(uuid.uuid4()),
            "name": name,
            "link": link,
            "avatar_url": None,
            "subscribers": 0,
            "category": payload.category,
            "language": "Русский",
            "short_description": None,
            "seo_description": None,
            "status": "draft",
            "created_at": now,
            "updated_at": now,
        }
        try:
            await db.channels.update_one({"link": channel["link"]}, {"$setOnInsert": prepare_for_mongo(channel)}, upsert=True)
            inserted += 1
        except Exception as e:
            print(f"Error inserting channel {channel['name']}: {e}")
            continue
    return {"ok": True, "inserted": inserted}

# -------------------- Link checker & demo seed --------------------

@api.post("/admin/links/check")
async def check_links(limit: int = 100, replace_dead: bool = False, user: Dict[str, Any] = Depends(get_current_admin)):
    cursor = db.channels.find({"status": {"$in": ["approved", "draft"]}}).sort("link_last_checked", 1).limit(limit)
    items = await cursor.to_list(length=limit)
    alive = dead = 0
    now = utcnow_iso()
    for ch in items:
        link = ch.get("link", "")
        if not link:
            continue
        url = link if link.startswith("http") else f"https://{link}"
        status = "dead"
        try:
            r = requests.head(url, timeout=8, allow_redirects=True)
            if r.status_code < 400:
                status = "alive"
            else:
                r2 = requests.get(url, timeout=8)
                if r2.status_code < 400:
                    status = "alive"
        except Exception:
            status = "dead"
        updates = {"link_status": status, "link_last_checked": now, "updated_at": now}
        if status == "dead":
            updates["dead_at"] = now
            if replace_dead:
                updates["link"] = "#"
            dead += 1
        else:
            alive += 1
        await db.channels.update_one({"id": ch["id"]}, {"$set": updates})
    return {"ok": True, "checked": len(items), "alive": alive, "dead": dead}

@api.post("/admin/seed-demo")
async def seed_demo(user: Dict[str, Any] = Depends(get_current_admin)):
    now = utcnow_iso()
    demo = [
        {"name":"Новости 24/7","link":"https://t.me/demo_news247","avatar_url":"https://picsum.photos/id/1011/200/200","category":"Новости","language":"Русский","country":"Россия","city":"Москва","subscribers":412000,"er":5.2,"price_rub":18000,"cpm_rub":450.0,"growth_30d":3.8,"last_post_at":"2025-08-18T10:00:00Z","short_description":"Круглосуточные главные события, коротко и по делу.","is_featured":True},
        {"name":"Tech Insight RU","link":"https://t.me/demo_techinsight","avatar_url":"https://picsum.photos/id/1027/200/200","category":"Технологии","language":"Русский","country":"Россия","city":"Санкт-Петербург","subscribers":156000,"er":4.3,"price_rub":25000,"cpm_rub":520.0,"growth_30d":6.2,"last_post_at":"2025-08-17T12:30:00Z","short_description":"Глубокая аналитика ИТ-рынка, тренды и обзоры продуктов.","is_featured":True},
        {"name":"КриптоРадар","link":"https://t.me/demo_cryptoradar","avatar_url":"https://picsum.photos/id/1005/200/200","category":"Крипто","language":"Русский","country":"Казахстан","city":"Алматы","subscribers":98000,"er":6.1,"price_rub":22000,"cpm_rub":390.0,"growth_30d":12.5,"last_post_at":"2025-08-18T08:45:00Z","short_description":"Сигналы, аналитика и разборы альткоинов без воды.","is_featured":True},
        {"name":"Бизнес-Практика","link":"https://t.me/demo_bizpractice","avatar_url":"https://picsum.photos/id/1012/200/200","category":"Бизнес","language":"Русский","country":"Россия","city":"Екатеринбург","subscribers":203000,"er":3.4,"price_rub":30000,"cpm_rub":560.0,"growth_30d":2.1,"last_post_at":"2025-08-16T19:10:00Z","short_description":"Стратегии роста, кейсы, рабочие инструменты для SMB.","is_featured":False},
        {"name":"Развлечения Сегодня","link":"https://t.me/demo_fun_today","avatar_url":"https://picsum.photos/id/1035/200/200","category":"Развлечения","language":"Русский","country":"Украина","city":"Киев","subscribers":320000,"er":7.5,"price_rub":15000,"cpm_rub":280.0,"growth_30d":4.6,"last_post_at":"2025-08-18T14:20:00Z","short_description":"Мемы, тренды и самое смешное за сутки.","is_featured":False},
        {"name":"Маркетинг PRO","link":"https://t.me/demo_marketing_pro","avatar_url":"https://picsum.photos/id/1025/200/200","category":"Маркетинг","language":"Русский","country":"Россия","city":"Казань","subscribers":87000,"er":4.9,"price_rub":18000,"cpm_rub":430.0,"growth_30d":5.9,"last_post_at":"2025-08-17T09:05:00Z","short_description":"CRM, воронки, креативы и рост конверсий на практике.","is_featured":False},
        {"name":"FinTalk Аналитика","link":"https://t.me/demo_fintalk","avatar_url":"https://picsum.photos/id/1001/200/200","category":"Финансы","language":"Русский","country":"Беларусь","city":"Минск","subscribers":142000,"er":3.8,"price_rub":27000,"cpm_rub":600.0,"growth_30d":1.4,"last_post_at":"2025-08-15T20:40:00Z","short_description":"Рынки, облигации, портфельные идеи и отчёты.","is_featured":False},
        {"name":"Product Sense","link":"https://t.me/demo_product_sense","avatar_url":"https://picsum.photos/id/1010/200/200","category":"Технологии","language":"Русский","country":"Россия","city":"Новосибирск","subscribers":64000,"er":5.6,"price_rub":16000,"cpm_rub":410.0,"growth_30d":7.1,"last_post_at":"2025-08-18T07:55:00Z","short_description":"Продукт-менеджмент: метрики, JTBD, A/B и рост.","is_featured":False},
        {"name":"Городская Афиша","link":"https://t.me/demo_city_afisha","avatar_url":"https://picsum.photos/id/1043/200/200","category":"Развлечения","language":"Русский","country":"Россия","city":"Сочи","subscribers":118000,"er":6.8,"price_rub":12000,"cpm_rub":300.0,"growth_30d":3.2,"last_post_at":"2025-08-18T11:30:00Z","short_description":"Куда сходить: концерты, выставки, кино и фестивали.","is_featured":False},
        {"name":"Startup Digest RU","link":"https://t.me/demo_startup_digest","avatar_url":"https://picsum.photos/id/1015/200/200","category":"Бизнес","language":"Русский","country":"Россия","city":"Москва","subscribers":53000,"er":4.1,"price_rub":14000,"cpm_rub":380.0,"growth_30d":9.4,"last_post_at":"2025-08-16T16:25:00Z","short_description":"Раунды, питчи, инструменты и гранты для фаундеров.","is_featured":False},
    ]
    inserted = 0
    for s in demo:
        doc = {
            "id": str(uuid.uuid4()),
            **s,
            "status": "approved",
            "created_at": now,
            "updated_at": now,
        }
        try:
            await db.channels.update_one({"link": s["link"]}, {"$setOnInsert": prepare_for_mongo(doc)}, upsert=True)
            inserted += 1
        except Exception as e:
            print(f"Error inserting demo channel {s['name']}: {e}")
            continue
    return {"ok": True, "inserted": inserted}

# -------------------- Creators Endpoints --------------------

@api.get("/creators", response_model=PaginatedCreators)
async def list_creators(
    q: Optional[str] = Query(None, description="Search in name and tags"),
    category: Optional[str] = Query(None, description="Filter by category"),
    language: Optional[str] = Query(None, description="Filter by language"),
    country: Optional[str] = Query(None, description="Filter by country"),
    subscribers_min: Optional[int] = Query(None, description="Minimum total subscribers"),
    subscribers_max: Optional[int] = Query(None, description="Maximum total subscribers"),
    price_min: Optional[int] = Query(None, description="Minimum price"),
    price_max: Optional[int] = Query(None, description="Maximum price"),
    er_min: Optional[float] = Query(None, description="Minimum ER percentage"),
    er_max: Optional[float] = Query(None, description="Maximum ER percentage"),
    cpm_max: Optional[int] = Query(None, description="Maximum CPM"),
    has_price: Optional[bool] = Query(None, description="Filter creators with price"),
    featured: Optional[bool] = Query(None, description="Filter featured creators"),
    verified: Optional[bool] = Query(None, description="Filter verified creators"),
    priority_level: Optional[PriorityLevel] = Query(None, description="Filter by priority level"),
    last_post_days_max: Optional[int] = Query(None, description="Maximum days since last post"),
    tags: Optional[List[str]] = Query(None, description="Filter by tags"),
    sort: str = Query("subscribers", description="Sort field: name|created_at|subscribers|price|er|cpm|last_post"),
    order: str = Query("desc", description="Sort order: asc|desc"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(24, ge=1, le=50, description="Items per page")
):
    """List creators with filtering, sorting and pagination"""
    # Build query
    query = {"flags.active": True}
    
    if q:
        query["$text"] = {"$search": q}
    if category:
        query["category"] = category
    if language:
        query["language"] = language
    if country:
        query["country"] = country
    if subscribers_min is not None:
        query["metrics.subscribers_total"] = {"$gte": subscribers_min}
    if subscribers_max is not None:
        if "metrics.subscribers_total" not in query:
            query["metrics.subscribers_total"] = {}
        query["metrics.subscribers_total"]["$lte"] = subscribers_max
    if price_min is not None:
        query["metrics.min_price_rub"] = {"$gte": price_min}
    if price_max is not None:
        query["metrics.avg_price_rub"] = {"$lte": price_max}
    if er_min is not None:
        query["metrics.avg_er_percent"] = {"$gte": er_min}
    if er_max is not None:
        if "metrics.avg_er_percent" not in query:
            query["metrics.avg_er_percent"] = {}
        query["metrics.avg_er_percent"]["$lte"] = er_max
    if cpm_max is not None:
        query["metrics.avg_cpm_rub"] = {"$lte": cpm_max}
    if has_price is not None:
        if has_price:
            query["metrics.min_price_rub"] = {"$exists": True, "$ne": None, "$gt": 0}
        else:
            query["$or"] = [
                {"metrics.min_price_rub": {"$exists": False}},
                {"metrics.min_price_rub": None},
                {"metrics.min_price_rub": 0}
            ]
    if featured is not None:
        query["flags.featured"] = featured
    if verified is not None:
        query["flags.verified"] = verified
    if priority_level is not None:
        query["priority_level"] = priority_level
    if last_post_days_max is not None:
        from datetime import datetime, timezone, timedelta
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=last_post_days_max)
        query["metrics.last_post_at_min"] = {"$gte": cutoff_date.isoformat()}
    if tags:
        query["tags"] = {"$in": tags}
    
    # Build sort
    sort_field_map = {
        "name": "name",
        "created_at": "created_at",
        "subscribers": "metrics.subscribers_total",
        "price": "metrics.avg_price_rub",
        "er": "metrics.avg_er_percent",
        "cpm": "metrics.avg_cpm_rub",
        "last_post": "metrics.last_post_at_min"
    }
    
    sort_field = sort_field_map.get(sort, "metrics.subscribers_total")
    sort_order = -1 if order == "desc" else 1
    
    # Execute queries
    total = await db.creators.count_documents(query)
    skip = (page - 1) * limit
    
    cursor = db.creators.find(query).sort(sort_field, sort_order).skip(skip).limit(limit)
    items = await cursor.to_list(length=limit)
    
    # Convert to response format
    creators = []
    for item in items:
        creator_data = parse_from_mongo(item)
        # Ensure metrics exists
        if "metrics" not in creator_data:
            creator_data["metrics"] = CreatorMetrics().dict()
        # Ensure all new fields have defaults
        if "pricing" not in creator_data:
            creator_data["pricing"] = CreatorPricing().dict()
        if "audience_stats" not in creator_data:
            creator_data["audience_stats"] = CreatorAudienceStats().dict()
        if "contacts" not in creator_data:
            creator_data["contacts"] = CreatorContacts().dict()
        if "priority_level" not in creator_data:
            creator_data["priority_level"] = "normal"
        creators.append(CreatorResponse(**creator_data))
    
    return PaginatedCreators(
        items=creators,
        meta={
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    )

@api.get("/creators/{id_or_slug}", response_model=CreatorResponse)
async def get_creator(
    id_or_slug: str,
    include: Optional[str] = Query(None, description="Include channels: 'channels'")
):
    """Get creator by ID or slug"""
    # Try to find by ID first, then by slug
    creator = await db.creators.find_one({"id": id_or_slug})
    if not creator:
        creator = await db.creators.find_one({"slug": id_or_slug})
    
    if not creator:
        raise HTTPException(404, detail="Creator not found")
    
    creator_data = parse_from_mongo(creator)
    
    # Ensure metrics exists
    if "metrics" not in creator_data:
        creator_data["metrics"] = CreatorMetrics().dict()
    # Ensure all new fields have defaults
    if "pricing" not in creator_data:
        creator_data["pricing"] = CreatorPricing().dict()
    if "audience_stats" not in creator_data:
        creator_data["audience_stats"] = CreatorAudienceStats().dict()
    if "contacts" not in creator_data:
        creator_data["contacts"] = CreatorContacts().dict()
    if "priority_level" not in creator_data:
        creator_data["priority_level"] = "normal"
    
    # Include channels if requested
    if include == "channels":
        # Get linked channels
        links_cursor = db.creator_channel_links.find({"creator_id": creator_data["id"]})
        links = await links_cursor.to_list(length=None)
        
        if links:
            channel_ids = [link["channel_id"] for link in links]
            channels_cursor = db.channels.find({"id": {"$in": channel_ids}})
            channels = await channels_cursor.to_list(length=None)
            
            # Convert to minimal format
            creator_data["channels"] = [
                ChannelMinimal(
                    id=ch["id"],
                    name=ch["name"],
                    link=ch["link"],
                    subscribers=ch.get("subscribers", 0),
                    price_rub=ch.get("price_rub"),
                    er=ch.get("er"),
                    last_post_at=ch.get("last_post_at"),
                    link_status=ch.get("link_status"),
                    category=ch.get("category")
                ) for ch in channels
            ]
    
    return CreatorResponse(**creator_data)

@api.post("/creators", response_model=CreatorResponse)
async def create_creator(
    payload: CreatorCreate,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Create new creator (admin/editor only)"""
    if user.get("role") not in ["admin", "editor"]:
        raise HTTPException(403, detail="Admin or editor role required")
    
    now = utcnow_iso()
    
    # Generate slug if not provided
    slug = payload.slug or generate_slug(payload.name)
    slug = await ensure_unique_slug(slug)
    
    creator_data = {
        "id": str(uuid.uuid4()),
        **payload.dict(exclude={"slug"}),
        "slug": slug,
        "metrics": CreatorMetrics().dict(),
        "created_at": now,
        "updated_at": now,
    }
    
    try:
        await db.creators.insert_one(prepare_for_mongo(creator_data))
    except Exception as e:
        if "slug" in str(e):
            raise HTTPException(400, detail="Slug already exists")
        raise HTTPException(400, detail="Creator creation failed")
    
    return CreatorResponse(**creator_data)

@api.put("/creators/{creator_id}", response_model=CreatorResponse)
async def update_creator(
    creator_id: str,
    payload: CreatorUpdate,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Update creator (admin/editor only)"""
    if user.get("role") not in ["admin", "editor"]:
        raise HTTPException(403, detail="Admin or editor role required")
    
    creator = await db.creators.find_one({"id": creator_id})
    if not creator:
        raise HTTPException(404, detail="Creator not found")
    
    # Prepare update data
    update_data = {k: v for k, v in payload.dict(exclude_unset=True).items() if v is not None}
    
    # Handle slug regeneration if name changed
    if "name" in update_data and "slug" not in update_data:
        new_slug = generate_slug(update_data["name"])
        update_data["slug"] = await ensure_unique_slug(new_slug, creator_id)
    elif "slug" in update_data:
        update_data["slug"] = await ensure_unique_slug(update_data["slug"], creator_id)
    
    update_data["updated_at"] = utcnow_iso()
    
    try:
        await db.creators.update_one(
            {"id": creator_id},
            {"$set": prepare_for_mongo(update_data)}
        )
    except Exception as e:
        if "slug" in str(e):
            raise HTTPException(400, detail="Slug already exists")
        raise HTTPException(400, detail="Creator update failed")
    
    # Return updated creator
    updated_creator = await db.creators.find_one({"id": creator_id})
    creator_data = parse_from_mongo(updated_creator)
    
    # Ensure metrics exists
    if "metrics" not in creator_data:
        creator_data["metrics"] = CreatorMetrics().dict()
    # Ensure all new fields have defaults
    if "pricing" not in creator_data:
        creator_data["pricing"] = CreatorPricing().dict()
    if "audience_stats" not in creator_data:
        creator_data["audience_stats"] = CreatorAudienceStats().dict()
    if "contacts" not in creator_data:
        creator_data["contacts"] = CreatorContacts().dict()
    if "priority_level" not in creator_data:
        creator_data["priority_level"] = "normal"
    
    return CreatorResponse(**creator_data)

@api.delete("/creators/{creator_id}")
async def delete_creator(
    creator_id: str,
    hard: bool = Query(False, description="Permanently delete"),
    user: Dict[str, Any] = Depends(get_current_admin)
):
    """Delete creator (admin only, soft delete by default)"""
    creator = await db.creators.find_one({"id": creator_id})
    if not creator:
        raise HTTPException(404, detail="Creator not found")
    
    if hard:
        # Hard delete: remove creator and all links
        await db.creators.delete_one({"id": creator_id})
        await db.creator_channel_links.delete_many({"creator_id": creator_id})
    else:
        # Soft delete: set active=false
        await db.creators.update_one(
            {"id": creator_id},
            {"$set": {"flags.active": False, "updated_at": utcnow_iso()}}
        )
    
    return {"ok": True, "deleted": "hard" if hard else "soft"}

@api.post("/creators/{creator_id}/channels")
async def link_channels_to_creator(
    creator_id: str,
    payload: LinkChannelsPayload,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Link channels to creator (admin/editor only)"""
    if user.get("role") not in ["admin", "editor"]:
        raise HTTPException(403, detail="Admin or editor role required")
    
    creator = await db.creators.find_one({"id": creator_id})
    if not creator:
        raise HTTPException(404, detail="Creator not found")
    
    # Verify channels exist
    channels = await db.channels.find({"id": {"$in": payload.channel_ids}}).to_list(length=None)
    if len(channels) != len(payload.channel_ids):
        raise HTTPException(400, detail="Some channels not found")
    
    now = utcnow_iso()
    added = 0
    
    for channel_id in payload.channel_ids:
        # Check if link already exists
        existing = await db.creator_channel_links.find_one({
            "creator_id": creator_id,
            "channel_id": channel_id
        })
        
        if not existing:
            link_data = {
                "id": str(uuid.uuid4()),
                "creator_id": creator_id,
                "channel_id": channel_id,
                "role": "owner",  # Default role
                "primary": channel_id == payload.primary_id,
                "created_at": now
            }
            
            try:
                await db.creator_channel_links.insert_one(prepare_for_mongo(link_data))
                added += 1
            except Exception:
                continue
    
    # Recompute metrics
    await recompute_creator_metrics(creator_id)
    
    return {"ok": True, "added": added}

@api.delete("/creators/{creator_id}/channels/{channel_id}")
async def unlink_channel_from_creator(
    creator_id: str,
    channel_id: str,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Unlink channel from creator (admin/editor only)"""
    if user.get("role") not in ["admin", "editor"]:
        raise HTTPException(403, detail="Admin or editor role required")
    
    result = await db.creator_channel_links.delete_one({
        "creator_id": creator_id,
        "channel_id": channel_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(404, detail="Link not found")
    
    # Recompute metrics
    await recompute_creator_metrics(creator_id)
    
    return {"ok": True, "removed": 1}

@api.post("/admin/creators/seed")
async def seed_creators(
    count: int = Query(10, description="Number of creators to create (10 or 100)"),
    user: Dict[str, Any] = Depends(get_current_admin)
):
    """Seed demo creators with links to existing channels"""
    if count not in [10, 100]:
        count = 10
    
    # Get existing approved channels to link to creators
    channels = await db.channels.find({"status": "approved"}).to_list(length=100)
    if not channels:
        raise HTTPException(400, detail="No approved channels found. Run channel seed first.")
    
    now = utcnow_iso()
    created = 0
    
    demo_creators = [
        {
            "name": "Кира Петровна",
            "bio": "Ведущий маркетолог и создатель популярных каналов о бизнесе и технологиях",
            "category": "Бизнес",
            "tags": ["маркетинг", "реклама", "бизнес"],
            "country": "RU",
            "language": "ru",
            "avatar_url": "https://images.unsplash.com/photo-1494790108755-2616b332969c?w=200&h=200&fit=crop&crop=face",
            "external": {
                "telegram_username": "kira_blog",
                "telegram_url": "https://t.me/kira_blog",
                "website": "https://kira-marketing.ru"
            },
            "flags": {"featured": True, "verified": True}
        },
        {
            "name": "Алексей Техносвет",
            "bio": "IT-эксперт, основатель технологических каналов и стартапер",
            "category": "Технологии",
            "tags": ["технологии", "стартапы", "it"],
            "country": "RU",
            "language": "ru",
            "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
            "external": {
                "telegram_username": "alex_tech",
                "telegram_url": "https://t.me/alex_tech",
                "youtube": "https://youtube.com/@alextech"
            },
            "flags": {"featured": True, "verified": False}
        },
        {
            "name": "Мария Финанс",
            "bio": "Финансовый аналитик и автор образовательных материалов по инвестициям",
            "category": "Финансы",
            "tags": ["финансы", "инвестиции", "аналитика"],
            "country": "RU",
            "language": "ru",
            "avatar_url": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
            "external": {
                "telegram_username": "maria_finance",
                "telegram_url": "https://t.me/maria_finance",
                "website": "https://maria-finance.com"
            },
            "flags": {"featured": False, "verified": True}
        },
        {
            "name": "Денис Медиа",
            "bio": "Медиа-продюсер и создатель развлекательного контента",
            "category": "Развлечения",
            "tags": ["медиа", "развлечения", "контент"],
            "country": "RU",
            "language": "ru",
            "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
            "external": {
                "telegram_username": "denis_media",
                "telegram_url": "https://t.me/denis_media",
                "instagram": "https://instagram.com/denis_media"
            },
            "flags": {"featured": False, "verified": False}
        },
        {
            "name": "Анна Новости",
            "bio": "Журналист и редактор новостных каналов, эксперт по информационной политике",
            "category": "Новости",
            "tags": ["новости", "журналистика", "политика"],
            "country": "RU",
            "language": "ru",
            "avatar_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face",
            "external": {
                "telegram_username": "anna_news",
                "telegram_url": "https://t.me/anna_news",
                "website": "https://anna-news.ru"
            },
            "flags": {"featured": True, "verified": True}
        }
    ]
    
    # Extend for 100 creators if needed
    if count == 100:
        base_creators = demo_creators.copy()
        for i in range(5, 100):
            base_idx = i % len(base_creators)
            base_creator = base_creators[base_idx].copy()
            base_creator["name"] = f"{base_creator['name']} {i-4}"
            base_creator["bio"] = f"{base_creator['bio']} (вариант {i-4})"
            base_creator["flags"]["featured"] = i < 20  # First 20 featured
            base_creator["flags"]["verified"] = i < 50  # First 50 verified
            demo_creators.append(base_creator)
    
    # Create creators and link to channels
    for i, creator_template in enumerate(demo_creators[:count]):
        slug = await ensure_unique_slug(generate_slug(creator_template["name"]))
        
        creator_data = {
            "id": str(uuid.uuid4()),
            "slug": slug,
            "metrics": CreatorMetrics().dict(),
            "created_at": now,
            "updated_at": now,
            **creator_template
        }
        
        try:
            await db.creators.insert_one(prepare_for_mongo(creator_data))
            
            # Link 1-3 random channels to this creator
            import random
            num_channels = random.randint(1, min(3, len(channels)))
            linked_channels = random.sample(channels, num_channels)
            
            for j, channel in enumerate(linked_channels):
                link_data = {
                    "id": str(uuid.uuid4()),
                    "creator_id": creator_data["id"],
                    "channel_id": channel["id"],
                    "role": "owner",
                    "primary": j == 0,  # First channel is primary
                    "created_at": now
                }
                
                try:
                    await db.creator_channel_links.insert_one(prepare_for_mongo(link_data))
                except Exception:
                    continue
            
            # Recompute metrics for this creator
            await recompute_creator_metrics(creator_data["id"])
            created += 1
            
        except Exception as e:
            print(f"Error creating creator {creator_template['name']}: {e}")
            continue
    
    return {"ok": True, "created": created}

# -------------------- App wiring --------------------

app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def on_startup():
    await create_indexes()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()