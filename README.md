# URL Shortener

A URL shortener built using FastAPI and Python.

## Current Features

- FastAPI application
- GET `/` endpoint
- POST `/urls` endpoint
- Pydantic request validation
- Swagger API documentation

## Tech Stack

- Python
- FastAPI
- Pydantic
- Uvicorn

## Current API

### POST `/urls`

Request:

```json
{
    "url": "https://google.com"
}