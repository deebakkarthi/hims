#!/usr/bin/env python3
import dataclasses
from awscrt import io, mqtt
from awsiot import mqtt_connection_builder
import time as t
import json
import random
from datetime import  datetime, time, timedelta

def message_gen():
    message = {
            "date": datetime(2023, 5, 30).date().isoformat(),
            "time": None,
            "hr": random.uniform(74,90),
            "spo2": random.uniform(95, 99),
            "ax": random.uniform(-9.8, 9.8),
            "ay": random.uniform(-9.8, 9.8),
            "az": random.uniform(-9.8, 9.8),
            "gx": random.uniform(-6.28, 6.28),
            "gy": random.uniform(-6.28, 6.28),
            "gz": random.uniform(-6.28, 6.28),
            }
    return message


# Define ENDPOINT, CLIENT_ID, PATH_TO_CERTIFICATE, PATH_TO_PRIVATE_KEY, PATH_TO_AMAZON_ROOT_CA_1, MESSAGE, TOPIC, and RANGE
ENDPOINT = "abmz93c7nf56o-ats.iot.us-east-1.amazonaws.com"
CLIENT_ID = "ESP32_HEALTH"
PATH_TO_CERTIFICATE = "certificates/dc.pem"
PATH_TO_PRIVATE_KEY = "certificates/private.pem"
PATH_TO_AMAZON_ROOT_CA_1 = "certificates/root.pem"
TOPIC = "esp32/pub"
RANGE = 20

def main():
    random.seed()
    # Spin up resources
    event_loop_group = io.EventLoopGroup(1)
    host_resolver = io.DefaultHostResolver(event_loop_group)
    client_bootstrap = io.ClientBootstrap(event_loop_group, host_resolver)
    mqtt_connection = mqtt_connection_builder.mtls_from_path(
            endpoint=ENDPOINT,
            cert_filepath=PATH_TO_CERTIFICATE,
            pri_key_filepath=PATH_TO_PRIVATE_KEY,
            client_bootstrap=client_bootstrap,
            ca_filepath=PATH_TO_AMAZON_ROOT_CA_1,
            client_id=CLIENT_ID,
            clean_session=False,
            keep_alive_secs=6
            )
    print("Connecting to {} with client ID '{}'...".format(
        ENDPOINT, CLIENT_ID))
# Make the connect() call
    connect_future = mqtt_connection.connect()
# Future.result() waits until a result is available
    connect_future.result()
    print("Connected!")
# Publish message to server desired number of times.
    print('Begin Publish')
    start_hr = random.randint(14,21)
    curr_time = time(start_hr,0,0)
    delta = timedelta(minutes=1, seconds=random.randint(0, 59))
    end_time = time(start_hr+1, 0, 0)
    while curr_time < end_time:
        message = message_gen()
        message["time"] = curr_time.isoformat()
        curr_time = (datetime.combine(datetime.now(),curr_time) + delta).time()
        mqtt_connection.publish(topic=TOPIC, payload=json.dumps(message), qos=mqtt.QoS.AT_LEAST_ONCE)
        print("Published: '" + json.dumps(message) + "' to the topic: " + "'esp32/pub'")
        t.sleep(0.5)
    print('Publish End')
    disconnect_future = mqtt_connection.disconnect()
    disconnect_future.result()

if __name__ == "__main__":
    main()
