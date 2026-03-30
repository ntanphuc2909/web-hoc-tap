/**
 * CEP Settings
 * Quản lý Giao diện (Sáng/Tối) và Ngôn ngữ trên thiết bị của người dùng
 */

var CEP_SETTINGS = (function () {
    var STORAGE_KEY = 'cep_settings';

    var defaults = {
        theme    : 'light',
        language : 'vi'
    };

    function load() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            return raw ? Object.assign({}, defaults, JSON.parse(raw)) : defaults;
        } catch (e) { return defaults; }
    }

    function save(settings) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); }
        catch (e) { console.error('Lỗi lưu cài đặt:', e); }
    }

    function setTheme(theme) {
        var s = load();
        s.theme = theme;
        save(s);
        applyTheme(theme);
    }

    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }

    /* Tự động áp dụng theme khi tải trang */
    function init() { applyTheme(load().theme); }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { 
        load: load, 
        save: save, 
        setTheme: setTheme, 
        applyTheme: applyTheme 
    };
})();
