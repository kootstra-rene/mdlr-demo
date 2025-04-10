mkdir -p ./docs/app/bundle/demo

curl --insecure -s --header "Accept: text/html" "https://localhost/app/web/demo:realworld-app" | gunzip > ./docs/realworld-app.html
curl --insecure -s "https://localhost/bundle/web/demo:realworld-app" | gunzip > ./docs/app/bundle/demo/realworld-app