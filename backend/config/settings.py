import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MONGODB_URI = os.getenv("MONGODB_URI")

GEMINI_MODEL = "gemini-2.5-flash"

FASTAPI_HOST = "localhost"
FASTAPI_PORT = 8000
