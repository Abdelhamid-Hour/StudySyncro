import { showMessageBlock } from '../../../../main_assets/js/domFunctions.js';
import {
  expandAndShrinkDescription,
  handelTaskBtns,
  handelTaskDetailsBtn,
  handleChatInput,
  handleFiles,
  Quiz,
  Session,
} from './domFunctions.js';
import {
  collapseAllCom,
  collapseAllOn,
  expandDescriptionBtn,
  fileInput,
  FileTypes,
  imageInput,
  inputChatContainer,
  inputMessage,
  scrollToTopCom,
  scrollToTopOn,
  selectedFiles,
  sendBtn,
  tasksContainer,
} from './getNodes.js';

expandDescriptionBtn.addEventListener('click', expandAndShrinkDescription);
collapseAllCom.addEventListener('click', () =>
  handelTaskBtns('completed-tasks')
);
collapseAllOn.addEventListener('click', () => handelTaskBtns('ongoing-tasks'));
scrollToTopCom.addEventListener('click', () =>
  handelTaskBtns('completed-tasks', true)
);
scrollToTopOn.addEventListener('click', () =>
  handelTaskBtns('ongoing-tasks', true)
);

tasksContainer.addEventListener('click', handelTaskDetailsBtn);

const session = new Session({
  name: 'New Session',
  groupName: 'Group Name',
  startDate: new Date().getTime() - 50 * 1000,
  description: 'This is a sample session description.',
  isAdmin: true,
})
  .setTasks([
    new Quiz({
      title: 'Make a shawr And Pray',
      description: 'Description for Task 1',
      duration: 1,
      questionsCount: 12,
    }),
  ])
  .startSession();

sendBtn.addEventListener('click', handleChatInput);
inputMessage.addEventListener(
  'keydown',
  (e) => e.key === 'Enter' && !e.shiftKey && sendBtn.click()
);

document.addEventListener('dragenter', (e) => {
  if (e.relatedTarget === null) {
    const dropArea = document.createElement('div');
    dropArea.className = 'drop-area';
    const icon = document.createElement('i');
    icon.className = 'bi bi-plus-circle';
    const text = document.createElement('span');
    text.textContent = 'Drop files here to add to your message.';
    dropArea.append(icon, text);
    inputChatContainer.append(dropArea);
    setTimeout(() => {
      inputChatContainer.classList.add('drop-start');
    }, 0);
  }
});
document.addEventListener('dragleave', (e) => {
  if (e.relatedTarget === null) {
    inputChatContainer.classList.remove('drop-start'); // ???
    document.querySelector('.drop-area').remove();
  }
});
document.addEventListener('drop', (e) => {
  e.preventDefault();
  inputChatContainer.classList.remove('drop-start');
  document.querySelector('.drop-area').remove();
  const files = e.dataTransfer.files;
  if (files.length) {
    handleFiles(files);
  }
});

document.addEventListener('dragover', (e) => {
  e.preventDefault();
});

fileInput.addEventListener('change', () => {
  if (fileInput.files.length) {
    handleFiles(fileInput.files);
  }
});
imageInput.addEventListener('change', () => {
  if (imageInput.files.length) {
    handleFiles(imageInput.files);
  }
});


