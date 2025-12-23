document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('serviceForm');
    const descInput = document.getElementById('issue_description');
    const charCount = document.getElementById('current-count');
    const submitBtn = form.querySelector('.submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');

    // Validation patterns
    const patterns = {
        customer_name: /^[a-zA-Z\u4e00-\u9fa5\s]{2,50}$/,
        phone: /^1[3-9]\d{9}$/,
        email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        order_id: /^[a-zA-Z0-9-]{5,30}$/,
        issue_description: /^[\s\S]{10,1000}$/
    };

    const errorMessages = {
        customer_name: '请输入有效的姓名（2-50个字符）',
        phone: '请输入有效的手机号码',
        email: '请输入有效的电子邮箱',
        order_id: '请输入有效的订单编号',
        issue_description: '问题描述需在10-1000字之间'
    };

    // Character counter
    descInput.addEventListener('input', function() {
        const length = this.value.length;
        charCount.textContent = length;
        if (length > 1000) {
            charCount.style.color = 'var(--color-error)';
        } else {
            charCount.style.color = 'var(--color-text-secondary)';
        }
        validateField(this);
    });

    // Real-time validation
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        if (input.name === 'bot-field' || input.type === 'hidden') return;
        
        input.addEventListener('blur', () => {
            validateField(input);
        });

        input.addEventListener('input', () => {
            // Clear error when typing
            if (input.parentElement.classList.contains('error')) {
                validateField(input);
            }
        });
    });

    function validateField(input) {
        const fieldName = input.name;
        const value = input.value.trim();
        const pattern = patterns[fieldName];
        const errorSpan = document.getElementById(getErrorId(fieldName));
        const formGroup = input.parentElement;

        if (!pattern) return true;

        if (!pattern.test(value)) {
            formGroup.classList.add('error');
            if (errorSpan) errorSpan.textContent = errorMessages[fieldName];
            return false;
        } else {
            formGroup.classList.remove('error');
            if (errorSpan) errorSpan.textContent = '';
            return true;
        }
    }

    function getErrorId(fieldName) {
        switch(fieldName) {
            case 'customer_name': return 'name-error';
            case 'contact_info': return 'contact-error';
            case 'order_id': return 'order-error';
            case 'product_name': return 'product-error';
            case 'issue_description': return 'desc-error';
            default: return '';
        }
    }

    // Form submission
    form.addEventListener('submit', (e) => {
        // Netlify Forms handles the submission, but we want to validate first
        // If JS is disabled, browser validation works.
        // With JS, we can show custom UI.
        
        let isValid = true;
        inputs.forEach(input => {
            if (input.name === 'bot-field' || input.type === 'hidden') return;
            if (!validateField(input)) {
                isValid = false;
            }
        });

        if (!isValid) {
            e.preventDefault();
            // Shake animation or scroll to first error could be added here
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        btnText.classList.add('hidden');
        btnLoading.classList.remove('hidden');

        // Allow default form submission to Netlify
    });
});
