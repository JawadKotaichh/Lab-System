FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r ./requirements.txt

COPY pyproject.toml .
COPY src ./src
RUN pip install -e .
RUN pip install --no-cache-dir -r ./requirements.txt
EXPOSE 8000

CMD ["uvicorn", "src.main_app:app", "--host", "0.0.0.0", "--port", "8000"]
