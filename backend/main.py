BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

from dotenv import load_dotenv
from upstash_redis import Redis
from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, HttpUrl
from fastapi.middleware.cors import CORSMiddleware
import os
import psycopg

load_dotenv()

app = FastAPI()
redis_client = Redis.from_env()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500", "http://127.0.0.1:5500"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class URLRequest(BaseModel):
    url: HttpUrl


connection = psycopg.connect(
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT"),
    dbname=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD")
)


def generate_short_code(num):
    if num == 0:
        return "0"

    code = ""

    while num > 0:
        remainder = num % 62
        code = BASE62[remainder] + code
        num = num // 62

    return code


@app.post("/urls")
def create_url(request: URLRequest):

    cursor = connection.cursor()

    # Check whether this URL already exists
    
    cursor.execute(
        "SELECT short_code FROM urls WHERE original_url = %s",
        (str(request.url),)
    )


    result = cursor.fetchone()

    if result:
        return {
            "short_code": result[0],
            "original_url": request.url
        }

    # Get the next ID that PostgreSQL will use
    cursor.execute(
        "SELECT nextval('urls_id_seq')"
    )

    num = cursor.fetchone()[0]

    # Convert that ID into Base62
    short_url = generate_short_code(num)

    # Insert everything into the table
    cursor.execute(
        """
        INSERT INTO urls (id, short_code, original_url)
        VALUES (%s, %s, %s)
        """,
        (num, short_url, str(request.url))
    )

    connection.commit()

    return {
        "short_code": short_url,
        "original_url": str(request.url)
    }

@app.get("/analytics/{short_code}")
def get_analytics(short_code: str):

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT original_url, click_count
        FROM urls
        WHERE short_code = %s
        """,
        (short_code,)
    )

    result = cursor.fetchone()

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Short URL not found"
        )

    return {
        "short_code": short_code,
        "original_url": result[0],
        "click_count": result[1]
    }


@app.get("/{short_code}")
def redirect_url(short_code: str):

    # Redis
    original_url = redis_client.get(short_code)

    if original_url:
        print("CACHE HIT")

        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE urls
            SET click_count = click_count + 1
            WHERE short_code = %s
            """,
            (short_code,)
        )

        connection.commit()

        return RedirectResponse(
            url=original_url,
            status_code=307
        )

    # PostgreSQL
    print("CACHE MISS")

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT original_url
        FROM urls
        WHERE short_code = %s
        """,
        (short_code,)
    )

    result = cursor.fetchone()

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Short URL not found"
        )

    original_url = result[0]

    # Increase count
    cursor.execute(
        """
        UPDATE urls
        SET click_count = click_count + 1
        WHERE short_code = %s
        """,
        (short_code,)
    )

    connection.commit()

    # Store in Redis
    redis_client.set(
        short_code,
        original_url
    )

    return RedirectResponse(
        url=original_url,
        status_code=307
    )