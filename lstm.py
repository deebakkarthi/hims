#!/usr/bin/env python3
import keras
import http.server
import json
import numpy as np
from urllib.parse import urlparse, parse_qs
model = keras.models.load_model("model")

class RequestHandler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        parsed_data = json.loads(post_data.decode())

        # Convert JSON data to a NumPy array
        input_array = np.array(parsed_data)
        print(len(parsed_data))
        input_array = input_array.reshape((1, 50, 3))

        # Perform prediction using the loaded model
        prediction = model.predict(input_array)

        # Convert the prediction to a list for JSON serialization
        prediction_list = prediction.tolist()
        class_labels = ['running down the stairs', 'Jogging', 'Sitting', 'Standing', 'running up the stairs', 'Walking']
        prediction = np.argmax(prediction_list)
        # Prepare the response JSON
        response_json = {'prediction': class_labels[prediction]}
        #response_json = {'prediction': "Walking"}

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()

        # Send the response JSON
        self.wfile.write(json.dumps(response_json).encode())

if __name__ == '__main__':
    PORT = 42070
    server_address = ('', PORT)
    httpd = http.server.HTTPServer(server_address, RequestHandler)
    print('Server listening on port', PORT)
    httpd.serve_forever()
