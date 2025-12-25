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
        name: 'Por favor, insira um nome válido (2-50 caracteres)',
        phone: 'Por favor, insira um número de telefone válido',
        email: 'Por favor, insira um e-mail válido',
        order_number: 'Por favor, insira um número de pedido válido',
        description: 'A descrição do problema deve ter entre 10 e 1000 caracteres',
        purchase_date: 'Por favor, selecione a data da compra'
    };

    // Service Type & Description Visibility Logic
    const descSection = document.getElementById('description-section');
    
    function toggleDescription() {
        const serviceRadios = form.querySelectorAll('input[name="service_type"]');
        let selectedValue = null;
        serviceRadios.forEach(radio => {
            if (radio.checked) selectedValue = radio.value;
        });

        if (!descSection) return;

        // Only show description for 'claim' and 'support'
        if (selectedValue === 'claim' || selectedValue === 'support') {
            descSection.classList.remove('hidden');
            descSection.classList.add('animate-fade-in');
            if(descInput) descInput.setAttribute('required', '');
        } else {
            // Hide for 'register' or no selection
            descSection.classList.add('hidden');
            descSection.classList.remove('animate-fade-in');
            if(descInput) descInput.removeAttribute('required');
            
            // Clear validation state
            if(descInput) {
                const formGroup = descInput.closest('.form-group');
                if (formGroup) formGroup.classList.remove('error');
            }
            const errorSpan = document.getElementById('desc-error');
            if (errorSpan) errorSpan.textContent = '';
        }
    }

    // Attach listeners immediately
    const serviceRadios = form.querySelectorAll('input[name="service_type"]');
    serviceRadios.forEach(radio => {
        radio.addEventListener('change', toggleDescription);
    });

    // Initialize state on load
    toggleDescription();

    // Initialize Flatpickr for date input
    flatpickr("#purchase_date", {
        locale: "pt",
        dateFormat: "d/m/Y",
        disableMobile: false, // Force custom picker on mobile for consistent Portuguese experience
        allowInput: true, // Allow manual typing if needed
        maxDate: "today"
    });

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
        // Handle native validation message (browser tooltip)
        input.addEventListener('invalid', function() {
            if (this.validity.valueMissing) {
                this.setCustomValidity('Por favor, preencha este campo.');
            } else if (this.validity.typeMismatch) {
                if (this.type === 'email') {
                    this.setCustomValidity('Por favor, insira um endereço de e-mail válido.');
                } else if (this.type === 'url') {
                    this.setCustomValidity('Por favor, insira uma URL válida.');
                } else {
                    this.setCustomValidity('Por favor, insira um valor válido.');
                }
            } else if (this.validity.patternMismatch) {
                this.setCustomValidity('Por favor, siga o formato solicitado.');
            } else {
                this.setCustomValidity('');
            }
        });

        // Clear custom validity on input
        input.addEventListener('input', function() {
            this.setCustomValidity('');
        });

        if (input.name === 'bot-field' || input.type === 'hidden' || input.name === 'service_type') return;
        
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

    // Step 1: Pre-submit button click -> Validate -> Open Captcha Modal
    if (preSubmitBtn) {
        preSubmitBtn.addEventListener('click', () => {
            let isValid = true;
            
            // Validate inputs
            const inputs = form.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                if (input.name === 'bot-field' || input.type === 'hidden' || input.name === 'service_type') return;
                // Skip validation for inputs inside the captcha modal (like checkbox hacks if any, though reCAPTCHA is iframe)
                if (captchaModalOverlay.contains(input)) return; 
                
                if (!validateField(input)) {
                    isValid = false;
                }
            });

            // Validate radio buttons
            const radioButtons = form.querySelectorAll('input[name="service_type"]');
            let radioChecked = false;
            radioButtons.forEach(radio => {
                if (radio.checked) radioChecked = true;
            });
            
            // Trigger native validation report if needed, or focus first error
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            if (!isValid) {
                // Focus first error
                const firstError = form.querySelector('.form-group.error input, .form-group.error textarea');
                if (firstError) firstError.focus();
                return;
            }

            // Client-side Duplicate Check
            const formData = new FormData(form);
            const orderNumber = formData.get('order_number').trim();
            const submittedOrders = JSON.parse(localStorage.getItem('submitted_orders') || '[]');
            if (submittedOrders.includes(orderNumber)) {
                alert('Atenção: Este número de pedido já foi enviado anteriormente. Se precisar de nova assistência, entre em contato direto por e-mail.');
                return;
            }

            // If all valid, open Captcha Modal
            captchaModalOverlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        });
    }

    // Step 2: Handle Cancel in Modal
    if (cancelCaptchaBtn) {
        cancelCaptchaBtn.addEventListener('click', () => {
            captchaModalOverlay.classList.add('hidden');
            document.body.style.overflow = '';
        });
    }

    // Step 3: Final Submission (Triggered by 'Confirmar' button inside form)
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const orderNumber = formData.get('order_number').trim();
        const submittedOrders = JSON.parse(localStorage.getItem('submitted_orders') || '[]');

        // 2. Simple Client-side Captcha Check
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            const captchaResponse = formData.get('g-recaptcha-response');
            if (captchaResponse === "") {
                alert('Por favor, confirme que você não é um robô.');
                return;
            }
        }

        // Show loading state on final button
        if (finalSubmitBtn) {
            finalSubmitBtn.disabled = true;
            if (btnLoading) btnLoading.classList.remove('hidden');
        }
        
        // Submit to Netlify via AJAX
        fetch('/', {
            method: 'POST',
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams(formData).toString()
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            // Save order number to local storage
            submittedOrders.push(orderNumber);
            localStorage.setItem('submitted_orders', JSON.stringify(submittedOrders));
            
            // Close Captcha Modal
            captchaModalOverlay.classList.add('hidden');
            document.body.style.overflow = '';

            openSuccessModal();
            form.reset();
            // Reset captcha
            if (window.grecaptcha) {
                window.grecaptcha.reset();
            }
            if (descSection) descSection.classList.add('hidden');
            if (charCount) charCount.textContent = '0';
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Erro ao enviar o formulário. Por favor, tente novamente ou entre em contato conosco.');
        })
        .finally(() => {
            // Reset loading state
            if (finalSubmitBtn) {
                finalSubmitBtn.disabled = false;
                if (btnLoading) btnLoading.classList.add('hidden');
            }
        });
    });

    // Success Modal Logic
    const successModal = document.getElementById('success-modal');
    const closeSuccessBtn = document.getElementById('close-success-btn');
    const successModalBackdrop = document.getElementById('success-modal-backdrop');

    function openSuccessModal() {
        if (successModal) {
            successModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeSuccessModal() {
        if (successModal) {
            successModal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }

    if (closeSuccessBtn) closeSuccessBtn.addEventListener('click', closeSuccessModal);
    if (successModalBackdrop) successModalBackdrop.addEventListener('click', closeSuccessModal);

    // Terms Modal Logic
    const termsLink = document.getElementById('terms-link');
    const termsModal = document.getElementById('terms-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const closeModalFooterBtn = document.getElementById('close-modal-footer-btn');
    const modalBackdrop = document.getElementById('modal-backdrop');

    if (termsLink && termsModal) {
        function openModal(e) {
            e.preventDefault();
            termsModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Prevent scrolling background
        }

        function closeModal() {
            termsModal.classList.add('hidden');
            document.body.style.overflow = ''; // Restore scrolling
        }

        termsLink.addEventListener('click', openModal);
        
        if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
        if (closeModalFooterBtn) closeModalFooterBtn.addEventListener('click', closeModal);
        if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !termsModal.classList.contains('hidden')) {
                closeModal();
            }
        });
    }

    // Privacy Modal Logic
    const privacyLink = document.getElementById('privacy-link');
    const privacyModal = document.getElementById('privacy-modal');
    const closePrivacyBtn = document.getElementById('close-privacy-btn');
    const closePrivacyFooterBtn = document.getElementById('close-privacy-footer-btn');
    const privacyModalBackdrop = document.getElementById('privacy-modal-backdrop');

    if (privacyLink && privacyModal) {
        function openPrivacyModal(e) {
            e.preventDefault();
            privacyModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }

        function closePrivacyModal() {
            privacyModal.classList.add('hidden');
            document.body.style.overflow = '';
        }

        privacyLink.addEventListener('click', openPrivacyModal);
        
        if (closePrivacyBtn) closePrivacyBtn.addEventListener('click', closePrivacyModal);
        if (closePrivacyFooterBtn) closePrivacyFooterBtn.addEventListener('click', closePrivacyModal);
        if (privacyModalBackdrop) privacyModalBackdrop.addEventListener('click', closePrivacyModal);

        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !privacyModal.classList.contains('hidden')) {
                closePrivacyModal();
            }
        });
    }
});
