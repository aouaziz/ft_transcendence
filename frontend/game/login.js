import { navigateTo } from './index.js';

const wrapper = document.querySelector(".wrapper");
const signupHeader = document.querySelector(".signup header");
const loginHeader = document.querySelector(".login header");

const errorSpan = document.getElementById("error");
const signupError = document.getElementById("signup-error");
const loginError = document.getElementById("login-error");

// Signup validation elements
const signupBtn = document.getElementById('signup-btn');
const signupFullname = document.getElementById('signup-fullname');
const signupEmail = document.getElementById('signup-email');
const signupPassword = document.getElementById('signup-password');

// Login validation elements
const loginBtn = document.getElementById('login-btn');
const loginUsername = document.getElementById('username');
const loginPassword = document.getElementById('login-password');
const intra_btn = document.getElementById('input-42');


// Event listeners for switching between login and signup forms
loginHeader?.addEventListener("click", () => {
    loginError.textContent = "";
    signupFullname.value = "";
    signupEmail.value = "";
    signupPassword.value = "";
    wrapper.classList.add('active');
});

signupHeader?.addEventListener("click", () => {
    signupError.textContent = "";
    loginUsername.value = "";
    loginPassword.value = "";
    wrapper.classList.remove('active');
});

// Event listeners for buttons
signupBtn?.addEventListener('click', validateSignupForm);
loginBtn?.addEventListener('click', validateLoginForm);
intra_btn?.addEventListener('click', async (event) => {
    event.preventDefault();
    try {
        const response = await fetch('https://localhost:8443/auth/oauth/login/');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        window.location.href = data.url;
    } catch (error) {
        console.error("error fetching login url", error);
    }
});

async function validateSignupForm() {
    const fullName = signupFullname.value.trim();
    const email = signupEmail.value.trim();
    const password = signupPassword.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Check if the full name is empty
    if (!fullName) {
        signupError.innerHTML = "Full name cannot be empty.";
        return false;
    }

    // Check if the email is empty or invalid
    if (!email) {
        signupError.innerHTML = "Email address cannot be empty.";
        return false;
    } else if (!emailRegex.test(email)) {
        signupError.innerHTML = "Please enter a valid email address.";
        return false;
    }

    // Check for password validity
    const passwordErrors = [];
    if (!password) {
        passwordErrors.push("- Password cannot be empty.");
    } else {
        if (password.length < 8) passwordErrors.push("- Password must be at least 8 characters long.");
        if (!/[A-Z]/.test(password)) passwordErrors.push("- Password must contain at least one uppercase letter.");
        if (!/[!@#$%^&*()]/.test(password)) passwordErrors.push("- Password must contain at least one special character (!@#$%^&*()).");
    }

    if (passwordErrors.length > 0) {
        signupError.innerHTML = passwordErrors.join("<br>");
        return false;
    }

    signupError.innerHTML = "";

    try {
        const response = await fetch('https://localhost:8443/api/auth/user/create/', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: fullName,
                email: email,
                password: password,
            }),
        });

        const data = await response.json();
        console.log("Server response:", data);

        if (response.ok) {
            signupError.innerHTML = "";
            console.log('Sign up successful:', data);
            handleSuccessfulAuth(data.tokens, fullName);
        } else {
            if (data.errors) {
                showAccountExistsModal("Already have an account? Please log in.");
            } else {
                signupError.innerHTML = "An error occurred. Please try again.";
            }
        }
    } catch (error) {
        console.error('Error signing up:', error);
        signupError.innerHTML = "Unable to connect to the server.";
    }

    return false;
}

function showAccountExistsModal(message) {
    document.getElementById("modalMessage").innerText = message;

    document.getElementById("accountExistsModal").style.display = "block";

    setTimeout(function () {
        document.getElementById("accountExistsModal").style.display = "none";
    }, 3000); 
}

// Close the modal when the close button is clicked
document.getElementById("closeModal").onclick = function () {
    document.getElementById("accountExistsModal").style.display = "none";
}

// Close the modal if the user clicks outside of it
window.onclick = function (event) {
    if (event.target === document.getElementById("accountExistsModal")) {
        document.getElementById("accountExistsModal").style.display = "none";
    }
}


async function validateLoginForm() {
    const username = loginUsername.value.trim();
    const password = loginPassword.value;

    if (!username) {
        loginError.textContent = "Username cannot be empty.";
        return false;
    }

    if (!password) {
        loginError.textContent = "Password cannot be empty.";
        return false;
    }

    loginError.textContent = ""; 
    try {
        const response = await fetch('https://localhost:8443/api/auth/user/login/', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password,
            }),
        });

        if (!response.ok) {
            const contentType = response.headers.get('Content-Type');
            let data;
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                throw new Error("Unexpected response format");
            }

            // Handle specific errors based on the status code
            if (response.status === 401) {
                loginError.textContent = "Invalid username or password.";
            } else if (response.status === 500) {
                loginError.textContent = "An error occurred. Please try again later.";
            } else {
                loginError.textContent = data.message || "An error occurred. Please try again.";
            }
            return;
        }

        const data = await response.json();
        if (data.tokens) {
            console.log("Login successful:", data);
            handleSuccessfulAuth(data.tokens, username);
        } else if (data.requires_2fa) {
            loginError.textContent = "";
            show2FAPopup(username, password);
        }

    } catch (error) {
        console.error('Error logging in:', error);
        loginError.textContent = "Unable to connect to the server. Please check your connection.";
    }
}


function handleSuccessfulAuth(tokens, username){
     document.cookie = `access_token=${tokens.access_token}; path=/; SameSite=Lax;`;
        document.cookie = `refresh_token=${tokens.refresh_token}; path=/;  SameSite=Lax;`;
        document.cookie = `username=${username}; path=/;  SameSite=Lax;`;
        document.cookie = `isLoggedIn=true; path=/;  SameSite=Lax;`;
          navigateTo('/Home');
}


function show2FAPopup(username, password) {
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
                z-index: 1000;`;


            const modalContent = document.createElement('div');
           modalContent.classList.add('modal-content');
           modalContent.style.cssText = `
               background: #fff;
               padding: 20px;
               border-radius: 8px;
               max-width: 400px;
               text-align: center;`;

          const codeLabel = document.createElement('label');
            codeLabel.textContent = 'Enter 2FA Code:';
              const codeInput = document.createElement('input');
            codeInput.type = 'text';
            codeInput.style.width = '100%';
           codeInput.style.padding = '10px';
            codeInput.style.marginBottom = '10px';
            codeInput.style.boxSizing = 'border-box';
           codeInput.style.borderRadius = '4px';
            const error2FA = document.createElement('div');
           error2FA.id = 'error2FA'
            error2FA.style.color = 'red';
           error2FA.style.display = 'flex';
            error2FA.style.justifyContent = 'center'

          const submitBtn = document.createElement('button');
           submitBtn.textContent = "Submit 2FA code";
            submitBtn.style.backgroundColor = '#007bff';
           submitBtn.style.color = 'white';
            submitBtn.style.border = 'none';
            submitBtn.style.padding = '10px 15px';
           submitBtn.style.borderRadius = '4px';
            submitBtn.style.cursor = 'pointer';

            submitBtn.addEventListener('click', async () => {
               const twoFactorCode = codeInput.value;
                  if (!twoFactorCode) {
                      error2FA.textContent = 'please provide a 2FA code';
                     return
                 }

               try {
                    const response = await fetch('https://localhost:8443/api/auth/user/login/', {
                         method: 'POST',
                       credentials: 'include',
                       headers: {
                         'Content-Type': 'application/json',
                        },
                         body: JSON.stringify({
                             username: username,
                            password: password,
                            two_factor_code: twoFactorCode
                        }),
                   });
                   
                    const data = await response.json();

                  if (response.ok && data.tokens) {
                       console.log("Login successful:", data);
                       handleSuccessfulAuth(data.tokens, username);
                       modal.remove();
                    } else {
                        error2FA.textContent = data.error || "Invalid 2FA code.";  
                    }
               } catch (error) {
                   console.error('Error logging in with 2fa:', error);
                    error2FA.textContent = "Unable to connect to the server."; 

             }

          });

         modalContent.appendChild(codeLabel);
         modalContent.appendChild(codeInput);
         modalContent.appendChild(error2FA);
           modalContent.appendChild(submitBtn);
        modal.appendChild(modalContent);
       document.body.appendChild(modal);

    }
export{
  validateLoginForm
}