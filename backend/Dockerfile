FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app
WORKDIR /app
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r ./requirements.txt
COPY src ./src

EXPOSE 8000

# CMD ["uvicorn", "src.main_app:app", "--host", "0.0.0.0", "--port", "8000"]
CMD ["python", "-m", "uvicorn", "src.main_app:app", "--host", "0.0.0.0", "--port", "8000"]
