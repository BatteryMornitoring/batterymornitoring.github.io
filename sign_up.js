let form1 = document.getElementById('signup_form');
let name = document.getElementById('nameId');
let password = document.getElementById('passwordId');
let passwordConfirm = document.getElementById('passwordConfirmId');
let floor = document.getElementById('floor');
let roomNumber = document.getElementById('roomNumber');

let database = JSON.parse(localStorage.getItem('database'))||[];

form1.addEventListener("submit",function(e){
    e.preventDefault();
    if (!name.value || !password.value || !passwordConfirm.value) {
        alert("Vui lòng điền đầy đủ thông tin.");
        return
    }
    if((floor.value === '0' || roomNumber.value ==='0')&&password.value !=='admin123' ){
        alert('Vui lòng chọn số căn')
        return
    }
    if(passwordConfirm.value !== password.value ){
        alert('Mật khẩu không khớp');
        return
    }
    let exists = database.some(user => user.name === name.value || (user.floor == floor.value && user.room == roomNumber.value));
    if (exists) {
        alert("Tên người dùng đã tồn tại.");
        return
    }
    else{
        if(password.value =='admin123'){
            if(floor.value !== '0' || roomNumber.value !== '0'){
            alert('Admin không được chọn phòng')
            location.reload();
            return
            }
            else{
            database.push({
                name:name.value,
                password:'admin123',
                floor:'0',
                room:'0',
            });}
        }
        else{
        database.push({
            name:name.value,
            password:password.value,
            floor:floor.value,
            room:roomNumber.value,
        });
    }
    localStorage.setItem('database',JSON.stringify(database));
    alert('Đăng kí thành công');
    window.location.href='index.html';
    }
    name.value = "";
    password.value = "";
    passwordConfirm.value = "";
})