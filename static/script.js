const socket = new WebSocket(`ws://localhost:42069/ws`);
let heartRateChart = new Chart(document.getElementById('heartRateChart'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: "Heart Rate",
            data: [],
        }],
    },
    options: {
        responsive: true,
        scales: {
            x: {
                title: {
                    display: true,
                    text: "Timestamp",
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Heart Rate'
                }
            }
        }
    }
});
let accelerometer = new Chart(document.getElementById('accelerometer'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: "g/ms2",
            data: [],
            borderColor: '#FF6384',
            backgroundColor: '#FFB1C1',
        }],
    },
    options: {
        responsive: true,
        scales: {
            x: {
                title: {
                    display: true,
                    text: "Timestamp",
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'accelerometer'
                }
            }
        }
    }
});

function vecMagnitude(x, y, z) {
    return Math.sqrt(x ** 2 + y ** 2 + z ** 2);
}

let inputArray = []
let hrArray = []
let i = 0;
socket.addEventListener('message', (event) => {
    const { time, hr, ax, ay, az } = JSON.parse(event.data);
    if (i < 50) {
        inputArray.push([ax, ay, az]);
        hrArray.push(hr);
        console.log(i);
        i++;
    } else {
        i = 0
        let total = 0;
        let count = 0;
        hrArray.forEach(function(item, _) {
            total += item;
            count++;
        });
        let avg = total / count;
        document.getElementById("avgHeartRate").textContent = avg;
        const payload = JSON.stringify(inputArray);
        fetch('http://localhost:42070/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: payload
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Error sending POST request');
                }
                return response.json();
            })
            .then((data) => {
                console.log('Prediction:', data.prediction);
                const element = document.getElementById("activity");
                element.textContent = data.prediction;
                // Handle the prediction response here
            })
            .catch((error) => {
                console.error('Error:', error);
                // Handle the error here
            });
        inputArray = [];
        hrArray = [];
    }
    heartRateChart.data.labels.push(time);
    heartRateChart.data.datasets[0].data.push(hr);
    heartRateChart.update();
    accelerometer.data.labels.push(time);
    accelerometer.data.datasets[0].data.push(vecMagnitude(ax, ay, az));
    accelerometer.update();
});
