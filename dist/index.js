"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _SelectionTool_jietuKey, _SelectionTool_videoObj, _SelectionTool_isAutoCopy;
// selectionTool.ts
class SelectionTool {
    constructor(key = 'Enter', params = {
        isAutoCopy: true
    }, selectBoxStyle = {
        borderStyle: {},
        fourStyle: {}
    }, callBackFn = {
        cancelVideo: () => { console.log(`取消了授权权限`); },
        getSuccessVideo: () => { console.log(`获取授权成功回调`); },
        overBanck: () => { console.log(`获取授权成功回调`); },
    }) {
        this.startX = 0;
        this.startY = 0;
        this.isSelecting = false;
        this.isDragging = false;
        this.isResizing = false;
        this.initialWidth = 0;
        this.initialHeight = 0;
        this.initialLeft = 0;
        this.initialTop = 0;
        this.currentHandle = null;
        this.cssPath = './css/index.css';
        _SelectionTool_jietuKey.set(this, void 0);
        /**视频对象 */
        _SelectionTool_videoObj.set(this, null
        /**base64对象 */
        );
        /**base64对象 */
        this.base64Obj = null;
        /**截屏成功后自动copy到剪切板 */
        _SelectionTool_isAutoCopy.set(this, true
        /**用户取消了授权回调 */
        );
        this.getSuccessVideo = callBackFn.getSuccessVideo;
        this.cancelVideo = callBackFn.cancelVideo;
        this.jietuSuccess = callBackFn.overBanck;
        __classPrivateFieldSet(this, _SelectionTool_jietuKey, key, "f");
        this.selectionBox = this.createSelectionBox(selectBoxStyle);
        this.contextMenu = this.createContextMenu();
        __classPrivateFieldSet(this, _SelectionTool_isAutoCopy, params.isAutoCopy, "f");
        this.initializeEventListeners();
    }
    loadCSS() {
        if (document.querySelector(`link[href="${this.cssPath}"]`)) {
            console.log(`CSS file "${this.cssPath}" is already loaded.`);
            return;
        }
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = this.cssPath;
        document.head.appendChild(link);
    }
    /**创建截图选区 */
    createSelectionBox(style = {
        borderStyle: {},
        fourStyle: {}
    }) {
        const box = document.createElement('div');
        box.id = 'selectionBox';
        box.style.position = 'absolute';
        box.style.border = '2px dashed #000';
        box.style.zIndex = '999';
        box.style.display = 'none';
        // 用户自定义样式 覆盖默认样式
        Object.keys(style.borderStyle).forEach((key) => {
            box.style[key] = style.borderStyle[key];
        });
        document.body.appendChild(box);
        const resizeHandles = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
        resizeHandles.forEach((handle) => {
            const div = document.createElement('div');
            div.className = `resize-handle ${handle}`;
            div.style.position = 'absolute';
            div.style.width = '10px';
            div.style.height = '10px';
            div.style.backgroundColor = '#000';
            // 用户自定义样式 覆盖默认样式
            Object.keys(style.fourStyle).forEach((key) => {
                div.style[key] = style.fourStyle[key];
            });
            if (handle.includes('top'))
                div.style.top = '-5px';
            if (handle.includes('bottom'))
                div.style.bottom = '-5px';
            if (handle.includes('left'))
                div.style.left = '-5px';
            if (handle.includes('right'))
                div.style.right = '-5px';
            div.style.cursor = handle.includes('top') && handle.includes('left') ? 'nwse-resize' :
                handle.includes('top') && handle.includes('right') ? 'nesw-resize' :
                    handle.includes('bottom') && handle.includes('left') ? 'nesw-resize' :
                        'nwse-resize';
            box.appendChild(div);
        });
        return box;
    }
    createContextMenu() {
        const menu = document.createElement('div');
        menu.id = 'contextMenu';
        menu.style.position = 'absolute';
        menu.style.display = 'none';
        menu.style.backgroundColor = 'white';
        menu.style.border = '1px solid #ccc';
        menu.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        menu.style.zIndex = '1000';
        const ul = document.createElement('ul');
        ul.style.listStyle = 'none';
        ul.style.padding = '0';
        ul.style.margin = '0';
        const li = document.createElement('li');
        li.id = 'deleteSelection';
        li.textContent = 'Delete';
        li.style.padding = '8px 12px';
        li.style.cursor = 'pointer';
        li.addEventListener('click', () => {
            this.selectionBox.style.display = 'none';
            menu.style.display = 'none';
        });
        li.addEventListener('mouseover', () => {
            li.style.backgroundColor = '#eee';
        });
        li.addEventListener('mouseout', () => {
            li.style.backgroundColor = 'white';
        });
        ul.appendChild(li);
        menu.appendChild(ul);
        document.body.appendChild(menu);
        return menu;
    }
    screenshot() {
        return __awaiter(this, void 0, void 0, function* () {
            const screenWidth = window.outerWidth;
            const screenHeight = window.outerHeight;
            const displayMediaOptions = {
                video: {
                    cursor: 'always',
                    width: screenWidth,
                    height: screenHeight
                }
            };
            const stream = yield navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
            const video = document.createElement('video');
            video.srcObject = stream;
            try {
                yield video.play();
                return video;
            }
            catch (e) {
                return e;
            }
        });
    }
    /**将截图转成图片 */
    generateCanvas(video, selectionBox) {
        return __awaiter(this, void 0, void 0, function* () {
            const canvas = document.createElement('canvas');
            canvas.width = selectionBox.offsetWidth;
            canvas.height = selectionBox.offsetHeight;
            const context = canvas.getContext('2d');
            selectionBox.style.visibility = 'hidden';
            const rect = selectionBox.getBoundingClientRect();
            const tabsHeiht = window.outerHeight - window.innerHeight;
            yield new Promise((resolve) => {
                setTimeout(() => {
                    context === null || context === void 0 ? void 0 : context.drawImage(video, rect.left, tabsHeiht + rect.top, selectionBox.offsetWidth, selectionBox.offsetHeight, 0, 0, canvas.width, canvas.height);
                    selectionBox.style.visibility = 'visible';
                    resolve();
                }, 100);
            });
            canvas.toBlob(blob => {
                if (blob) {
                    const item = new ClipboardItem({ 'image/png': blob });
                    if (__classPrivateFieldGet(this, _SelectionTool_isAutoCopy, "f")) {
                        navigator.clipboard.write([item]);
                    }
                    this.blobData = blob;
                }
            }, 'image/png');
            this.base64Obj = canvas.toDataURL('image/png');
            this.jietuSuccess([this.base64Obj, this.blobData]);
            return [this.base64Obj, this.blobData];
        });
    }
    /**将文字复制到剪切板 */
    copyToClipboard(text) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield navigator.clipboard.writeText(text);
                console.log('Screenshot copied to clipboard');
            }
            catch (err) {
                console.error('Failed to copy: ', err);
            }
        });
    }
    handleMouseDown(event) {
        if (event.button === 2)
            return;
        if (this.selectionBox.style.display !== 'block') {
            this.startX = event.pageX;
            this.startY = event.pageY;
            this.isSelecting = true;
            this.selectionBox.style.left = `${this.startX}px`;
            this.selectionBox.style.top = `${this.startY}px`;
            this.selectionBox.style.width = '0px';
            this.selectionBox.style.height = '0px';
            this.selectionBox.style.display = 'block';
        }
        else if (event.target instanceof HTMLElement && event.target.classList.contains('resize-handle')) {
            this.isResizing = true;
            this.currentHandle = event.target;
            this.initialWidth = this.selectionBox.offsetWidth;
            this.initialHeight = this.selectionBox.offsetHeight;
            this.initialLeft = this.selectionBox.offsetLeft;
            this.initialTop = this.selectionBox.offsetTop;
            this.startX = event.pageX;
            this.startY = event.pageY;
        }
        else if (event.target === this.selectionBox) {
            this.isDragging = true;
            this.startX = event.pageX - this.selectionBox.offsetLeft;
            this.startY = event.pageY - this.selectionBox.offsetTop;
        }
    }
    handleMouseMove(event) {
        if (this.isSelecting) {
            const currentX = event.pageX;
            const currentY = event.pageY;
            const width = Math.abs(currentX - this.startX);
            const height = Math.abs(currentY - this.startY);
            this.selectionBox.style.width = `${width}px`;
            this.selectionBox.style.height = `${height}px`;
            this.selectionBox.style.left = `${Math.min(currentX, this.startX)}px`;
            this.selectionBox.style.top = `${Math.min(currentY, this.startY)}px`;
        }
        else if (this.isDragging) {
            const currentX = event.pageX;
            const currentY = event.pageY;
            this.selectionBox.style.left = `${currentX - this.startX}px`;
            this.selectionBox.style.top = `${currentY - this.startY}px`;
        }
        else if (this.isResizing && this.currentHandle) {
            const currentX = event.pageX;
            const currentY = event.pageY;
            const dx = currentX - this.startX;
            const dy = currentY - this.startY;
            if (this.currentHandle.classList.contains('top-left')) {
                this.selectionBox.style.width = `${this.initialWidth - dx}px`;
                this.selectionBox.style.height = `${this.initialHeight - dy}px`;
                this.selectionBox.style.left = `${this.initialLeft + dx}px`;
                this.selectionBox.style.top = `${this.initialTop + dy}px`;
            }
            else if (this.currentHandle.classList.contains('top-right')) {
                this.selectionBox.style.width = `${this.initialWidth + dx}px`;
                this.selectionBox.style.height = `${this.initialHeight - dy}px`;
                this.selectionBox.style.top = `${this.initialTop + dy}px`;
            }
            else if (this.currentHandle.classList.contains('bottom-left')) {
                this.selectionBox.style.width = `${this.initialWidth - dx}px`;
                this.selectionBox.style.height = `${this.initialHeight + dy}px`;
                this.selectionBox.style.left = `${this.initialLeft + dx}px`;
            }
            else if (this.currentHandle.classList.contains('bottom-right')) {
                this.selectionBox.style.width = `${this.initialWidth + dx}px`;
                this.selectionBox.style.height = `${this.initialHeight + dy}px`;
            }
        }
    }
    handleMouseUp() {
        this.isSelecting = false;
        this.isDragging = false;
        this.isResizing = false;
    }
    handleContextMenu(event) {
        if (event.target === this.selectionBox || (event.target instanceof HTMLElement && event.target.parentElement === this.selectionBox)) {
            event.preventDefault();
            this.contextMenu.style.top = `${event.pageY}px`;
            this.contextMenu.style.left = `${event.pageX}px`;
            this.contextMenu.style.display = 'block';
        }
        else {
            this.contextMenu.style.display = 'none';
        }
    }
    handleClick() {
        this.contextMenu.style.display = 'none';
    }
    /**监听键盘按下的事件 */
    handleKeyDown(event) {
        return __awaiter(this, void 0, void 0, function* () {
            if (event.key === __classPrivateFieldGet(this, _SelectionTool_jietuKey, "f")) {
                this.loadCSS();
                if (__classPrivateFieldGet(this, _SelectionTool_videoObj, "f")) {
                    yield this.generateCanvas(__classPrivateFieldGet(this, _SelectionTool_videoObj, "f"), this.selectionBox);
                    // await this.copyToClipboard(base64);
                }
            }
        });
    }
    /**获取录屏权限 */
    getVideoAuthority() {
        return __awaiter(this, void 0, void 0, function* () {
            this.screenshot().then(r => {
                __classPrivateFieldSet(this, _SelectionTool_videoObj, r, "f");
            }).catch(e => {
                this.cancelVideo();
            });
        });
    }
    initializeEventListeners() {
        document.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        document.addEventListener('contextmenu', this.handleContextMenu.bind(this));
        document.addEventListener('click', this.handleClick.bind(this));
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
}
_SelectionTool_jietuKey = new WeakMap(), _SelectionTool_videoObj = new WeakMap(), _SelectionTool_isAutoCopy = new WeakMap();
