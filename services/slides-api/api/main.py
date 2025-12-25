from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from api.lifespan import app_lifespan
from api.middlewares import UserConfigEnvUpdateMiddleware
from api.v1.ppt.router import API_V1_PPT_ROUTER
from api.v1.webhook.router import API_V1_WEBHOOK_ROUTER
from api.v1.mock.router import API_V1_MOCK_ROUTER
from utils.get_env import get_app_data_directory_env
import os


app = FastAPI(lifespan=app_lifespan, redirect_slashes=False)


# Routers
app.include_router(API_V1_PPT_ROUTER)
app.include_router(API_V1_WEBHOOK_ROUTER)
app.include_router(API_V1_MOCK_ROUTER)

# Mount static files for exports and other app data
app_data_dir = get_app_data_directory_env() or os.getenv("APP_DATA_DIRECTORY") or "/tmp/slides-api-data"
print(f"Mounting static files from: {app_data_dir}")
if os.path.exists(app_data_dir):
    app.mount("/app_data", StaticFiles(directory=app_data_dir), name="app_data")
    print(f"Static files mounted at /app_data -> {app_data_dir}")
else:
    print(f"Warning: APP_DATA_DIRECTORY does not exist: {app_data_dir}")

# Middlewares
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(UserConfigEnvUpdateMiddleware)
