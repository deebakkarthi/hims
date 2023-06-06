const awscrt = require("aws-crt");
const { exit } = require("process")
const TextDecoder = require('util').TextDecoder;
const mqtt = awscrt.mqtt

const CERT = "cert";
const KEY = "key";
const CA_FILE = "ca_file";
const ENDPOINT = "abmz93c7nf56o-ats.iot.us-east-1.amazonaws.com"
const TOPIC = "test/pub"
const COUNT = 10

function buildDirectMQTTConn() {
    let configBuilder = awscrt.iot.AwsIotMqttConnectionConfigBuilder.new_mtls_builder_from_path(CERT, KEY);
    configBuilder.with_certificate_authority(undefined, CA_FILE);
    configBuilder.with_clean_session(false);
    configBuilder.with_client_id("test-" + Math.floor(Math.random() + 1000000000));
    configBuilder.with_endpoint(ENDPOINT);
    const config = configBuilder.build();
    const client = new mqtt.MqttClient();
    return client.new_connection(config);

}

async function executeSession(connection) {
    return new Promise(async (resolve, reject) => {
        try {
            const decoder = new TextDecoder('utf8');
            const on_publish = async (topic, payload, dup, qos, retain) => {
                const json = decoder.decode(payload);
                console.log(`Publish received. topic:"${topic}" dup:${dup} qos:${qos} retain:${retain}`);
                console.log(`Payload: ${json}`);
            }
            await connection.subscribe(TOPIC, mqtt.QoS.AtLeastOnce, on_publish);
        }
        catch (error) {
            reject(error);
        }
    });
}

async function main() {
    // force node to wait 90 seconds before killing itself, promises do not keep node alive
    // ToDo: we can get rid of this but it requires a refactor of the native connection binding that includes
    //    pinning the libuv event loop while the connection is active or potentially active.
    const timer = setInterval(() => { }, 90 * 1000);

    const connection = buildDirectMQTTConn();
    await connection.connect().catch((error) => {
        console.log("Connection Error: ", error); exit(-1);
    });
    await executeSession(connection).catch((error) => {
        console.log("Session Error: ", error); exit(-1);
    });
    await connection.disconnect().catch((error) => { console.log("Disconnect error: " + error), exit(-1) });

    // Allow node to die if the promise above resolved
    clearTimeout(timer);

}

main();
