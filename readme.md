# AQI Visualization Project
Please visit: https://aqi.001.gs/

## Prerequisites

Ensure [Docker](https://www.docker.com/get-started) is installed on your machine.

## Installation Steps

1. Clone this repository to your local machine.
   ```bash
   git clone https://github.com/bobyeoh/aqi-map.git
   cd aqi-map
   docker build -t aqi-map .
   docker run -d -p 5000:5000 --name aqi-map aqi-map
   ```
2. Accessing the Application
Once the Docker container is running, you can access the application at http://localhost:5000/index.html

3. Stopping the Application
To stop the running Docker container, execute the following command:
```bash
docker stop aqi-map
```

4. Removing the Docker container (optional)
To remove the Docker container after stopping it, execute the following command:
```bash
docker rm aqi-map
```
