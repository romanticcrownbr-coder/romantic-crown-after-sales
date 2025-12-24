document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('serviceForm');
    const descInput = document.getElementById('description');
    const charCount = document.getElementById('current-count');
    const submitBtn = form.querySelector('.submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');

    // Validation patterns
    const patterns = {
        name: /^[a-zA-Z\u4e00-\u9fa5\s]{2,50}$/,
        phone: /^1[3-9]\d{9}$/,
        email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        order_number: /^[a-zA-Z0-9-]{5,30}$/,
        description: /^[\s\S]{10,1000}$/,
        purchase_date: /.+/ // Simple check for date
    };

    const errorMessages = {
        name: '请输入有效的姓名（2-50个字符）',
        phone: '请输入有效的手机号码',
        email: '请输入有效的电子邮箱',
        order_number: '请输入有效的订单编号',
        description: '问题描述需在10-1000字之间',
        purchase_date: '请选择购买日期'
    };

    // Character counter
    if (descInput && charCount) {
        descInput.addEventListener('input', function() {
            const length = this.value.length;
            charCount.textContent = length;
            if (length > 1000) {
                charCount.classList.add('text-red-500');
            } else {
                charCount.classList.remove('text-red-500');
            }
            validateField(this);
        });
    }

    // Real-time validation
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        if (input.name === 'bot-field' || input.type === 'hidden' || input.name === 'problem_type') return;
        
        input.addEventListener('blur', () => {
            validateField(input);
        });

        input.addEventListener('input', () => {
            // Clear error when typing
            const formGroup = input.closest('.form-group');
            if (formGroup && formGroup.classList.contains('error')) {
                validateField(input);
            }
        });
    });

    function validateField(input) {
        // Skip validation if the element is hidden
        if (input.offsetParent === null) return true;

        const fieldName = input.name;
        const value = input.value.trim();
        const pattern = patterns[fieldName];
        const errorSpan = document.getElementById(getErrorId(fieldName));
        const formGroup = input.closest('.form-group');

        if (!pattern || !formGroup) return true;

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
            case 'name': return 'name-error';
            case 'phone': return 'phone-error';
            case 'email': return 'email-error';
            case 'order_number': return 'order-error';
            case 'description': return 'desc-error';
            case 'purchase_date': return 'date-error';
            default: return '';
        }
    }

    // Form submission
    form.addEventListener('submit', (e) => {
        let isValid = true;
        
        // Validate inputs
        inputs.forEach(input => {
            if (input.name === 'bot-field' || input.type === 'hidden' || input.name === 'service_type') return;
            if (!validateField(input)) {
                isValid = false;
            }
        });

        // Validate radio buttons (Service Type)
        const radioButtons = form.querySelectorAll('input[name="service_type"]');
        let radioChecked = false;
        radioButtons.forEach(radio => {
            if (radio.checked) radioChecked = true;
        });
        
        // Note: Radio validation visual feedback is tricky with custom UI, 
        // relying on browser 'required' attribute mostly, or we could add custom logic here.

        if (!isValid) {
            e.preventDefault();
            return;
        }

        // Show loading state
        if (submitBtn) {
            submitBtn.disabled = true;
            if (btnText) btnText.classList.add('hidden');
            if (btnLoading) btnLoading.classList.remove('hidden');
        }
        
        // Allow default form submission to Netlify
    });
});
