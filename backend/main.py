from fastapi import FastAPI
from pydantic import BaseModel
import psycopg

app = FastAPI()


class URLRequest(BaseModel):
    url: str


connection = psycopg.connect(
    host="localhost",
    port=5432,
    dbname="url_shortener",
    user="postgres",
    password="18105"
)


@app.post("/urls")
def create_url(request: URLRequest):
    cursor = connection.cursor()
    cursor.execute("""INSERT INTO urls (short_code, original_url)   
                   VALUES (%s, %s)
                   """,
    ("abc123", request.url)

    )

    connection.commit()

    return {
        "short_code": "abc123",
        "original_url": request.url
    }