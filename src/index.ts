(() => {
  // selectionTool.ts
  let startX: number, startY: number;
  let isSelecting: boolean = false;
  let isDragging: boolean = false;
  let isResizing: boolean = false;
  let initialWidth: number, initialHeight: number, initialLeft: number, initialTop: number;
  let currentHandle: HTMLElement | null = null;

  const selectionBox = createSelectionBox();
  const contextMenu = createContextMenu();

  /**
   * 创建一个可调整大小的选区框并添加到页面中
   * @returns {HTMLElement} selectionBox 选区框
   */
  function createSelectionBox(): HTMLElement {
    const box = document.createElement('div');
    box.id = 'selectionBox';
    box.style.position = 'absolute';
    box.style.border = '2px dashed #000';
    // box.style.backgroundColor = 'rgba(0, 0, 255, 0.2)';
    box.style.zIndex = '999';
    box.style.display = 'none';
    document.body.appendChild(box);

    const resizeHandles = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    resizeHandles.forEach((handle) => {
      const div = document.createElement('div');
      div.className = `resize-handle ${handle}`;
      div.style.position = 'absolute';
      div.style.width = '10px';
      div.style.height = '10px';
      div.style.backgroundColor = '#000';

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

  /**
   * 创建右键菜单并添加到页面中
   * @returns {HTMLElement} contextMenu 右键菜单
   */
  function createContextMenu(): HTMLElement {
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
      selectionBox.style.display = 'none';
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

  /**创建屏幕录制并返回一个视频对象
   * @returns {Promise<HTMLVideoElement>} video
   */
  async function screenshot(): Promise<HTMLVideoElement> {
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
    await video.play();
    return video;
  }

  /**生成选区内的截图并返回base64编码的PNG数据
   * @param {HTMLVideoElement} video - 用于截屏的视频元素
   * @param {HTMLElement} selectionBox - 包含截屏区域的选区框
   * @returns {Promise<string>} base64 - base64编码的PNG数据
   */
  async function generateCanvas(video: HTMLVideoElement, selectionBox: HTMLElement): Promise<string> {
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

    const base64 = canvas.toDataURL('image/png');
    return base64;
  }

  /**将文本复制到剪贴板
   * @param {string} text - 要复制的文本
   */
  async function copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      console.log('Screenshot copied to clipboard');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  }

  /**处理鼠标按下事件，启动选区选择、拖动或调整大小
   * @param {MouseEvent} event - 鼠标事件
   */
  function handleMouseDown(event: MouseEvent): void {
    if (event.button === 2) return;
    if (selectionBox.style.display !== 'block') {
      startX = event.pageX;
      startY = event.pageY;
      isSelecting = true;

      selectionBox.style.left = `${startX}px`;
      selectionBox.style.top = `${startY}px`;
      selectionBox.style.width = '0px';
      selectionBox.style.height = '0px';
      selectionBox.style.display = 'block';
    } else if (event.target instanceof HTMLElement && event.target.classList.contains('resize-handle')) {
      isResizing = true;
      currentHandle = event.target;
      initialWidth = selectionBox.offsetWidth;
      initialHeight = selectionBox.offsetHeight;
      initialLeft = selectionBox.offsetLeft;
      initialTop = selectionBox.offsetTop;
      startX = event.pageX;
      startY = event.pageY;
    } else if (event.target === selectionBox) {
      isDragging = true;
      startX = event.pageX - selectionBox.offsetLeft;
      startY = event.pageY - selectionBox.offsetTop;
    }
  }

  /**处理鼠标移动事件，更新选区选择、拖动或调整大小
   * @param {MouseEvent} event - 鼠标事件
   */
  function handleMouseMove(event: MouseEvent): void {
    if (isSelecting) {
      const currentX = event.pageX;
      const currentY = event.pageY;

      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      selectionBox.style.width = `${width}px`;
      selectionBox.style.height = `${height}px`;
      selectionBox.style.left = `${Math.min(currentX, startX)}px`;
      selectionBox.style.top = `${Math.min(currentY, startY)}px`;
    } else if (isDragging) {
      const currentX = event.pageX;
      const currentY = event.pageY;

      selectionBox.style.left = `${currentX - startX}px`;
      selectionBox.style.top = `${currentY - startY}px`;
    } else if (isResizing && currentHandle) {
      const currentX = event.pageX;
      const currentY = event.pageY;

      const dx = currentX - startX;
      const dy = currentY - startY;

      if (currentHandle.classList.contains('top-left')) {
        selectionBox.style.width = `${initialWidth - dx}px`;
        selectionBox.style.height = `${initialHeight - dy}px`;
        selectionBox.style.left = `${initialLeft + dx}px`;
        selectionBox.style.top = `${initialTop + dy}px`;
      } else if (currentHandle.classList.contains('top-right')) {
        selectionBox.style.width = `${initialWidth + dx}px`;
        selectionBox.style.height = `${initialHeight - dy}px`;
        selectionBox.style.top = `${initialTop + dy}px`;
      } else if (currentHandle.classList.contains('bottom-left')) {
        selectionBox.style.width = `${initialWidth - dx}px`;
        selectionBox.style.height = `${initialHeight + dy}px`;
        selectionBox.style.left = `${initialLeft + dx}px`;
      } else if (currentHandle.classList.contains('bottom-right')) {
        selectionBox.style.width = `${initialWidth + dx}px`;
        selectionBox.style.height = `${initialHeight + dy}px`;
      }
    }
  }

  /**处理鼠标抬起事件，结束选区选择、拖动或调整大小
   */
  function handleMouseUp(): void {
    isSelecting = false;
    isDragging = false;
    isResizing = false;
  }

  /**处理右键菜单事件
   * @param {MouseEvent} event - 鼠标事件
   */
  function handleContextMenu(event: MouseEvent): void {
    if (event.target === selectionBox || (event.target instanceof HTMLElement && event.target.parentElement === selectionBox)) {
      event.preventDefault();
      contextMenu.style.top = `${event.pageY}px`;
      contextMenu.style.left = `${event.pageX}px`;
      contextMenu.style.display = 'block';
    } else {
      contextMenu.style.display = 'none';
    }
  }

  /**处理全局点击事件，隐藏右键菜单
   */
  function handleClick(): void {
    contextMenu.style.display = 'none';
  }

  /**处理键盘按下事件，启动截图或生成截图
   * @param {KeyboardEvent} event - 键盘事件
   */
  async function handleKeyDown(event: KeyboardEvent): Promise<void> {
    const video = await screenshot();
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', async (event) => {
      if (event.key === 'Enter') {
        const base64 = await generateCanvas(video, selectionBox);
        await copyToClipboard(base64);
      }
    });
  }
  window
  Object.defineProperty(window,'jsScreenshots', handleKeyDown)
})();
