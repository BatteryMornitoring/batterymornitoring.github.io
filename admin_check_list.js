let container = document.getElementById('container');
let checkList = JSON.parse(localStorage.getItem('checklist')) || [];
let database = JSON.parse(localStorage.getItem('database')) || [{"name":"","password":"","floor":"","room":"","email":"","phonenumber":"","reasons":""}];


function display() {
    container.innerHTML = "";
    checkList.forEach(user => {
        if (user.status === 'considering') {
            let div = document.createElement('div');
            div.classList.add('box', 'p-4', 'rounded-5');
            div.innerHTML = `
                <h1 class="text-center bg-danger rounded-3 text-white"><b>${user.floor}${user.room}</b></h1>
                <p><b>Email:</b> <span>${user.email}</span></p>
                <p><b>Name:</b> <span>${user.name}</span></p>
                <p><b>Password:</b> <span>${user.password}</span></p>
                <p><b>Phone Number:</b> <span>${user.phonenumberroom}</span></p>
                <p><b>Reasons:</b> <span>${user.reasons}</span></p>
            `;

            // Accept button
            let acceptBtn = document.createElement('button');
            acceptBtn.classList.add('boxBtn', 'border-0', 'px-5', 'py-2', 'rounded-3', 'bg-danger', 'text-white', 'ms-5');
            acceptBtn.innerHTML = 'Accept';
            acceptBtn.onclick = () => acceptFunc(user);
            div.appendChild(acceptBtn);

            // Deny button
            let denyBtn = document.createElement('button');
            denyBtn.classList.add('boxBtn', 'border-0', 'px-5', 'py-2', 'rounded-3', 'bg-danger', 'text-white', 'ms-4');
            denyBtn.innerHTML = 'Deny';
            denyBtn.onclick = () => denyFunc(user);
            div.appendChild(denyBtn);

            container.appendChild(div);
        }
    });
}

function acceptFunc(user) {
    user.status = 'accept';

    // Tìm tất cả người trong cùng phòng
    let sameRoomUsers = database.filter(
        (userdata) => userdata.floor === user.floor && userdata.room === user.room
    );

    if (user.reasons === "tenant") {
        // LUÔN THÊM NGƯỜI MỚI nếu là tenant
        database.push({
            name: user.name,
            password: user.password,
            email: user.email,
            floor: user.floor,
            room: user.room,
            phonenumber: user.phonenumberroom,
            reasons: user.reasons,
        });
    } else {
        // Nếu không phải tenant 
        // Ta sẽ sửa người ĐẦU TIÊN tìm được ở cùng phòng
        let userdata = sameRoomUsers[0];
        if (userdata) {
            userdata.name = user.name;
            userdata.password = user.password;
            userdata.email = user.email;
            userdata.phonenumber = user.phonenumberroom;
            userdata.reasons = user.reasons;
        } else {
            // Nếu không có ai thì thêm mới
            database.push({
                name: user.name,
                password: user.password,
                email: user.email,
                floor: user.floor,
                room: user.room,
                phonenumber: user.phonenumberroom,
                reasons: user.reasons,
            });
        }
    }

    localStorage.setItem("database", JSON.stringify(database));
    localStorage.setItem('checklist', JSON.stringify(checkList));
    display();
}

function denyFunc(user) {
    user.status = 'deny';
    localStorage.setItem('checklist', JSON.stringify(checkList));
    display();
}

// Lắng nghe sự kiện storage để cập nhật khi localStorage thay đổi ở tab khác
window.addEventListener('storage', (event) => {
    if (event.key === 'checklist') {
        checkList = JSON.parse(event.newValue) || [];
        display();
    }
});

// Khởi đầu gọi display
display();

// Quay lại
function goBack(){
    window.location.href='admin.html';
}

// if(user){
// user.name = nameId.value;
// user.password = passwordId.value;
// user.email = emailId.value;
// user.phonenumber = phoneNumberId.value;
// user.reasons = reasons.value;
// localStorage.setItem("database", JSON.stringify(database));
// }
