from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class URLRequest(BaseModel):
    url: str

@app.get("/")
def home():
    return {"message": "This is my homepage"}

@app.post("/urls")
def create_url(request: URLRequest):
    return {
        "original_url":request.url
    }

