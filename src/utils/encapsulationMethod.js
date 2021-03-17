
// 文件大小转换
export const formatBytes = (bytes, decimals) => {
  if (bytes === 0) return '0 Bytes';
  var k = 1024,
    dm = decimals || 2,
    sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// 去掉文本左右空格
export const trim = (s) => {
  return s.replace(/(^\s*)|(\s*$)/g, "");
}


export const chromeSpeak = (text) => {
  // 让浏览器说我爱你
  const speechInstance = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(speechInstance);
}
