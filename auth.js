/**
 * CEP Authentication & User Data Storage
 * Xử lý Đăng ký, Đăng nhập và Lưu dữ liệu người dùng vào Firebase Firestore
 */

// 1. Cấu hình Firebase từ dự án của bạn
const firebaseConfig = {
  apiKey: "AIzaSyCAb5DJd-xcSn6Mol9Fg2S7jdgr2O4W4PQ",
  authDomain: "ccep-54f4d.firebaseapp.com",
  projectId: "ccep-54f4d",
  storageBucket: "ccep-54f4d.firebasestorage.app",
  messagingSenderId: "654325866248",
  appId: "1:654325866248:web:1a5aafe9329ab72f3f96bd",
  measurementId: "G-3CS7F81C28"
};

// Khởi tạo Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

let currentUserData = null;

// 2. Hàm Đăng ký và Lưu dữ liệu người dùng
function doRegister() {
    var name = document.getElementById('regFullname').value.trim();
    var email = document.getElementById('regEmail').value.trim();
    var phone = document.getElementById('regPhone').value.trim();
    var pwd = document.getElementById('regPassword').value;
    var conf = document.getElementById('regConfirm').value;
    var role = document.getElementById('regRole').value;
    var terms = document.getElementById('regTerms').checked;

    if(!name || !email || !pwd || !conf) return toast('errFill', 'error');
    if(pwd.length < 8) return toast('errPwdShort', 'error');
    if(pwd !== conf) return toast('errPwdMatch', 'error');
    if(!terms) return toast('errTerms', 'error');

    // Bước A: Tạo tài khoản xác thực (Firebase Auth)
    auth.createUserWithEmailAndPassword(email, pwd)
    .then((userCredential) => {
        var user = userCredential.user;
        
        // Gửi link xác thực email thật
        user.sendEmailVerification(); 
        
        // Bước B: Lưu toàn bộ cấu trúc dữ liệu hồ sơ vào Firestore
        return db.collection('users').doc(user.uid).set({
            fullname   : name,
            email      : email,
            phone      : phone      || '',
            role       : role       || 'student',
            avatar     : '',
            bio        : '',
            location   : '',
            website    : '',
            occupation : '',
            dob        : '',
            gender     : 'male',
            facebook   : '',
            education  : '',
            experience : '',
            skills     : '',
            createdAt  : firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt  : firebase.firestore.FieldValue.serverTimestamp()
        });
    })
    .then(() => {
        toast('toastRegOk', 'success');
        document.getElementById('loginEmail').value = email;
        // Tạm thoát để bắt người dùng xác nhận Email trước khi dùng web
        auth.signOut();
        showPage('page-login');
    })
    .catch((error) => {
        toast('Lỗi đăng ký: ' + error.message, 'error');
    });
}

// 3. Hàm Đăng nhập
function doLogin() {
    var email = document.getElementById('loginEmail').value.trim();
    var pwd = document.getElementById('loginPassword').value;

    if(!email || !pwd) return toast('errFill', 'error');

    auth.signInWithEmailAndPassword(email, pwd)
    .then((userCredential) => {
        var user = userCredential.user;
        // Kiểm tra xem email đã xác thực chưa
        if (!user.emailVerified) {
            toast('⚠️ Tài khoản chưa kích hoạt! Vui lòng vào Email (thư rác) bấm link xác nhận.', 'error');
            auth.signOut();
        } else {
            toast('toastLoginOk', 'success');
            showPage('page-home');
        }
    })
    .catch((error) => {
        toast('❌ Email hoặc mật khẩu không chính xác!', 'error');
    });
}

// 4. Hàm Lưu chỉnh sửa hồ sơ
function saveProfile() {
    if(!auth.currentUser) return;

    var data = {
        fullname: document.getElementById('eFn').value.trim(),
        phone: document.getElementById('ePh').value.trim(),
        occupation: document.getElementById('eOc').value.trim(),
        location: document.getElementById('eLc').value.trim(),
        website: document.getElementById('eWb').value.trim(),
        bio: document.getElementById('eBi').value.trim(),
        role: document.getElementById('eRl').value,
        dob: document.getElementById('eDob').value,
        gender: document.getElementById('eGen').value,
        facebook: document.getElementById('eFb').value.trim(),
        education: document.getElementById('eEdu').value.trim(),
        experience: document.getElementById('eExp').value.trim(),
        skills: document.getElementById('eSkills').value.trim(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if(!data.fullname) return toast('errNameEmpty', 'error');
    if(typeof tempAvatar !== 'undefined' && tempAvatar) data.avatar = tempAvatar;

    // Cập nhật dữ liệu lên Firestore
    db.collection('users').doc(auth.currentUser.uid).update(data).then(() => {
        toast('toastSaveProfile', 'success');
        currentUserData = {...currentUserData, ...data};
        toggleEdit();
        renderProfile();
        auth.onAuthStateChanged(auth.currentUser); 
    }).catch((error) => {
        toast('Lỗi cập nhật: ' + error.message, 'error');
    });
}

// 5. Theo dõi trạng thái đăng nhập để lấy dữ liệu từ Firestore
auth.onAuthStateChanged((user) => {
    var authArea = document.getElementById('homeAuthArea');
    var userBar = document.getElementById('homeUserBar');
    var smLogin = document.getElementById('smLoginLink');
    var smReg = document.getElementById('smRegLink');
    var smProf = document.getElementById('smProfileLink');
    var smSet = document.getElementById('smSettingsLink');

    if (user && user.emailVerified) {
        // Lấy dữ liệu hồ sơ từ bộ sưu tập 'users' trên Firestore
        db.collection('users').doc(user.uid).get().then((doc) => {
            if(doc.exists) {
                currentUserData = doc.data();
                var displayName = currentUserData.fullname.split(' ')[0];
                
                if(authArea) authArea.innerHTML = `<button class="btn-hlogin" onclick="showPage('page-profile')">👤 ${displayName}</button>`;
                if(userBar) userBar.style.display = 'block';
                
                if(document.getElementById('hubName')) {
                    document.getElementById('hubName').innerText = (t('welcomeBack') || 'Chào mừng,') + ' ' + currentUserData.fullname + '!';
                }
                
                if(smLogin) smLogin.style.display = 'none';
                if(smReg) smReg.style.display = 'none';
                if(smProf) smProf.style.display = 'flex';
                if(smSet) smSet.style.display = 'flex';
                
                if(document.getElementById('page-profile').classList.contains('active')) {
                    renderProfile();
                }
            }
        });
    } else {
        currentUserData = null;
        if(authArea) authArea.innerHTML = '<button class="btn-hlogin" onclick="showPage(\'page-login\')">Đăng nhập</button><button class="btn-hreg" onclick="showPage(\'page-register\')">Đăng ký</button>';
        if(userBar) userBar.style.display = 'none';
    }
});

function doLogout() {
    if(!confirm(t('confirmLogout'))) return;
    auth.signOut().then(() => {
        currentUserData = null;
        toast('🚪 Đã đăng xuất', 'success');
        showPage('page-login');
    });
}
