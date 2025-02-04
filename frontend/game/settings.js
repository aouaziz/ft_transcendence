import { navigateTo } from './index.js';

export async function loadSettings() {
    const settingsContainer = document.querySelector('.settings');
    if (!settingsContainer) return; 
    const sections = document.querySelectorAll('.settings-section');
    const listItems = document.querySelectorAll('.settings-menu-item');
    const usernameInput = document.getElementById('usernameInput');
    const emailInput = document.getElementById('emailInput');
    const userProfileImg = document.getElementById('userProfileImg');
    const userDisplayName = document.getElementById('userDisplayName');
    const profileImageInput = document.getElementById('profileImageInput');
    const currentPasswordInput = document.getElementById('currentPasswordInput');
    const newPasswordInput = document.getElementById('newPasswordInput');
    const confirmPasswordInput = document.getElementById('confirmPasswordInput');
    const passwordSettingsDiv = document.getElementById('passwordSettings');
    const passwordForm = passwordSettingsDiv ? passwordSettingsDiv.querySelector('form') : null; 
    const generalForm = document.getElementById('generalSettings')?.querySelector('form');
    const logoutButton = document.querySelector('.logout-button');
    const twoFactorToggle = document.querySelector('.switch input[type="checkbox"]');
    const twoFactorContainer = document.querySelector('.jwt-toggle-container');
    let is2FAEnabled = false;
    let isOauthUser = null;
    const usernameError = document.getElementById('username-error');
    const emailError = document.getElementById('email-error');
    const currentPasswordError = document.getElementById('current-password-error');
    const newPasswordError = document.getElementById('new-password-error');
    const confirmPasswordError = document.getElementById('confirm-password-error');
    const generalSubmitBtn = generalForm?.querySelector('button[type="submit"]');
     const passwordSubmitBtn = passwordForm?.querySelector('button[type="submit"]');
    const inputsGeneral = generalForm?.querySelectorAll('input') || [];
    const inputsPassword = passwordForm?.querySelectorAll('input') || [];

    function disableForm() {
        inputsGeneral.forEach(input => {
            input.disabled = true;
        });
         inputsPassword.forEach(input => {
            input.disabled = true;
        });
        if(generalSubmitBtn) generalSubmitBtn.style.display = 'none';
         if(passwordSubmitBtn) passwordSubmitBtn.style.display = 'none';
        if(twoFactorContainer) twoFactorContainer.style.display = 'none';
        profileImageInput.disabled = true;
        twoFactorToggle.disabled = true;
        if(twoFactorToggle) twoFactorToggle.parentNode.style.pointerEvents = 'none';
    }

    function enableForm() {
        profileImageInput.disabled = false;
        twoFactorToggle.disabled = false;
       if (twoFactorToggle) twoFactorToggle.parentNode.style.pointerEvents = 'auto';
        if(generalSubmitBtn) generalSubmitBtn.style.display = 'block';
       if(passwordSubmitBtn) passwordSubmitBtn.style.display = 'block';
        if(twoFactorContainer) twoFactorContainer.style.display = 'block';
        inputsGeneral.forEach(input => {
            input.disabled = false;
        });
         inputsPassword.forEach(input => {
            input.disabled = false;
        });


    }

    //disable inputs when the function is called.
    async function fetchAndDisplayUserData() {
        isOauthUser = null; 
        disableForm() 
        try {
            const token = getCookie('access_token');
            if (!token) {
                console.error('No token found in cookies');
                navigateTo('/Login');
                return;
            }
            const response = await fetch('https://localhost:8443/api/auth/user/detail/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                usernameInput.value = data.username;
                emailInput.value = data.email;
                userDisplayName.textContent = data.username;
                userProfileImg.src = data.avatar;
                
                if (data.two_factor_enabled) {
                    twoFactorToggle.checked = true;
                    is2FAEnabled = true;
                } else {
                    twoFactorToggle.checked = false;
                    is2FAEnabled = false;
                }
                isOauthUser = data.oauth_status;

                console.log('OAuth Status:', isOauthUser);

                if (isOauthUser) {
                    usernameError.textContent = "intra users cannot update their profile .";
                    disableForm();


                } else {
                    enableForm();

                }


            }
            else {
                const errorData = await response.json();
                console.error("Failed to fetch user details", response.status, errorData);
                usernameError.textContent = "failed to get user details, please try again.";
                return;
            }
        } catch (error) {
            console.error("Error fetching user details:", error);
            usernameError.textContent = "Failed to connect to server, Please try again."
            return;
        }
    }


    function validateUsername() {
        const usernameValue = usernameInput.value.trim();
        if (!usernameValue) {
            usernameError.textContent = "Username cannot be empty.";
            return false;
        } else if (usernameValue.length > 15) {
            usernameError.textContent = "Username must be 15 characters or less.";
            return false;
        } else {
            usernameError.textContent = "";
            return true;
        }
    }
    if(usernameInput) usernameInput.addEventListener('blur', validateUsername);
    // Clear errors on input change
    if(usernameInput) usernameInput.addEventListener('input', () => usernameError.textContent = '');
     if(emailInput) emailInput.addEventListener('input', () => emailError.textContent = '');

    if(generalForm) generalForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        if (isOauthUser) {
            usernameError.textContent = "OAuth users cannot update their profile data";
            return;
        }
        if (!validateUsername()) {
            return;
        }


        const formData = new FormData();
        formData.append('username', usernameInput.value);
        formData.append('email', emailInput.value);
        try {
            const token = getCookie('access_token');
            if (!token) {
                console.error('No token found in cookies');
                navigateTo('/Login');
                return;
            }
            const response = await fetch('https://localhost:8443/api/auth/user/update/', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Failed to update user data:', errorData);
                if (errorData && errorData.username) {
                    usernameError.textContent = errorData.username[0]
                } else if (errorData && errorData.email) {
                    emailError.textContent = errorData.email[0];
                } else if (errorData && errorData.error) {
                    usernameError.textContent = errorData.error;
                } else {
                    usernameError.textContent = "An error occurred, Please try again."
                }
                return;
            }
        } catch (error) {
            console.error('Error during data update:', error);
            usernameError.textContent = "Failed to connect to server, Please try again."
        }

        if (profileImageInput.files[0]) {
            const formDataAvatar = new FormData();
            formDataAvatar.append('avatar', profileImageInput.files[0]);
            try {
                const token = getCookie('access_token');
                if (!token) {
                    console.error('No token found in cookies');
                    navigateTo('/Login');
                    return;
                }
                const response = await fetch('https://localhost:8443/api/auth/user/avatar/upload/', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formDataAvatar
                });
                if (response.ok) {
                    const data = await response.json();
                    console.log('Avatar updated successfully:', data);
                    try {
                        const token = getCookie('access_token');
                        if (!token) {
                            console.error('No token found in cookies');
                            navigateTo('/Login');
                            return;
                        }
                        const response = await fetch('https://localhost:8443/api/auth/user/avatar/fetch/', {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            },
                        });
                        if (response.ok) {
                            const avatar_data = await response.json();
                            console.log("avatar fetch success", avatar_data)
                            userProfileImg.src = avatar_data.avatar;
                            const token = getCookie('access_token');
                            const response_detail = await fetch('https://localhost:8443/api/auth/user/detail/', {
                                method: 'GET',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                }
                            });
                            if (response_detail.ok) {
                                const detail_data = await response_detail.json();
                                userDisplayName.textContent = detail_data.username;
                                document.cookie = `username=${detail_data.username}; path=/;  SameSite=Lax;`;
                                navigateTo('/Profile');
                            } else {
                                console.error("failed to get user details after changing avatar")
                            }
                        } else {
                            console.error("failed to fetch avatar after uploading");
                            userProfileImg.src = '/assets/default_avatar.jpg';
                        }
                    } catch (error) {
                        console.error('Error fetching avatar after update:', error);
                         userProfileImg.src = '/assets/default_avatar.jpg';
                    }

                } else {
                    const errorData = await response.json();
                    console.error('Failed to update avatar:', errorData);
                }
            } catch (error) {
                console.error('Error during avatar update:', error);
            }

        } else {
            const token = getCookie('access_token');
            const response_detail = await fetch('https://localhost:8443/api/auth/user/detail/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response_detail.ok) {
                const detail_data = await response_detail.json();
                userDisplayName.textContent = detail_data.username;
                document.cookie = `username=${detail_data.username}; path=/;  SameSite=Lax;`;
                navigateTo('/Profile');
            } else {
                console.error("failed to get user details after changing avatar")
            }
        }

    });
    // Clear password error on input change
   if(currentPasswordInput) currentPasswordInput.addEventListener('input', () => currentPasswordError.textContent = '');
    if(newPasswordInput) newPasswordInput.addEventListener('input', () => newPasswordError.textContent = '');
    if(confirmPasswordInput) confirmPasswordInput.addEventListener('input', () => confirmPasswordError.textContent = '');

    function showCustomModal(message) {
        const modal = document.getElementById('customModal');
        const modalMessage = document.getElementById('customModalMessage');
        modalMessage.textContent = message;
        modal.style.display = 'flex'; //Show the modal
    }

    function hideCustomModal() {
        const modal = document.getElementById('customModal');
        modal.style.display = 'none'; //Hide the modal
    }
    // Add event listener for close button only when it's available
    const closeModalButton = document.getElementById('customModalClose');
    if (closeModalButton) {
        closeModalButton.addEventListener('click', hideCustomModal);
    }
      const handlePasswordSubmit = async (event) => {
        event.preventDefault();
         if (isOauthUser) {
            currentPasswordError.textContent = "OAuth users cannot update their password";
            return;
          }
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            currentPasswordError.textContent = "Please fill in all password fields.";
            newPasswordError.textContent = "Please fill in all password fields.";
            confirmPasswordError.textContent = "Please fill in all password fields.";
            return;
        }
        if (newPassword !== confirmPassword) {
            newPasswordError.textContent = "New password and confirm password must be the same.";
            confirmPasswordError.textContent = "New password and confirm password must be the same.";
            return;
        }
        const formData = new FormData();
        formData.append('password', newPassword);
        formData.append('current_password', currentPassword);

        try {
            const token = getCookie('access_token');
            if (!token) {
                console.error('No token found in cookies');
                navigateTo('/Login');
                return;
            }
            const response = await fetch('https://localhost:8443/api/auth/user/update/', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });
             if (response.ok) {
                showCustomModal("Password changed successfully!"); 
                if (passwordForm) passwordForm.reset();
            } else {
                const errorData = await response.json();
                console.error('Failed to change password:', errorData);
                   if (errorData && errorData.current_password) {
                    currentPasswordError.textContent = "Incorrect password";
                }
                 else if (errorData && errorData.password) {
                    newPasswordError.textContent = errorData.password[0]
                     confirmPasswordError.textContent = errorData.password[0]
                } else if (errorData && errorData.error) {
                    currentPasswordError.textContent = errorData.error;
                } else {
                    currentPasswordError.textContent = "Failed to change password, Please try again.";
                }
            }
        } catch (error) {
            console.error('Error changing password:', error);
            currentPasswordError.textContent = "Failed to connect to server, Please try again.";
        }
    };
    if(passwordForm) passwordForm.addEventListener('submit', handlePasswordSubmit);
     if(profileImageInput) profileImageInput?.addEventListener('change', previewImage);

    listItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetSection = item.getAttribute('data-section');
            sections.forEach(section => {
                section.classList.add('d-none');
            });
            document.getElementById(targetSection).classList.remove('d-none');
            listItems.forEach(li => li.classList.remove('active'));
            item.classList.add('active');
        });
    });

    logoutButton.addEventListener('click', handleLogout);

    async function enable2FA() {
        if (isOauthUser) return;
        try {
            const token = getCookie('access_token');
            if (!token) {
                console.error('No token found in cookies');
                navigateTo('/Login');
                return;
            }
            const response = await fetch('https://localhost:8443/api/auth/two_factor/setup/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                show2FAPopup(data.qr_code_image, data.backup_codes);
                is2FAEnabled = true;
            } else {
                const errorData = await response.json();
                console.error('2FA setup failed:', errorData);
                showCustomModal("failed to enable 2fa");
                is2FAEnabled = false;
            }
        } catch (error) {
            console.error('Error enabling 2FA:', error);
            is2FAEnabled = false;
        }
    }

    async function disable2FA() {
        if (isOauthUser) return;
        try {
            const token = getCookie('access_token');
            if (!token) {
                console.error('No token found in cookies');
                navigateTo('/Login');
                return;
            }
            const formData = new FormData();
            formData.append('two_factor_enabled', 'false');
            const response = await fetch('https://localhost:8443/api/auth/user/update/', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            if (response.ok) {
                is2FAEnabled = false;
                showCustomModal("2FA has been disabled"); // use custom modal

            }
            else {
                const errorData = await response.json();
                console.error('disable 2fa failed:', errorData);
                showCustomModal("failed to disable 2fa");  // use custom modal
                is2FAEnabled = true;
            }
        } catch (error) {
            console.error('Error disabling 2FA:', error);
            is2FAEnabled = true;
        }
    }

    function show2FAPopup(qrCodeImage, backupCodes) {
        const modal = document.createElement('div');
        modal.classList.add('two-factor-modal');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        const modalContent = document.createElement('div');
        modalContent.classList.add('modal-content');
        modalContent.style.cssText = `
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            max-width: 400px;
            text-align: center;
             display: flex;
            flex-direction: column;
            align-items: center;
        `;

        const qrCodeContainer = document.createElement('div');
        qrCodeContainer.style.display = 'flex'; //Use flexbox for aligning
        qrCodeContainer.style.justifyContent = 'center'; 
        qrCodeContainer.style.marginBottom = '10px'; 

        const qrCodeImg = document.createElement('img');
        qrCodeImg.src = qrCodeImage;
        qrCodeImg.style.maxWidth = '200px';

        qrCodeContainer.appendChild(qrCodeImg); 


        const backupCodeTitle = document.createElement('p');
        backupCodeTitle.textContent = "Backup Codes:";
        backupCodeTitle.style.fontWeight = "bold";
        backupCodeTitle.style.marginBottom = '10px';
        const backupCodeList = document.createElement('ul');
        backupCodeList.style.listStyleType = 'none';
        backupCodeList.style.padding = '0';
        backupCodes.forEach(code => {
            const listItem = document.createElement('li');
            listItem.textContent = code;
            backupCodeList.appendChild(listItem);
        });
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.addEventListener('click', () => {
            modal.remove();
        });


        modalContent.appendChild(qrCodeContainer);
        modalContent.appendChild(backupCodeTitle);
        modalContent.appendChild(backupCodeList);
        modalContent.appendChild(closeButton)
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    }

    if(twoFactorToggle) twoFactorToggle?.addEventListener('change', async function () {
        if (isOauthUser) {
            return;
        }
        if (twoFactorToggle.checked && !is2FAEnabled) {
            await enable2FA();
        }
        else if (!twoFactorToggle.checked && is2FAEnabled) {
            await disable2FA()
        }
    });
        hideCustomModal();
    await fetchAndDisplayUserData(); 
}
document.addEventListener('DOMContentLoaded', loadSettings);

async function handleBeforeUnload() {
    try {
        const token = getCookie('access_token');
        if (token) {
            await fetch('https://localhost:8443/api/auth/user/update/status/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                }
            });
            console.log('User status updated to offline before page hidden');
        }
    } catch (error) {
        console.error('Error updating user status to offline:', error);
    }
}


async function handleLogout() {
    await handleBeforeUnload();
    try {
        const token = getCookie('access_token');
        if (!token) {
            console.error('No token found in cookies');
            navigateTo('/Login');
            return;
        }
        const response = await fetch('https://localhost:8443/api/auth/user/logout/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            document.cookie = "isLoggedIn=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            navigateTo('/Login');
        }
        else {
            console.error("failed to log out");
        }
    } catch (error) {
        console.error("Error during logout:", error);
    }
}

function previewImage(event) {
    const file = event.target.files[0];
    const userProfileImg = document.getElementById('userProfileImg');
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            userProfileImg.src = e.target.result;
        }
        reader.readAsDataURL(file);
    }
}

function getCookie(name) {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) === ' ') cookie = cookie.substring(1, cookie.length);
        const regex = new RegExp(`^${nameEQ}([^;]+)`);
        const match = cookie.match(regex);
        if (match) {
            return match[1];
        }
    }
    return null;
}