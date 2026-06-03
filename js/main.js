// 导航栏汉堡菜单切换
document.addEventListener('DOMContentLoaded', function() {
    // 创建汉堡菜单按钮
    const navContainer = document.querySelector('.nav-container');
    if (navContainer && !document.querySelector('.hamburger')) {
        const hamburgerBtn = document.createElement('div');
        hamburgerBtn.className = 'hamburger';
        hamburgerBtn.innerHTML = '<span class="bar"></span><span class="bar"></span><span class="bar"></span>';
        navContainer.appendChild(hamburgerBtn);

        // 汉堡菜单点击事件
        hamburgerBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            document.querySelector('.nav-menu').classList.toggle('active');
        });
    }
});

// 点击导航链接后关闭菜单
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.nav-menu a').forEach(function(link) {
        link.addEventListener('click', function() {
            const hamburger = document.querySelector('.hamburger');
            const navMenu = document.querySelector('.nav-menu');
            if (hamburger && navMenu) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    });
});

// 平滑滚动到锚点
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// 页面滚动效果
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // 导航栏滚动效果
    if (scrollTop > 100) {
        navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
        navbar.style.background = 'rgba(255,255,255,0.95)';
    } else {
        navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)';
        navbar.style.background = 'white';
    }
});

// 页面加载动画
document.addEventListener('DOMContentLoaded', function() {
    // 为项目卡片添加延迟动画
    const projectItems = document.querySelectorAll('.project-item');
    projectItems.forEach(function(item, index) {
        item.style.opacity = '0';
        item.style.transform = 'translateY(30px)';
        item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

        setTimeout(function() {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, index * 100);
    });

    // 添加页面加载完成类
    document.body.classList.add('loaded');
});

// 返回顶部按钮
document.addEventListener('DOMContentLoaded', function() {
    const button = document.createElement('button');
    button.innerHTML = '↑';
    button.className = 'back-to-top';
    button.style.cssText = 'position:fixed;bottom:30px;right:30px;width:50px;height:50px;background:#165DFF;color:white;border:none;border-radius:50%;cursor:pointer;opacity:0;visibility:hidden;transition:all 0.3s ease;z-index:1000;font-size:20px;box-shadow:0 4px 12px rgba(0,0,0,0.15);';
    document.body.appendChild(button);

    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            button.style.opacity = '1';
            button.style.visibility = 'visible';
        } else {
            button.style.opacity = '0';
            button.style.visibility = 'hidden';
        }
    });

    button.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});

// 表单验证
document.addEventListener('DOMContentLoaded', function() {
    const forms = document.querySelectorAll('form');
    forms.forEach(function(form) {
        form.addEventListener('submit', function(e) {
            const inputs = form.querySelectorAll('input, textarea');
            let isValid = true;

            inputs.forEach(function(input) {
                if (input.hasAttribute('required') && !input.value.trim()) {
                    input.style.borderColor = '#EF4444';
                    isValid = false;
                } else {
                    input.style.borderColor = '#ddd';
                }
            });

            if (!isValid) {
                e.preventDefault();
                alert('请填写所有必填字段');
            }
        });
    });
});

// 页面访问统计
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面已加载:', window.location.pathname);
});