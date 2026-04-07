# Use the official lightweight Python image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies required by OpenCV and other ML tools
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
COPY Requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r Requirements.txt

# Copy the rest of the backend application code
COPY . .

# Expose the port Uvicorn runs on
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
