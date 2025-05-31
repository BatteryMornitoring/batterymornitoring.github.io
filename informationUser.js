let nameId = document.getElementById('nameId');
let passwordId = document.getElementById('passwordId');
let passwordConfirmId = document.getElementById('passwordConfirmId');
let emailId = document.getElementById('emailId');
let phoneNumberId = document.getElementById('phoneNumberId');
let reasons = document.getElementById('reasons');
let in4Form = document.getElementById('in4_form');

let currentUser = JSON.parse(localStorage.getItem('currentUser')) || [{"name":"","password":"","floor":"","room":"","email":"","phonenumber":"","reasons":""}];
let database = JSON.parse(localStorage.getItem('database')) || [{"name":"","password":"","floor":"","room":"","email":"","phonenumber":"","reasons":""}];
let checkList = JSON.parse(localStorage.getItem('checklist'))||[];


nameId.value = `${currentUser.name}`;
passwordId.value = `${currentUser.password}`;
passwordConfirmId.value = `${currentUser.password}`;
if(currentUser.email !== undefined){
    emailId.value = `${currentUser.email}`;
}
if(currentUser.phonenumber !== undefined){
    phoneNumberId.value = `${currentUser.phonenumber}`;
}



in4Form.addEventListener('submit',(e)=>{
    e.preventDefault();
    if( !nameId.value || !passwordId.value || !passwordConfirmId.value || !emailId.value || !phoneNumberId.value || reasons.value === '0'){
        alert("Vui lòng điền đầy đủ thông tin.");
        return 
    }
    if(passwordConfirmId.value !== passwordId.value ){
        alert('Mật khẩu không khớp');
        return
    }
    if(nameId.value === database.name || passwordId === database.password){
        alert('Tài khoản đã tồn tại');
    }
    // if(reasons.value === "tenant"){
    //     database.push({
    //         name:nameId.value,
    //         password:passwordId.value,
    //         email:emailId.value,
    //         floor:currentUser.floor,
    //         room:currentUser.room,
    //         phonenumberroom:phoneNumberId.value,
    //         reasons: reasons.value,
    //     });
    //     localStorage.setItem("database", JSON.stringify(database));
    //     alert('Cập nhật thành công');
    //     window.location.href='index.html';
    // }
    // else{
    //     //////////////////////
    //     let user = database.find(
    //         (user) => user.floor === currentUser.floor && user.room === currentUser.room
    //     );
    //     if(user){
    //     user.name = nameId.value;
    //     user.password = passwordId.value;
    //     user.email = emailId.value;
    //     user.phonenumber = phoneNumberId.value;
    //     user.reasons = reasons.value;
    //     localStorage.setItem("database", JSON.stringify(database));
    //     }
    //     /////////////////////
    //     currentUser.name = nameId.value;
    //     currentUser.password = passwordId.value;
    //     currentUser.email = emailId.value;
    //     currentUser.phonenumber = phoneNumberId.value;
    //     currentUser.reasons = reasons.value;
    //     alert('Cập nhật thành công');
    //     window.location.href='user.html';
    // }

    else{
        checkList.push({
            name:nameId.value,
            password:passwordId.value,
            email:emailId.value,
            floor:currentUser.floor,
            room:currentUser.room,
            phonenumberroom:phoneNumberId.value,
            reasons: reasons.value,
            status: 'considering',
        });
        localStorage.setItem("checklist", JSON.stringify(checkList));
        alert('Đã gửi yêu cầu thay đổi thông tin. Vui lòng đợi trong chút lát');
        window.location.href='user.html';
    }



    localStorage.setItem("currentUser", JSON.stringify(currentUser));
})

//go back button
function gobackBtn(){
    window.location.href='user.html'
}