from flask import Flask, request, jsonify, make_response, render_template, send_from_directory
import requests

app = Flask(__name__, static_folder='page')

BASE_URL = "https://api.openaq.org/v1"

@app.route('/v1/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def catch_all(path):
    # Construct the full URL for the OpenAQ API
    forward_url = f"{BASE_URL}/{path}"

    # Get all query parameters passed by the client
    query_params = request.args
    print(forward_url)
    print(query_params)
    # Set the request headers
    headers = {'accept': 'application/json', 'Expires': '0', 'Pragma': 'no-cache', 'Cache-Control': 'no-cache, no-store, must-revalidate'}

    # Forward the request based on the method
    if request.method == 'GET':
        response = requests.get(forward_url, headers=headers, params=query_params, timeout=100)
    elif request.method == 'POST':
        response = requests.post(forward_url, headers=headers, json=request.json)
    elif request.method == 'PUT':
        response = requests.put(forward_url, headers=headers, json=request.json)
    elif request.method == 'DELETE':
        response = requests.delete(forward_url, headers=headers)
    else:
        return jsonify({"error": "Unsupported method"}), 405

    ALLOWED_HEADERS = ["Content-Type", "Date", "Expires", "Cache-Control"]

    resp = make_response(response.content, response.status_code)
    for header_key, header_value in response.headers.items():
        if header_key in ALLOWED_HEADERS:
            resp.headers[header_key] = header_value

    return resp

@app.route('/<path:filename>')
def custom_static(filename):
    return send_from_directory("page", filename)


if __name__ == '__main__':
    app.run(debug=True)
