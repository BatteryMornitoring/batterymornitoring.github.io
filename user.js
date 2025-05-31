///////////FIREBASE

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBppIwEMQtK1OsnN2MVanqIwUre6xfnkZU",
    authDomain: "batterymonitoringsystem-86df4.firebaseapp.com",
    databaseURL: "https://batterymonitoringsystem-86df4-default-rtdb.firebaseio.com",
    projectId: "batterymonitoringsystem-86df4",
    storageBucket: "batterymonitoringsystem-86df4.firebasestorage.app",
    messagingSenderId: "913686041879",
    appId: "1:913686041879:web:24f5581ef99823b0d31352",
    measurementId: "G-0W50WGBWGC"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var databasee = firebase.database();




///////////////////JAVASCRIPT
let avaName = document.getElementById('avaName');
let avaRoom = document.getElementById('avaRoom');


let currentUser = JSON.parse(localStorage.getItem('currentUser')) || [];

let database = JSON.parse(localStorage.getItem('database')) || [{ "name": "", "password": "", "floor": "", "room": "", "email": "", "phonenumber": "", "reasons": "" }];


avaName.innerHTML = `<b>${currentUser.name.toUpperCase()}</b>`;

avaRoom.innerHTML = `<b>Room: ${currentUser.floor.toUpperCase()}${currentUser.room.toUpperCase()}</b>`





// button
function changeBtn() {
    window.location.href = 'informationUser.html';
}

//log out
function logout() {
    window.location.href = 'index.html';
}

// chart 
let MAX_POINTS = 20;

// Biến lưu giá trị hiện tại từ Firebase
let currentSoC = 0;
let currentSoH = 0;
let currentTemp = 0;

// Dữ liệu cho biểu đồ
let socLabels = [], socData = [];
let sohLabels = [], sohData = [];
let tempLabels = [], tempData = [];

// Biểu đồ Gộp 3 loại dữ liệu (SoC, SoH, Temp)
const combinedChart = new Chart(document.getElementById('combinedChart'), {
    type: 'line',
    data: {
        labels: socLabels,  // Lấy nhãn của SoC
        datasets: [
            {
                label: 'SoC (%)',
                data: socData,
                borderColor: 'rgba(75, 192, 192, 1)',
                tension: 0.1,
            },
            {
                label: 'SoH (%)',
                data: sohData,
                borderColor: 'rgba(0, 123, 255, 1)',
                tension: 0.1,
            },
            {
                label: 'Temp (°C)',
                data: tempData,
                borderColor: 'rgba(255, 159, 64, 1)',
                tension: 0.1,
            }
        ]
    },
    options: {
        animation: false,
        plugins: {
            title: { display: true, text: 'Real-Time Battery Data' }
        },
        scales: {
            y: { beginAtZero: true }
        },
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1.77   // Điều chỉnh tỷ lệ (16:9)
    }
});


////////Thông tin lựa chọn modal
let socPath = '/Room/' + currentUser.floor + currentUser.room + '/soc';
let sohPath = '/Room/' + currentUser.floor + currentUser.room + '/soh';
let tempPath = '/Room/' + currentUser.floor + currentUser.room + '/temp';
let usedPath = '/Room/' + currentUser.floor + currentUser.room + '/used';


// Lắng nghe dữ liệu từ Firebase
databasee.ref(socPath).on("value", function (snapshot) {
    currentSoC = snapshot.val();
    document.getElementById('socData').innerText = currentSoC;
    warningCheck();
});

databasee.ref(sohPath).on("value", function (snapshot) {
    currentSoH = snapshot.val();
    document.getElementById('sohData').innerText = currentSoH;
    warningCheck();
});

databasee.ref(tempPath).on("value", function (snapshot) {
    currentTemp = snapshot.val();
    document.getElementById('tempData').innerText = currentTemp;
    warningCheck();
});

databasee.ref(usedPath).on("value", function (snapshot) {
    currentUsed = snapshot.val();
    document.getElementById('usedData').innerText = currentUsed;
});


// Cập nhật dữ liệu vào biểu đồ mỗi 2 giây
setInterval(() => {
    const now = new Date().toLocaleTimeString();

    // Cập nhật biểu đồ SoC
    socLabels.push(now);
    socData.push(currentSoC);
    if (socLabels.length > MAX_POINTS) {
        socLabels.shift();
        socData.shift();
    }

    // Cập nhật biểu đồ SoH
    sohLabels.push(now);
    sohData.push(currentSoH);
    if (sohLabels.length > MAX_POINTS) {
        sohLabels.shift();
        sohData.shift();
    }

    // Cập nhật biểu đồ Temp
    tempLabels.push(now);
    tempData.push(currentTemp);
    if (tempLabels.length > MAX_POINTS) {
        tempLabels.shift();
        tempData.shift();
    }

    // Cập nhật tất cả dữ liệu vào biểu đồ
    combinedChart.update();

    ///gửi dữ liệu SoC, SoH và temp về data
    let user = database.find(
        (user) => user.floor === currentUser.floor && user.room === currentUser.room
    );


}, 2000); // Cập nhật mỗi 2 giây





// //////////////// Cờ bật
// const switchElement = document.getElementById('switch');
// if (switchElement) {
//     switchElement.addEventListener('change', function() {
//         if (switchElement.checked) {
//             databasee.ref("/").update({
//                 "wifi": 'on'
//             });
//         } else {
//             databasee.ref("/").update({
//                 "wifi": 'off'
//             });
//         }
//     });
// }


// databasee.ref("/wifi").on("value",function(snapshot){
//     var a = snapshot.val();
//     if  (a == "on"){
//         switchElement.checked = true;}
//     else if (a == "off") {
//         switchElement.checked = false;}
//     });


/////////////////// Kiểm tra ngưỡng
/////////////////// Kiểm tra ngưỡng
function warningCheck() {
    const warningSoc = document.getElementById('warning-soc');
    const warningSoh = document.getElementById('warning-soh');
    const warningTemp = document.getElementById('warning-temp');

    // Lấy giá trị hiện tại từ các span
    const currentSoC = parseFloat(document.getElementById('socData').textContent);
    const currentSoH = parseFloat(document.getElementById('sohData').textContent);
    const currentTemp = parseFloat(document.getElementById('tempData').textContent);

    // SoC - Cảnh báo khi < 30%
    if (currentSoC < 30) {
        warningSoc.style.display = 'inline-block';
        warningSoc.style.color = 'yellow';
    } else {
        warningSoc.style.display = 'none';
    }

    // SoH - Cảnh báo khi = 0%
    if (currentSoH === 0) {
        warningSoh.style.display = 'inline-block';
        warningSoh.style.color = 'yellow';
    } else {
        warningSoh.style.display = 'none';
    }

    // Temp - Cảnh báo khi > 60°C hoặc <= 0°C
    if (currentTemp > 60 || currentTemp <= 0) {
        warningTemp.style.display = 'inline-block';
        warningTemp.style.color = 'yellow';
    } else {
        warningTemp.style.display = 'none';
    }
}