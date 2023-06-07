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
socket.addEventListener('message', (event) => {
    const { time, hr, spo2 } = JSON.parse(event.data);
    console.log(time, hr);
    heartRateChart.data.labels.push(time);
    heartRateChart.data.datasets[0].data.push(hr);
    heartRateChart.update();
});
