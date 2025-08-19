from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ---------------------- Helpers ----------------------

def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def prepare_for_mongo(data: Dict[str, Any]) -> Dict[str, Any]:
    # Ensure datetimes are iso strings
    for key in ["created_at", "updated_at"]:
        if isinstance(data.get(key), datetime):
            data[key] = data[key].astimezone(timezone.utc).isoformat()
    return data


def parse_from_mongo(item: Dict[str, Any]) -> Dict[str, Any]:
    # Ignore Mongo's _id
    item.pop("_id", None)
    return item

# ---------------------- Models ----------------------

class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: str = Field(default_factory=utcnow_iso)

class StatusCheckCreate(BaseModel):
    client_name: str

ChannelStatus = Literal["draft", "approved", "rejected"]

class ChannelBase(BaseModel):
    name: str
    link: str  # t.me/xxx or https://t.me/+invite
    avatar_url: Optional[str] = None
    subscribers: int = 0
    category: Optional[str] = None
    language: Optional[str] = None
    short_description: Optional[str] = None  # brief summary for cards
    seo_description: Optional[str] = None
    status: ChannelStatus = "approved"
    growth_score: Optional[float] = None

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

# ---------------------- Routes ----------------------

@api_router.get("/health")
async def health():
    return {"ok": True, "time": utcnow_iso()}

@api_router.get("/")
async def root():
    return {"message": "TeleIndex API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(client_name=input.client_name)
    await db.status_checks.insert_one(status_obj.model_dump())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**parse_from_mongo(s)) for s in status_checks]

DEFAULT_CATEGORIES = [
    "News", "Technology", "Crypto", "Business", "Entertainment",
    "Education", "Sports", "Lifestyle", "Finance", "Gaming"
]

@api_router.get("/categories", response_model=List[str])
async def list_categories():
    # For MVP: return defaults if collection empty
    count = await db.categories.count_documents({})
    if count == 0:
        # Upsert defaults once (idempotent)
        ops = [{"updateOne": {
            "filter": {"name": c},
            "update": {"$set": {"name": c}},
            "upsert": True
        }} for c in DEFAULT_CATEGORIES]
        if ops:
            await db.categories.bulk_write(ops)
    cats = await db.categories.find().sort("name", 1).to_list(1000)
    return [c.get("name") for c in cats]

@api_router.post("/channels", response_model=ChannelResponse)
async def create_channel(payload: ChannelCreate):
    # Basic link guard
    if not payload.link.startswith("http") and not payload.link.startswith("t.me"):
        raise HTTPException(status_code=400, detail="Invalid link. Provide t.me or https URL")
    now = utcnow_iso()
    item = {
        "id": str(uuid.uuid4()),
        **payload.model_dump(),
        "created_at": now,
        "updated_at": now,
    }
    await db.channels.insert_one(prepare_for_mongo(item))
    return ChannelResponse(**item)

@api_router.patch("/channels/{channel_id}", response_model=ChannelResponse)
async def update_channel(channel_id: str, payload: ChannelUpdate):
    existing = await db.channels.find_one({"id": channel_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Channel not found")
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    updates["updated_at"] = utcnow_iso()
    await db.channels.update_one({"id": channel_id}, {"$set": prepare_for_mongo(updates)})
    doc = await db.channels.find_one({"id": channel_id})
    doc = parse_from_mongo(doc)
    return ChannelResponse(**doc)

@api_router.get("/channels", response_model=PaginatedChannels)
async def list_channels(
    q: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[ChannelStatus] = "approved",
    sort: Literal["popular", "new"] = "popular",
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

    sort_spec = [("subscribers", -1)] if sort == "popular" else [("created_at", -1)]

    skip = (page - 1) * limit
    total = await db.channels.count_documents(query)
    cursor = db.channels.find(query).sort(sort_spec).skip(skip).limit(limit)
    items_raw = await cursor.to_list(length=limit)
    items = [ChannelResponse(**parse_from_mongo(i)) for i in items_raw]
    return PaginatedChannels(
        items=items,
        total=total,
        page=page,
        limit=limit,
        has_more=(skip + len(items)) &lt; total,
    )

@api_router.get("/channels/top", response_model=List[ChannelResponse])
async def top_channels(limit: int = Query(10, ge=1, le=50)):
    cursor = db.channels.find({"status": "approved"}).sort("subscribers", -1).limit(limit)
    items_raw = await cursor.to_list(length=limit)
    return [ChannelResponse(**parse_from_mongo(i)) for i in items_raw]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()