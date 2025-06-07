
// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBppIwEMQtK1OsnN2MVanqIwUre6xfnkZU",
    authDomain: "batterymonitoringsystem-86df4.firebaseapp.com",
    databaseURL: "https://batterymonitoringsystem-86df4-default-rtdb.firebaseio.com",
    projectId: "batterymonitoringsystem-86df4",
    storageBucket: "batterymonitoringsystem-86df4.appspot.com",
    messagingSenderId: "913686041879",
    appId: "1:913686041879:web:24f5581ef99823b0d31352",
    measurementId: "G-0W50WGBWGC"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// User data
let avaName = document.getElementById('avaName');
let avaRoom = document.getElementById('avaRoom');
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
avaName.innerHTML = `<b>${currentUser.name.toUpperCase()}</b>`;
avaRoom.innerHTML = `<b>Room: ${currentUser.floor.toUpperCase()}${currentUser.room.toUpperCase()}</b>`;

// Chart data
let socLabels = [], socData = [];
let sohLabels = [], sohData = [];
let tempLabels = [], tempData = [];
let MAX_POINTS = 20;

const combinedChart = new Chart(document.getElementById('combinedChart'), {
    type: 'line',
    data: {
        labels: socLabels,
        datasets: [
            { label: 'SoC (%)', data: socData, borderColor: 'rgba(75, 192, 192, 1)', tension: 0.1 },
            { label: 'SoH (%)', data: sohData, borderColor: 'rgba(0, 123, 255, 1)', tension: 0.1 },
            { label: 'Temp (°C)', data: tempData, borderColor: 'rgba(255, 159, 64, 1)', tension: 0.1 }
        ]
    },
    options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1.77,
        plugins: { title: { display: true, text: 'Real-Time Battery Data' } },
        scales: { y: { beginAtZero: true } }
    }
});

// Weekly chart
let weeklyChart;
function initWeeklyChart(labels, minSocData, minSohData, maxTempData) {
    const ctx = document.getElementById('weeklyChart').getContext('2d');
    weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Min SoC (%)', data: minSocData, backgroundColor: 'rgba(255, 99, 132, 0.7)' },
                { label: 'Min SoH (%)', data: minSohData, backgroundColor: 'rgba(255, 206, 86, 0.7)' },
                { label: 'Max Temp (°C)', data: maxTempData, backgroundColor: 'rgba(153, 102, 255, 0.7)' }
            ]
        },
        options: {
            plugins: { title: { display: true, text: 'Battery data summary (SoC, SoH, Temp) for the last 7 days' } },
            responsive: true,
            scales: { y: { beginAtZero: true } }
        }
    });
}

// Firebase paths
const pathPrefix = '/Room/' + currentUser.floor + currentUser.room;
const socPath = pathPrefix + '/soc';
const sohPath = pathPrefix + '/soh';
const tempPath = pathPrefix + '/temp';
const usedPath = pathPrefix + '/used';
const statsPath = pathPrefix + '/stats';

let currentSoC = 0, currentSoH = 0, currentTemp = 0;

// Realtime listeners
db.ref(socPath).on("value", (snapshot) => {
    currentSoC = snapshot.val();
    document.getElementById('socData').innerText = currentSoC;
    warningCheck();
});
db.ref(sohPath).on("value", (snapshot) => {
    currentSoH = snapshot.val();
    document.getElementById('sohData').innerText = currentSoH;
    warningCheck();
});
db.ref(tempPath).on("value", (snapshot) => {
    currentTemp = snapshot.val();
    document.getElementById('tempData').innerText = currentTemp;
    warningCheck();
});
db.ref(usedPath).on("value", (snapshot) => {
    document.getElementById('usedData').innerText = snapshot.val();
});

// Update chart and max SoC logic
setInterval(() => {
    const now = new Date();
    const timeLabel = now.toLocaleTimeString();
    const dateKey = now.toISOString().slice(0, 10); // YYYY-MM-DD

    socLabels.push(timeLabel); socData.push(currentSoC);
    sohLabels.push(timeLabel); sohData.push(currentSoH);
    tempLabels.push(timeLabel); tempData.push(currentTemp);
    if (socLabels.length > MAX_POINTS) { socLabels.shift(); socData.shift(); }
    if (sohLabels.length > MAX_POINTS) { sohLabels.shift(); sohData.shift(); }
    if (tempLabels.length > MAX_POINTS) { tempLabels.shift(); tempData.shift(); }
    combinedChart.update();

    // Ghi lại SoC cao nhất trong ngày
    db.ref(`${statsPath}/${dateKey}/minSoc`).transaction(currentMin => {
        return (currentMin === null || currentSoC < currentMin) ? currentSoC : currentMin;
    });
    db.ref(`${statsPath}/${dateKey}/minSoh`).transaction(currentMin => {
        return (currentMin === null || currentSoH < currentMin) ? currentSoH : currentMin;
    });
    db.ref(`${statsPath}/${dateKey}/maxTemp`).transaction(currentMax => {
        return (currentMax === null || currentTemp > currentMax) ? currentTemp : currentMax;
    });
}, 2000);

// Load weekly max SoC stats
function loadWeeklyStats() {
    const today = new Date();
    const labels = [];
    const promises = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateKey = date.toISOString().slice(0, 10);
        labels.push(dateKey.slice(5)); // MM-DD

        promises.push(
            db.ref(`${statsPath}/${dateKey}/minSoc`).once("value"),
            db.ref(`${statsPath}/${dateKey}/minSoh`).once("value"),
            db.ref(`${statsPath}/${dateKey}/maxTemp`).once("value") );
    }

    Promise.all(promises).then(results => {
        const minSocData = [], minSohData = [], maxTempData = [];

        for (let i = 0; i < results.length; i += 3) {
            minSocData.push(results[i].exists() ? results[i].val() : 0);
            minSohData.push(results[i+1].exists() ? results[i+1].val() : 0);
            maxTempData.push(results[i+2].exists() ? results[i+2].val() : 0);
        }

        if (minSocData.length > 0 && minSohData.length > 0 && maxTempData.length > 0) {
            if (weeklyChart) {
                weeklyChart.data.labels = labels;
                weeklyChart.data.datasets[0].data = minSocData;
                weeklyChart.data.datasets[1].data = minSohData;
                weeklyChart.data.datasets[2].data = maxTempData;
                weeklyChart.update();
            } else {
                initWeeklyChart(labels, minSocData, minSohData, maxTempData);
            }
        } else {
            console.error("Dữ liệu weekly stats không hợp lệ!");
        }

        // Hiển thị max hôm nay
        const todayKey = today.toISOString().slice(0, 10);
        const todayIndex = labels.indexOf(todayKey.slice(5));
        if (todayIndex !== -1) {
            document.getElementById("maxSocToday").innerText = data[todayIndex];
        }
    });
}

loadWeeklyStats();
setInterval(loadWeeklyStats, 5 * 60 * 1000); // cập nhật mỗi 5 phút

const chartToggleSwitch = document.getElementById("chartToggleSwitch");
const combinedChartCanvas = document.getElementById("combinedChart");
const weeklyChartCanvas = document.getElementById("weeklyChart");

// Initially show only combined chart
weeklyChartCanvas.style.display = "none";

chartToggleSwitch.addEventListener("change", function () {
    if (chartToggleSwitch.checked) {
        combinedChartCanvas.style.display = "none";
        weeklyChartCanvas.style.display = "block";
        loadWeeklyStats();
    } else {
        weeklyChartCanvas.style.display = "none";
        combinedChartCanvas.style.display = "block";
    }
    this.blur(); 
});

//----------- Logic chuyển trang --------------------------------------------------
function changeBtn() { window.location.href = 'informationUser.html'; }
function logout() { window.location.href = 'index.html'; }

// Cảnh báo ngưỡng
function warningCheck() {
    const soc = parseFloat(document.getElementById('socData').textContent);
    const soh = parseFloat(document.getElementById('sohData').textContent);
    const temp = parseFloat(document.getElementById('tempData').textContent);

    document.getElementById('warning-soc').style.display = (soc < 30) ? 'inline-block' : 'none';
    document.getElementById('warning-soc').style.color = 'yellow';
    document.getElementById('warning-soh').style.display = (soh === 0) ? 'inline-block' : 'none';
    document.getElementById('warning-soh').style.color = 'yellow';
    document.getElementById('warning-temp').style.display = (temp > 50 || temp <= 0) ? 'inline-block' : 'none';
    document.getElementById('warning-temp').style.color = 'yellow';
}
