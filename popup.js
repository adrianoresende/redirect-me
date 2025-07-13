const redirectList = document.getElementById('redirect-list');
const addForm = document.getElementById('add-redirect-form');
const fromUrlInput = document.getElementById('from-url');
const toUrlInput = document.getElementById('to-url');

// Function to render the list of redirects
function renderRedirects() {
  chrome.storage.sync.get('redirects', ({ redirects }) => {
    redirectList.innerHTML = '';
    if (redirects && redirects.length > 0) {
      redirects.forEach((redirect, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'flex items-center justify-between p-3';
        
        const urlPair = document.createElement('div');
        urlPair.className = 'flex flex-col text-sm overflow-hidden';
        
        const fromSpan = document.createElement('span');
        fromSpan.className = 'text-gray-500 truncate';
        fromSpan.textContent = `From: ${redirect.from}`;
        fromSpan.title = redirect.from;
        
        const toSpan = document.createElement('span');
        toSpan.className = 'text-blue-600 font-bold truncate';
        toSpan.textContent = `To: ${redirect.to}`;
        toSpan.title = redirect.to;

        urlPair.appendChild(fromSpan);
        urlPair.appendChild(toSpan);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        // Add back the 'delete-btn' class for the event listener to work
        deleteButton.className = 'delete-btn cursor-pointer ml-4 py-2 px-3 bg-red-600 text-white text-xs font-bold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500';
        deleteButton.dataset.index = index;

        listItem.appendChild(urlPair);
        listItem.appendChild(deleteButton);
        redirectList.appendChild(listItem);
      });
    } else {
      const emptyMessage = document.createElement('li');
      emptyMessage.textContent = 'No redirects configured.';
      emptyMessage.className = 'text-center text-gray-500 py-5';
      redirectList.appendChild(emptyMessage);
    }
  });
}

// Handle form submission to add a new redirect
addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const from = fromUrlInput.value;
  const to = toUrlInput.value;

  if (from && to) {
    chrome.storage.sync.get('redirects', ({ redirects }) => {
      const newRedirects = redirects || [];
      newRedirects.push({ from, to });
      chrome.storage.sync.set({ redirects: newRedirects }, () => {
        fromUrlInput.value = '';
        toUrlInput.value = '';
        renderRedirects();
      });
    });
  }
});

// Handle delete button clicks
redirectList.addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-btn')) {
    const redirectIndex = parseInt(e.target.dataset.index, 10);
    chrome.storage.sync.get('redirects', ({ redirects }) => {
      const updatedRedirects = redirects.filter((_, index) => index !== redirectIndex);
      chrome.storage.sync.set({ redirects: updatedRedirects }, () => {
        renderRedirects();
      });
    });
  }
});

// Initial render
document.addEventListener('DOMContentLoaded', renderRedirects); 