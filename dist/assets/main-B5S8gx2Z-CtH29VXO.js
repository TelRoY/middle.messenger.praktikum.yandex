(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))s(o);new MutationObserver(o=>{for(const r of o)if(r.type==="childList")for(const n of r.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&s(n)}).observe(document,{childList:!0,subtree:!0});function t(o){const r={};return o.integrity&&(r.integrity=o.integrity),o.referrerPolicy&&(r.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?r.credentials="include":o.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(o){if(o.ep)return;o.ep=!0;const r=t(o);fetch(o.href,r)}})();(function(){const i=document.createElement("link").relList;if(i&&i.supports&&i.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))t(s);new MutationObserver(s=>{for(const o of s)if(o.type==="childList")for(const r of o.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&t(r)}).observe(document,{childList:!0,subtree:!0});function e(s){const o={};return s.integrity&&(o.integrity=s.integrity),s.referrerPolicy&&(o.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?o.credentials="include":s.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function t(s){if(s.ep)return;s.ep=!0;const o=e(s);fetch(s.href,o)}})();class P{listeners={};on(e,t){this.listeners[e]||(this.listeners[e]=[]),this.listeners[e].push(t)}off(e,t){if(!this.listeners[e])throw new Error(`Нет события: ${e}`);this.listeners[e]=this.listeners[e].filter(s=>s!==t)}emit(e,...t){if(!this.listeners[e])throw new Error(`Нет события: ${e}`);this.listeners[e].forEach(s=>{s(...t)})}}class u{static EVENTS={INIT:"init",FLOW_CDM:"flow:component-did-mount",FLOW_CDU:"flow:component-did-update",FLOW_RENDER:"flow:render"};_element=null;_meta;props;eventBus;constructor(e="div",t={}){const s=new P;this._meta={tagName:e,props:t},this.props=this._makePropsProxy(t),this.eventBus=()=>s,this._registerEvents(s),s.emit(u.EVENTS.INIT)}_registerEvents(e){e.on(u.EVENTS.INIT,this.init.bind(this)),e.on(u.EVENTS.FLOW_CDM,this._componentDidMount.bind(this)),e.on(u.EVENTS.FLOW_CDU,this._componentDidUpdate.bind(this)),e.on(u.EVENTS.FLOW_RENDER,this._render.bind(this))}_createResources(){const{tagName:e}=this._meta;this._element=this._createDocumentElement(e)}init(){this._createResources(),this.eventBus().emit(u.EVENTS.FLOW_RENDER)}_componentDidMount(){this.componentDidMount()}componentDidMount(){}dispatchComponentDidMount(){this.eventBus().emit(u.EVENTS.FLOW_CDM)}_componentDidUpdate(e,t){this.componentDidUpdate(e,t)&&this.eventBus().emit(u.EVENTS.FLOW_RENDER)}componentDidUpdate(e,t){return JSON.stringify(e)!==JSON.stringify(t)}setProps=e=>{e&&Object.assign(this.props,e)};get element(){return this._element}_render(){const e=this.render();this._element&&(this._element.innerHTML=e,this._addEventListeners())}_addEventListeners(){const{events:e={}}=this.props;Object.keys(e).forEach(t=>{this._element&&this._element.addEventListener(t,e[t])})}render(){return""}getContent(){if(!this._element)throw new Error("Элемент не создан");return this._element}_makePropsProxy(e){return new Proxy(e,{get:(t,s)=>{const o=t[s];return typeof o=="function"?o.bind(t):o},set:(t,s,o)=>{const r={...t};return t[s]=o,this.eventBus().emit(u.EVENTS.FLOW_CDU,r,t),!0},deleteProperty:()=>{throw new Error("Нет доступа")}})}_createDocumentElement(e){return document.createElement(e)}show(){const e=this.getContent();e.style.display="block"}hide(){const e=this.getContent();e.style.display="none"}}class a{static rules={required:e=>!e||e.trim().length===0?"Поле обязательно для заполнения":null,minLength:e=>t=>t&&t.length<e?`Минимальная длина: ${e} символов`:null,maxLength:e=>t=>t&&t.length>e?`Максимальная длина: ${e} символов`:null,email:e=>e&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)?"Некорректный email адрес":null,phone:e=>e&&!/^\+?[1-9]\d{1,14}$/.test(e.replace(/\D/g,""))?"Некорректный номер телефона":null,login:e=>e&&!/^[a-zA-Z0-9_-]+$/.test(e)?"Логин может содержать только буквы, цифры, дефисы и подчеркивания":null,password:e=>{if(e){const t=/\d/.test(e),s=/[a-zA-Z]/.test(e);if(!t||!s)return"Пароль должен содержать хотя бы одну букву и одну цифру"}return null},name:e=>e&&!/^[a-zA-Zа-яА-ЯёЁ\s-]+$/.test(e)?"Имя может содержать только буквы, пробелы и дефисы":null};static schemas={authorization:{login:[a.rules.required,a.rules.minLength(3)],password:[a.rules.required,a.rules.minLength(6)]},registration:{first_name:[a.rules.required,a.rules.name],second_name:[a.rules.required,a.rules.name],login:[a.rules.required,a.rules.minLength(3),a.rules.maxLength(20),a.rules.login],email:[a.rules.required,a.rules.email],password:[a.rules.required,a.rules.minLength(6),a.rules.password],phone:[a.rules.required,a.rules.phone]},profile:{first_name:[a.rules.required,a.rules.name],second_name:[a.rules.required,a.rules.name],display_name:[a.rules.minLength(2),a.rules.maxLength(30)],login:[a.rules.required,a.rules.minLength(3),a.rules.maxLength(20),a.rules.login],email:[a.rules.required,a.rules.email],phone:[a.rules.required,a.rules.phone],oldPassword:[],newPassword:[a.rules.minLength(6),a.rules.password]}};static validateField(e,t,s){const o=a.schemas[s][e];if(!o)return null;for(const r of o){const n=r(t);if(n)return n}return null}static validateForm(e,t){const s={},o=a.schemas[t];for(const[r,n]of Object.entries(o)){const l=e[r]?.toString().trim()||"";if(!(t==="profile"&&(r==="oldPassword"||r==="newPassword")&&!e.oldPassword&&!e.newPassword))for(const d of n){const m=d(l);if(m){s[r]=m;break}}}return s}}class T{baseURL;defaultHeaders;defaultTimeout;constructor(e="",t={}){this.baseURL=e,this.defaultHeaders={"Content-Type":"application/json",...t.headers},this.defaultTimeout=t.timeout||5e3}request(e,t={}){return new Promise((s,o)=>{const{method:r="GET",headers:n={},data:l,params:d={},timeout:m=this.defaultTimeout,withCredentials:w=!0}=t;let y=this.baseURL+e;if(r==="GET"&&Object.keys(d).length>0){const h=this.buildQueryString(d);y+=(y.includes("?")?"&":"?")+h}const c=new XMLHttpRequest;c.open(r,y,!0),c.timeout=m;const C={...this.defaultHeaders,...n};Object.entries(C).forEach(([h,p])=>{p&&c.setRequestHeader(h,p)}),c.withCredentials=w,c.onload=()=>{const h={};c.getAllResponseHeaders().trim().split(/[\r\n]+/).forEach(f=>{const S=f.split(": "),L=S.shift(),x=S.join(": ");L&&(h[L.toLowerCase()]=x)});let p;try{const f=c.getResponseHeader("content-type");f&&f.includes("application/json")?p=JSON.parse(c.responseText):f&&(f.includes("text/")||f.includes("application/xml"))?p=c.responseText:p=c.response}catch{p=c.responseText}const M={ok:c.status>=200&&c.status<300,status:c.status,statusText:c.statusText,data:p,headers:h};s(M)},c.onerror=()=>{o(new Error("Network error occurred"))},c.ontimeout=()=>{o(new Error(`Request timeout after ${m}ms`))},c.onabort=()=>{o(new Error("Request was aborted"))};try{l&&r!=="GET"&&r!=="DELETE"?l instanceof FormData?(c.setRequestHeader("Content-Type",""),c.send(l)):typeof l=="string"?c.send(l):c.send(JSON.stringify(l)):c.send()}catch(h){o(h)}})}buildQueryString(e){return Object.entries(e).filter(([t,s])=>s!=null).map(([t,s])=>{const o=encodeURIComponent(t),r=encodeURIComponent(String(s));return`${o}=${r}`}).join("&")}get(e,t,s){const o={...s,method:"GET"};return t&&(o.params=t),this.request(e,o)}post(e,t,s){return this.request(e,{...s,method:"POST",data:t})}put(e,t,s){return this.request(e,{...s,method:"PUT",data:t})}delete(e,t){return this.request(e,{...t,method:"DELETE"})}patch(e,t,s){return this.request(e,{...s,method:"PATCH",data:t})}uploadFile(e,t,s="file",o={}){const r=new FormData;return r.append(s,t),Object.entries(o).forEach(([n,l])=>{l!=null&&r.append(n,String(l))}),this.request(e,{method:"POST",headers:{},data:r})}setHeader(e,t){this.defaultHeaders[e]=t}removeHeader(e){delete this.defaultHeaders[e]}setBaseURL(e){this.baseURL=e}}const g=new T("https://api.your-messenger.com",{headers:{Accept:"application/json"},timeout:1e4});class v{static async login(e){const t=await g.post("/auth/signin",e);if(!t.ok){const s=t.data;throw new Error(s.reason||"Ошибка авторизации")}return t.data}static async register(e){const t=await g.post("/auth/signup",e);if(!t.ok){const s=t.data;throw new Error(s.reason||"Ошибка регистрации")}return t.data}static async logout(){if(!(await g.post("/auth/logout")).ok)throw new Error("Ошибка при выходе")}static async getCurrentUser(){const e=await g.get("/auth/user");if(!e.ok){const t=e.data;throw new Error(t.reason||"Ошибка получения данных пользователя")}return e.data}static async updateProfile(e){const t=await g.put("/user/profile",e);if(!t.ok){const s=t.data;throw new Error(s.reason||"Ошибка обновления профиля")}return t.data}static async changePassword(e,t){const s=await g.put("/user/password",{oldPassword:e,newPassword:t});if(!s.ok){const o=s.data;throw new Error(o.reason||"Ошибка смены пароля")}}static async updateAvatar(e){const t=new FormData;t.append("avatar",e);const s=await g.put("/user/profile/avatar",t,{headers:{}});if(!s.ok){const o=s.data;throw new Error(o.reason||"Ошибка обновления аватара")}return s.data}}class _ extends u{validationTimeout;isLoading=!1;constructor(){super("div",{events:{submit:e=>{e.preventDefault(),this.onSubmit()}}})}async onSubmit(){if(this.isLoading)return;const e=this.getContent(),t=e.querySelector("form");if(t){const s=new FormData(t),o=Object.fromEntries(s),r=a.validateForm(o,"registration");if(Object.keys(r).length===0)await this.attemptRegistration(o);else{this.showAllErrors(r);const n=Object.keys(r)[0],l=e.querySelector(`[name="${n}"]`);l&&l.focus()}}}validateOnBlur(e,t){this.validationTimeout&&clearTimeout(this.validationTimeout),this.validationTimeout=setTimeout(()=>{const s=a.validateField(e,t,"registration"),o=this.getContent().querySelector(`[name="${e}"]`),r=o?.closest(".form-group");if(r){const n=r.querySelector(".field-error");n&&n.remove(),o?.classList.remove("has-error"),o?.classList.remove("is-valid"),s?this.showFieldError(e,s):t.trim()&&o?.classList.add("is-valid")}},300)}showFieldError(e,t){const s=this.getContent().querySelector(`[name="${e}"]`),o=s?.closest(".form-group");if(o&&s){const r=document.createElement("div");r.className="field-error",r.textContent=t,o.appendChild(r),s.classList.add("has-error")}}showAllErrors(e){const t=this.getContent();this.clearGlobalError(),t.querySelectorAll(".field-error").forEach(s=>s.remove()),t.querySelectorAll(".has-error, .is-valid").forEach(s=>{s.classList.remove("has-error","is-valid")}),Object.entries(e).forEach(([s,o])=>{this.showFieldError(s,o)})}clearGlobalError(){const e=this.getContent().querySelector(".global-error");e&&e.remove()}async attemptRegistration(e){try{this.setLoading(!0),this.showAllErrors({});const t={first_name:e.first_name.toString().trim(),second_name:e.second_name.toString().trim(),login:e.login.toString().trim(),email:e.email.toString().trim(),password:e.password.toString().trim(),phone:e.phone.toString().trim()};await v.register(t),this.showSuccess("Регистрация успешно завершена!");try{const o=await v.login({login:t.login,password:t.password});localStorage.setItem("user",JSON.stringify(o)),localStorage.setItem("isAuthenticated","true"),setTimeout(()=>{window.history.pushState({},"","/"),window.dispatchEvent(new PopStateEvent("popstate"))},3e3)}catch{this.showSuccess("Регистрация успешна! Теперь войдите в систему."),setTimeout(()=>{window.history.pushState({},"","/authorization"),window.dispatchEvent(new PopStateEvent("popstate"))},3e3)}const s=this.getContent().querySelector("form");s&&s.reset()}catch(t){console.error("Registration error:",t);let s="Ошибка регистрации";t instanceof Error&&(t.message.includes("логин")?s="Этот логин уже занят":t.message.includes("email")?s="Этот email уже используется":t.message.includes("phone")&&(s="Этот телефон уже используется")),this.showGlobalError(s)}finally{this.setLoading(!1)}}setLoading(e){this.isLoading=e;const t=this.getContent().querySelector('button[type="submit"]');t&&(e?(t.disabled=!0,t.textContent="Регистрация...",t.classList.add("loading")):(t.disabled=!1,t.textContent="Зарегистрироваться",t.classList.remove("loading")))}showGlobalError(e){const t=this.getContent();if(this.clearGlobalError(),!e)return;const s=document.createElement("div");s.className="global-error",s.textContent=e;const o=s;o.style.color="#ff4757",o.style.backgroundColor="rgba(255, 71, 87, 0.1)",o.style.padding="12px",o.style.borderRadius="8px",o.style.marginBottom="16px",o.style.textAlign="center";const r=t.querySelector("form");r&&r.prepend(s)}showSuccess(e){const t=this.getContent(),s=t.querySelector(".success-message");s&&s.remove();const o=document.createElement("div");o.className="success-message",o.textContent=e;const r=o;r.style.padding="12px",r.style.borderRadius="8px",r.style.marginBottom="16px",r.style.textAlign="center",r.style.fontWeight="500",r.style.backgroundColor="rgba(46, 204, 113, 0.1)",r.style.color="#2ecc71",r.style.border="1px solid #2ecc71";const n=t.querySelector("form");n&&n.parentNode?.insertBefore(o,n),setTimeout(()=>{o.parentNode&&o.remove()},5e3)}render(){return`
      <main class="container">
        <div class="header">
          <h1>Регистрация</h1>
        </div>

        <form class="registration-form">
          <div class="form-group">
            <label for="first_name">Имя</label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              class="form-input"
              placeholder="Иван"
              required
            />
          </div>

          <div class="form-group">
            <label for="second_name">Фамилия</label>
            <input
              type="text"
              id="second_name"
              name="second_name"
              class="form-input"
              placeholder="Иванов"
              required
            />
          </div>

          <div class="form-group">
            <label for="login">Логин</label>
            <input
              type="text"
              id="login"
              name="login"
              class="form-input"
              placeholder="ivanivanov"
              required
              minlength="3"
            />
          </div>

          <div class="form-group">
            <label for="email">Электронная почта</label>
            <input
              type="email"
              id="email"
              name="email"
              class="form-input"
              placeholder="ivanivanov@yandex.ru"
              required
            />
          </div>

          <div class="form-group">
            <label for="password">Пароль</label>
            <input
              type="password"
              id="password"
              name="password"
              class="form-input"
              placeholder="Минимум 6 символов"
              required
              minlength="6"
            />
          </div>

          <div class="form-group">
            <label for="phone">Телефон</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              class="form-input"
              placeholder="+7 (800) 555-35-35"
              required
            />
          </div>

          <div class="form-buttons">
            <button type="submit" class="component-button component-button--primary">
              Зарегистрироваться
            </button>
            <button type="button" class="component-button component-button--secondary" id="homeBtn">
              На главную
            </button>
          </div>
        </form>
      </main>
    `}componentDidMount(){const e=this.getContent(),t=e.querySelector("#homeBtn");t&&t.addEventListener("click",()=>{window.history.pushState({},"","/"),window.dispatchEvent(new PopStateEvent("popstate"))}),e.querySelectorAll(".form-input").forEach(o=>{o.addEventListener("blur",r=>{const n=r.target;this.validateOnBlur(n.name,n.value)}),o.addEventListener("focus",()=>{const r=o.closest(".form-group")?.querySelector(".field-error");r&&(r.remove(),o.classList.remove("has-error")),o.classList.remove("is-valid")})});const s=e.querySelector("input");s&&setTimeout(()=>s.focus(),100)}}class $ extends u{validationTimeout;isLoading=!1;constructor(){super("div",{events:{submit:e=>{e.preventDefault(),this.onSubmit()}}})}async onSubmit(){if(this.isLoading)return;const e=this.getContent(),t=e.querySelector("#login-form");if(t){const s=new FormData(t),o=Object.fromEntries(s),r=a.validateForm(o,"authorization");if(Object.keys(r).length===0)await this.attemptLogin(o);else{this.showAllErrors(r);const n=Object.keys(r)[0],l=e.querySelector(`[name="${n}"]`);l&&l.focus()}}}validateOnBlur(e,t){this.validationTimeout&&clearTimeout(this.validationTimeout),this.validationTimeout=setTimeout(()=>{const s=a.validateField(e,t,"authorization"),o=this.getContent().querySelector(`[name="${e}"]`),r=o?.closest(".form-group");if(r){const n=r.querySelector(".field-error");n&&n.remove(),o?.classList.remove("has-error"),o?.classList.remove("is-valid"),s?this.showFieldError(e,s):t.trim()&&o?.classList.add("is-valid")}},300)}showFieldError(e,t){const s=this.getContent().querySelector(`[name="${e}"]`),o=s?.closest(".form-group");if(o&&s){const r=document.createElement("div");r.className="field-error",r.textContent=t,o.appendChild(r),s.classList.add("has-error")}}showAllErrors(e){const t=this.getContent();this.clearGlobalError(),t.querySelectorAll(".field-error").forEach(s=>s.remove()),t.querySelectorAll(".has-error, .is-valid").forEach(s=>{s.classList.remove("has-error","is-valid")}),Object.entries(e).forEach(([s,o])=>{this.showFieldError(s,o)})}showGlobalError(e){const t=this.getContent();if(this.clearGlobalError(),!e)return;const s=document.createElement("div");s.className="global-error",s.textContent=e;const o=s;o.style.color="#ff4757",o.style.backgroundColor="rgba(255, 71, 87, 0.1)",o.style.padding="12px",o.style.borderRadius="8px",o.style.marginBottom="16px",o.style.textAlign="center";const r=t.querySelector("#login-form");r&&r.prepend(s)}clearGlobalError(){const e=this.getContent().querySelector(".global-error");e&&e.remove()}showSuccessMessage(e){const t=this.getContent();this.clearGlobalError(),t.querySelectorAll(".success-message").forEach(n=>n.remove());const s=document.createElement("div");s.className="success-message",s.textContent=e;const o=s;o.style.color="#2ecc71",o.style.backgroundColor="rgba(46, 204, 113, 0.1)",o.style.padding="12px",o.style.borderRadius="8px",o.style.marginBottom="16px",o.style.textAlign="center";const r=t.querySelector("#login-form");r&&r.prepend(s),setTimeout(()=>{s.parentNode&&s.remove()},3e3)}async attemptLogin(e){try{this.setLoading(!0),this.clearGlobalError(),this.showAllErrors({});const t=await v.login({login:e.login.toString().trim(),password:e.password.toString().trim()});localStorage.setItem("user",JSON.stringify(t)),localStorage.setItem("isAuthenticated","true"),this.showSuccessMessage("Вход выполнен успешно!"),setTimeout(()=>{window.history.pushState({},"","/"),window.dispatchEvent(new PopStateEvent("popstate"))},2e3)}catch(t){console.error("Login error:",t);let s="Ошибка при входе. Проверьте данные и попробуйте снова.";t instanceof Error?s=t.message||s:typeof t=="string"?s=t:t&&typeof t=="object"&&"message"in t&&(s=String(t.message)),this.showGlobalError(s)}finally{this.setLoading(!1)}}setLoading(e){this.isLoading=e;const t=this.getContent().querySelector('button[type="submit"]');t&&(e?(t.disabled=!0,t.textContent="Выполняется вход...",t.classList.add("loading")):(t.disabled=!1,t.textContent="Авторизация",t.classList.remove("loading")))}render(){return`
      <main class="container">
        <div class="header">
          <h1>MyMate</h1>
          <p>Войдите в свой аккаунт, чтобы продолжить</p>
        </div>

        <div class="main">
          <form id="login-form" class="auth-form">
            <div class="form-group">
              <label for="login" class="form-label">Логин</label>
              <input
                type="text"
                id="login"
                name="login"
                class="form-input"
                placeholder="Введите логин или email"
                required
                autocomplete="username"
              />
            </div>

            <div class="form-group">
              <label for="password" class="form-label">Пароль</label>
              <input
                type="password"
                id="password"
                name="password"
                class="form-input"
                placeholder="Введите пароль"
                required
                minlength="6"
                autocomplete="current-password"
              />
            </div>

            <div class="form-buttons login-buttons">
              <button type="submit" class="component-button component-button--primary component-button--authorization">
                Авторизация
              </button>
              
              <button type="button" id="registration-btn" class="component-button component-button--secondary component-button--registration">
                Регистрация
              </button>
            </div>
          </form>
        </div>
      </main>
    `}componentDidMount(){const e=this.getContent(),t=e.querySelector("#registration-btn");t&&t.addEventListener("click",()=>{window.history.pushState({},"","/registration"),window.dispatchEvent(new PopStateEvent("popstate"))}),e.querySelectorAll(".form-input").forEach(o=>{o.addEventListener("blur",r=>{const n=r.target;this.validateOnBlur(n.name,n.value)}),o.addEventListener("focus",()=>{const r=o.closest(".form-group")?.querySelector(".field-error");r&&(r.remove(),o.classList.remove("has-error")),o.classList.remove("is-valid")})});const s=e.querySelector("#login");s&&setTimeout(()=>s.focus(),100)}}class D extends u{isEditMode=!1;originalData;escapeHandler;validationTimeouts={};isLoading=!1;constructor(){super("div",{events:{submit:e=>{e.preventDefault(),this.onSubmit()},change:e=>{const t=e.target;t.id==="avatar-input"&&this.handleAvatarChange(t)}}}),this.originalData=this.loadProfileData()}async loadProfileData(){try{const e=localStorage.getItem("user");if(e)return JSON.parse(e);const t=await v.getCurrentUser();return localStorage.setItem("user",JSON.stringify(t)),t}catch(e){console.error("Error loading profile data:",e)}return{first_name:"Иван",second_name:"Иванов",display_name:"ivan95",login:"ivanivanov",email:"ivanivanov@yandex.ru",phone:"+7 (800) 555-35-35",avatar:""}}getDefaultData(){return{first_name:"Иван",second_name:"Иванов",display_name:"ivan95",login:"ivanivanov",email:"ivanivanov@yandex.ru",phone:"+7 (800) 555-35-35",avatar:""}}saveProfileData(e){try{localStorage.setItem("userProfile",JSON.stringify(e)),this.originalData={...e}}catch(t){console.error("Error saving profile data:",t)}}onSubmit(){this.isEditMode?this.saveProfile():this.toggleEditMode()}async saveProfile(){if(this.isLoading)return;const e=this.getContent(),t=e.querySelector("#profile-form");if(t){const s=new FormData(t),o={};s.forEach((l,d)=>{o[d]=l.toString().trim()});const r=o.oldPassword||o.newPassword,n=a.validateForm(o,"profile");if(Object.keys(n).length===0){console.log("Profile data to save:",o);try{this.setLoading(!0);const l={first_name:o.first_name,second_name:o.second_name,display_name:o.display_name,login:o.login,email:o.email,phone:o.phone},d=await v.updateProfile(l);if(this.originalData=d,this.showMessage("Профиль успешно обновлен","success"),r)try{await v.changePassword(o.oldPassword,o.newPassword)}catch(m){console.error("Password change failed:",m),this.showMessage("Профиль обновлен, но не удалось сменить пароль","error")}this.saveProfileData(o),this.updateProfileDisplay(o),this.toggleEditMode(),this.showMessage("Профиль успешно обновлен!","success")}catch(l){console.error("Profile update error:",l),this.showMessage("Ошибка обновления профиля","error")}finally{this.setLoading(!1)}}else{this.showAllErrors(n);const l=Object.keys(n)[0],d=e.querySelector(`[name="${l}"]`);d&&d.focus()}}}validateOnBlur(e,t){if(e==="oldPassword"||e==="newPassword"){const s=this.getContent(),o=s.querySelector("#oldPassword")?.value||"",r=s.querySelector("#newPassword")?.value||"";if(!o&&!r)return}this.validationTimeouts[e]&&clearTimeout(this.validationTimeouts[e]),this.validationTimeouts[e]=setTimeout(()=>{const s=a.validateField(e,t,"profile"),o=this.getContent().querySelector(`[name="${e}"]`),r=o?.closest(".form-group");if(r){const n=r.querySelector(".field-error");n&&n.remove(),o?.classList.remove("has-error"),o?.classList.remove("is-valid"),s?this.showFieldError(e,s):t.trim()&&o?.classList.add("is-valid")}},300)}showFieldError(e,t){const s=this.getContent().querySelector(`[name="${e}"]`),o=s?.closest(".form-group");if(o&&s){const r=document.createElement("div");r.className="field-error",r.textContent=t,o.appendChild(r),s.classList.add("has-error")}}showAllErrors(e){const t=this.getContent();t.querySelectorAll(".field-error").forEach(s=>s.remove()),t.querySelectorAll(".has-error, .is-valid").forEach(s=>{s.classList.remove("has-error","is-valid")}),Object.entries(e).forEach(([s,o])=>{this.showFieldError(s,o)})}toggleEditMode(){this.isEditMode=!this.isEditMode,!this.isEditMode&&this.escapeHandler&&(document.removeEventListener("keydown",this.escapeHandler),this.escapeHandler=void 0),this.forceUpdate(),this.isEditMode?this.setupEditMode():this.setupViewMode()}setupEditMode(){const e=this.getContent(),t=e.querySelector("input");t&&setTimeout(()=>t.focus(),100),this.escapeHandler=s=>{s.key==="Escape"&&this.isEditMode&&this.toggleEditMode()},document.addEventListener("keydown",this.escapeHandler),e.querySelectorAll(".form-input").forEach(s=>{s.addEventListener("blur",o=>{const r=o.target;this.validateOnBlur(r.name,r.value)}),s.addEventListener("focus",()=>{const o=s.closest(".form-group")?.querySelector(".field-error");o&&(o.remove(),s.classList.remove("has-error")),s.classList.remove("is-valid")})})}setupViewMode(){const e=this.getContent(),t=e.querySelector("#oldPassword"),s=e.querySelector("#newPassword");t&&(t.value=""),s&&(s.value="")}forceUpdate(){const e=this.getContent();e.innerHTML=this.render(),this.componentDidMount()}async handleAvatarChange(e){if(e.files&&e.files[0]){const t=e.files[0];if(!t.type.startsWith("image/")){this.showMessage("Пожалуйста, выберите изображение","error");return}if(t.size>2*1024*1024){this.showMessage("Изображение должно быть меньше 2MB","error");return}try{this.setLoading(!0);const s=await v.updateAvatar(t);this.saveProfileData(s);const o=this.getContent().querySelector(".avatar-img"),r=this.getContent().querySelector(".avatar-placeholder");o&&(o.src=s.avatar,o.style.display="block",r&&(r.style.display="none")),this.showMessage("Аватар обновлен!","success")}catch(s){console.error("Avatar upload error:",s),this.showMessage("Ошибка при загрузке аватара","error")}finally{this.setLoading(!1)}}}updateProfileDisplay(e){const t=this.getContent(),s=t.querySelector(".profile-name");if(s){const r=e.first_name||"Иван",n=e.second_name||"Иванов";s.textContent=`${r} ${n}`}const o=t.querySelector(".profile-display-name");if(o){const r=e.display_name||"ivan95";o.textContent=`@${r}`}if(["first_name","second_name","display_name","login","email","phone"].forEach(r=>{const n=t.querySelector(`[name="${r}"]`);n&&(n.value=e[r]||"")}),e.avatar){const r=t.querySelector(".avatar-img"),n=t.querySelector(".avatar-placeholder");r&&(r.src=e.avatar,r.style.display="block",n&&(n.style.display="none"))}}showMessage(e,t){const s=this.getContent(),o=s.querySelector(".profile-message");o&&o.remove();const r=document.createElement("div");r.className=`profile-message profile-message--${t}`,r.textContent=e,r.style.padding="12px",r.style.borderRadius="8px",r.style.marginBottom="16px",r.style.textAlign="center",r.style.fontWeight="500",t==="success"?(r.style.backgroundColor="rgba(46, 204, 113, 0.1)",r.style.color="#2ecc71",r.style.border="1px solid #2ecc71"):(r.style.backgroundColor="rgba(255, 71, 87, 0.1)",r.style.color="#ff4757",r.style.border="1px solid #ff4757");const n=s.querySelector("#profile-form");n&&n.parentNode?.insertBefore(r,n),setTimeout(()=>{r.parentNode&&r.remove()},5e3)}setLoading(e){this.isLoading=e;const t=this.getContent().querySelector('button[type="submit"]');t&&(e?(t.disabled=!0,t.textContent=this.isEditMode?"Сохранение...":"Загрузка...",t.classList.add("loading")):(t.disabled=!1,t.textContent=this.isEditMode?"Сохранить изменения":"Редактировать профиль",t.classList.remove("loading")))}render(){const e=this.originalData||this.getDefaultData(),{first_name:t="Иван",second_name:s="Иванов",display_name:o="ivan95",login:r="ivanivanov",email:n="ivanivanov@yandex.ru",phone:l="+7 (800) 555-35-35",avatar:d=""}=e,m=!!d,w=t&&t.length>0?t[0]:"И",y=s&&s.length>0?s[0]:"И";return`
      <main class="container">
        <div class="header">
          <div class="avatar-section">
            <div class="avatar-container">
              ${m?`<img src="${d}" alt="Аватар" class="avatar-img">`:`<div class="avatar-placeholder">${w}${y}</div>`}
              ${this.isEditMode?`
                <label for="avatar-input" class="avatar-upload-btn">
                  <span>Изменить фото</span>
                  <input type="file" id="avatar-input" name="avatar" accept="image/*" style="display: none;">
                </label>
              `:""}
            </div>
          </div>
          
          <div class="profile-info">
            <h1 class="profile-name">${t} ${s}</h1>
            <p class="profile-display-name">@${o}</p>
          </div>
        </div>

        <form id="profile-form" class="profile-form">
          <div class="form-grid">
            <div class="form-group">
              <label for="first_name" class="form-label">Имя</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                class="form-input ${this.isEditMode?"":"form-input--readonly"}"
                value="${t}"
                placeholder="Иван"
                ${this.isEditMode?"":"readonly"}
              />
            </div>

            <div class="form-group">
              <label for="second_name" class="form-label">Фамилия</label>
              <input
                type="text"
                id="second_name"
                name="second_name"
                class="form-input ${this.isEditMode?"":"form-input--readonly"}"
                value="${s}"
                placeholder="Иванов"
                ${this.isEditMode?"":"readonly"}
              />
            </div>

            <div class="form-group">
              <label for="display_name" class="form-label">Никнэйм</label>
              <input
                type="text"
                id="display_name"
                name="display_name"
                class="form-input ${this.isEditMode?"":"form-input--readonly"}"
                value="${o}"
                placeholder="ivan95"
                ${this.isEditMode?"":"readonly"}
              />
            </div>

            <div class="form-group">
              <label for="login" class="form-label">Логин</label>
              <input
                type="text"
                id="login"
                name="login"
                class="form-input ${this.isEditMode?"":"form-input--readonly"}"
                value="${r}"
                placeholder="ivanivanov"
                ${this.isEditMode?"":"readonly"}
              />
            </div>

            <div class="form-group">
              <label for="email" class="form-label">Электронная почта</label>
              <input
                type="email"
                id="email"
                name="email"
                class="form-input ${this.isEditMode?"":"form-input--readonly"}"
                value="${n}"
                placeholder="ivanivanov@yandex.ru"
                ${this.isEditMode?"":"readonly"}
              />
            </div>

            <div class="form-group">
              <label for="phone" class="form-label">Телефон</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                class="form-input ${this.isEditMode?"":"form-input--readonly"}"
                value="${l}"
                placeholder="+7 (800) 555-35-35"
                ${this.isEditMode?"":"readonly"}
              />
            </div>

            ${this.isEditMode?`
              <div class="form-group password-section">
                <h3 class="section-title">Смена пароля</h3>
                
                <div class="form-group">
                  <label for="oldPassword" class="form-label">Старый пароль</label>
                  <input
                    type="password"
                    id="oldPassword"
                    name="oldPassword"
                    class="form-input"
                    placeholder="Введите старый пароль"
                  />
                </div>

                <div class="form-group">
                  <label for="newPassword" class="form-label">Новый пароль</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    class="form-input"
                    placeholder="Введите новый пароль"
                    minlength="6"
                  />

                </div>
              </div>
            `:""}
          </div>

          <div class="profile-actions">
            <button type="submit" class="component-button ${this.isEditMode?"component-button--primary":"component-button--secondary"}">
              ${this.isEditMode?"Сохранить изменения":"Редактировать профиль"}
            </button>
            
            ${this.isEditMode?`
              <button type="button" id="cancel-edit" class="component-button component-button--secondary">
                Отмена
              </button>
            `:""}
            
            <button type="button" id="back-home" class="component-button component-button--link">
              На главную
            </button>
          </div>
        </form>
      </main>
    `}componentDidMount(){const e=this.getContent(),t=e.querySelector("#back-home");t&&t.addEventListener("click",()=>{window.history.pushState({},"","/"),window.dispatchEvent(new PopStateEvent("popstate"))});const s=e.querySelector("#cancel-edit");s&&s.addEventListener("click",()=>{this.toggleEditMode()});const o=e.querySelector(".avatar-upload-btn");o&&o.addEventListener("click",r=>{r.preventDefault();const n=e.querySelector("#avatar-input");n&&n.click()}),this.isEditMode&&e.querySelectorAll(".form-input").forEach(r=>{r.addEventListener("blur",n=>{const l=n.target;this.validateOnBlur(l.name,l.value)}),r.addEventListener("focus",()=>{const n=r.closest(".form-group")?.querySelector(".field-error");n&&(n.remove(),r.classList.remove("has-error")),r.classList.remove("is-valid")})})}}console.log("MyMate messenger loaded!");function O(){const i=document.querySelector("main.container");i&&i.remove();const e=document.querySelector('script[src="src/main.ts"]');e&&e.remove()}function E(){const i=window.location.pathname;if(console.log("Current path:",i),O(),i.includes(".html")&&!i.includes("index.html")){console.log("Loading static page:",i),b(i);return}if((i==="/"||i==="/index.html"||i.includes(".html"))&&document.querySelector("main.container")!==null){console.log("Static page loaded by Handlebars"),q();return}if(!document.getElementById("app")){const t=document.createElement("div");t.id="app",document.body.appendChild(t)}const e=document.getElementById("app");if(e)if(e.innerHTML="",i.includes("registration")){console.log("Loading RegistrationPage");const t=new _;e.appendChild(t.getContent()),t.dispatchComponentDidMount()}else if(i.includes("authorization")){console.log("Loading AuthorizationPage");const t=new $;e.appendChild(t.getContent()),t.dispatchComponentDidMount()}else if(i.includes("profile")){console.log("Loading ProfilePage");const t=new D;e.appendChild(t.getContent()),t.dispatchComponentDidMount()}else(i==="/"||i==="/index.html")&&(console.log("Loading Main page"),e.innerHTML=`
        <main class="container">
          <div class="header">
            <h1>MyMate</h1>
            <p>Добро пожаловать в новейший, современный, безопасный и быстрый мессенджер!</p>
          </div>
          <nav class="main">
            <ul class="feature-list">
              <li class="feature-item">
                <a href="/authorization" class="feature-link">Авторизация</a>
              </li>
              <li class="feature-item">
                <a href="/registration" class="feature-link">Регистрация</a>
              </li>
              <li class="feature-item">
                <a href="/home.html" class="feature-link">Главная</a>
              </li>
              <li class="feature-item">
                <a href="/profile" class="feature-link">Профиль</a>
              </li>
              <li class="feature-item">
                <a href="/404.html" class="feature-link">404</a>
              </li>
              <li class="feature-item">
                <a href="/500.html" class="feature-link">500</a>
              </li>
            </ul>
          </nav>
        </main>
      `)}async function b(i){try{let e=i;if(!i.startsWith("/src/pages/")){const r=i.replace(".html","").replace("/","");e=`/src/pages/${r}/${r}.html`}const t=await fetch(e);if(!t.ok){if(t.status===404){window.history.pushState({},"","/404.html"),b("/404.html");return}throw new Error(`Failed to load page: ${t.status}`)}const s=await t.text(),o=document.getElementById("app");o&&(o.innerHTML=s,setTimeout(()=>q(),100))}catch(e){console.error("Error loading static page:",e),window.history.pushState({},"","/500.html"),b("/500.html")}}function q(){console.log("Initializing static page events");const i=document.getElementById("message-form");i&&i.addEventListener("submit",s=>{s.preventDefault();const o=document.getElementById("message");if(o){const r=o.value.trim();r&&(console.log("Отправка сообщения:",r),o.value="",N(r,!0))}});const e=document.querySelectorAll(".chat-item");e.length>0&&e.forEach(s=>{s.addEventListener("click",function(){const o=this.dataset.chatId;console.log("Выбран чат:",o),e.forEach(n=>n.classList.remove("chat-item--active")),this.classList.add("chat-item--active");const r=this.querySelector(".chat-item__name")?.textContent;r&&A(r)})});const t=document.querySelector(".search-input__field");t&&t.addEventListener("input",s=>{const o=s.target;k(o.value.toLowerCase())})}function N(i,e=!0){const t=document.querySelector(".messages-wrapper");if(!t)return;const s=Date.now().toString(),o=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),r=document.createElement("div");r.className=`message ${e?"message--mine":"message--theirs"}`,r.setAttribute("data-message-id",s),r.innerHTML=`
    ${e?"":`
      <div class="message__avatar">
        <div class="message__avatar-placeholder">A</div>
      </div>
    `}
    
    <div class="message__content">
      ${e?"":'<div class="message__sender">Анна</div>'}
      
      <div class="message__bubble">
        <div class="message__text">${i}</div>
        <div class="message__meta">
          <span class="message__time">${o}</span>
          ${e?'<span class="message__status message__status--sent">✓</span>':""}
        </div>
      </div>
    </div>
  `,t.prepend(r)}function k(i){document.querySelectorAll(".chat-item").forEach(e=>{const t=e.querySelector(".chat-item__name")?.textContent?.toLowerCase()||"",s=e.querySelector(".chat-item__last-message")?.textContent?.toLowerCase()||"";t.includes(i)||s.includes(i)?e.style.display="":e.style.display="none"})}function A(i){const e=document.querySelector(".chat-title");e&&(e.textContent=i)}function F(){document.addEventListener("click",i=>{const e=i.target.closest("a");if(e&&e.href){const t=new URL(e.href);t.origin===window.location.origin&&(i.preventDefault(),window.history.pushState({},"",t.pathname),E())}})}document.addEventListener("DOMContentLoaded",()=>{console.log("MyMate messenger started!"),F(),E(),window.addEventListener("popstate",E)});
