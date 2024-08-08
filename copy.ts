import * as fs from 'fs';
import * as path from 'path';

const sourceDir = path.resolve(__dirname, 'src/css');
const destDir = path.resolve(__dirname, 'dist/css');

// 创建目标文件夹（如果不存在）
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// 复制文件
fs.readdirSync(sourceDir).forEach(file => {
  const sourceFile = path.join(sourceDir, file);
  const destFile = path.join(destDir, file);

  // 检查是否是文件
  if (fs.statSync(sourceFile).isFile()) {
    fs.copyFileSync(sourceFile, destFile);
  }
});

console.log('CSS 文件已复制到 dist/css 目录中');
