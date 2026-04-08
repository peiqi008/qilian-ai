// 导航栏滚动效果
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 4px 20px rgba(51, 181, 255, 0.2)';
        navbar.style.padding = '5px 0';
    } else {
        navbar.style.boxShadow = '0 4px 20px rgba(51, 181, 255, 0.15)';
        navbar.style.padding = '15px 0';
    }
});

// 移动端汉堡菜单
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// 平滑滚动
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// 回到顶部按钮
const backToTop = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        backToTop.classList.add('active');
    } else {
        backToTop.classList.remove('active');
    }
});

backToTop.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// ==================== 核心：精准IP定位 + 中文城市显示 ====================
function getLocationByIP() {
    const cityTag = document.getElementById('cityTag');
    cityTag.textContent = "定位中...";

    // 方案1：淘宝IP接口（国内最准，免费，返回中文）
    fetch('https://ip.taobao.com/outGetIpInfo?accessKey=alibaba-inc')
        .then(res => res.json())
        .then(data => {
            if (data.code === 0 && data.data && data.data.city) {
                // 直接返回中文城市名，比如：湛江市 → 提取"湛江"
                let city = data.data.city.replace('市', '');
                cityTag.textContent = city;
                return;
            }
            throw new Error('淘宝接口失败');
        })
        .catch(() => {
            // 方案2：备用：高德IP接口（同样精准，中文返回）
            fetch('https://restapi.amap.com/v3/ip?key=789cb0d354b2e53f24e4a869ac8fbd4d&output=json')
                .then(res => res.json())
                .then(data => {
                    if (data.status === '1' && data.city) {
                        let city = data.city.replace('市', '');
                        cityTag.textContent = city;
                        return;
                    }
                    throw new Error('高德接口失败');
                })
                .catch(() => {
                    // 双接口都失败，兜底显示「本地」，避免错误
                    cityTag.textContent = "本地";
                });
        });
}

// 页面加载时执行
getLocationByIP();

// 表单提交处理
const contactForm = document.getElementById('contact-form');
contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData);

    // 基础前端验证
    if (!data.industry || !data.phone) {
        alert('请填写必填项（行业、联系电话）');
        return;
    }

    // 手机号简单验证
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(data.phone)) {
        alert('请输入正确的手机号');
        return;
    }

    try {
        const response = await fetch('/api/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (result.success) {
            alert('提交成功！我们会尽快联系您');
            contactForm.reset();
        } else {
            alert('提交失败，请稍后重试');
        }
    } catch (error) {
        console.error('提交错误:', error);
        alert('网络错误，请检查网络后重试');
    }
});

// 滚动动画触发
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animationPlayState = 'running';
        }
    });
}, observerOptions);

// 监听所有动画元素
document.querySelectorAll('[class*="animate-"]').forEach(el => {
    el.style.animationPlayState = 'paused';
    observer.observe(el);
});