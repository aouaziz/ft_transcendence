// index.js
import { checkUserCondition } from './profile.js';
import { loadChatPage } from './chat.js';
import { loadSettings } from './settings.js';
import { loadLocalPage } from './local.js';
import { loadLocalGamePage } from './localGame.js';
import { loadOnlineGamePage ,closeWebSocket} from './OnlineGame.js';
import { loadTournamentPage } from './Tournament.js';
import { loadTournamentGamePage } from './TournamentGame.js';
import { loadTErrorPage } from './404.js';


const routes = {
    '/404': {
        htmlFile: '404.html',
        cssFile: '/game/404.css',
        jsFile: '/game/404.js',
    },
    '/Home': {
        htmlFile: 'home.html',
        cssFile: '/game/home.css',
        jsFile: '/game/home.js',
    },
    '/Login': {
        htmlFile: 'login.html',
        cssFile: '/game/login.css',
        jsFile: '/game/login.js',
    },
    '/Chat': {
        htmlFile: 'chat.html',
        cssFile: '/game/chat.css',
        jsFile: '/game/chat.js',
    },
    '/Profile': {
        htmlFile: 'profile.html',
        cssFile: '/game/profile.css',
        jsFile: '/game/profile.js',
    },
    '/Settings': {
        htmlFile: 'settings.html',
        cssFile: '/game/settings.css',
        jsFile: '/game/settings.js',
    },
    '/Local': {
        htmlFile: 'local.html',
        cssFile: '/game/local.css',
        jsFile: '/game/local.js',
    },
      '/LocalGame': {
        htmlFile: 'localGame.html',
        cssFile: '/game/localGame.css',
        jsFile: '/game/localGame.js',
    },
    '/OnlineGame': {
       htmlFile: 'OnlineGame.html',
        cssFile: '/game/OnlineGame.css',
        jsFile: '/game/OnlineGame.js',
    },
    '/Tournament': {
       htmlFile: 'Tournament.html',
        cssFile: '/game/Tournament.css',
       jsFile: '/game/Tournament.js',
    },
     '/TournamentGame': {
        htmlFile: 'TournamentGame.html',
        cssFile: '/game/localGame.css',
        jsFile: '/game/TournamentGame.js',
    },
};

async function handleRoute(path) {
    console.log("handleRoute called, current path:", path);

    const isLoggedIn = document.cookie.includes('isLoggedIn=true');

    if (!isLoggedIn) {
       if (path !== '/Login') {
            console.log("User not logged in, redirecting to Login");
           navigateTo('/Login');
        } else {
            await loadPage(path);
        }
       return;
   }

    if (path === '/') {
        console.log("User already logged in, redirecting to Home");
       navigateTo('/Home');
       return;
    }
    await loadPage(path);
}

async function loadPage(path) {
    const loadingScreen = document.querySelector('.loading-screen');
    loadingScreen.classList.add('active');
    const pathWithoutQuery = path.split('?')[0];
    let normalizedPath = pathWithoutQuery.endsWith('/') ? pathWithoutQuery.slice(0, -1) : pathWithoutQuery;
    const queryString = path.includes('?') ? path.split('?')[1] : '';
    const params = new URLSearchParams(queryString);
    console.log("normalizedPath:", normalizedPath);
    console.log("parameters", params);

    // Use the normalized path (without query) to find the route
    const route = routes[normalizedPath] || routes['/404'];
    if(route ===  routes['/404']){
        normalizedPath = '/404'
    }
    try {
        // Fetch and render the HTML content
        const response = await fetch(route.htmlFile);
        if (!response.ok) throw new Error(`Failed to load ${route.htmlFile}`);
        const html = await response.text();

        // Remove the old content and insert the new page
        const oldApp = document.getElementById('app');
        if (oldApp) oldApp.remove();

        const app = document.createElement('div');
        app.id = 'app';
        app.className = 'container';
        document.body.appendChild(app);
        app.innerHTML = html;

        // Update the CSS file
        const oldLink = document.getElementById('style-page');
        if (oldLink) oldLink.remove();
        const existingBootstrapLink = document.getElementById('bootstrap-styles');
        if (existingBootstrapLink) {
            existingBootstrapLink.remove();
        }

        if (route.cssFile) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.id = 'style-page';
            link.href = route.cssFile;
            document.head.appendChild(link);
        }

        // Update the JS file
        const oldScript = document.getElementById('script-page');
        if (oldScript) oldScript.remove();

        if (route.jsFile) {
            const script = document.createElement('script');
            script.src = route.jsFile;
            script.id = 'script-page';
            script.type = 'module';
            document.body.appendChild(script);

            // Run initialization code after script loads
            console.log('normalizedPath : '+normalizedPath);
            script.onload = async () => {
                if (normalizedPath === '/Profile') {
                    await checkUserCondition(params.get('username'));
                }
                else if (normalizedPath === '/Chat') {
                    await loadChatPage();
                } else if (normalizedPath === '/Settings') {
                    const bootstrapLink = document.createElement('link');
                    bootstrapLink.rel = 'stylesheet';
                    bootstrapLink.href = 'https://cdn.jsdelivr.net/npm/bootstrap@4.1.3/dist/css/bootstrap.min.css';
                    bootstrapLink.id = 'bootstrap-styles';
                    bootstrapLink.integrity = 'sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO';
                    bootstrapLink.crossOrigin = 'anonymous';
                    document.head.appendChild(bootstrapLink);
                    await loadSettings();
                } else if (normalizedPath === '/Local') {
                    await loadLocalPage(); 
                } else if (normalizedPath === '/LocalGame') {
                    await loadLocalGamePage();
                } else if (normalizedPath === '/OnlineGame') {
                    await loadOnlineGamePage(); 
                } else if (normalizedPath === '/Tournament') {
                    await loadTournamentPage(); 
                } else if (normalizedPath === '/TournamentGame') {
                    await loadTournamentGamePage(); 
                }else if(normalizedPath === '/404'){
                    loadTErrorPage();
                }
            };
        }
    } catch (error) {
        console.error('Error loading route:', error);
        document.getElementById('app').innerHTML = '<h1>Error: Unable to load the page content</h1>';
    } finally {
        loadingScreen.classList.remove('active');
    }
}


export function navigateTo(path) {
    const loadingScreen = document.querySelector('.loading-screen');
    loadingScreen.classList.add('active');
    closeWebSocket();
    setTimeout(() => {
        history.pushState({ path: path }, '', path);
        handleRoute(path);
    }, 100); 
}

// Event Listeners
window.addEventListener('popstate', (event) => {
    handleRoute(event.state ? event.state.path : window.location.pathname);
});

document.body.addEventListener('click', (event) => {
    if (event.target.tagName === 'A' && event.target.dataset.route) {
        event.preventDefault();
        const targetRoute = event.target.dataset.route;
        navigateTo(targetRoute);
   }
});

const tokenCheck = () => {
    const isLoggedIn = document.cookie.includes('isLoggedIn=true');
   const currentPath = window.location.pathname;
    if(isLoggedIn){
        handleRoute(currentPath);
    }else{
       if(currentPath !== '/Login'){
            navigateTo('/Login')
       }else{
            handleRoute(currentPath);
        }
    }
}

tokenCheck();

const customSearchIcon = document.getElementById("custom-searchIcon");
const customSearchBar = document.querySelector(".custom-searchBar");
const searchInput = document.getElementById("custom-searchInput");

customSearchIcon?.addEventListener('click', (e) => {
    customSearchBar?.classList.toggle('searchActive');
   if (customSearchBar?.classList.contains('searchActive')) {
        searchInput?.focus();
    }
});

searchInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim() !== '') {
        const searchUsername = searchInput.value.trim();
        navigateTo(`/Profile?username=${searchUsername}`);
    }
});
