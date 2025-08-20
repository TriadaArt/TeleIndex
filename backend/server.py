from fastapi import FastAPI, APIRouter, HTTPException, Query, Depends, Body
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
    if not value:
        return None
    s = value.strip().lower()
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


def prepare_for_mongo(data: Dict[str, Any]) -> Dict[str, Any]:
    data = dict(data)
    for k in ["created_at", "updated_at", "link_last_checked", "dead_at"]:
        if isinstance(data.get(k), datetime):
            data[k] = data[k].astimezone(timezone.utc).isoformat()
    return data


def parse_from_mongo(item: Dict[str, Any]) -> Dict[str, Any]:
    item = dict(item)
    item.pop("_id", None)
    return item

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
    subscribers: int = 0
    category: Optional[str] = None
    language: Optional[str] = None
    short_description: Optional[str] = None
    seo_description: Optional[str] = None
    status: ChannelStatus = "approved"
    growth_score: Optional[float] = None
    is_featured: bool = False
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
    subscribers: Optional[int] = None
    category: Optional[str] = None
    language: Optional[str] = None
    short_description: Optional[str] = None
    seo_description: Optional[str] = None
    status: Optional[ChannelStatus] = None
    growth_score: Optional[float] = None
    is_featured: Optional[bool] = None
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

async def create_indexes():
    try:
        await db.users.create_index("email", unique=True)
        await db.channels.create_index("id", unique=True)
        await db.channels.create_index([("status", 1), ("subscribers", -1)])
        await db.channels.create_index([("created_at", -1)])
        await db.channels.create_index([("name", "text"), ("short_description", "text"), ("seo_description", "text")])
        await db.categories.create_index("name", unique=True)
    except Exception:
        pass


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

DEFAULT_CATEGORIES = ["Новости", "Технологии", "Крипто", "Бизнес", "Развлечения"]

@api.get("/health")
async def health():
    return {"ok": True, "time": utcnow_iso()}

@api.get("/")
async def root():
    return {"message": "TeleIndex API"}

@api.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(client_name=input.client_name)
    await db.status_checks.insert_one(status_obj.model_dump())
    return status_obj

@api.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**parse_from_mongo(s)) for s in status_checks]

# Auth
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

# Categories
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

# Public channels
@api.post("/channels", response_model=ChannelResponse)
async def create_channel(payload: ChannelCreate):
    if not payload.link.startswith("http") and not payload.link.startswith("t.me"):
        raise HTTPException(400, detail="Invalid link. Provide t.me or https URL")
    now = utcnow_iso()
    item = {"id": str(uuid.uuid4()), **payload.model_dump(), "created_at": now, "updated_at": now}
    await db.channels.insert_one(prepare_for_mongo(item))
    return ChannelResponse(**item)

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

@api.get("/channels", response_model=PaginatedChannels)
async def list_channels(
    q: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[ChannelStatus] = "approved",
    sort: Literal["popular", "new", "name"] = "popular",
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    query: Dict[str, Any] = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"short_description": {"$regex": q, "$options": "i"}},
            {"seo_description": {"$regex": q, "$options": "i"}},
        ]

    if sort == "popular":
        sort_spec = [("subscribers", -1)]
    elif sort == "name":
        sort_spec = [("name", 1)]
    else:
        sort_spec = [("created_at", -1)]

    skip = (page - 1) * limit
    total = await db.channels.count_documents(query)
    cursor = db.channels.find(query).sort(sort_spec).skip(skip).limit(limit)
    items_raw = await cursor.to_list(length=limit)
    items = [ChannelResponse(**parse_from_mongo(i)) for i in items_raw]
    return PaginatedChannels(items=items, total=total, page=page, limit=limit, has_more=(skip + len(items)) < total)

@api.get("/channels/top", response_model=List[ChannelResponse])
async def top_channels(limit: int = Query(10, ge=1, le=50)):
    cursor = db.channels.find({"status": "approved"}).sort("subscribers", -1).limit(limit)
    items_raw = await cursor.to_list(length=limit)
    return [ChannelResponse(**parse_from_mongo(i)) for i in items_raw]

@api.get("/channels/trending", response_model=List[ChannelResponse])
async def trending_channels(limit: int = Query(6, ge=1, le=20)):
    cursor = db.channels.find({"status": "approved"}).sort([("growth_score", -1), ("subscribers", -1)]).limit(limit)
    items_raw = await cursor.to_list(length=limit)
    return [ChannelResponse(**parse_from_mongo(i)) for i in items_raw]

# Admin endpoints
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
    # Find link
    link = None
    a = card.select_one('a[href*="t.me"], a[href*="telegram.me"]')
    if a and a.get('href'):
        link = a.get('href').strip()
    else:
        # try to find @username text
        text = card.get_text(" ", strip=True)
        m = re.search(r"@([A-Za-z0-9_]{4,})", text)
        if m:
            link = f"https://t.me/{m.group(1)}"
    if not link:
        return {}
    # Name
    name = None
    for sel in ['.title', 'h3', 'h2', 'h4', 'a', '.name']:
        el = card.select_one(sel)
        if el and el.get_text(strip=True):
            name = el.get_text(strip=True)
            break
    if not name:
        name = link.rsplit('/', 1)[-1]
    # Avatar
    img = card.select_one('img')
    avatar = None
    if img:
        avatar = img.get('src') or img.get('data-src') or img.get('data-original') or img.get('data-lazy')
    avatar = absolutize(avatar, base_url)
    # Subscribers
    subs_text = card.get_text(" ", strip=True).lower()
    m2 = re.search(r"([\d\s.,]+)\s*(подписчик|подписчиков|subs|subscribers)", subs_text)
    subs = to_int(m2.group(1)) if m2 else 0
    # Category
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
    # de-dup by link
    uniq = {}
    for it in results:
        uniq[it['link']] = it
    return list(uniq.values())


def parse_tgstat_html(html: str, base_url: str) -> List[Dict[str, Any]]:
    soup = BeautifulSoup(html, "lxml")
    results = []
    # Direct t.me links
    for a in soup.select('a[href*="t.me"], a[href*="telegram.me"]'):
        card = a
        for _ in range(3):
            if card.parent:
                card = card.parent
        data = extract_card_generic(card, base_url)
        if data:
            results.append(data)
    # tgstat channel cards linking to /channel/@username
    for a in soup.select('a[href*="/channel/"]'):
        href = a.get('href', '')
        m = re.search(r"/@([A-Za-z0-9_]{4,})", href)
        if not m:
            continue
        username = m.group(1)
        # Climb to parent as card
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
    # Many cards with anchor to t.me or have @username in text
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
                "language": "ru",
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
                "language": "ru",
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
                "language": "ru",
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

# Parse pasted links
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
            "language": "ru",
            "short_description": None,
            "seo_description": None,
            "status": "draft",
            "created_at": now,
            "updated_at": now,
        }
        await db.channels.update_one({"link": channel["link"]}, {"$setOnInsert": prepare_for_mongo(channel)}, upsert=True)
        inserted += 1
    return {"ok": True, "inserted": inserted}

# Link checker & demo seed
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
    sample = [
        {"name": "Новости России", "link": "https://t.me/rian_ru", "subscribers": 1000000, "category": "Новости"},
        {"name": "Технологии Сегодня", "link": "https://t.me/tech", "subscribers": 250000, "category": "Технологии"},
        {"name": "Крипто Daily", "link": "https://t.me/crypto", "subscribers": 180000, "category": "Крипто"},
        {"name": "Бизнес Аналитика", "link": "https://t.me/business", "subscribers": 120000, "category": "Бизнес"},
        {"name": "Развлечения 24", "link": "https://t.me/fun", "subscribers": 95000, "category": "Развлечения"},
    ]
    inserted = 0
    for s in sample:
        doc = {
            "id": str(uuid.uuid4()),
            **s,
            "language": "ru",
            "status": "approved",
            "created_at": now,
            "updated_at": now,
            "short_description": "Демо канал",
        }
        await db.channels.update_one({"link": s["link"]}, {"$setOnInsert": prepare_for_mongo(doc)}, upsert=True)
        inserted += 1
    return {"ok": True, "inserted": inserted}

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