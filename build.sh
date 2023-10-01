docker stop aqi-map
docker rm aqi-map
docker rmi aqi-map
git pull
docker build -t aqi-map .
sh run.sh