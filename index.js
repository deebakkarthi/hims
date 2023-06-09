const awscrt = require("aws-crt");
const { exit } = require("process")
const TextDecoder = require('util').TextDecoder;
const { spawn } = require('child_process');
const mqtt = awscrt.mqtt
const express = require("express");
const expressWs = require("express-ws");
const bodyParser = require('body-parser');

const CERT = "cert.pem";
const KEY = "key.pem";
const CA_FILE = "ca_file.pem";
const ENDPOINT = "abmz93c7nf56o-ats.iot.us-east-1.amazonaws.com"
const TOPIC = "esp32/pub"

function buildDirectMQTTConn() {
    let configBuilder = awscrt.iot.AwsIotMqttConnectionConfigBuilder.new_mtls_builder_from_path(CERT, KEY);
    configBuilder.with_certificate_authority(undefined, CA_FILE);
    configBuilder.with_clean_session(true);
    configBuilder.with_client_id("test-" + Math.floor(Math.random() + 1000000000));
    configBuilder.with_endpoint(ENDPOINT);
    const config = configBuilder.build();
    console.log(config);
    const client = new mqtt.MqttClient();
    return client.new_connection(config);

}

const connection = buildDirectMQTTConn();
connection.connect().catch((error) => {
    console.log("Connection Error: ", error); exit(-1);
});
connection.on("connect", () => {
    console.log("MQTT Connected");
});
connection.on("disconnect", () => {
    console.log("MQTT Connection closed");
});
connection.subscribe(TOPIC, mqtt.QoS.AtLeastOnce);
const app = express();
app.use(bodyParser.json());
expressWs(app);

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/static/index.html");
});

const pythonURL = 'http://localhost:42070';

app.get("/python", async (req, res) => {
    try {
        const response = await fetch(pythonURL, {
            method: 'POST',
            body: JSON.stringify(req.body),
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            throw new Error('Error sending request to Python server');
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

app.use(express.static("static"));

app.ws("/ws", (ws, req) => {
    connection.on("message", (topic, payload, dup, qos, retain) => {
        const decoder = new TextDecoder('utf8');
        const json = decoder.decode(payload);
        console.log(`Publish received. topic:"${topic}" dup:${dup} qos:${qos} retain:${retain}`);
        console.log(`Payload: ${json}`);
        ws.send(json);
    });
    ws.on("close", () => {
        console.log("WebSocket connection closed");
    })
});

const port = 42069;
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
})

