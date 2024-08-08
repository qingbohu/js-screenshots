// selectionTool.ts
class SelectionTool {
  private startX = 0
  private startY = 0
  private isSelecting: boolean = false;
  private isDragging: boolean = false;
  private isResizing: boolean = false;
  private initialWidth = 0;
  private initialHeight = 0;
  private initialLeft = 0;
  private initialTop = 0;
  private currentHandle: HTMLElement | null = null;
  private selectionBox: HTMLElement;
  private contextMenu: HTMLElement;
  /** 截图的 blog 对象 */
  private blobData: any;

  /** 截图的 base^4 对象 */
  private base64Data: any;

  private cssPath: string = './css/index.css';
  #jietuKey: string
  /**视频对象 */
  #videoObj = null as HTMLVideoElement | null

  /**base64对象 */
  base64Obj = null as string | null

  /**截屏成功后自动copy到剪切板 */
  #isAutoCopy = true

  /**用户取消了授权回调 */
  cancelVideo: () => void

  /**用户取消了授权回调 */
  getSuccessVideo: () => void


  /**用户截图成功回调 */
  jietuSuccess: (data: string[]) => void

  constructor(
    key = 'Enter', 
    params = {
      isAutoCopy: true
    },
    selectBoxStyle = {
      borderStyle: {},
      fourStyle: {
      }
    },
    callBackFn = {
      cancelVideo: () => { console.log(`取消了授权权限`) },
      getSuccessVideo: () => { console.log(`获取授权成功回调`) },
      overBanck: () => { console.log(`获取授权成功回调`) },
    },
  ) {
    this.getSuccessVideo = callBackFn.getSuccessVideo
    this.cancelVideo = callBackFn.cancelVideo
    this.jietuSuccess = callBackFn.overBanck
    this.#jietuKey = key
    this.selectionBox = this.createSelectionBox(selectBoxStyle);
    this.contextMenu = this.createContextMenu();
    this.#isAutoCopy = params.isAutoCopy
    this.initializeEventListeners();
  }

  private loadCSS(): void {
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
  private createSelectionBox(style = {
    borderStyle: {} as Record<string, any>,
    fourStyle: {
    } as Record<string, any>
  }): HTMLElement {
    const box = document.createElement('div');
    box.id = 'selectionBox';
    box.style.position = 'absolute';
    box.style.border = '2px dashed #000';
    box.style.zIndex = '999';
    box.style.display = 'none';
    // 用户自定义样式 覆盖默认样式
    Object.keys(style.borderStyle).forEach((key:any) => {
      box.style[key] = style.borderStyle[key]
    })
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
      Object.keys(style.fourStyle).forEach((key:any) => {
        div.style[key] = style.fourStyle[key]
      })
      if (handle.includes('top')) div.style.top = '-5px';
      if (handle.includes('bottom')) div.style.bottom = '-5px';
      if (handle.includes('left')) div.style.left = '-5px';
      if (handle.includes('right')) div.style.right = '-5px';

      div.style.cursor = handle.includes('top') && handle.includes('left') ? 'nwse-resize' :
        handle.includes('top') && handle.includes('right') ? 'nesw-resize' :
          handle.includes('bottom') && handle.includes('left') ? 'nesw-resize' :
            'nwse-resize';
      box.appendChild(div);
    });

    return box;
  }

  private createContextMenu(): HTMLElement {
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

  private async screenshot(): Promise<HTMLVideoElement> {
    const screenWidth = window.outerWidth;
    const screenHeight = window.outerHeight;
    const displayMediaOptions = {
      video: {
        cursor: 'always',
        width: screenWidth,
        height: screenHeight
      }
    };
    const stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
    const video = document.createElement('video');
    video.srcObject = stream;
    try {
      await video.play();
      return video;
    }
    catch (e: any) {
      return e
    }
  }

  /**将截图转成图片 */
  private async generateCanvas(video: HTMLVideoElement, selectionBox: HTMLElement): Promise<string[]> {
    const canvas = document.createElement('canvas');
    canvas.width = selectionBox.offsetWidth;
    canvas.height = selectionBox.offsetHeight;
    const context = canvas.getContext('2d');

    selectionBox.style.visibility = 'hidden';
    const rect = selectionBox.getBoundingClientRect();
    const tabsHeiht = window.outerHeight - window.innerHeight;

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        context?.drawImage(
          video,
          rect.left, tabsHeiht + rect.top,
          selectionBox.offsetWidth, selectionBox.offsetHeight,
          0, 0, canvas.width, canvas.height
        );
        selectionBox.style.visibility = 'visible';
        resolve();
      }, 100);
    });

    canvas.toBlob(blob => {
      if (blob) {
        const item = new ClipboardItem({ 'image/png': blob });
        
        if (this.#isAutoCopy) {
          navigator.clipboard.write([item])
        }
        this.blobData = blob
      }
    }, 'image/png');
    this.base64Obj = canvas.toDataURL('image/png');
    this.jietuSuccess([this.base64Obj, this.blobData])
    
   
    return [this.base64Obj, this.blobData];
  }
  /**将文字复制到剪切板 */
  private async copyToClipboard(text: any): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      console.log('Screenshot copied to clipboard');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  }

  private handleMouseDown(event: MouseEvent): void {
    if (event.button === 2) return;
    if (this.selectionBox.style.display !== 'block') {
      this.startX = event.pageX;
      this.startY = event.pageY;
      this.isSelecting = true;

      this.selectionBox.style.left = `${this.startX}px`;
      this.selectionBox.style.top = `${this.startY}px`;
      this.selectionBox.style.width = '0px';
      this.selectionBox.style.height = '0px';
      this.selectionBox.style.display = 'block';
    } else if (event.target instanceof HTMLElement && event.target.classList.contains('resize-handle')) {
      this.isResizing = true;
      this.currentHandle = event.target;
      this.initialWidth = this.selectionBox.offsetWidth;
      this.initialHeight = this.selectionBox.offsetHeight;
      this.initialLeft = this.selectionBox.offsetLeft;
      this.initialTop = this.selectionBox.offsetTop;
      this.startX = event.pageX;
      this.startY = event.pageY;
    } else if (event.target === this.selectionBox) {
      this.isDragging = true;
      this.startX = event.pageX - this.selectionBox.offsetLeft;
      this.startY = event.pageY - this.selectionBox.offsetTop;
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    if (this.isSelecting) {
      const currentX = event.pageX;
      const currentY = event.pageY;

      const width = Math.abs(currentX - this.startX);
      const height = Math.abs(currentY - this.startY);

      this.selectionBox.style.width = `${width}px`;
      this.selectionBox.style.height = `${height}px`;
      this.selectionBox.style.left = `${Math.min(currentX, this.startX)}px`;
      this.selectionBox.style.top = `${Math.min(currentY, this.startY)}px`;
    } else if (this.isDragging) {
      const currentX = event.pageX;
      const currentY = event.pageY;

      this.selectionBox.style.left = `${currentX - this.startX}px`;
      this.selectionBox.style.top = `${currentY - this.startY}px`;
    } else if (this.isResizing && this.currentHandle) {
      const currentX = event.pageX;
      const currentY = event.pageY;

      const dx = currentX - this.startX;
      const dy = currentY - this.startY;

      if (this.currentHandle.classList.contains('top-left')) {
        this.selectionBox.style.width = `${this.initialWidth - dx}px`;
        this.selectionBox.style.height = `${this.initialHeight - dy}px`;
        this.selectionBox.style.left = `${this.initialLeft + dx}px`;
        this.selectionBox.style.top = `${this.initialTop + dy}px`;
      } else if (this.currentHandle.classList.contains('top-right')) {
        this.selectionBox.style.width = `${this.initialWidth + dx}px`;
        this.selectionBox.style.height = `${this.initialHeight - dy}px`;
        this.selectionBox.style.top = `${this.initialTop + dy}px`;
      } else if (this.currentHandle.classList.contains('bottom-left')) {
        this.selectionBox.style.width = `${this.initialWidth - dx}px`;
        this.selectionBox.style.height = `${this.initialHeight + dy}px`;
        this.selectionBox.style.left = `${this.initialLeft + dx}px`;
      } else if (this.currentHandle.classList.contains('bottom-right')) {
        this.selectionBox.style.width = `${this.initialWidth + dx}px`;
        this.selectionBox.style.height = `${this.initialHeight + dy}px`;
      }
    }
  }

  private handleMouseUp(): void {
    this.isSelecting = false;
    this.isDragging = false;
    this.isResizing = false;
  }

  private handleContextMenu(event: MouseEvent): void {
    if (event.target === this.selectionBox || (event.target instanceof HTMLElement && event.target.parentElement === this.selectionBox)) {
      event.preventDefault();
      this.contextMenu.style.top = `${event.pageY}px`;
      this.contextMenu.style.left = `${event.pageX}px`;
      this.contextMenu.style.display = 'block';
    } else {
      this.contextMenu.style.display = 'none';
    }
  }

  private handleClick(): void {
    this.contextMenu.style.display = 'none';
  }

  /**监听键盘按下的事件 */
  private async handleKeyDown(event: KeyboardEvent): Promise<void> {
    if (event.key === this.#jietuKey) {
      this.loadCSS();
      if (this.#videoObj) {
        await this.generateCanvas(this.#videoObj, this.selectionBox);
        // await this.copyToClipboard(base64);
      }
    }
  }

  /**获取录屏权限 */
  async getVideoAuthority() {
    this.screenshot().then(r => {
      this.#videoObj = r
    }).catch(e => {
      this.cancelVideo()
    })
  }

  private initializeEventListeners(): void {
    document.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    document.addEventListener('contextmenu', this.handleContextMenu.bind(this));
    document.addEventListener('click', this.handleClick.bind(this));
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

}

