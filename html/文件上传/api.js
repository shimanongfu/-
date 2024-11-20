function uploadFile() {
  const fileInput = document.getElementById('selectFile');
  const file = fileInput.files[0]; // 获取选中的文件

  console.log(file);

  if (!file) {
    alert('请先选择一个文件');
    return;
  }
}
