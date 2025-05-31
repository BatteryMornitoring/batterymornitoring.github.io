let name = document.getElementById('nameId');
let password = document.getElementById('passwordId');
let form2 = document.getElementById('signinForm');

let database = JSON.parse(localStorage.getItem('database'))||[];

form2.addEventListener('submit',(e)=>{
    e.preventDefault();
    if(name.value==='' || password.value ===''){
        alert('Vui lòng điền đầy đủ thông tin.')
    }
    else{
        let user = database.filter((user)=> user.name===name.value && user.password===password.value )
        if(user.length === 1){
            localStorage.setItem("currentUser", JSON.stringify(user[0]));
            if(user[0].password === 'admin123'){
                window.location.href = "admin.html";
                }
                else{
                window.location.href = "user.html";
                }
        }
        else{
            alert('Tài khoản không tồn tại')
        }
    }
    name.value ='';
    password.value='';
})
